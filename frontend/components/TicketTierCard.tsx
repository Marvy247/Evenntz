import React from 'react';
import { Ticket, DollarSign, Users, CheckCircle, XCircle } from 'lucide-react';

interface TicketTier {
  id: number;
  name: string;
  price: string;
  pricePerPerson: string;
  maxSupply: number;
  currentSupply: number;
  tokenType: string;
  active: boolean;
  available: number;
}

interface TicketTierCardProps {
  tier: TicketTier;
  onPurchase: () => void;
  disabled: boolean;
}

export const TicketTierCard: React.FC<TicketTierCardProps> = ({ tier, onPurchase, disabled }) => {
  const getTokenColor = (tokenType: string) => {
    switch (tokenType) {
      case 'XFI': return 'text-blue-600 bg-blue-100';
      case 'XUSD': return 'text-green-600 bg-green-100';
      case 'MPX': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTokenColor(tier.tokenType)}`}>
          {tier.tokenType}
        </span>
      </div>

      <div className="text-4xl font-bold text-blue-600 mb-4">
        {tier.price}
        <span className="text-lg font-medium text-gray-600"> {tier.tokenType}</span>
      </div>

      <div className="space-y-2 text-gray-700 text-sm mb-6 flex-grow">
        <div className="flex items-center space-x-2">
          <Ticket className="w-4 h-4 text-blue-500" />
          <span>Available: {tier.available} / {tier.maxSupply}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-green-500" />
          <span>Sold: {tier.currentSupply}</span>
        </div>
        {tier.pricePerPerson && (
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-purple-500" />
            <span>Per Person: {tier.pricePerPerson} {tier.tokenType}</span>
          </div>
        )}
      </div>

      <button
        onClick={onPurchase}
        disabled={disabled}
        className={`w-full py-3 rounded-md text-white font-semibold transition-colors ${disabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {tier.available <= 0 ? 'Sold Out' : disabled ? 'Connect Wallet / Event Not Active' : 'Purchase Ticket'}
      </button>
    </div>
  );
};
