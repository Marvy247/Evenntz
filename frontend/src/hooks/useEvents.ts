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
  active: boolean;
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
};

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const allEvents = await web3Service.getAllEvents();
      // @ts-ignore
      setEvents(allEvents.map(event => ({
        ...event,
        id: event.eventAddress,
        isPaid: event.eventType === EventType.PAID,
        price: event.ticketPrice,
        approvalNeeded: event.eventType === EventType.APPROVAL,
        hostAddress: event.organizer,
        blockchainEventAddress: event.eventAddress,
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    loading,
    loadEvents,
  };
}