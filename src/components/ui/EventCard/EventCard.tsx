import Link from 'next/link';
import { ROUTES } from '@/config';
import { EventCardProps } from './types';
import { EventCardHeader } from './EventCardHeader';
import { EventCardMetrics } from './EventCardMetrics';

import { useState } from 'react';
import { HeadGuestModal } from '../HeadGuestModal';

import { useEvents } from '@/context/EventContext';

/**
 * EventCard component
 * Displays event summary with clickable link to event details
 * Composed of Header and Metrics subcomponents
 */
export function EventCard({ event, className }: EventCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { deleteEvent, refreshEvents } = useEvents();

  const handleAssignClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
    <Link href={ROUTES.EVENT(event.id)}>
      <div className={`card p-6 hover:shadow-md transition-all cursor-pointer group relative ${className || ''}`}>
        <EventCardHeader
          name={event.name}
          location={event.location}
          startDate={event.startDate}
          endDate={event.endDate}
          status={event.status}
        />
        <EventCardMetrics
          guestCount={event.guestCount}
          hotelCount={event.hotelCount}
          inventoryConsumed={event.inventoryConsumed}
        />
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this event?')) {
                        deleteEvent(event.id);
                    }
                }}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                title="Delete Event"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
            </button>

            {(!event.headGuestId || event.headGuestId === '00000000-0000-0000-0000-000000000000') ? (
                <button 
                    onClick={handleAssignClick}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors"
                >
                    Assign Head Guest
                </button>
            ) : (
                <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-md">
                    Head Guest Assigned
                </span>
            )}
        </div>
      </div>
    </Link>

    <HeadGuestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        eventId={event.id} 
        eventName={event.name}
        onAssignSuccess={refreshEvents}
    />
    </>
  );
}
