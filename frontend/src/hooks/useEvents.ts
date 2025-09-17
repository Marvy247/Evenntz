import { useCallback, useEffect, useState } from "react";
import { web3Service, EventType } from "@/Services/Web3Service";

export type FormField = {
  id: string;
  label: string;
  type: "text" | "email" | "number";
  required?: boolean;
};

export type EventItem = {
  eventAddress: string;
  name: string;
  eventType: EventType;
  ticketPrice: string;
  organizer: string;
  bannerUrl: string; // gateway URL for the banner image
  bannerCid?: string; // optional raw CID
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  organization?: string;
  organizationDescription?: string;
  eventDescription?: string;
  lat?: number;
  lng?: number;
  formSchema?: FormField[];
  analytics?: {
    totalTicketsSold: number;
    checkIns: number;
    totalRevenue: string;
  };
  // Additional mapped properties
  id: string;
  isPaid: boolean;
  price: string;
  approvalNeeded: boolean;
  hostAddress: string;
  currency?: string;
  active: boolean;
};

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const allEvents = await web3Service.getAllEvents();

      const eventsWithAnalytics = await Promise.all(
        // @ts-ignore
        allEvents.filter(event => event.active).map(async (event) => {
          const analytics = await web3Service.getEventAnalytics(event.eventAddress);
          return {
            ...event,
            id: event.eventAddress,
            isPaid: event.eventType === EventType.PAID,
            price: event.ticketPrice,
            approvalNeeded: event.eventType === EventType.APPROVAL,
            hostAddress: event.organizer,
            organizer: event.organizer,
            blockchainEventAddress: event.eventAddress,
            active: event.active,
            analytics,
          };
        })
      );

      setEvents(eventsWithAnalytics);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const updateEvent = (id: string, updates: Partial<EventItem>) => {
    setEvents(prev => prev.map(event => event.id === id ? { ...event, ...updates } : event));
  };

  return {
    events,
    loading,
    loadEvents,
    updateEvent,
  };
}