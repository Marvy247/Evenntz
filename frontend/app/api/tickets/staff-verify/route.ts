import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract, defineChain } from 'viem';
import EventManagerABI from '../../../../lib/abi/EventManagerABI.json';

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

export async function POST(req: NextRequest) {
  const { qrData, staffCode, eventId } = await req.json();

  if (!qrData) {
    return NextResponse.json({ error: 'QR data is required' }, { status: 400 });
  }
  if (!staffCode || !eventId) {
    return NextResponse.json({ error: 'Staff code and Event ID are required' }, { status: 400 });
  }

  // Basic staff code validation (replace with actual authentication in a real app)
  // For example, check against a database of valid staff codes for the given eventId
  if (staffCode !== `STAFF-${eventId}`) {
    return NextResponse.json({ error: 'Invalid staff code for this event' }, { status: 403 });
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

    // Extract ticketId from qrData (assuming qrData is just the ticketId for now)
    const ticketId = BigInt(qrData);

    // Get detailed ticket info
    const ticketInfo = await contract.read.getTicketInfo([ticketId]);
    const [
      id,
      _eventId,
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

    // Check if the ticket belongs to the provided eventId
    if (Number(_eventId) !== Number(eventId)) {
      return NextResponse.json({ error: 'Ticket does not belong to this event' }, { status: 403 });
    }

    // Call verifyTicket (view function)
    const [isValid, validationReason] = await contract.read.verifyTicket([ticketId]);

    // Get event details
    const eventData = await contract.read.getEvent([_eventId]);
    const [
      __eventId,
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
    const tierData = await contract.read.getTicketTier([_eventId, tierId]);
    const [
      tierName,
      pricePerPerson,
      maxSupply,
      currentSupply,
      active
    ] = tierData;

    return NextResponse.json({
      ticketId: Number(id),
      eventId: Number(_eventId),
      eventTitle,
      eventLocation,
      tierName,
      attendeeCount: Number(attendeeCount),
      totalAmountPaid: totalAmountPaid.toString(),
      pricePerPerson: pricePerPerson.toString(),
      tokenType: 'XFI', // Placeholder
      purchaseTimestamp: Number(purchaseTimestamp),
      purchaser: purchaser,
      eventStatusAtPurchase: eventStatusAtPurchase,
      currentEventStatus: currentEventStatus,
      valid: isValid,
      reason: validationReason,
      qrData: qrData,
      timestamp: new Date().toISOString(),
      staffVerified: true,
      blockchainVerified: true,
    });
  } catch (error: any) {
    console.error('Error in staff ticket verification API:', error);
    return NextResponse.json({ error: 'Failed to verify ticket', details: error.message }, { status: 500 });
  }
}