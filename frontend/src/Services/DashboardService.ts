import { web3Service } from './Web3Service';
import { type Address } from 'viem';

export interface EventAnalytics {
  ticketsSold: number;
  revenue: number;
  ticketPrice: number;
  eventType: number;
}

export interface OrganizerStats {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
}

export interface CheckInStats {
  totalTickets: number;
  checkedInCount: number;
  checkInRate: number;
}

export interface NFTTicketInfo {
  tokenId: number;
  owner: string;
  isListedForResale: boolean;
  resalePrice: number;
  resaleCount: number;
  maxResales: number;
}

class DashboardService {
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (!web3Service.getPublicClient()) {
      await web3Service.initialize();
    }
    this.isInitialized = true;
  }

  async getEventAnalytics(eventAddress: Address): Promise<EventAnalytics> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);

    // Get total supply of tickets (represents tickets sold)
    const totalSupply = await web3Service.getPublicClient().readContract({
      address: ticketNFTAddress,
      abi: web3Service.getEventFactoryABI(), // Using EVENT_TICKET_ABI
      functionName: 'nextTokenId'
    });

    // Get event type and ticket price
    const [eventType, ticketPrice] = await Promise.all([
      web3Service.getPublicClient().readContract({
        address: eventAddress,
        abi: web3Service.getEventFactoryABI(), // Using EVENT_IMPLEMENTATION_ABI
        functionName: 'eventType'
      }),
      web3Service.getPublicClient().readContract({
        address: eventAddress,
        abi: web3Service.getEventFactoryABI(), // Using EVENT_IMPLEMENTATION_ABI
        functionName: 'ticketPrice'
      })
    ]);

    // Calculate revenue (only for paid events)
    const ticketsSold = Number(totalSupply);
    const revenue = eventType === 1 ? (ticketsSold * Number(ticketPrice)) / 1e18 : 0; // Convert from wei to ETH

    return {
      ticketsSold,
      revenue,
      ticketPrice: Number(ticketPrice) / 1e18, // Convert to ETH
      eventType: Number(eventType)
    };
  }

  async getOrganizerStats(organizerAddress: Address): Promise<OrganizerStats> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const allEvents = await web3Service.getAllEvents();
    // @ts-ignore
    const organizerEvents = allEvents.filter(event =>
      event.organizer.toLowerCase() === organizerAddress.toLowerCase() && event.active
    );

    let totalTicketsSold = 0;
    let totalRevenue = 0;
    let totalEvents = organizerEvents.length;

    // Calculate totals from all organizer's events
    for (const event of organizerEvents) {
      try {
        const analytics = await this.getEventAnalytics(event.eventAddress);
        totalTicketsSold += analytics.ticketsSold;
        totalRevenue += analytics.revenue;
      } catch (error) {
        console.warn(`Failed to get analytics for event ${event.eventAddress}:`, error);
      }
    }

    return {
      totalEvents,
      totalTicketsSold,
      totalRevenue
    };
  }

  async getTicketCheckInStatus(eventAddress: Address, tokenId: number): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);

      // Try to get owner - if it fails, ticket is burned (checked in)
      await web3Service.getPublicClient().readContract({
        address: ticketNFTAddress,
        abi: web3Service.getEventFactoryABI(), // Using EVENT_TICKET_ABI
        functionName: 'ownerOf',
        args: [BigInt(tokenId)]
      });

      return false; // Ticket still exists, not checked in
    } catch (error) {
      // If ownerOf fails, ticket is burned (checked in)
      return true; // Ticket is checked in
    }
  }

  async getEventCheckInStats(eventAddress: Address): Promise<CheckInStats> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);

    const totalSupply = await web3Service.getPublicClient().readContract({
      address: ticketNFTAddress,
      abi: web3Service.getEventFactoryABI(), // Using EVENT_TICKET_ABI
      functionName: 'nextTokenId'
    });

    let checkedInCount = 0;
    const totalTickets = Number(totalSupply);

    // Check each ticket's status (this could be optimized with events later)
    for (let tokenId = 0; tokenId < totalTickets; tokenId++) {
      if (await this.getTicketCheckInStatus(eventAddress, tokenId)) {
        checkedInCount++;
      }
    }

    return {
      totalTickets,
      checkedInCount,
      checkInRate: totalTickets > 0 ? (checkedInCount / totalTickets) * 100 : 0
    };
  }

  async getNFTTicketInfo(eventAddress: Address, tokenId: number): Promise<NFTTicketInfo> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);

    const [owner, resaleInfo] = await Promise.all([
      web3Service.getPublicClient().readContract({
        address: ticketNFTAddress,
        abi: web3Service.getEventFactoryABI(), // Using EVENT_TICKET_ABI
        functionName: 'ownerOf',
        args: [BigInt(tokenId)]
      }),
      web3Service.getPublicClient().readContract({
        address: ticketNFTAddress,
        abi: web3Service.getEventFactoryABI(), // Using EVENT_TICKET_ABI
        functionName: 'getResaleInfo',
        args: [BigInt(tokenId)]
      })
    ]);

    return {
      tokenId,
      owner: owner as string,
      isListedForResale: resaleInfo[0] as boolean,
      resalePrice: Number(resaleInfo[1]) / 1e18, // Convert from wei to ETH
      resaleCount: Number(resaleInfo[2]),
      maxResales: 3 // From contract constant
    };
  }

  async getAllNFTTicketsForEvent(eventAddress: Address): Promise<NFTTicketInfo[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);

    const totalSupply = await web3Service.getPublicClient().readContract({
      address: ticketNFTAddress,
      abi: web3Service.getEventFactoryABI(), // Using EVENT_TICKET_ABI
      functionName: 'nextTokenId'
    });

    const tickets: NFTTicketInfo[] = [];
    const totalTickets = Number(totalSupply);

    for (let tokenId = 0; tokenId < totalTickets; tokenId++) {
      try {
        const ticketInfo = await this.getNFTTicketInfo(eventAddress, tokenId);
        tickets.push(ticketInfo);
      } catch (error) {
        // Ticket might be burned, skip it
        console.warn(`Failed to get info for token ${tokenId}:`, error);
      }
    }

    return tickets;
  }

  private async getTicketNFTAddress(eventAddress: Address): Promise<Address> {
    const ticketNFTAddress = await web3Service.getPublicClient().readContract({
      address: eventAddress,
      abi: web3Service.getEventFactoryABI(), // Using EVENT_IMPLEMENTATION_ABI
      functionName: 'ticketNFT'
    });

    return ticketNFTAddress as Address;
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
