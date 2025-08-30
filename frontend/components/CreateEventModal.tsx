import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, DollarSign, Ticket, Clock, Image as ImageIcon } from 'lucide-react';
import { useAccount, usePublicClient, useWalletClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem'; // Import parseUnits from viem
import EventManagerABI from '../lib/abi/EventManagerABI.json';
import { toast } from 'react-toastify';

interface CreateEventModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface TicketTierInput {
  name: string;
  price: string;
  maxSupply: string;
  paymentToken: string; // 0: XFI, 1: XUSD, 2: MPX
}

const EVENT_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_EVENT_MANAGER_CONTRACT_ADDRESS || '';

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ onClose, onSuccess }) => {
  const { address: account } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync: createEvent, isPending: isCreatingEvent } = useWriteContract();
  const { writeContractAsync: addTicketTier, isPending: isAddingTier } = useWriteContract();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [metadataURI, setMetadataURI] = useState('');
  const [ticketTiers, setTicketTiers] = useState<TicketTierInput[]>([
    { name: '', price: '', maxSupply: '', paymentToken: '0' },
  ]);
  const [error, setError] = useState<string | null>(null);

  const validateInputs = (): boolean => {
    // Event Details Validation
    if (title.trim().length < 3 || title.trim().length > 100) {
      setError('Title must be between 3 and 100 characters.');
      toast.error('Title must be between 3 and 100 characters.');
      return false;
    }
    if (description.trim().length === 0 || description.trim().length > 1000) {
      setError('Description is required and must be less than 1000 characters.');
      toast.error('Description is required and must be less than 1000 characters.');
      return false;
    }
    if (location.trim().length < 3 || location.trim().length > 200) {
      setError('Location must be between 3 and 200 characters.');
      toast.error('Location must be between 3 and 200 characters.');
      return false;
    }
    if (metadataURI && !/^(ipfs|https?):\/\/[^\s/$.?#].[^\s]*$/.test(metadataURI)) {
      setError('Invalid Metadata URI. Must be a valid IPFS or HTTP(S) URL.');
      toast.error('Invalid Metadata URI. Must be a valid IPFS or HTTP(S) URL.');
      return false;
    }

    // Date Validation (already present in handleSubmit, but can be moved here for consistency)
    const startTimestamp = BigInt(Math.floor(new Date(startDate).getTime() / 1000));
    const endTimestamp = BigInt(Math.floor(new Date(endDate).getTime() / 1000));

    if (startTimestamp <= BigInt(Math.floor(Date.now() / 1000))) {
      setError('Start date must be in the future.');
      toast.error('Start date must be in the future.');
      return false;
    }
    if (endTimestamp <= startTimestamp) {
      setError('End date must be after start date.');
      toast.error('End date must be after start date.');
      return false;
    }

    // Ticket Tiers Validation
    for (const tier of ticketTiers) {
      if (tier.name.trim().length < 3 || tier.name.trim().length > 50) {
        setError(`Ticket tier name "${tier.name}" must be between 3 and 50 characters.`);
        toast.error(`Ticket tier name "${tier.name}" must be between 3 and 50 characters.`);
        return false;
      }
      const price = parseFloat(tier.price);
      if (isNaN(price) || price <= 0) {
        setError(`Ticket tier price for "${tier.name}" must be a positive number.`);
        toast.error(`Ticket tier price for "${tier.name}" must be a positive number.`);
        return false;
      }
      const maxSupply = parseInt(tier.maxSupply);
      if (isNaN(maxSupply) || maxSupply <= 0 || maxSupply > 10000) {
        setError(`Ticket tier max supply for "${tier.name}" must be between 1 and 10000.`);
        toast.error(`Ticket tier max supply for "${tier.name}" must be between 1 and 10000.`);
        return false;
      }
    }

    return true;
  };

  const handleAddTicketTier = () => {
    setTicketTiers([...ticketTiers, { name: '', price: '', maxSupply: '', paymentToken: '0' }]);
  };

  const handleTierChange = (index: number, field: keyof TicketTierInput, value: string) => {
    const newTiers = [...ticketTiers];
    newTiers[index][field] = value;
    setTicketTiers(newTiers);
  };

  const removeTicketTier = (index: number) => {
    const newTiers = ticketTiers.filter((_, i) => i !== index);
    setTicketTiers(newTiers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!walletClient || !account) {
      setError('Wallet not connected.');
      toast.error('Please connect your wallet.');
      return;
    }

    if (!EVENT_MANAGER_ADDRESS) {
      setError('Event Manager contract address not configured.');
      toast.error('Contract address missing.');
      return;
    }

    if (!validateInputs()) {
      return;
    }

    try {
      // Create event
      const createEventHash = await createEvent({
        address: EVENT_MANAGER_ADDRESS as `0x${string}`,
        abi: EventManagerABI,
        functionName: 'createEvent',
        args: [
          title,
          description,
          location,
          BigInt(Math.floor(new Date(startDate).getTime() / 1000)), // Convert to BigInt here
          BigInt(Math.floor(new Date(endDate).getTime() / 1000)),   // Convert to BigInt here
          metadataURI,
        ],
      });
      toast.info('Transaction sent: Creating event. Waiting for confirmation...');
      const createEventReceipt = await publicClient?.waitForTransactionReceipt({ hash: createEventHash });
      toast.success('Event created on blockchain!');
      console.log('Event creation receipt:', createEventReceipt);

      // Extract eventId from logs
      const decodedLogs = publicClient?.parseEventLogs({
        abi: EventManagerABI,
        logs: createEventReceipt?.logs || [],
      });
      const eventCreatedLog = decodedLogs?.find(log => log.eventName === 'EventCreated');
      const newEventId = eventCreatedLog?.args?.eventId?.toString();

      if (!newEventId) {
        throw new Error('Could not retrieve new event ID from transaction.');
      }

      // Add ticket tiers
      for (let i = 0; i < ticketTiers.length; i++) {
        const tier = ticketTiers[i];
        const priceInWei = parseUnits(tier.price, 18); // Use parseUnits from viem, assuming 18 decimals
        const maxSupply = BigInt(parseInt(tier.maxSupply)); // Convert to BigInt
        const paymentTokenId = BigInt(parseInt(tier.paymentToken)); // Convert to BigInt

        const addTierHash = await addTicketTier({
          address: EVENT_MANAGER_ADDRESS as `0x${string}`,
          abi: EventManagerABI,
          functionName: 'addTicketTier',
          args: [
            BigInt(newEventId),
            tier.name,
            priceInWei,
            maxSupply,
            paymentTokenId,
          ],
        });
        toast.info(`Transaction sent: Adding tier ${tier.name}. Waiting for confirmation...`);
        await publicClient?.waitForTransactionReceipt({ hash: addTierHash });
        toast.success(`Tier ${tier.name} added!`);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error creating event:', err);
      if (err.code === 4001) {
        setError('Transaction rejected by user.');
        toast.error('Transaction rejected.');
      } else if (err.shortMessage?.includes('Not event organizer')) {
        setError('You are not registered as an event organizer.');
        toast.error('You are not an organizer.');
      } else {
        setError(err.shortMessage || err.message || 'Failed to create event.');
        toast.error(err.shortMessage || err.message || 'Failed to create event.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {/* Event Details */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                ></textarea>
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="metadataURI" className="block text-sm font-medium text-gray-700 mb-1">Event Image URL (Metadata URI)</label>
                <input
                  type="url"
                  id="metadataURI"
                  value={metadataURI}
                  onChange={(e) => setMetadataURI(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., ipfs://... or https://..."
                />
              </div>
            </div>
          </div>

          {/* Ticket Tiers */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Ticket Tiers</h3>
            {ticketTiers.map((tier, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 rounded-md relative">
                <div className="md:col-span-2">
                  <label htmlFor={`tier-name-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
                  <input
                    type="text"
                    id={`tier-name-${index}`}
                    value={tier.name}
                    onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`tier-price-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    id={`tier-price-${index}`}
                    value={tier.price}
                    onChange={(e) => handleTierChange(index, 'price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    step="0.001"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`tier-supply-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Max Supply</label>
                  <input
                    type="number"
                    id={`tier-supply-${index}`}
                    value={tier.maxSupply}
                    onChange={(e) => handleTierChange(index, 'maxSupply', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`payment-token-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Token</label>
                  <select
                    id={`payment-token-${index}`}
                    value={tier.paymentToken}
                    onChange={(e) => handleTierChange(index, 'paymentToken', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="0">XFI</option>
                    <option value="1">XUSD</option>
                    <option value="2">MPX</option>
                  </select>
                </div>
                {ticketTiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTicketTier(index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddTicketTier}
              className="mt-4 px-4 py-2 border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              + Add Another Tier
            </button>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingEvent || isAddingTier}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {(isCreatingEvent || isAddingTier) ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
