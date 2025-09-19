"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import ImageDropzone from "@/components/ImageDropzone";
import CustomDatePicker from "@/components/DatePicker";
import CustomTimePicker from "@/components/TimePicker";
import SimpleDatePicker from "@/components/SimpleDatePicker";
import SimpleTimePicker from "@/components/SimpleTimePicker";
import LocationMap from "@/components/LocationMap";
import { uploadImageToIPFS } from "@/lib/ipfs";
import SkeletonForm from "@/components/SkeletonForm";
import { web3Service } from "@/Services/Web3Service";
import { eventFactoryABI } from "../../../web3/constants";

const LOCATIONS = [
  "Singapore",
  "Mumbai",
  "Bengaluru",
  "Delhi",
  "Jakarta",
  "Seoul",
  "Tokyo",
  "Sydney",
  "Taipei",
  "Dubai",
  "London",
  "Paris",
  "Berlin",
  "Lisbon",
  "Amsterdam",
  "San Francisco",
  "New York",
  "Toronto",
  "Austin",
  "Buenos Aires",
  "São Paulo",
  "Cape Town",
  "Nairobi",
  "Worldwide",
];

type TicketTier = {
  name: string;
  price: string;
  currency: string;
  quantity: string;
};

export default function HostPage() {
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const { organization, loading: authLoading } = useAuth();
  const { addEvent } = useEvents();
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgDescription, setOrgDescription] = useState("");

  async function registerOrganization(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) {
      alert('Connect wallet first');
      return;
    }
    try {
      const tx = await web3Service.getWalletClient().writeContract({
        address: web3Service.getEventFactoryAddress(),
        abi: eventFactoryABI.abi,
        functionName: 'registerOrganization',
        args: [orgName, orgDescription, ""],
      });
      await web3Service.getPublicClient().waitForTransactionReceipt({ hash: tx });
    } catch (error) {
      console.error("Failed to register organization", error);
      alert("Failed to register organization");
    }
  }


  const [name, setName] = useState("");
  const [bannerDataUrl, setBannerDataUrl] = useState("");
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [approvalNeeded, setApprovalNeeded] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  const [eventDescription, setEventDescription] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  function addTier() {
    setTicketTiers([...ticketTiers, { name: '', price: '', currency: 'USD', quantity: '' }]);
  }

  function updateTier(index: number, field: keyof TicketTier, value: string) {
    const newTiers = [...ticketTiers];
    newTiers[index][field] = value;
    setTicketTiers(newTiers);
  }

  function removeTier(index: number) {
    const newTiers = [...ticketTiers];
    newTiers.splice(index, 1);
    setTicketTiers(newTiers);
  }

  function handleTags(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const value = e.currentTarget.value;
    if (!value.trim()) return;
    setTags([...tags, value]);
    e.currentTarget.value = "";
  }

  function removeTag(index: number) {
    setTags(tags.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected) {
      alert("Please connect your wallet to create events.");
      return;
    }    if (!isValid) {
      alert("Please fill all the required fields.");
      return;
    }

    if (new Date(date) < new Date()) {
      alert("Start date must be in the future.");
      return;
    }

    if (new Date(endDate) < new Date(date)) {
      alert("End date must be after the start date.");
      return;
    }

    if (ticketTiers.length > 0 && !ticketTiers.every(tier => tier.name && tier.price && tier.quantity)) {
      alert("Please fill all the fields for each ticket tier.");
      return;
    }

    if (ticketTiers.length > 0 && ticketTiers.some(tier => Number(tier.price) < 0 || Number(tier.quantity) < 0)) {
      alert("Ticket price and quantity cannot be negative.");
      return;
    }

    if (!lat || !lng) {
      alert("Please set the location on the map.");
      return;
    }

    if (!bannerDataUrl) {
      alert("Please upload a banner image.");
      return;
    }

    try {
      setSubmitting(true);

      let bannerCid = "";
      if (bannerDataUrl) {
        try {
          const { cid } = await uploadImageToIPFS(bannerDataUrl);
          bannerCid = cid;
        } catch (error) {
          console.error("Failed to upload banner to IPFS", error);
          alert("Failed to upload banner to IPFS");
          setSubmitting(false);
          return;
        }
      }

      let eventType;
      let ticketPrice = "0";

      if (ticketTiers.length > 0) {
        eventType = 1; // PAID
        ticketPrice = ticketTiers[0].price;
      } else if (approvalNeeded) {
        eventType = 2; // APPROVAL
      } else {
        eventType = 0; // FREE
      }

      const maxTickets = ticketTiers.reduce((acc, tier) => acc + Number(tier.quantity), 0);

      const tx = await web3Service.getWalletClient().writeContract({
        address: web3Service.getEventFactoryAddress(),
        abi: eventFactoryABI.abi,
        functionName: 'createEvent',
        args: [name, eventType, web3Service.parseEther(ticketPrice), maxTickets],
      });
      const receipt = await web3Service.getPublicClient().waitForTransactionReceipt({ hash: tx });

      const eventResponse = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          eventDescription,
          bannerCid,
          date,
          time,
          endDate,
          endTime,
          location,
          venueName,
          venueAddress,
          lat,
          lng,
          tags,
          ticketTiers,
          approvalNeeded,
          organizationId: organization.id,
          blockchainEventAddress: receipt.contractAddress
        }),
      });

      if (!eventResponse.ok) {
        await web3Service.deactivateEvent(receipt.contractAddress!);
        throw new Error("Failed to save event to database, blockchain event has been deactivated");
      }

      router.push('/host/dashboard');
    } catch (err: any) {
      alert(err?.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  const isValid =
    name.trim().length > 0 &&
    bannerDataUrl.trim().length > 0 &&
    date.trim().length > 0 &&
    time.trim().length > 0 &&
    endDate.trim().length > 0 &&
    endTime.trim().length > 0 &&
    location.trim().length > 0 &&
    venueName.trim().length > 0 &&
    venueAddress.trim().length > 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">
        {organization ? "Create a new event" : "Become a host"}
      </h1>

      {!isConnected && (
        <div className="mb-6">
          <ConnectButton />
        </div>
      )}

      {isConnected && authLoading && (
        <SkeletonForm />
      )}

      {isConnected && !authLoading && !organization && (
        <form onSubmit={registerOrganization} className="space-y-6">
          <div className="rounded-md border border-black/10 dark:border-white/10 p-4">
            <h2 className="text-lg font-medium mb-2">Register your organization</h2>
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="orgName">Organization name</label>
              <input id="orgName" type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="orgEmail">Contact email</label>
              <input id="orgEmail" type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="orgAbout">Description</label>
              <textarea id="orgAbout" value={orgDescription} onChange={(e) => setOrgDescription(e.target.value)} rows={3} className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div className="mt-3">
              <button type="submit" className="inline-flex items-center rounded-md border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5">Sign & Register</button>
            </div>
          </div>
        </form>
      )}

      {isConnected && !authLoading && organization && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="name">Event name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20" placeholder="e.g. evenntz Launch Party" required />
          </div>

          <ImageDropzone value={bannerDataUrl} onChange={setBannerDataUrl} label="Event banner image" />

          <div className="flex items-center gap-2 mb-4">
            <input type="checkbox" id="customOrg" />
            <label htmlFor="customOrg" className="text-sm">Use custom organization details for this event</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">Organization Name</label>
              <input
                type="text"
                placeholder="Enter organization name"
                className="w-full px-3 py-2 border border-foreground/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                defaultValue={organization?.name || ""} // Placeholder
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">Organization Description</label>
              <textarea
                rows={3}
                placeholder="Enter organization description"
                className="w-full px-3 py-2 border border-foreground/20 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                defaultValue={organization?.description || ""} // Placeholder
              />
            </div>
          </div>

          

          <div className="space-y-2">
            <label className="block text-sm font-medium">Event description (Markdown)</label>
            <textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows={6} className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none" placeholder="Write details here..." />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Tags</label>
            <div className="flex items-center flex-wrap gap-2">
              {tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
                  <span>{tag}</span>
                  <button type="button" onClick={() => removeTag(index)} className="text-red-500">x</button>
                </div>
              ))}
            </div>
            <input onKeyDown={handleTags} type="text" placeholder="Add a tag and press Enter" className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          </div>

          <div className="space-y-4 p-4 border border-black/10 dark:border-white/10 rounded-md">
              <h3 className="text-lg font-medium">Venue</h3>
              <div className="space-y-2">
                  <label className="block text-sm font-medium" htmlFor="venueName">Venue Name</label>
                  <input id="venueName" type="text" value={venueName} onChange={(e) => setVenueName(e.target.value)} className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" required />
              </div>
              <div className="space-y-2">
                  <label className="block text-sm font-medium" htmlFor="venueAddress">Venue Address</label>
                  <textarea id="venueAddress" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} rows={3} className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" required />
              </div>
              <div className="space-y-2">
                  <label className="block text-sm font-medium" htmlFor="location">City</label>
                  <select id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20">
                      {LOCATIONS.map((loc) => (<option key={loc} value={loc}>{loc}</option>))}
                  </select>
              </div>
              <LocationMap 
                  lat={lat ? Number(lat) : undefined}
                  lng={lng ? Number(lng) : undefined}
                  onLocationChange={(lat, lng) => {
                      setLat(lat.toString());
                      setLng(lng.toString());
                  }}
              />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <SimpleDatePicker 
                value={date} 
                onChange={setDate} 
                label="Start Date" 
                required 
              />
            </div>
            <div className="space-y-2">
              <SimpleTimePicker 
                value={time} 
                onChange={setTime} 
                label="Start Time" 
                required 
              />
            </div>
            <div className="space-y-2">
              <SimpleDatePicker 
                value={endDate} 
                onChange={setEndDate} 
                label="End Date" 
                required 
              />
            </div>
            <div className="space-y-2">
              <SimpleTimePicker 
                value={endTime} 
                onChange={setEndTime} 
                label="End Time" 
                required 
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Ticket Tiers</h3>
            {ticketTiers.map((tier, index) => (
              <div key={index} className="p-4 border border-black/10 dark:border-white/10 rounded-md space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className='sm:col-span-2'>
                    <label className="block text-sm font-medium">Tier Name</label>
                    <input type="text" value={tier.name} onChange={(e) => updateTier(index, 'name', e.target.value)} placeholder="e.g., General Admission" className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Quantity</label>
                    <input type="number" value={tier.quantity} onChange={(e) => updateTier(index, 'quantity', e.target.value)} placeholder="100" className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Price</label>
                    <input type="number" min="0" step="0.01" value={tier.price} onChange={(e) => updateTier(index, 'price', e.target.value)} placeholder="25.00" className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Currency</label>
                    <select value={tier.currency} onChange={(e) => updateTier(index, 'currency', e.target.value)} className="w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
                      <option value="USD">USD</option>
                      <option value="INR">INR</option>
                      <option value="THB">THB</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <button type="button" onClick={() => removeTier(index)} className="text-red-500 text-sm">Remove Tier</button>
              </div>
            ))}
            <button type="button" onClick={addTier} className="inline-flex items-center rounded-md border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5">Add Ticket Tier</button>
          </div>

          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={approvalNeeded} onChange={(e) => setApprovalNeeded(e.target.checked)} />
              Approval required
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Status</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="status" value="published" checked={true} />
                Published
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="status" value="draft" />
                Draft
              </label>
            </div>
          </div>

          <div>
            <button type="submit" disabled={!isValid || submitting} className="inline-flex items-center rounded-md border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50">{submitting ? "Creating..." : "Create event"}</button>
            <button type="button" disabled={!isValid || submitting} className="inline-flex items-center rounded-md border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50">Preview Event</button>
          </div>
        </form>
      )}
    </main>
  );
}
