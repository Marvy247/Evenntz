import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract, defineChain } from 'viem';
import { verifyMessage } from 'viem';
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ticketId = params.id;
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const signature = searchParams.get('signature');
  const message = searchParams.get('message');

  if (!ticketId) {
    return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
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

    // Get detailed ticket info
    const ticketInfo = await contract.read.getTicketInfo([BigInt(ticketId)]);

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

    let purchaserVerified = false;
    let signatureValid = false;

    // Verify signature if provided
    if (address && signature && message) {
      // Check if the message corresponds to the ticket ID
      if (!message.includes(`Accessing ticket ${ticketId}`)) {
        return NextResponse.json({ error: 'Message references different ticket', detail: 'Message references different ticket' }, { status: 403 });
      }

      // Verify the signature
      const isValid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
      signatureValid = isValid;

      // Check if the signer is the ticket purchaser
      if (isValid && address.toLowerCase() === purchaser.toLowerCase()) {
        purchaserVerified = true;
      } else if (isValid && address.toLowerCase() !== purchaser.toLowerCase()) {
        return NextResponse.json({ error: 'Connected wallet does not own this ticket', detail: 'Connected wallet does not own this ticket' }, { status: 403 });
      } else if (!isValid) {
        return NextResponse.json({ error: 'Wallet signature verification failed', detail: 'Wallet signature verification failed' }, { status: 403 });
      }
    } else {
      // If no signature provided, and it's not the purchaser, deny access
      // This assumes that if you're not the purchaser, you *must* provide a valid signature.
      // For public viewing, this logic would need to be adjusted.
      // For now, if no signature and not the purchaser, it's an unauthorized access attempt.
      if (address && address.toLowerCase() !== purchaser.toLowerCase()) {
         return NextResponse.json({ error: 'Access to this ticket is restricted', detail: 'Access to this ticket is restricted' }, { status: 403 });
      }
    }

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

    // For QR code, we can use a simple URL that includes ticket ID and a signature for verification
    // In a real app, this QR code would point to a verification endpoint or contain signed data.
    // For now, a placeholder URL.
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      `${req.nextUrl.origin}/ticket/${ticketId}/verify` // Example verification URL
    )}`;

    return NextResponse.json({
      id: Number(id),
      eventId: Number(eventId),
      eventTitle,
      eventLocation,
      eventStartDate: Number(eventStartDate),
      eventEndDate: Number(eventEndDate),
      tierName,
      pricePerPerson: pricePerPerson.toString(),
      attendeeCount: Number(attendeeCount),
      totalAmountPaid: totalAmountPaid.toString(),
      purchaseTime: Number(purchaseTimestamp),
      used: used,
      valid: valid,
      status: currentEventStatus, // Use currentEventStatus from getTicketInfo
      purchaser: purchaser,
      blockchainVerified: true,
      validationReason: reason,
      qrCode: qrCodeUrl,
      purchaserVerified: purchaserVerified, // Add this
      signatureValid: signatureValid,       // Add this
    });
  } catch (error: any) {
    console.error('Error in single ticket API:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket details', details: error.message }, { status: 500 });
  }
}