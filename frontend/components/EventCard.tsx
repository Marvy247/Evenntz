import React from 'react';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: number;
  endDate: number;
  organizer: string;
  status: 'upcoming' | 'live' | 'ended';
  active: boolean;
}

export const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link href={`/event/${event.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col">
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src="https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt={event.title}
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
              {event.status === 'live' ? 'Live Now' : 
               event.status === 'upcoming' ? 'Upcoming' : 'Ended'}
            </span>
          </div>
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>
          <div className="space-y-2 text-sm text-gray-700 mt-auto">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-green-500" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span>Organized by: {event.organizer.slice(0, 6)}...{event.organizer.slice(-4)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
