"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OrganizerStatItem {
  id: number;
  value: number;
  label: string;
  suffix: string;
  icon: React.ReactNode;
  color: string;
}

interface OrganizerStatsProps {
  eventsCount: number;
  totalTicketsSold?: number;
  totalRevenue?: number;
  pendingApprovals?: number;
}

export default function OrganizerStats({ eventsCount, totalTicketsSold = 0, totalRevenue = 0, pendingApprovals = 0 }: OrganizerStatsProps) {
  const stats: OrganizerStatItem[] = [
    {
      id: 1,
      value: eventsCount,
      label: "Events Created",
      suffix: "",
      color: "from-blue-500 to-blue-600",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 2,
      value: totalTicketsSold,
      label: "Tickets Sold",
      suffix: "+",
      color: "from-green-500 to-green-600",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    {
      id: 3,
      value: totalRevenue,
      label: "Total Revenue",
      suffix: " ETH",
      color: "from-purple-500 to-purple-600",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const [animatedValues, setAnimatedValues] = useState<number[]>(stats.map(() => 0));

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    const timers = stats.map((stat, index) => {
      const increment = stat.value / steps;
      let current = 0;

      return setInterval(() => {
        current += increment;
        if (current >= stat.value) {
          current = stat.value;
          clearInterval(timers[index]);
        }
        setAnimatedValues(prev => {
          const newValues = [...prev];
          newValues[index] = Math.floor(current);
          return newValues;
        });
      }, interval);
    });

    return () => timers.forEach(clearInterval);
  }, [eventsCount, totalTicketsSold, totalRevenue, pendingApprovals]);

  return (
    <section className="py-8 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Your Event Performance
          </h2>
          <p className="text-sm text-foreground/70">
            Track your event management metrics
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className="card p-4 text-center group hover:scale-105 transition-all duration-300 slide-in"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform text-white`}>
                {stat.icon}
              </div>
              <div className="text-xl font-bold text-foreground mb-1">
                {animatedValues[index].toLocaleString()}{stat.suffix}
              </div>
              <div className="text-xs text-foreground/70">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/dashboard/nft" className="btn-primary">
            Manage NFT Tickets
          </Link>
          <Link href="/dashboard/analytics" className="btn-secondary ml-4">
            View Analytics
          </Link>
        </div>
      </div>
    </section>
  );
}