import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Wallet, LogIn, LogOut } from 'lucide-react';

export const WalletButton: React.FC = () => {
  const [mounted, setMounted] = useState(false); // New state for mounted status
  useEffect(() => setMounted(true), []); // Set mounted to true after initial render

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // Render null on server, or if not yet mounted on client
  if (!mounted) return null;

  return (
    <button
      onClick={isConnected ? disconnect : () => connect({ connector: injected() })}
      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      {isConnected ? (
        <>
          <Wallet className="h-4 w-4" />
          <span>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}</span>
          <LogOut className="h-4 w-4" />
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4" />
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  );
};
