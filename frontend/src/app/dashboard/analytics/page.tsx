"use client";

import { useAccount } from "wagmi";

export default function AnalyticsDashboardPage() {
  const { address } = useAccount();

  if (!address) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-6">Analytics Dashboard</h1>
        <p className="text-lg text-foreground/70">
          Please connect your wallet to access your analytics dashboard.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-bold text-foreground mb-6">Analytics Dashboard</h1>
      <p className="text-lg text-foreground/70 mb-6">
        Welcome to your analytics dashboard. Here you can view detailed analytics for your events.
      </p>
    </main>
  );
}