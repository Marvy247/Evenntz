import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { defineChain } from 'viem';
import { mockEvents } from '../../../lib/mockEvents';

// CrossFi Chain configuration
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

const network = process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet';
const currentChain = network === 'production' ? crossfiMainnet : crossfiTestnet;

const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(currentChain.rpcUrls.default.http[0]),
});

// Contract configuration
const CONTRACT_ADDRESSES = {
  EVENT_MANAGER: process.env.EVENT_MANAGER_CONTRACT || '',
};

// Contract ABI (simplified for key functions)
const EVENT_MANAGER_ABI = [
  "function getEvent(uint256 eventId) view returns (uint256, address, string, string, string, uint256, uint256, string, bool, uint256)",
  "function getTicketTier(uint256 eventId, uint256 tierId) view returns (string, uint256, uint256, uint256, uint8, bool)",
];

// Initialize provider
function getEventManagerContract() {
  if (!CONTRACT_ADDRESSES.EVENT_MANAGER) {
    throw new Error('EventManager contract address not configured');
  }
  
  return getContract({
    address: CONTRACT_ADDRESSES.EVENT_MANAGER as `0x${string}`,
    abi: EVENT_MANAGER_ABI,
    client: publicClient,
  });
}

function getEventStatus(startDate, endDate) {
  const now = Math.floor(Date.now() / 1000);
  
  if (now < startDate) return 'upcoming';
  if (now >= startDate && now <= endDate) return 'live';
  return 'ended';
}

export async function GET(req: NextRequest) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }

  if (req.method === 'GET') {
    try {
      const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
      const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
      const organizer = req.nextUrl.searchParams.get('organizer');
      
      console.log('Events API called with params:', { page, limit, organizer });
      
      // For MVP, we'll return mock data since we don't have a deployed contract yet
      // Try to fetch from blockchain first
      try {
        const contract = getEventManagerContract();
        
        if (contract) {
          console.log('Fetching events from blockchain...');
          const events = [];
          const maxEventId = 50; // Check up to 50 events
          
          for (let i = 1; i <= maxEventId; i++) {
            try {
              const eventData = await contract.getEvent(i);
              
              // Check if event exists and is active
              if (Number(eventData[0]) !== 0 && 
                  eventData[1] !== '0x0000000000000000000000000000000000000000' &&
                  eventData[8] === true) { // active
                
                const startDate = Number(eventData[5]);
                const endDate = Number(eventData[6]);
                
                const event = {
                  id: Number(eventData[0]),
                  organizer: eventData[1],
                  title: eventData[2],
                  description: eventData[3],
                  location: eventData[4],
                  startDate: startDate,
                  endDate: endDate,
                  metadataURI: eventData[7],
                  active: eventData[8],
                  tierCount: Number(eventData[9]),
                  status: getEventStatus(startDate, endDate)
                };
                
                // Filter by organizer if specified
                if (!organizer || event.organizer.toLowerCase() === organizer.toLowerCase()) {
                  events.push(event);
                }
              }
            } catch (error) {
              // Event doesn't exist or error reading it - continue to next
              if (error.message.includes('execution reverted') || 
                  error.message.includes('invalid opcode') ||
                  error.code === 'CALL_EXCEPTION') {
                continue;
              }
            }
          }
          
          if (events.length > 0) {
            console.log(`Found ${events.length} blockchain events`);
            
            // Sort events by ID (newest first)
            events.sort((a, b) => b.id - a.id);
            
            // Implement pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedEvents = events.slice(startIndex, endIndex);
            
            return NextResponse.json({
              events: paginatedEvents,
              pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(events.length / limit),
                totalEvents: events.length,
                hasNext: endIndex < events.length,
                hasPrev: page > 1
              },
              blockchainVerified: true
            }, { status: 200, headers });
          }
        }
      } catch (error) {
        console.error('Blockchain fetch error:', error);
      }
      
      // Fallback to mock data
      console.log('Using fallback mock data');

      // Filter by organizer if specified
      let filteredEvents = mockEvents;
      if (organizer) {
        filteredEvents = mockEvents.filter(event => 
          event.organizer.toLowerCase() === organizer.toLowerCase()
        );
      }

      // Implement pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

      console.log(`Returning ${paginatedEvents.length} events`);

      return NextResponse.json({
        events: paginatedEvents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredEvents.length / limit),
          totalEvents: filteredEvents.length,
          hasNext: endIndex < filteredEvents.length,
          hasPrev: page > 1
        }
      }, { status: 200, headers });

    } catch (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch events',
        details: error.message 
      }, { status: 500, headers });
    }
  }

  return new NextResponse(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}