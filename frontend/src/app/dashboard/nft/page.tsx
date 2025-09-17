"use client";

import { useAccount } from "wagmi";
import { useNftTickets } from "@/hooks/useNftTickets";

export default function NftDashboardPage() {
  const { address } = useAccount();
  const { nftTickets, loading } = useNftTickets();

  if (!address) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-6">NFT Dashboard</h1>
        <p className="text-lg text-foreground/70">
          Please connect your wallet to access your NFT dashboard.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold text-foreground mb-6">NFT Dashboard</h1>
      <p className="text-lg text-foreground/70 mb-6">
        Welcome to your NFT dashboard. Here you can manage your NFT tickets, view their status, and more.
      </p>

      {loading ? (
        <p>Loading your NFT tickets...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nftTickets.map((ticket) => (
            <div key={ticket.id} className="card p-6 fade-in">
              <h3 className="text-xl font-bold text-foreground">Ticket #{ticket.tokenId}</h3>
              <p className="text-sm text-foreground/70">Event: {ticket.eventAddress}</p>
              <p className="text-sm text-foreground/70">Owner: {ticket.owner}</p>
              <p className="text-sm text-foreground/70">Token URI: {ticket.tokenURI}</p>
              <div className="mt-4">
                <h4 className="font-semibold">Resale Info</h4>
                <p className="text-sm text-foreground/70">Listed for resale: {ticket.resaleInfo.isListed ? 'Yes' : 'No'}</p>
                <p className="text-sm text-foreground/70">Price: {ticket.resaleInfo.price}</p>
                <p className="text-sm text-foreground/70">Resales done: {ticket.resaleInfo.resalesDone}</p>
                <p className="text-sm text-foreground/70">Resales remaining: {ticket.resaleInfo.resalesRemaining}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}