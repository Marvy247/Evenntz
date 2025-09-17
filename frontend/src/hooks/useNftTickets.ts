import { useCallback, useEffect, useState } from "react";
import { web3Service } from "@/Services/Web3Service";
import { useAccount } from "wagmi";

export type NftTicket = {
  id: string;
  tokenId: number;
  eventAddress: string;
  owner: string;
  tokenURI: string;
  resaleInfo: {
    isListed: boolean;
    price: string;
    resalesDone: number;
    resalesRemaining: number;
  };
};

export function useNftTickets() {
  const { address } = useAccount();
  const [nftTickets, setNftTickets] = useState<NftTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadNftTickets = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      const allEvents = await web3Service.getAllEvents();
      const tickets: NftTicket[] = [];

      for (const event of allEvents) {
        if (event.organizer.toLowerCase() === address.toLowerCase()) {
          const totalTickets = await web3Service.getEventAnalytics(event.eventAddress).then(a => a.totalTicketsSold);
          for (let i = 0; i < totalTickets; i++) {
            const owner = await web3Service.getTicketOwner(event.eventAddress, i);
            if (owner.toLowerCase() === address.toLowerCase()) {
              const tokenURI = await web3Service.getTicketTokenURI(event.eventAddress, i);
              const resaleInfo = await web3Service.getResaleInfo(event.eventAddress, i);
              tickets.push({
                id: `${event.eventAddress}-${i}`,
                tokenId: i,
                eventAddress: event.eventAddress,
                owner,
                tokenURI,
                resaleInfo,
              });
            }
          }
        }
      }

      setNftTickets(tickets);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadNftTickets();
  }, [loadNftTickets]);

  return {
    nftTickets,
    loading,
    loadNftTickets,
  };
}