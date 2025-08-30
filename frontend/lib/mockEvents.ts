export interface MockEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: number; // Unix timestamp
  endDate: number;   // Unix timestamp
  organizer: string; // Placeholder address
  metadataURI: string;
  status: 'upcoming' | 'live' | 'ended';
  active: boolean;
  tiers?: MockTicketTier[]; // Optional, as not all events might have tiers in mock
}

export interface MockTicketTier {
  id: number;
  name: string;
  price: string; // Formatted string, e.g., "1.0"
  pricePerPerson: string; // Formatted string
  maxSupply: number;
  currentSupply: number;
  tokenType: string; // e.g., "XFI", "XUSD"
  active: boolean;
  available: number;
}

// Helper to get future/past timestamps
const getFutureTimestamp = (days: number) => Math.floor(Date.now() / 1000) + (days * 24 * 60 * 60);
const getPastTimestamp = (days: number) => Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);

export const mockEvents: MockEvent[] = [
  {
    id: 1,
    title: "Global Blockchain Summit 2024",
    description: "Join industry leaders and innovators at the premier blockchain event of the year. Explore the latest trends in DeFi, NFTs, and Web3.",
    location: "Virtual Event",
    startDate: getFutureTimestamp(10),
    endDate: getFutureTimestamp(12),
    organizer: "0x1f9031A2beA086a591e9872FE3A26F01570A8B2A",
    metadataURI: "https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg",
    status: "upcoming",
    active: true,
    tiers: [
      { id: 0, name: "Standard Pass", price: "100", pricePerPerson: "100", maxSupply: 500, currentSupply: 50, tokenType: "XUSD", active: true, available: 450 },
      { id: 1, name: "VIP Pass", price: "500", pricePerPerson: "500", maxSupply: 50, currentSupply: 5, tokenType: "XUSD", active: true, available: 45 },
    ]
  },
  {
    id: 2,
    title: "Decentralized Art Fair",
    description: "An immersive experience showcasing the future of art through NFTs and digital ownership. Discover unique pieces from emerging artists.",
    location: "Metaverse Gallery",
    startDate: getFutureTimestamp(2),
    endDate: getFutureTimestamp(3),
    organizer: "0x2f9031A2beA086a591e9872FE3A26F01570A8B2B",
    metadataURI: "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg",
    status: "upcoming",
    active: true,
    tiers: [
      { id: 0, name: "General Admission", price: "0.5", pricePerPerson: "0.5", maxSupply: 1000, currentSupply: 100, tokenType: "XFI", active: true, available: 900 },
    ]
  },
  {
    id: 3,
    title: "Web3 Gaming Convention",
    description: "Level up your knowledge at the ultimate Web3 gaming event. Play new blockchain games, meet developers, and win exclusive NFTs.",
    location: "London, UK",
    startDate: getFutureTimestamp(30),
    endDate: getFutureTimestamp(32),
    organizer: "0x3f9031A2beA086a591e9872FE3A26F01570A8B2C",
    metadataURI: "https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg",
    status: "upcoming",
    active: true,
    tiers: [
      { id: 0, name: "Gamer Pass", price: "50", pricePerPerson: "50", maxSupply: 700, currentSupply: 20, tokenType: "XUSD", active: true, available: 680 },
      { id: 1, name: "Developer Workshop", price: "200", pricePerPerson: "200", maxSupply: 100, currentSupply: 10, tokenType: "XUSD", active: true, available: 90 },
    ]
  },
  {
    id: 4,
    title: "CrossFi Community Meetup",
    description: "Connect with fellow CrossFi enthusiasts and developers. Share ideas, collaborate on projects, and grow the ecosystem.",
    location: "Online - Discord",
    startDate: getFutureTimestamp(0.1), // Live now
    endDate: getFutureTimestamp(0.2),
    organizer: "0x4f9031A2beA086a591e9872FE3A26F01570A8B2D",
    metadataURI: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg",
    status: "live",
    active: true,
    tiers: [
      { id: 0, name: "Free Access", price: "0", pricePerPerson: "0", maxSupply: 9999, currentSupply: 500, tokenType: "XFI", active: true, available: 9499 },
    ]
  },
  {
    id: 5,
    title: "Blockchain for Social Impact",
    description: "Discover how blockchain technology is being used to create positive social change around the world.",
    location: "New York, USA",
    startDate: getPastTimestamp(5),
    endDate: getPastTimestamp(4),
    organizer: "0x5f9031A2beA086a591e9872FE3A26F01570A8B2E",
    metadataURI: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg",
    status: "ended",
    active: true,
    tiers: [
      { id: 0, name: "Standard Ticket", price: "75", pricePerPerson: "75", maxSupply: 300, currentSupply: 300, tokenType: "XUSD", active: false, available: 0 },
    ]
  },
  {
    id: 6,
    title: "NFT Creator Workshop",
    description: "Learn the ins and outs of creating and minting your own NFTs. Hands-on session for aspiring digital artists.",
    location: "Virtual Workshop",
    startDate: getFutureTimestamp(7),
    endDate: getFutureTimestamp(7.5),
    organizer: "0x6f9031A2beA086a591e9872FE3A26F01570A8B2F",
    metadataURI: "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg",
    status: "upcoming",
    active: true,
    tiers: [
      { id: 0, name: "Workshop Seat", price: "150", pricePerPerson: "150", maxSupply: 80, currentSupply: 10, tokenType: "XUSD", active: true, available: 70 },
    ]
  },
  {
    id: 7,
    title: "DeFi & Yield Farming Masterclass",
    description: "Master the strategies for maximizing your returns in the decentralized finance ecosystem.",
    location: "Online Course",
    startDate: getFutureTimestamp(15),
    endDate: getFutureTimestamp(18),
    organizer: "0x7f9031A2beA086a591e9872FE3A26F01570A8B20",
    metadataURI: "https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg",
    status: "upcoming",
    active: true,
    tiers: [
      { id: 0, name: "Full Course Access", price: "300", pricePerPerson: "300", maxSupply: 200, currentSupply: 30, tokenType: "XUSD", active: true, available: 170 },
    ]
  },
];

// Function to add a new event to the mock data
export const addMockEvent = (newEvent: MockEvent) => {
  mockEvents.push(newEvent);
};