"use client";

import { useEffect, useState } from 'react';

interface StatItem {
  id: number;
  value: number;
  label: string;
  suffix: string;
  icon: React.ReactNode;
}

export default function Stats() {
  const stats: StatItem[] = [
    {
      id: 1,
      value: 10000,
      label: "Events Hosted",
      suffix: "+",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 2,
      value: 50000,
      label: "Active Users",
      suffix: "+",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    {
      id: 3,
      value: 99,
      label: "Uptime",
      suffix: ".9%",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 4,
      value: 150,
      label: "Countries",
      suffix: "+",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  }, []);

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-primary/5 to-accent/5" data-aos="fade-up">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 fade-in" data-aos="fade-down">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 sm:mb-6">
            Trusted Worldwide
          </h2>
          <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto px-4">
            Join a growing community of event organizers and attendees
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className="card p-6 sm:p-8 text-center group hover:scale-105 transition-all duration-300 slide-in"
              data-aos="fade-up"
              data-aos-delay={index * 200}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 glass rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform text-foreground">
                {stat.icon}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {animatedValues[index].toLocaleString()}{stat.suffix}
              </div>
              <div className="text-sm sm:text-base text-foreground/70">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
