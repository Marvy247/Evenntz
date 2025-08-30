import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract, defineChain } from 'viem';
import EventManagerABI from '../../../../lib/abi/EventManagerABI.json';
import { mockEvents } from '../../../../lib/mockEvents';

// Define CrossFi chains (same as in app/api/events/route.ts)
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

// Helper to get event status
function getEventStatus(startDate: number, endDate: number, currentTimestamp: number): 'upcoming' | 'live' | 'ended' {
  if (currentTimestamp < startDate) return 'upcoming';
  if (currentTimestamp >= startDate && currentTimestamp <= endDate) return 'live';
  return 'ended';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const organizerAddress = searchParams.get('address');

  if (!organizerAddress) {
    return NextResponse.json({ error: 'Organizer address is required' }, { status: 400 });
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

    const filteredEvents = mockEvents.filter(event =>
      event.organizer.toLowerCase() === organizerAddress.toLowerCase()
    );

    return NextResponse.json({ events: filteredEvents });
  } catch (error: any) {
    console.error('Error in organizer events API:', error);
    return NextResponse.json({ error: 'Failed to fetch organizer events', details: error.message }, { status: 500 });
  }
}