"use client";

import React, { useState } from 'react';
import { Flight } from '@/modules/flights/types';
import { toast } from 'sonner';

interface FlightListProps {
    flights: Flight[];
    onAdd: (flightId: string, seats: number) => Promise<void>;
}

export const FlightList: React.FC<FlightListProps> = ({ flights, onAdd }) => {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [seatMap, setSeatMap] = useState<Record<string, number>>({});

    const handleAdd = async (flight: Flight) => {
        const seats = seatMap[flight.id] || 1;
        setLoadingMap(prev => ({ ...prev, [flight.id]: true }));
        try {
            await onAdd(flight.id, seats);
            toast.success('Flight added to cart!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add flight to cart');
        } finally {
            setLoadingMap(prev => ({ ...prev, [flight.id]: false }));
        }
    };

    if (flights.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200">
                <p className="text-neutral-500 font-medium">No flights found for this route.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {flights.map(flight => (
                <div key={flight.id} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                           <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                           </div>
                            <div>
                                <h3 className="font-bold text-neutral-900 text-lg">{flight.airline_name}</h3>
                                <p className="text-sm text-neutral-500 font-medium">{flight.flight_number}</p>
                                <div className="flex items-center gap-3 mt-1 text-sm text-neutral-600">
                                    <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded">{flight.departure_code}</span>
                                    <span>→</span>
                                    <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded">{flight.arrival_code}</span>
                                </div>
                            </div>
                        </div>

                            <div className="flex flex-col items-center">
                            <div className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1">Departure</div>
                            <div className="font-bold text-neutral-900 text-lg">
                                {flight.departure_time ? new Date(flight.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </div>
                            <div className="text-neutral-400 text-xs">
                                {flight.departure_time ? new Date(flight.departure_time).toLocaleDateString() : ''}
                            </div>
                        </div>
                        
                        <div className="md:border-l md:border-r border-neutral-100 px-6 mx-2 hidden md:block">
                            <div className="text-neutral-400 text-xs text-center">Duration</div>
                             {/* Placeholder for duration calculation if needed */}
                            <div className="w-20 h-[1px] bg-neutral-200 my-2"></div>
                        </div>

                        <div className="flex flex-col items-center">
                             <div className="text-neutral-500 text-xs uppercase font-bold tracking-wider mb-1">Arrival</div>
                            <div className="font-bold text-neutral-900 text-lg">
                                {flight.arrival_time ? new Date(flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </div>
                            <div className="text-neutral-400 text-xs">
                                {flight.arrival_time ? new Date(flight.arrival_time).toLocaleDateString() : ''}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                            <div className="text-right">
                                <div className="text-2xl font-black text-neutral-900">₹{(flight.base_price || 0).toLocaleString()}</div>
                                <div className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                    {flight.available_seats} seats left
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="flex items-center border border-neutral-300 rounded-lg h-10 overflow-hidden">
                                    <button 
                                        onClick={() => {
                                            const current = seatMap[flight.id] || 1;
                                            if (current > 1) {
                                                setSeatMap(prev => ({...prev, [flight.id]: current - 1}));
                                            }
                                        }}
                                        className="px-3 h-full hover:bg-neutral-100 text-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={(seatMap[flight.id] || 1) <= 1}
                                    >
                                        -
                                    </button>
                                    <div className="w-10 text-center text-sm font-medium text-neutral-900">
                                        {seatMap[flight.id] || 1}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const current = seatMap[flight.id] || 1;
                                            const maxSeats = flight.available_seats || 9;
                                            if (current < maxSeats) {
                                                setSeatMap(prev => ({...prev, [flight.id]: current + 1}));
                                            }
                                        }}
                                        className="px-3 h-full hover:bg-neutral-100 text-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={(seatMap[flight.id] || 1) >= (flight.available_seats || 9)}
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleAdd(flight)}
                                    disabled={loadingMap[flight.id]}
                                    className="flex-1 md:flex-none h-10 px-4 bg-neutral-900 text-white font-bold rounded-lg text-sm hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-70"
                                >
                                    {loadingMap[flight.id] ? 'Adding...' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
