"use client";

import { useAccount } from "wagmi";
import { useEvents } from "@/hooks/useEvents";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { eventFactoryABI, eventFactoryAddress } from "../../../web3/constants";
import { type Address } from "viem";
import Toast from "@/components/Toast";

export default function DashboardPage() {
  const { address } = useAccount();
  const { events, loadEvents } = useEvents();
  const [deactivateTxHash, setDeactivateTxHash] = useState<string | null>(null);

  // Deactivate event hooks
  const { writeContract: writeDeactivateContract, data: deactivateHash, error: deactivateError, isPending: deactivatePending } = useWriteContract();
  const { data: deactivateTxReceipt, isLoading: deactivateTxLoading } = useWaitForTransactionReceipt({
    hash: deactivateHash,
  });

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Filter events where user is the organizer
  const myEvents = events.filter(event => event.organizer && event.organizer.toLowerCase() === address?.toLowerCase());

  const handleDeactivateEvent = async (eventAddress: string) => {
    try {
      writeDeactivateContract({
        address: eventFactoryAddress,
        abi: eventFactoryABI.abi,
        functionName: 'deactivateEvent',
        args: [eventAddress as Address],
      });
    } catch (error) {
      console.error('Failed to deactivate event:', error);
    }
  };

  if (!address) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-6">Organizer Dashboard</h1>
        <p className="text-lg text-foreground/70">
          Please connect your wallet to access your organizer dashboard.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold text-foreground mb-6">Organizer Dashboard</h1>
      <p className="text-lg text-foreground/70 mb-6">
        Welcome to your organizer dashboard. Here you can manage your events, view registrations, and more.
      </p>

      {myEvents.length === 0 ? (
        <div className="text-center py-16 card fade-in">
          <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No events found</h3>
          <p className="text-foreground/60">You haven't created any events yet.</p>
          <Link href="/host" className="btn-primary mt-4 inline-block">
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Your Events ({myEvents.length})</h2>
            <Link href="/host" className="btn-primary">
              Create New Event
            </Link>
          </div>

          <div className="grid gap-6">
            {myEvents.map((event) => (
              <div key={event.eventAddress} className="card p-6 fade-in">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-foreground">{event.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium glass border ${
                        event.eventType === 1 ? 'border-foreground/20 text-foreground' : 'border-foreground/10 text-foreground/70'
                      }`}>
                        {event.eventType === 1 ? 'Paid Event' : 'Free Event'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-foreground/60">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{event.date} at {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{event.location}</span>
                      </div>
                    </div>

                    {event.organization && (
                      <div className="text-sm text-foreground/70">
                        Hosted by {event.organization}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/events/${event.eventAddress}`}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      View Event
                    </Link>
                    {event.eventType === 2 && (
                      <Link
                        href={`/events/${event.eventAddress}/review`}
                        className="btn-secondary text-sm px-4 py-2"
                      >
                        Review Registrations
                      </Link>
                    )}
                    <Link
                      href={`/events/${event.eventAddress}/edit`}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      Edit Event
                    </Link>
                    <button
                      onClick={() => handleDeactivateEvent(event.eventAddress)}
                      disabled={deactivatePending || deactivateTxLoading}
                      className="btn-danger text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deactivatePending || deactivateTxLoading ? 'Deactivating...' : 'Deactivate Event'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success/Error Toast */}
      {(deactivateTxReceipt || deactivateError) && (
        <Toast
          message={deactivateTxReceipt ? 'Event deactivated successfully!' : 'Failed to deactivate event'}
          type={deactivateTxReceipt ? 'success' : 'error'}
          onClose={() => {
            // Reset states
            setDeactivateTxHash(null);
            if (deactivateTxReceipt) {
              // Reload events
              loadEvents();
            }
          }}
        />
      )}
    </main>
  );
}
