import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract, defineChain, Hex } from 'viem';
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

export async function POST(req: NextRequest) {
  const { qrData, organizerAddress, address, signature, message } = await req.json();

  if (!qrData) {
    return NextResponse.json({ error: 'QR data is required' }, { status: 400 });
  }
  if (!organizerAddress) {
    return NextResponse.json({ error: 'Organizer address is required' }, { status: 400 });
  }
  if (!address || !signature || !message) {
    return NextResponse.json({ error: 'Authentication details (address, signature, message) are required' }, { status: 401 });
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

    // 1. Verify the signature
    const isValidSignature = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as Hex,
    });

    if (!isValidSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // 2. Extract ticketId from qrData (assuming qrData is just the ticketId for now)
    const ticketId = BigInt(qrData);

    // 3. Get ticket info from contract
    const ticketInfo = await contract.read.getTicketInfo([ticketId]);
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

    // 4. Check if the signer is the event organizer
    const eventData = await contract.read.getEvent([eventId]);
    const [, eventOrganizer] = eventData;

    if (address.toLowerCase() !== eventOrganizer.toLowerCase()) {
      return NextResponse.json({ error: 'Only event organizer can verify tickets' }, { status: 403 });
    }

    // 5. Call verifyAndUseTicket on the contract
    let verificationResult: any = {
      ticketId: Number(id),
      eventId: Number(eventId),
      eventTitle: eventData[2], // Assuming title is at index 2
      eventLocation: eventData[4], // Assuming location is at index 4
      tierName: (await contract.read.getTicketTier([eventId, tierId]))[0], // Assuming tierName is at index 0
      attendeeCount: Number(attendeeCount),
      totalAmountPaid: totalAmountPaid.toString(),
      pricePerPerson: (await contract.read.getTicketTier([eventId, tierId]))[1].toString(), // Assuming pricePerPerson is at index 1
      tokenType: 'XFI', // Placeholder
      purchaseTimestamp: Number(purchaseTimestamp),
      purchaser: purchaser,
      eventStatusAtPurchase: eventStatusAtPurchase,
      currentEventStatus: currentEventStatus,
      valid: valid,
      reason: reason,
      qrData: qrData,
      timestamp: new Date().toISOString(),
      staffVerified: true, // Verified by staff (organizer)
      blockchainVerified: true,
    };

    if (valid && !used && !refunded) {
      try {
        // Use walletClient to send transaction
        const { request } = await publicClient.simulateContract({
          account: address as `0x${string}`,
          address: EVENT_MANAGER_ADDRESS as `0x${string}`,
          abi: EventManagerABI,
          functionName: 'verifyAndUseTicket',
          args: [ticketId],
        });
        const hash = await publicClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });
        verificationResult.used = true;
        verificationResult.valid = true;
        verificationResult.reason = 'Ticket verified and used successfully!';
      } catch (txError: any) {
        console.error('Transaction error:', txError);
        verificationResult.valid = false;
        verificationResult.reason = txError.shortMessage || txError.message || 'Failed to use ticket on blockchain.';
      }
    } else {
      verificationResult.valid = false;
      verificationResult.reason = reason || 'Ticket is invalid, already used, or refunded.';
    }

    return NextResponse.json(verificationResult);
  } catch (error: any) {
    console.error('Error in ticket verification API:', error);
    return NextResponse.json({ error: 'Failed to verify ticket', details: error.message }, { status: 500 });
  }
}