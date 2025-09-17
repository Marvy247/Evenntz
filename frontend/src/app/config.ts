import { getDefaultConfig, metaMaskWallet, walletConnectWallet } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Sepolia Testnet chain
const SepoliaTestnet = defineChain({
  id: 11155111,
  name: 'Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia',
    symbol: 'S',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.etherscan.io'],
    },
    public: {
      http: ['https://sepolia.etherscan.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SepoliaScan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Evenntz',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [SepoliaTestnet],
  wallets: [
    metaMaskWallet,
    walletConnectWallet,
  ],
  ssr: true,
  // Performance optimizations
  batch: {
    multicall: {
      wait: 16, // 16ms batch delay
    },
  },
  // Reduce polling frequency
  pollingInterval: 4000, // 4 seconds instead of default 4 seconds
  // Disable some features for better performance
  enableNetworkSwitching: false,
  enableAccountBalance: false,
});