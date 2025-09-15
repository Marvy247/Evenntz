"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { web3Service } from "@/Services/Web3Service";
import WalletConnect from "@/components/tickets/WalletConnect";

export default function HostRegisterOrgPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!address || !orgName) {
      setError("Please connect your wallet and enter an organization name");
      return;
    }
    
    try {
      setSubmitting(true);
      await web3Service.registerOrganization({ name: orgName, description: orgDescription, website: orgWebsite });
      router.push("/host/dashboard");
    } catch (e: any) {
      setError(e?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-foreground/2">
      {/* Header Section */}
      <div className="bg-foreground/5 text-foreground py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Register Organization</h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-anto">
            Connect your wallet and create your organization account to start hosting events
          </p>
        </div>
      </div>

      {/* Registration Form */}
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <div className="card p-8 fade-in">
          <form onSubmit={submit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            <div className="space-y-3">
              <label className="block text-lg font-medium text-foreground">
                Connect Wallet *
              </label>
              <WalletConnect 
                onAddressChange={() => {}}
                className="w-full"
              />
              {address && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Wallet connected: {address}</span>
                </div>
              )}
              <p className="text-sm text-foreground/60">
                Your wallet address will be your organization's unique identifier
              </p>
            </div>
            
            <div className="space-y-3">
              <label className="block text-lg font-medium text-foreground" htmlFor="orgName">
                Organization Name *
              </label>
              <input 
                id="orgName" 
                type="text" 
                value={orgName} 
                onChange={(e) => setOrgName(e.target.value)} 
                className="input" 
                placeholder="Enter your organization name"
                required 
              />
            </div>

            <div className="space-y-3">
              <label className="block text-lg font-medium text-foreground" htmlFor="orgWebsite">
                Website
              </label>
              <input 
                id="orgWebsite" 
                type="text" 
                value={orgWebsite} 
                onChange={(e) => setOrgWebsite(e.target.value)} 
                className="input" 
                placeholder="https://your-organization.com"
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-lg font-medium text-foreground" htmlFor="orgDescription">
                Description
              </label>
              <textarea 
                id="orgDescription" 
                value={orgDescription} 
                onChange={(e) => setOrgDescription(e.target.value)} 
                rows={3} 
                className="input resize-none"
                placeholder="Tell people about your organization"
              />
            </div>
            
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={submitting || !address} 
                className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating Organization...' : 'Create Organization'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/host/signin" className="text-foreground/70 hover:text-foreground transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}