import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config';
import { EventCardProps } from './types';
import { EventCardHeader } from './EventCardHeader';
import { EventCardMetrics } from './EventCardMetrics';

import { useState } from 'react';
import { EventManagerModal } from '../EventManagerModal';

import { useEvents } from '@/context/EventContext';

/**
 * EventCard component
 * Displays event summary with clickable link to event details
 * Composed of Header and Metrics subcomponents
 */
export function EventCard({ event, className }: EventCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { deleteEvent, refreshEvents } = useEvents();
  const router = useRouter();

  const handleAssignClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <div 
        className={`card p-6 hover:shadow-md transition-all relative ${className || ''}`}
      >
        <EventCardHeader
          name={event.name}
          location={event.location}
          startDate={event.startDate}
          endDate={event.endDate}
          status={event.status}
        />
        <EventCardMetrics
          guestCount={event.guestCount}
          inventoryConsumed={event.inventoryConsumed}
          budgetSpent={event.budgetSpent}
          totalBudget={event.totalBudget}
          daysUntilEvent={event.daysUntilEvent}
          pendingActions={event.pendingActions}
          pendingActionDetails={event.pendingActionDetails}
        />
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
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

            {/* Actions Dropdown */}
            <div className="relative">
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDropdownOpen(!isDropdownOpen);
                    }}
                    className="flex items-center space-x-1.5 text-sm font-medium text-neutral-700 hover:text-corporate-blue-100 bg-neutral-50 hover:bg-corporate-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-neutral-200"
                >
                    <span>Actions</span>
                    <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                {isDropdownOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-10" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDropdownOpen(false);
                            }}
                        ></div>
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-neutral-200 shadow-xl rounded-xl z-20 overflow-hidden flex flex-col transform origin-bottom-right transition-all">
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    router.push(ROUTES.EVENT(event.id));
                                }}
                                className="cursor-pointer w-full px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-corporate-blue-100 flex items-center transition-colors text-left"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Go to Event
                            </button>

                            {(!event.eventManagerId || event.eventManagerId === '00000000-0000-0000-0000-000000000000') ? (
                                <button 
                                    onClick={(e) => {
                                        handleAssignClick(e);
                                        setIsDropdownOpen(false);
                                    }}
                                    className="cursor-pointer w-full px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-blue-600 flex items-center transition-colors text-left border-t border-neutral-100"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Assign Event Manager
                                </button>
                            ) : (
                                <div className="w-full px-4 py-3 text-xs font-medium text-green-600 bg-green-50/50 flex items-center border-t border-neutral-100 cursor-default" onClick={(e) => e.stopPropagation()}>
                                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Event Manager Assigned
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

    <EventManagerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        eventId={event.id} 
        eventName={event.name}
        onAssignSuccess={refreshEvents}
    />

    {/* Custom Delete Confirmation Modal */}
    {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Event</h3>
                    <p className="text-sm text-gray-500">
                        Are you sure you want to delete <span className="font-semibold text-gray-700">{event.name}</span>? This action cannot be undone.
                    </p>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDeleting(true);
                            await deleteEvent(event.id);
                            setIsDeleting(false);
                            setIsDeleteDialogOpen(false);
                        }}
                        disabled={isDeleting}
                        className="w-full sm:w-auto inline-flex justify-center rounded-xl bg-red-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-red-500 transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDeleteDialogOpen(false);
                        }}
                        disabled={isDeleting}
                        className="w-full sm:w-auto mt-3 sm:mt-0 inline-flex justify-center rounded-xl bg-white px-4 py-2 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
}
