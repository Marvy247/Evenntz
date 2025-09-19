import { createPublicClient, createWalletClient, http, parseEther, formatEther, type Address, type Hash, defineChain } from 'viem';
import { eventFactoryABI, eventImplementationABI, eventTicketABI, eventFactoryAddress } from '../../web3/constants';

// Define Sepolia Testnet chain
const SepoliaTestnet = defineChain({
  id: 11155111,
  name: 'Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia',
    symbol: 'S',
  },
  rpcUrls: {
    default: {
      http: ['https://eth-sepolia.g.alchemy.com/v2/H--HtDpZlgQ0zxKBt7zBC-DzXtxGRL0J'],
    },
    public: {
      http: ['https://eth-sepolia.g.alchemy.com/v2/H--HtDpZlgQ0zxKBt7zBC-DzXtxGRL0J'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SepoliaScan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
});

// Use the full ABIs from constants
const EVENT_FACTORY_ABI = eventFactoryABI.abi;
const EVENT_IMPLEMENTATION_ABI = eventImplementationABI.abi;
const EVENT_TICKET_ABI = eventTicketABI.abi;

export enum EventType {
  FREE = 0,
  PAID = 1,
  APPROVAL = 2
}

export interface CreateEventParams {
  name: string;
  eventType: EventType;
  ticketPrice: string; // in wei as string
  maxTickets: string; // Add this
}

export interface RegisterOrganizationParams {
    name: string;
    description: string;
    website: string;
}

export interface UpdateOrganizationParams {
    name: string;
    description: string;
    website: string;
}

export interface BuyTicketParams {
  eventAddress: Address;
  metadataURI: string;
  value?: string; // in wei as string
}

export interface MintForUserParams {
  eventAddress: Address;
  user: Address;
  metadataURI: string;
}

export interface AirdropTicketsParams {
    eventAddress: Address;
    users: Address[];
    metadataURI: string;
}

export interface ListTicketParams {
  eventAddress: Address;
  tokenId: number;
  price: string; // in wei as string
}

export interface BuyResaleParams {
  eventAddress: Address;
  tokenId: number;
  price: string; // in wei as string
}

class Web3Service {
  private publicClient: any = null;
  private walletClient: any = null;
  private isInitialized: boolean = false;
  private eventFactoryAddress: Address | null = null;
  private readonly RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/H--HtDpZlgQ0zxKBt7zBC-DzXtxGRL0J';
  private readonly EVENT_FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_EVENT_FACTORY_ADDRESS || eventFactoryAddress) as Address;

  async initialize(): Promise<void> {
    try {
      // Create public client for reading blockchain data
      this.publicClient = createPublicClient({
        chain: SepoliaTestnet,
        transport: http(this.RPC_URL)
      });

      // Check if we have the required environment variables
      if (!this.EVENT_FACTORY_ADDRESS) {
        throw new Error('EVENT_FACTORY_ADDRESS environment variable is required');
      }

      this.eventFactoryAddress = this.EVENT_FACTORY_ADDRESS;
      this.isInitialized = true;

      console.log('Web3Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Web3Service:', error);
      throw error;
    }
  }

  setWalletClient(walletClient: any) {
    this.walletClient = walletClient;
  }

  async deactivateEvent(eventAddress: Address): Promise<Hash> {
    if (!this.isInitialized || !this.walletClient) {
      throw new Error('Web3Service not initialized or wallet not connected');
    }

    const transactionHash = await this.walletClient.writeContract({
      address: this.eventFactoryAddress!,
      abi: EVENT_FACTORY_ABI,
      functionName: 'deactivateEvent',
      args: [eventAddress],
      account: this.walletClient.account,
    });

    return transactionHash;
  }

  // Utility functions
  parseEther(value: string): string {
    return parseEther(value).toString();
  }

  formatEther(value: string): string {
    return formatEther(BigInt(value));
  }

  // Event Factory functions
  async createEvent(params: CreateEventParams): Promise<string> {
    if (!this.isInitialized || !this.walletClient) {
      throw new Error('Web3Service not initialized or wallet not connected');
    }

    const { name, eventType, ticketPrice, maxTickets } = params;

    const transactionHash = await this.walletClient.writeContract({
        address: this.eventFactoryAddress!,
        abi: EVENT_FACTORY_ABI,
        functionName: 'createEvent',
        args: [name, eventType, BigInt(ticketPrice), BigInt(maxTickets)],
        account: this.walletClient.account,
    });

    return transactionHash;
  }

  async registerMe(): Promise<Hash> {
    if (!this.isInitialized || !this.walletClient) {
      throw new Error('Web3Service not initialized or wallet not connected');
    }

    const transactionHash = await this.walletClient.writeContract({
      address: this.eventFactoryAddress!,
      abi: EVENT_FACTORY_ABI,
      functionName: 'registerMe',
      account: this.walletClient.account,
    });

    return transactionHash;
  }

  async getAllEvents() {
      if (!this.isInitialized) {
          throw new Error('Web3Service not initialized');
      }

      const events = await this.publicClient.readContract({
          address: this.eventFactoryAddress!,
          abi: EVENT_FACTORY_ABI,
          functionName: 'getAllEvents',
          args: [],
      });

      return events;
  }

  async registerOrganization(params: RegisterOrganizationParams): Promise<Hash> {
      if (!this.isInitialized || !this.walletClient) {
          throw new Error('Web3Service not initialized or wallet not connected');
      }

      const { name, description, website } = params;

      const transactionHash = await this.walletClient.writeContract({
          address: this.eventFactoryAddress!,
          abi: EVENT_FACTORY_ABI,
          functionName: 'registerOrganization',
          args: [name, description, website],
          account: this.walletClient.account,
      });

      return transactionHash;
  }

  async updateOrganization(params: UpdateOrganizationParams): Promise<Hash> {
      if (!this.isInitialized || !this.walletClient) {
          throw new Error('Web3Service not initialized or wallet not connected');
      }

      const { name, description, website } = params;

      const transactionHash = await this.walletClient.writeContract({
          address: this.eventFactoryAddress!,
          abi: EVENT_FACTORY_ABI,
          functionName: 'updateOrganization',
          args: [name, description, website],
          account: this.walletClient.account,
      });

      return transactionHash;
  }

  async deactivateOrganization(orgAddress: Address): Promise<Hash> {
      if (!this.isInitialized || !this.walletClient) {
          throw new Error('Web3Service not initialized or wallet not connected');
      }

      const transactionHash = await this.walletClient.writeContract({
          address: this.eventFactoryAddress!,
          abi: EVENT_FACTORY_ABI,
          functionName: 'deactivateOrganization',
          args: [orgAddress],
          account: this.walletClient.account,
      });

      return transactionHash;
  }

  // Event Implementation functions
  async buyTicket(params: BuyTicketParams): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    const { eventAddress, metadataURI, value } = params;

    const hash = await this.walletClient.writeContract({
      address: eventAddress,
      abi: EVENT_IMPLEMENTATION_ABI,
      functionName: 'buyTicket',
      args: [metadataURI],
      value: value ? BigInt(value) : BigInt('0')
    });

    return hash;
  }

  async approveUser(eventAddress: Address, user: Address): Promise<Hash> {
      if (!this.isInitialized || !this.walletClient) {
          throw new Error('Web3Service not initialized or wallet not connected');
      }

      const transactionHash = await this.walletClient.writeContract({
          address: eventAddress,
          abi: EVENT_IMPLEMENTATION_ABI,
          functionName: 'approveUser',
          args: [user],
          account: this.walletClient.account,
      });

      return transactionHash;
  }

  async revokeUser(eventAddress: Address, user: Address): Promise<Hash> {
      if (!this.isInitialized || !this.walletClient) {
          throw new Error('Web3Service not initialized or wallet not connected');
      }

      const transactionHash = await this.walletClient.writeContract({
          address: eventAddress,
          abi: EVENT_IMPLEMENTATION_ABI,
          functionName: 'revokeUser',
          args: [user],
          account: this.walletClient.account,
      });

      return transactionHash;
  }

  async mintForUser(eventAddress: Address, user: Address, metadataURI: string): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    const hash = await this.walletClient.writeContract({
      address: eventAddress,
      abi: EVENT_IMPLEMENTATION_ABI,
      functionName: 'mintForUser',
      args: [user, metadataURI]
    });

    return hash;
  }

  async airdropTickets(params: AirdropTicketsParams): Promise<Hash> {
      if (!this.isInitialized || !this.walletClient) {
          throw new Error('Web3Service not initialized or wallet not connected');
      }

      const { eventAddress, users, metadataURI } = params;

      const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);

      const transactionHash = await this.walletClient.writeContract({
          address: ticketNFTAddress,
          abi: EVENT_TICKET_ABI,
          functionName: 'airdropTickets',
          args: [users, metadataURI],
          account: this.walletClient.account,
      });

      return transactionHash;
  }

  async checkIn(eventAddress: Address, tokenId: number): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    const hash = await this.walletClient.writeContract({
      address: eventAddress,
      abi: EVENT_IMPLEMENTATION_ABI,
      functionName: 'checkIn',
      args: [BigInt(tokenId)]
    });

    return hash;
  }

  // Event Ticket functions
  async listTicketForResale(eventAddress: Address, tokenId: number, price: string): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    // First, we need to get the ticket NFT contract address from the event
    const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);

    const hash = await this.walletClient.writeContract({
      address: ticketNFTAddress,
      abi: EVENT_TICKET_ABI,
      functionName: 'listForResale',
      args: [BigInt(tokenId), BigInt(price)]
    });

    return hash;
  }

  async buyResaleTicket(eventAddress: Address, tokenId: number, price: string): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);

    const hash = await this.walletClient.writeContract({
      address: ticketNFTAddress,
      abi: EVENT_TICKET_ABI,
      functionName: 'buyResale',
      args: [BigInt(tokenId)],
      value: BigInt(price)
    });

    return hash;
  }

  async cancelResale(eventAddress: Address, tokenId: number): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);

    const hash = await this.walletClient.writeContract({
      address: ticketNFTAddress,
      abi: EVENT_TICKET_ABI,
      functionName: 'cancelResale',
      args: [BigInt(tokenId)]
    });

    return hash;
  }

  // Helper function to get ticket NFT address from event contract
  private async getTicketNFTAddress(eventAddress: Address): Promise<Address> {
    const ticketNFTAddress = await this.publicClient.readContract({
      address: eventAddress,
      abi: EVENT_IMPLEMENTATION_ABI,
      functionName: 'ticketNFT'
    });

    return ticketNFTAddress as Address;
  }

  // Getters for public access
  getPublicClient() {
    return this.publicClient;
  }

  getEventFactoryAddress() {
    return this.eventFactoryAddress;
  }

  getEventFactoryABI() {
    return EVENT_FACTORY_ABI;
  }

  // Read functions
  async getEventInfo(eventAddress: Address) {
    const [eventName, eventType, ticketPrice, organizer] = await Promise.all([
      this.publicClient.readContract({
        address: eventAddress,
        abi: EVENT_IMPLEMENTATION_ABI,
        functionName: 'eventName'
      }),
      this.publicClient.readContract({
        address: eventAddress,
        abi: EVENT_IMPLEMENTATION_ABI,
        functionName: 'eventType'
      }),
      this.publicClient.readContract({
        address: eventAddress,
        abi: EVENT_IMPLEMENTATION_ABI,
        functionName: 'ticketPrice'
      }),
      this.publicClient.readContract({
        address: eventAddress,
        abi: EVENT_IMPLEMENTATION_ABI,
        functionName: 'owner'
      })
    ]);

    return {
      name: eventName,
      eventType: eventType,
      ticketPrice: ticketPrice,
      organizer: organizer
    };
  }

  async getEventAnalytics(eventAddress: Address) {
    const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);

    const [totalTicketsSold, checkIns, ticketPrice] = await Promise.all([
      this.publicClient.readContract({
        address: ticketNFTAddress,
        abi: EVENT_TICKET_ABI,
        functionName: 'nextTokenId'
      }),
      this.publicClient.readContract({
        address: ticketNFTAddress,
        abi: EVENT_TICKET_ABI,
        functionName: 'getBurnedTicketsCount'
      }),
      this.publicClient.readContract({
        address: eventAddress,
        abi: EVENT_IMPLEMENTATION_ABI,
        functionName: 'ticketPrice'
      })
    ]);

    const totalRevenue = BigInt(totalTicketsSold) * BigInt(ticketPrice);

    return {
      totalTicketsSold: Number(totalTicketsSold),
      checkIns: Number(checkIns),
      totalRevenue: formatEther(totalRevenue)
    };
  }

  async getTicketOwner(eventAddress: Address, tokenId: number): Promise<Address> {
    const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);
    
    const owner = await this.publicClient.readContract({
      address: ticketNFTAddress,
      abi: EVENT_TICKET_ABI,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)]
    });

    return owner as Address;
  }

  async getTicketTokenURI(eventAddress: Address, tokenId: number): Promise<string> {
    const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);
    
    const tokenURI = await this.publicClient.readContract({
      address: ticketNFTAddress,
      abi: EVENT_TICKET_ABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)]
    });

    return tokenURI as string;
  }

  async getResaleInfo(eventAddress: Address, tokenId: number) {
    const ticketNFTAddress = await this.getTicketNFTAddress(eventAddress);
    
    const resaleInfo = await this.publicClient.readContract({
      address: ticketNFTAddress,
      abi: EVENT_TICKET_ABI,
      functionName: 'getResaleInfo',
      args: [BigInt(tokenId)]
    });

    return resaleInfo;
  }
}

// Export singleton instance
export const web3Service = new Web3Service();