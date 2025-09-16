"use client";

import { EventItem } from "@/hooks/useEvents";
import Link from "next/link";

function groupByDay(events: EventItem[]) {
  const map = new Map<string, EventItem[]>();
  for (const e of events) {
    const key = e.date; // YYYY-MM-DD
    const arr = map.get(key) || [];
    arr.push(e);
    map.set(key, arr);
  }
  // sort by date ascending
  return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

export default function EventTimeline({ events }: { events: EventItem[] }) {
  const groups = groupByDay(events);

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-foreground/20 via-foreground/10 to-transparent" />
      
      <div className="space-y-12">
        {groups.map(([day, items], index) => (
          <section key={`${day}-${index}`} className="relative pl-12 fade-in">
            {/* Date indicator */}
            <div className="absolute left-0 top-2 w-8 h-8 rounded-full glass flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-foreground"></div>
            </div>
            
            {/* Date header */}
            <h3 className="text-lg font-semibold mb-6 text-foreground/90">{formatDay(day)}</h3>
            
            <div className="space-y-6">
              {items.map((e, index) => (
                <Link 
                  key={e.eventAddress} 
                  href={`/events/${e.eventAddress}`} 
                  className="block card hover:scale-[1.02] transition-all duration-300 ease-out slide-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <article className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Event meta */}
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-foreground/60 font-medium">{formatTime(e.time)}</div>
                          {e.eventType === 1 && e.ticketPrice !== undefined && (
                            <span className="text-xs font-semibold px-3 py-1 rounded-full glass border border-foreground/10">
                              {e.ticketPrice}
                            </span>
                          )}
                        </div>
                        
                        {/* Event title */}
                        <h4 className="text-xl font-bold text-foreground leading-tight">{e.name}</h4>
                        
                        {/* Organization */}
                        {e.organization && (
                          <div className="text-sm text-foreground/70 font-medium">{e.organization}</div>
                        )}
                        
                        {/* Location */}
                        <div className="flex items-center gap-4 text-sm text-foreground/60">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-foreground/40"></div>
                            <span>{e.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Event banner */}
                      {e.bannerUrl && (
                        <div className="relative overflow-hidden rounded-xl border border-foreground/10">
                          <img 
                            src={e.bannerUrl} 
                            alt="banner" 
                            className="w-32 h-24 object-cover transition-transform duration-300 hover:scale-110" 
                          />
                        </div>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function formatDay(day: string) {
  const d = new Date(day);
  if (isNaN(d.getTime())) {
    return day || "Invalid Date";
  }
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });
  const label = formatter.format(d);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  let prefix = "";
  if (isToday) prefix = "Today";
  else if (isTomorrow) prefix = "Tomorrow";

  return prefix ? `${prefix} • ${label}` : label;
}

function formatTime(t: string) {
  // expects HH:mm
  try {
    const [h, m] = t.split(":").map((x) => parseInt(x));
    const d = new Date();
    d.setHours(h, m);
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(d);
  } catch {
    return t;
  }
}