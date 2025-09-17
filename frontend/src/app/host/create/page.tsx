"use client";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { web3Service, EventType } from "@/Services/Web3Service";

export default function CreateEventPage() {
  const router = useRouter();
  const { organization, isAuthenticated, loading: authLoading } = useAuth();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [name, setName] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<string>("");
  const [maxTickets, setMaxTickets] = useState<string>("");
  const [approvalNeeded, setApprovalNeeded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/host/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || !organization) {
      setError("Please sign in to create events");
      return;
    }

    if (!isConnected) {
      if (openConnectModal) {
        openConnectModal();
      }
      return;
    }

    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      let eventType: EventType;
      if (isPaid) {
        eventType = EventType.PAID;
      } else if (approvalNeeded) {
        eventType = EventType.APPROVAL;
      } else {
        eventType = EventType.FREE;
      }

      await web3Service.createEvent({
        name,
        eventType,
        ticketPrice: isPaid ? web3Service.parseEther(price) : "0",
        maxTickets: maxTickets,
      });
      
      router.push('/host/dashboard');
    } catch (e: any) {
      setError(e?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to signin
  }

  return (
    <main className="min-h-screen bg-foreground/2">
      <div className="bg-foreground/5 text-foreground py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Create Your Event</h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto mb-6">
            Create and manage your events on the blockchain.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-16">
        <form onSubmit={submit} className="card p-8 space-y-8">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-lg font-medium text-foreground" htmlFor="name">
              Event Name *
            </label>
            <input 
              id="name" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="input text-lg" 
              placeholder="Enter your event name"
              required 
            />
          </div>

          <div className="space-y-3">
            <label className="block text-lg font-medium text-foreground" htmlFor="maxTickets">
              Number of Tickets to be Sold *
            </label>
            <input 
              id="maxTickets" 
              type="number" 
              value={maxTickets} 
              onChange={(e) => setMaxTickets(e.target.value)} 
              className="input text-lg" 
              placeholder="Enter the number of tickets"
              required 
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium text-foreground">Event Type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                !isPaid && !approvalNeeded
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-foreground/20 hover:border-foreground/40'
              }`}>
                <input 
                  type="radio" 
                  name="eventType" 
                  checked={!isPaid && !approvalNeeded} 
                  onChange={() => { setIsPaid(false); setApprovalNeeded(false); }} 
                  className="sr-only"
                />
                <h4 className="font-semibold text-foreground mb-1">Free Event</h4>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isPaid
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-foreground/20 hover:border-foreground/40'
              }`}>
                <input 
                  type="radio" 
                  name="eventType" 
                  checked={isPaid} 
                  onChange={() => { setIsPaid(true); setApprovalNeeded(false); }} 
                  className="sr-only"
                />
                <h4 className="font-semibold text-foreground mb-1">Paid Event</h4>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                approvalNeeded
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-foreground/20 hover:border-foreground/40'
              }`}>
                <input 
                  type="radio" 
                  name="eventType" 
                  checked={approvalNeeded} 
                  onChange={() => { setIsPaid(false); setApprovalNeeded(true); }} 
                  className="sr-only"
                />
                <h4 className="font-semibold text-foreground mb-1">Approval-Based</h4>
              </label>
            </div>
          </div>

          {isPaid && (
            <div className="glass p-6 rounded-xl space-y-4">
              <h4 className="font-medium text-foreground">Ticket Pricing</h4>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Price</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      placeholder="0.00" 
                      className="input w-full" 
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-foreground/5 rounded-lg border border-foreground/10">
                    <span className="text-sm font-medium text-foreground">SEP Tokens</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-8">
            <button 
              type="submit" 
              disabled={!name || submitting} 
              className="text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {submitting ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
