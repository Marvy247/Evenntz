"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { web3Service, EventType } from "@/Services/Web3Service";
import { useAccount } from "wagmi";

export default function HostDashboardPage() {
  const router = useRouter();
  const { organization, isAuthenticated, loading: authLoading } = useAuth();
  const { address } = useAccount();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/host/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    async function loadEvents() {
      if (!organization) {
        return;
      }

      try {
        setLoading(true);
        const eventsData = await web3Service.getAllEvents();
        const orgEvents = eventsData.filter((event: any) => event.organizer.toLowerCase() === organization.address.toLowerCase());
        setEvents(orgEvents);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    }

    if (organization) {
      loadEvents();
      
    }
  }, [organization]);

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm">Loading...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to signin
  }

  

  return (
    <main className="mx-auto max-w-3xl px-4 py-4 lg:py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Organizer Dashboard</h1>
            <p className="text-foreground/60">Manage your events and organization</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/host" className="btn-primary flex items-center gap-2 px-4 py-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Event</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8 card p-6 fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Organization Details</h2>
          
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-lg font-medium text-foreground">{organization?.name}</p>
            {organization?.description && (
              <p className="text-foreground/70 leading-relaxed">{organization.description}</p>
            )}
          </div>
          {organization?.website && (
            <div className="pt-2 border-t border-foreground/10">
              <a href={organization.website} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">
                {organization.website}
              </a>
            </div>
          )}
          {organization?.address && (
            <div className="pt-2 border-t border-foreground/10">
              <div className="flex items-center gap-2 text-sm text-foreground/60">
                <span className="font-medium">Wallet Address:</span>
                <span className="font-mono bg-foreground/5 px-2 py-1 rounded">
                  {organization.address}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 card fade-in">
          <h3 className="text-xl font-semibold text-foreground mb-2">No events yet</h3>
          <p className="text-foreground/60 mb-6">Create your first event to get started</p>
          <Link href="/host" className="btn-primary">
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="fade-in">
            <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-3">
              Your Events
            </h2>
            <div className="space-y-4">
              {events.map((e, index) => (
                <div key={e.eventAddress} className="card p-6 slide-in hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-foreground truncate mb-1">{e.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${e.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {e.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link 
                      href={`/events/${e.eventAddress}`}
                      className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                    >
                      View Event
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}