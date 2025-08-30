import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract, defineChain } from 'viem';
import EventManagerABI from '../../../../../lib/abi/EventManagerABI.json';

// Define CrossFi chains (same as in other API routes)
const crossfiTestnet = defineChain({
  id: 4157,
  name: 'CrossFi Testnet',
  nativeCurrency: { name: 'XFI', symbol: 'XFI', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.CROSSFI_TESTNET_RPC || 'https://rpc.testnet.ms'] },
  },
  blockExplorers: {
    default: { name: 'CrossFi Explorer', url: 'https://testnet.crossfi.org/explorer' },
  },
});

const crossfiMainnet = defineChain({
  id: 4158,
  name: 'CrossFi Mainnet',
  nativeCurrency: { name: 'XFI', symbol: 'XFI', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.CROSSFI_MAINNET_RPC || 'https://rpc.mainnet.ms'] },
  },
  blockExplorers: {
    default: { name: 'CrossFi Explorer', url: 'https://mainnet.crossfi.org/explorer' },
  },
});

const EVENT_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_EVENT_MANAGER_CONTRACT_ADDRESS || '';

// Helper to get event status (copied from app/api/events/route.ts)
function getEventStatus(startDate: number, endDate: number, currentTimestamp: number): 'upcoming' | 'live' | 'ended' {
  if (currentTimestamp < startDate) return 'upcoming';
  if (currentTimestamp >= startDate && currentTimestamp <= endDate) return 'live';
  return 'ended';
}

export async function GET(req: NextRequest, { params }: { params: { address: string } }) {
  const userAddress = params.address;

  if (!userAddress) {
    return NextResponse.json({ error: 'User address is required' }, { status: 400 });
  }

  if (!EVENT_MANAGER_ADDRESS) {
    return NextResponse.json({ error: 'Event Manager contract address not configured' }, { status: 500 });
  }

  try {
    const network = process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet';
    const currentChain = network === 'production' ? crossfiMainnet : crossfiTestnet;

    const publicClient = createPublicClient({
      chain: currentChain,
      transport: http(currentChain.rpcUrls.default.http[0]),
    });

    const contract = getContract({
      address: EVENT_MANAGER_ADDRESS as `0x${string}`,
      abi: EventManagerABI,
      client: publicClient,
    });

    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Get ticket IDs for the user
    const ticketIds = await contract.read.getUserTickets([userAddress as `0x${string}`]);

    const userTickets = [];

    for (const ticketId of ticketIds) {
      try {
        // Get detailed ticket info
        const ticketInfo = await contract.read.getTicketInfo([ticketId]);

        // Destructure ticketInfo
        const [
          id,
          eventId,
          tierId,
          purchaser,
          attendeeCount,
          totalAmountPaid,
          purchaseTimestamp,
          used,
          refunded,
          eventStatusAtPurchase,
          currentEventStatus,
          valid,
          reason
        ] = ticketInfo;

        // Get event details
        const eventData = await contract.read.getEvent([eventId]);
        const [
          _eventId,
          organizer,
          eventTitle,
          eventDescription,
          eventLocation,
          eventStartDate,
          eventEndDate,
          metadataURI,
          eventStoredStatus,
          tierCount
        ] = eventData;

        // Get ticket tier details
        const tierData = await contract.read.getTicketTier([eventId, tierId]);
        const [
          tierName,
          pricePerPerson,
          maxSupply,
          currentSupply,
          active
        ] = tierData;

        // Determine token type (hardcoded for now, based on paymentTokenId in EventManager)
        let tokenType = 'XFI'; // Default
        // In EventManager.sol, paymentTokenId is not stored in TicketTier.
        // This means we cannot directly get the token type from the contract for a ticket.
        // For now, we'll assume XFI as the primary token.
        // A more robust solution would involve storing paymentTokenId in TicketTier or Event.

        userTickets.push({
          id: Number(id),
          eventId: Number(eventId),
          eventTitle,
          eventLocation,
          eventStartDate: Number(eventStartDate),
          eventEndDate: Number(eventEndDate),
          tierName,
          pricePerPerson: pricePerPerson.toString(), // Convert BigInt to string
          attendeeCount: Number(attendeeCount),
          totalAmountPaid: totalAmountPaid.toString(), // Convert BigInt to string
          tokenType: tokenType, // Placeholder
          purchaseTime: Number(purchaseTimestamp),
          used: used,
          valid: valid,
          status: getEventStatus(Number(eventStartDate), Number(eventEndDate), currentTimestamp),
          purchaser: purchaser,
          blockchainVerified: true, // Assuming true if fetched from blockchain
          validationReason: reason,
        });

      } catch (error: any) {
        console.error(`Error fetching ticket ${ticketId}:`, error);
        // Continue to next ticket if one fails
      }
    }

    return NextResponse.json({ tickets: userTickets });
  } catch (error: any) {
    console.error('Error in user tickets API:', error);
    return NextResponse.json({ error: 'Failed to fetch user tickets', details: error.message }, { status: 500 });
  }
}