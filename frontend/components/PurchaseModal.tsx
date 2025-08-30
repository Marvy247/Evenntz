import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { useAccount, usePublicClient, useWalletClient, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem'; // Import from viem
import EventManagerABI from '../lib/abi/EventManagerABI.json';
const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "sender", "type": "address" },
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transferFrom",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
import { toast } from 'react-toastify';

interface PurchaseModalProps {
  onClose: () => void;
  onComplete: () => void;
  event: any; // Replace with actual Event interface
  tier: any; // Replace with actual TicketTier interface
}

const EVENT_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_EVENT_MANAGER_CONTRACT_ADDRESS || '';

const TOKEN_ADDRESSES: { [key: string]: `0x${string}` } = {
  '0': (process.env.NEXT_PUBLIC_XFI_TOKEN_ADDRESS || '') as `0x${string}`,
  '1': (process.env.NEXT_PUBLIC_XUSD_TOKEN_ADDRESS || '') as `0x${string}`,
  '2': (process.env.NEXT_PUBLIC_MPX_TOKEN_ADDRESS || '') as `0x${string}`,
};

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ onClose, onComplete, event, tier }) => {
  const { address: account } = useAccount(); // Renamed address to account for consistency
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Approve, 2: Purchase
  const [attendeeCount, setAttendeeCount] = useState(1); // New state for attendee count

  const tokenAddress = TOKEN_ADDRESSES[tier.paymentToken.toString()];
  const isNativeToken = tier.paymentToken.toString() === '0'; // Assuming 0 is XFI (native token)

  // Read allowance using wagmi hook
  const { data: allowance = 0n } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account!, EVENT_MANAGER_ADDRESS as `0x${string}`],
    query: {
      enabled: !isNativeToken && !!account && !!tokenAddress, // Only enable if not native token and account/tokenAddress exist
    },
  });

  // Write contract hooks for approve and purchase
  const { writeContractAsync: approveTokens, isPending: isApproving } = useWriteContract();
  const { writeContractAsync: purchaseTicket, isPending: isPurchasing } = useWriteContract();

  const handleApprove = async () => {
    if (!walletClient || !tokenAddress || !account) return;
    setLoading(true);
    setError(null);
    try {
      const amountToApprove = parseUnits(tier.price, 18); // Use parseUnits from viem, assuming 18 decimals
      
      const hash = await approveTokens({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [EVENT_MANAGER_ADDRESS as `0x${string}`, amountToApprove],
      });
      toast.info('Approving tokens... Please confirm in your wallet.');
      await publicClient?.waitForTransactionReceipt({ hash });
      setStep(2);
      toast.success('Tokens approved successfully!');
    } catch (err: any) {
      console.error('Error approving tokens:', err);
      if (err.code === 4001) {
        setError('Transaction rejected by user.');
        toast.error('Approval rejected.');
      } else {
        setError(err.shortMessage || err.message || 'Failed to approve tokens.');
        toast.error(err.shortMessage || err.message || 'Failed to approve tokens.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!walletClient || !account) return;
    setLoading(true);
    setError(null);
    try {
      const tokenURI = `https://example.com/ticket-metadata/${event.id}/${tier.id}/${Date.now()}.json`; // Placeholder

      let hash;
      if (isNativeToken) {
        hash = await purchaseTicket({
          address: EVENT_MANAGER_ADDRESS as `0x${string}`,
          abi: EventManagerABI,
          functionName: 'buyTicket',
          args: [BigInt(event.id), BigInt(tier.id), BigInt(attendeeCount), tokenURI],
          value: parseUnits(tier.price, 18),
        });
      } else {
        hash = await purchaseTicket({
          address: EVENT_MANAGER_ADDRESS as `0x${string}`,
          abi: EventManagerABI,
          functionName: 'buyTicket',
          args: [BigInt(event.id), BigInt(tier.id), BigInt(attendeeCount), tokenURI],
        });
      }
      
      toast.info('Purchasing ticket... Please confirm transaction in your wallet.');
      await publicClient?.waitForTransactionReceipt({ hash });
      toast.success('Ticket purchased successfully!');
      onComplete();
    } catch (err: any) {
      console.error('Error purchasing ticket:', err);
      if (err.code === 4001) {
        setError('Transaction rejected by user.');
        toast.error('Purchase rejected.');
      } else if (err.shortMessage?.includes('Check token allowance')) {
        setError('Allowance too low. Please approve more tokens.');
        toast.error('Allowance too low.');
        setStep(1); // Go back to approval step
      } else if (err.shortMessage?.includes('Sold out')) {
        setError('This ticket tier is sold out.');
        toast.error('Sold out!');
      } else {
        setError(err.shortMessage || err.message || 'Failed to purchase ticket.');
        toast.error(err.shortMessage || err.message || 'Failed to purchase ticket.');
      }
    } finally {
      setLoading(false);
    }
  };

  const needsApproval = !isNativeToken && allowance < parseUnits(tier.price, 18);

  useEffect(() => {
    if (needsApproval) {
      setStep(1);
    } else {
      setStep(2);
    }
  }, [needsApproval]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Purchase Ticket</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
            <p className="text-gray-600">{tier.name}</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {tier.price} {tier.tokenType}
            </p>
          </div>

          {step === 1 && !isNativeToken && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Approve {tier.tokenType} spending for the contract.</span>
              </div>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isApproving ? 'Approving...' : `Approve ${tier.tokenType}`}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Ready to purchase!</span>
              </div>

              <div>
                <label htmlFor="attendeeCount" className="block text-sm font-medium text-gray-700 mb-1">Number of Attendees</label>
                <input
                  type="number"
                  id="attendeeCount"
                  value={attendeeCount}
                  onChange={(e) => setAttendeeCount(Math.max(1, parseInt(e.target.value) || 1))} // Ensure min 1
                  min="1"
                  max="10" // Max attendee count from contract is 10
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isPurchasing ? 'Purchasing...' : `Buy Ticket for ${tier.price} ${tier.tokenType}`}
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-4 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
