"use client";

import RegisterButton from "@/components/RegisterButton";
import Link from "next/link";
import Image from "next/image";
import Markdown from "@/components/Markdown";
import { useEffect, useState, useCallback } from "react";
import React from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther, type Address } from "viem";
import { eventTicketABI, eventImplementationABI, eventFactoryABI, eventFactoryAddress } from "../../../../web3/constants";
import NFTDisplay from "@/components/tickets/NFTDisplay";
import Toast from "@/components/Toast";
import BlockchainNFTTicket from "@/components/BlockchainNFTTicket";
import { web3Service } from "@/Services/Web3Service";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { address } = useAccount();

  // Event state
  const [event, setEvent] = useState<any>(null);
  const [eventLoading, setEventLoading] = useState(true);

  // Deactivate event state
  const [deactivateTxHash, setDeactivateTxHash] = useState<string | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Cast id to Address type
  const eventAddress = id as Address;

  // Deactivate event hooks
  const { writeContract: writeDeactivateContract, data: deactivateHash, error: deactivateError, isPending: deactivatePending } = useWriteContract();
  const { data: deactivateTxReceipt, isLoading: deactivateTxLoading } = useWaitForTransactionReceipt({
    hash: deactivateHash,
  });

  // Load event data
  useEffect(() => {
    async function loadEvent() {
      try {
        console.log('🔍 Loading event for detail page:', eventAddress);
        const eventData = await web3Service.getEventInfo(eventAddress);
        console.log('✅ Event loaded for detail page:', eventData);
        setEvent(eventData);
      } catch (error) {
        console.error('❌ Failed to load event for detail page:', error);
      } finally {
        setEventLoading(false);
      }
    }

    loadEvent();
  }, [eventAddress]);

  // Handle deactivate event
  const handleDeactivateEvent = async () => {
    try {
      writeDeactivateContract({
        address: eventFactoryAddress,
        abi: eventFactoryABI.abi,
        functionName: 'deactivateEvent',
        args: [eventAddress],
      });
      setShowDeactivateConfirm(false);
    } catch (error) {
      console.error('Failed to deactivate event:', error);
    }
  };

  // Early return for loading states (after all hooks)
  if (eventLoading) {
  return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading event...</p>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-sm">Event not found.</p>
      </main>
    );
  }

  const isHost = event?.organizer && event.organizer.toLowerCase() === address?.toLowerCase();

  return (
    <main className="min-h-screen">
      {/* Hero Banner Section */}
      {event.bannerUrl && (
        <section className="relative h-96 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
          <img 
            src={event.bannerUrl} 
            alt={`${event.name} banner`} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 z-20 p-8">
            <div className="mx-auto max-w-6xl">
              <Link 
                href="/events" 
                className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors mb-4 group"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Events
            </Link>
              
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 drop-shadow-lg">
                {event.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-foreground/90">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{event.time}</span>
                </div>
        </div>
      </div>
            </div>
        </section>
      )}

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Details */}
            <div className="card p-8 fade-in">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium glass border ${
                      event.eventType === 1 ? 'border-foreground/20 text-foreground' : 'border-foreground/10 text-foreground/70'
                    }`}>
                      {event.eventType === 1 ? `${formatEther(event.ticketPrice)} SEP Tokens` : 'Free Event'}
                    </span>
                    {event.eventType === 2 && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium glass border border-foreground/10 text-foreground/70">
                        Approval Required
                </span>
              )}
            </div>
                </div>
                
                {/* Host Actions */}
                {console.log('isHost:', isHost)}
                {isHost && (
                  <div className="flex items-center gap-3">
                    {event.eventType === 2 && (
                      <Link
                        href={`/events/${id}/review`}
                        className="btn-secondary text-sm px-4 py-2"
                      >
                        Review Registrations
                      </Link>
                    )}
                    <Link
                      href={`/events/${id}/edit`}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      Edit Event
                    </Link>
                    <button
                      onClick={() => setShowDeactivateConfirm(true)}
                      disabled={deactivatePending || deactivateTxLoading}
                      className="btn-danger text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deactivatePending || deactivateTxLoading ? 'Deactivating...' : 'Deactivate Event'}
                    </button>
                </div>
            )}
              </div>

              {/* Event Description */}
          {event.eventDescription && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">About This Event</h2>
                  <div className="prose prose-foreground max-w-none">
              <Markdown content={event.eventDescription} />
                  </div>
                </div>
          )}

              {/* Organization Info */}
          {(event.organization || event.organizationDescription) && (
                <div className="space-y-4 pt-6 border-t border-foreground/10">
                  <h2 className="text-2xl font-semibold text-foreground">Host Organization</h2>
              {event.organization && (
                    <h3 className="text-lg font-medium text-foreground">{event.organization}</h3>
              )}
              {event.organizationDescription && (
                    <p className="text-foreground/70 leading-relaxed whitespace-pre-wrap">
                  {event.organizationDescription}
                </p>
              )}
                </div>
          )}
            </div>

            {/* Location Map */}
          {(event.lat && event.lng) && (
              <div className="card p-8 fade-in">
                <h2 className="text-2xl font-semibold text-foreground mb-6">Location</h2>
                <div className="rounded-xl overflow-hidden border border-foreground/10">
                  <iframe 
                    title="Event location map" 
                    width="100%" 
                    height="400" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade" 
                    src={`https://www.google.com/maps?q=${encodeURIComponent(String(event.lat)+","+String(event.lng))}&output=embed`} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Registration & QR */}
          <div className="space-y-6">
            {/* Registration Status */}
            <div className="card p-6 fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Registration Status</h3>
              </div>
              
                <div className="space-y-4">
                  <p className="text-foreground/70 text-center">Ready to join this event?</p>
                  <RegisterButton eventId={id} />
                </div>
            </div>

            {/* Event Quick Info */}
            <div className="card p-6 fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-4">Event Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-foreground/70">Date</span>
                  <span className="font-medium">{event.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground/70">Time</span>
                  <span className="font-medium">{event.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground/70">Location</span>
                  <span className="font-medium">{event.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground/70">Price</span>
                  <span className="font-medium">
                    {event.eventType === 1 ? `${formatEther(event.ticketPrice)} SEP Tokens` : 'Free'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground/70">Approval</span>
                  <span className="font-medium">
                    {event.eventType === 2 ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deactivate Event Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-foreground/10 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-foreground mb-4">Deactivate Event</h3>
            <p className="text-foreground/70 mb-6">
              Are you sure you want to deactivate this event? This action cannot be undone and will prevent new registrations.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 btn-secondary"
                disabled={deactivatePending || deactivateTxLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateEvent}
                disabled={deactivatePending || deactivateTxLoading}
                className="flex-1 btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deactivatePending || deactivateTxLoading ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
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
              // Reload the page or update event state
              window.location.reload();
            }
          }}
        />
      )}
    </main>
  );
}
