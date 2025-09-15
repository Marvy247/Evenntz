"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { web3Service, EventType } from "@/Services/Web3Service";
import React from "react";

export default function RegisterForEvent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  const [event, setEvent] = useState<any>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvent() {
      try {
        const eventData = await web3Service.getEventInfo(id);
        setEvent(eventData);
      } catch (error) {
        console.error('Failed to load event:', error);
      } finally {
        setEventLoading(false);
      }
    }
    
    loadEvent();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) {
      setError("Please connect your wallet to register.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let metadataURI = ""; // In a real application, you would upload metadata to IPFS here.

      if (event.eventType === EventType.FREE) {
        await web3Service.buyTicket({ eventAddress: id, metadataURI });
      } else if (event.eventType === EventType.PAID) {
        await web3Service.buyTicket({ eventAddress: id, metadataURI, value: event.ticketPrice });
      } else if (event.eventType === EventType.APPROVAL) {
        // For approval-based events, the user needs to be approved first.
        // This should be handled in a separate UI where the event organizer can approve users.
        // For now, we'll just show an error.
        setError("This event requires approval from the organizer.");
        setSubmitting(false);
        return;
      }

      router.push(`/events/${id}`);
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (eventLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading event...</p>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm">Event not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <Link href={`/events/${id}`} className="text-sm hover:underline">← Back to event</Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Register for {event.name}</h1>
      
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <button 
          disabled={submitting} 
          type="submit" 
          className="btn-primary w-full"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mr-2"></div>
              Submitting...
            </>
          ) : (
            "Register for this Event"
          )}
        </button>
      </form>
    </main>
  );
}