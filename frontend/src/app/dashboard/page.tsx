"use client";

import { useAuth } from "@/hooks/useAuth";

import { useAccount } from "wagmi";
import { useEvents } from "@/hooks/useEvents";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { eventFactoryABI, eventFactoryAddress } from "../../../web3/constants";
import { type Address } from "viem";
import Toast from "@/components/Toast";
import EventTimeline from "@/components/EventTimeline";
import OrganizerStats from "@/components/OrganizerStats";

export default function DashboardPage() {
    const { organization, isAuthenticated, loading: authLoading } = useAuth();
    const { address } = useAccount();
    const { events, loadEvents } = useEvents();
    const [deactivateTxHash, setDeactivateTxHash] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filterType, setFilterType] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("date");
  
    // Export functionality
    const exportEventsToCSV = () => {
      const headers = ["Name", "Date", "Time", "Location", "Type", "Organization", "Tickets Sold", "Revenue"];
      const csvContent = [
        headers.join(","),
        ...filteredEvents.map(event => {
          return [
            `"${event.name}"`,
            event.date,
            event.time,
            `"${event.location}"`,
            event.eventType === 1 ? "Paid" : event.eventType === 2 ? "Approval Required" : "Free",
            `"${event.organization || ""}"`,
            event.analytics?.totalTicketsSold || 0,
            event.analytics?.totalRevenue || 0
          ].join(",");
        })
      ].join("\n");
  
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `events-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  
    // Deactivate event hooks
    const { writeContract: writeDeactivateContract, data: deactivateHash, error: deactivateError, isPending: deactivatePending } = useWriteContract();
    const { data: deactivateTxReceipt, isLoading: deactivateTxLoading } = useWaitForTransactionReceipt({
      hash: deactivateHash,
    });
  
    useEffect(() => {
      loadEvents();
    }, [loadEvents]);
  
    // Filter events where user is the organizer
    const myEvents = events.filter(event =>
      isAuthenticated && organization
        ? event.organizer.toLowerCase() === organization.address.toLowerCase()
        : event.organizer.toLowerCase() === address?.toLowerCase()
    );
  // Filter upcoming events for timeline
  const upcomingEvents = myEvents.filter(event => {
    const eventDate = new Date(`${event.date}T${event.time}`);
    return eventDate > new Date();
  }).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Filter and sort events for main list
  const filteredEvents = myEvents.filter(event => {
    // Search filter
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.organization && event.organization.toLowerCase().includes(searchTerm.toLowerCase()));

    // Type filter
    const matchesType = filterType === "all" ||
                       (filterType === "paid" && event.eventType === 1) ||
                       (filterType === "free" && event.eventType === 0) ||
                       (filterType === "approval" && event.eventType === 2);

    return matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortBy === "date") {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "type") {
      return a.eventType - b.eventType;
    }
    return 0;
  });

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

      {/* Stats Section */}
      <div className="mb-12">
        <OrganizerStats
          eventsCount={myEvents.length}
          totalTicketsSold={myEvents.reduce((acc, event) => acc + (event.analytics?.totalTicketsSold || 0), 0)}
          totalRevenue={myEvents.reduce((acc, event) => acc + parseFloat(event.analytics?.totalRevenue || '0'), 0)}
          pendingApprovals={3} // Placeholder - would be fetched from backend
        />
      </div>

      {/* Upcoming Events Timeline */}
      {upcomingEvents.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Upcoming Events</h2>
          <EventTimeline events={upcomingEvents} />
        </div>
      )}

      {/* Organization Profile Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Organization Profile</h2>
        <div className="card p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
              {address ? address.slice(0, 2).toUpperCase() : "O"}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">{organization?.name || 'Your Organization'}</h3>
              <p className="text-sm text-foreground/70 mb-4">
                {organization?.description || 'Manage your organization profile and settings. This information will be displayed on your event pages.'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">Organization Name</label>
                  <input
                    type="text"
                    placeholder="Enter organization name"
                    className="w-full px-3 py-2 border border-foreground/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    defaultValue={organization?.name || ""} // Placeholder
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">Website</label>
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border border-foreground/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    defaultValue={organization?.website || ""} // Placeholder
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="contact@yourorg.com"
                    className="w-full px-3 py-2 border border-foreground/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    defaultValue="" // Placeholder
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-foreground/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    defaultValue="" // Placeholder
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications/Alerts Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Notifications</h2>
        <div className="space-y-4">
          {/* Pending Approvals Alert */}
          {myEvents.filter(event => event.eventType === 2).length > 0 && (
            <div className="card p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 fade-in">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Pending Registrations</h3>
                  <p className="text-sm text-foreground/70 mb-3">
                    {myEvents.filter(event => event.eventType === 2).length} event{myEvents.filter(event => event.eventType === 2).length > 1 ? 's' : ''} require{myEvents.filter(event => event.eventType === 2).length === 1 ? 's' : ''} registration approval.
                  </p>
                  <div className="flex gap-2">
                    {myEvents.filter(event => event.eventType === 2).slice(0, 2).map((event) => (
                      <Link
                        key={event.eventAddress}
                        href={`/events/${event.eventAddress}/review`}
                        className="btn-primary text-xs px-3 py-1"
                      >
                        Review {event.name}
                      </Link>
                    ))}
                    {myEvents.filter(event => event.eventType === 2).length > 2 && (
                      <span className="text-xs text-foreground/60 self-center">
                        +{myEvents.filter(event => event.eventType === 2).length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Events Alert */}
          {upcomingEvents.length > 0 && (
            <div className="card p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 fade-in">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Upcoming Events</h3>
                  <p className="text-sm text-foreground/70 mb-3">
                    You have {upcomingEvents.length} upcoming event{upcomingEvents.length > 1 ? 's' : ''} scheduled.
                  </p>
                  <div className="flex gap-2">
                    <Link href="#upcoming-events" className="btn-secondary text-xs px-3 py-1">
                      View Timeline
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Low Ticket Sales Alert */}
          {myEvents.some(event => {
            const ticketsSold = event.analytics?.totalTicketsSold || 0;
            return ticketsSold < 20 && new Date(`${event.date}T${event.time}`) > new Date();
          }) && (
            <div className="card p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 fade-in">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Low Ticket Sales</h3>
                  <p className="text-sm text-foreground/70 mb-3">
                    Some of your upcoming events have low ticket sales. Consider promoting them more.
                  </p>
                  <div className="flex gap-2">
                    <Link href="/host" className="btn-secondary text-xs px-3 py-1">
                      Create Promotion
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No notifications */}
          {myEvents.filter(event => event.eventType === 2).length === 0 && upcomingEvents.length === 0 && (
            <div className="card p-6 text-center fade-in">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1">All Clear</h3>
              <p className="text-sm text-foreground/70">No notifications at this time.</p>
            </div>
          )}
        </div>
      </div>

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
            <h2 className="text-2xl font-semibold text-foreground">Your Events ({filteredEvents.length})</h2>
            <div className="flex gap-3">
              <button
                onClick={exportEventsToCSV}
                className="btn-secondary text-sm px-4 py-2"
                disabled={filteredEvents.length === 0}
              >
                📊 Export Report
              </button>
              <Link href="/host" className="btn-primary">
                Create New Event
              </Link>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="card p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search events by name, location, or organization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-foreground/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Filter by Type */}
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-foreground/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">All Types</option>
                  <option value="free">Free Events</option>
                  <option value="paid">Paid Events</option>
                  <option value="approval">Approval Required</option>
                </select>

                {/* Sort Options */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-foreground/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="type">Sort by Type</option>
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            {(searchTerm || filterType !== "all") && (
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <span>Filters:</span>
                {searchTerm && <span className="px-2 py-1 bg-primary/10 rounded">Search: "{searchTerm}"</span>}
                {filterType !== "all" && <span className="px-2 py-1 bg-primary/10 rounded">Type: {filterType}</span>}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("all");
                  }}
                  className="text-primary hover:underline ml-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-6">
            {filteredEvents.map((event) => {
              const analytics = {
                ticketsSold: event.analytics?.totalTicketsSold || 0,
                totalCapacity: 100, // Placeholder
                revenue: parseFloat(event.analytics?.totalRevenue || '0'),
                checkIns: event.analytics?.checkIns || 0,
              };

              return (
                <div key={event.eventAddress} className="card p-6 fade-in">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex items-start gap-4">
                        {/* Event Banner */}
                        {event.bannerUrl && (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-foreground/10 flex-shrink-0">
                            <img
                              src={event.bannerUrl}
                              alt={`${event.name} banner`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-foreground">{event.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium glass border ${ 
                              event.eventType === 1 ? 'border-foreground/20 text-foreground' : 'border-foreground/10 text-foreground/70'
                            }`}>
                              {event.eventType === 1 ? 'Paid Event' : event.eventType === 2 ? 'Approval Required' : 'Free Event'}
                            </span>
                          </div>
                          {event.organization && (
                            <div className="text-sm text-foreground/70 mb-2">
                              Hosted by {event.organization}
                            </div>
                          )}
                        </div>
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



                      {/* Analytics Section */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-foreground/10">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground/70">Tickets Sold</span>
                            <span className="font-medium">{analytics.ticketsSold}/{analytics.totalCapacity}</span>
                          </div>
                          <div className="w-full bg-foreground/10 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(analytics.ticketsSold / analytics.totalCapacity) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {event.isPaid && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground/70">Revenue</span>
                              <span className="font-medium">{analytics.revenue} ETH</span>
                            </div>
                            <div className="w-full bg-foreground/10 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((analytics.revenue / 2) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground/70">Check-ins</span>
                            <span className="font-medium">{analytics.checkIns}/{analytics.ticketsSold}</span>
                          </div>
                          <div className="w-full bg-foreground/10 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(analytics.checkIns / analytics.ticketsSold) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Link
                        href={`/events/${event.eventAddress}`}
                        className="btn-secondary text-sm px-4 py-2 text-center"
                      >
                        View Event
                      </Link>
                      {event.eventType === 2 && (
                        <Link
                          href={`/events/${event.eventAddress}/review`}
                          className="btn-secondary text-sm px-4 py-2 text-center"
                        >
                          Review Registrations
                        </Link>
                      )}
                      <Link
                        href={`/events/${event.eventAddress}/edit`}
                        className="btn-primary text-sm px-4 py-2 text-center"
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
              );
            })}
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