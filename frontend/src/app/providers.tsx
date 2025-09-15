"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useWalletClient } from "wagmi";
import { RainbowKitProvider, lightTheme, darkTheme } from "@rainbow-me/rainbowkit";
import { config } from "./config";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import { web3Service } from "@/Services/Web3Service";

function RainbowKitWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <RainbowKitProvider
      modalSize="compact"
      showRecentTransactions={false}
      theme={theme === 'dark' ? darkTheme() : lightTheme()}
    >
      {children}
    </RainbowKitProvider>
  );
}

function Web3Initializer({ children }: { children: React.ReactNode }) {
  const [web3Initialized, setWeb3Initialized] = useState(false);
  const [web3Error, setWeb3Error] = useState<string | null>(null);

  // Get walletClient from wagmi hook - this must be inside WagmiProvider context
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    const initializeWeb3 = async () => {
      try {
        await web3Service.initialize();
        setWeb3Initialized(true);
      } catch (error) {
        console.error('Web3Service initialization failed:', error);
        setWeb3Error(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initializeWeb3();
  }, []);

  // Set walletClient in web3Service when available
  useEffect(() => {
    if (walletClient) {
      web3Service.setWalletClient(walletClient);
    }
  }, [walletClient]);

  if (!web3Initialized && !web3Error) {
    return <div className="flex items-center justify-center min-h-screen">Initializing Web3...</div>;
  }

  if (web3Error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error initializing Web3: {web3Error}</div>;
  }

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient only once to prevent recreation on every render
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitWrapper>
            <Web3Initializer>
              <AuthProvider>
                {children}
              </AuthProvider>
            </Web3Initializer>
          </RainbowKitWrapper>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
