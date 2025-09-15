"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import WalletConnect from "@/components/tickets/WalletConnect";
import { useAccount } from "wagmi";

export default function HostSigninPage() {
  const router = useRouter();
  const { signIn, isAuthenticated } = useAuth();
  const { address } = useAccount();
  const [submitting, setSubmitting] = useState(false);
  const [showRegisterOption, setShowRegisterOption] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/host/dashboard');
    }
  }, [isAuthenticated, router]);

  // Handle wallet-based signin
  useEffect(() => {
    if (address) {
      handleWalletSignin();
    }
  }, [address]);

  // Don't render the form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  async function handleWalletSignin() {
    if (!address) return;

    try {
      setSubmitting(true);
      setShowRegisterOption(false);

      const success = await signIn();
      if (success) {
        router.push("/host/dashboard");
      } else {
        setShowRegisterOption(true);
      }
    } catch (error) {
      console.error('Wallet sign in error:', error);
      setShowRegisterOption(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-foreground/2">
      {/* Header Section */}
      <div className="bg-foreground/5 text-foreground py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Sign In</h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Access your organization dashboard to manage events
          </p>
        </div>
      </div>

      {/* Sign In Form */}
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <div className="card p-8 fade-in">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">Connect Your Wallet</h2>
                <p className="text-foreground/60">
                  Sign in using your connected wallet address
                </p>
              </div>
              
              <div className="space-y-4">
                <WalletConnect 
                  onAddressChange={() => {}}
                  className="w-full"
                />
                
                {address && !showRegisterOption && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Wallet connected! Signing you in...</span>
                  </div>
                )}
                
                {showRegisterOption && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>No organization found with this wallet address</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-foreground/60">
                        Would you like to register a new organization?
                      </p>
                      <Link 
                        href="/host/register" 
                        className="inline-block btn-primary text-sm px-6 py-2"
                      >
                        Register New Organization
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              {!showRegisterOption && (
                <div className="text-center text-sm text-foreground/60">
                  <p>Don't have an account with this wallet?</p>
                  <Link href="/host/register" className="text-foreground hover:underline">
                    Register a new organization
                  </Link>
                </div>
              )}
            </div>
        </div>
      </div>
    </main>
  );
}