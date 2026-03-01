"use client";

import React, { useEffect, useState } from 'react';
import { flightApi } from '@/modules/flights/services/api';
import { FlightSearchParams, LocationResponse } from '@/modules/flights/types';

const LOCATION_NAMES: Record<string, string> = {
    'BOM': 'Mumbai (BOM)',
    'DEL': 'New Delhi (DEL)',
    'DXB': 'Dubai (DXB)',
    'BLR': 'Bengaluru (BLR)',
    'MAA': 'Chennai (MAA)',
    'CCU': 'Kolkata (CCU)',
    'SIN': 'Singapore (SIN)',
    'LHR': 'London Heathrow (LHR)',
    'JFK': 'New York (JFK)',
    'HYD': 'Hyderabad (HYD)',
    'AMD': 'Ahmedabad (AMD)',
};

interface FlightSearchProps {
    onSearch: (params: FlightSearchParams) => void;
    loading?: boolean;
    token?: string;
}

export const FlightSearch: React.FC<FlightSearchProps> = ({ onSearch, loading, token }) => {
    const [locations, setLocations] = useState<LocationResponse>({ departure_codes: [], arrival_codes: [] });
    const [departure, setDeparture] = useState('');
    const [arrival, setArrival] = useState('');

    useEffect(() => {
        if (token) {
            flightApi.getLocations(token).then(setLocations).catch(console.error);
        }
    }, [token]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (departure && arrival) {
            onSearch({ departure_code: departure, arrival_code: arrival });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">From</label>
                    <div className="relative">
                        <select
                            value={departure}
                            onChange={(e) => setDeparture(e.target.value)}
                            className="w-full h-12 rounded-xl border border-neutral-300 bg-white px-4 pr-8 text-neutral-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none"
                            required
                        >
                            <option value="">Select Departure</option>
                            {locations.departure_codes.map((code) => (
                                <option key={code} value={code}>{LOCATION_NAMES[code] || code}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">To</label>
                    <div className="relative">
                        <select
                            value={arrival}
                            onChange={(e) => setArrival(e.target.value)}
                            className="w-full h-12 rounded-xl border border-neutral-300 bg-white px-4 pr-8 text-neutral-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none"
                            required
                        >
                            <option value="">Select Arrival</option>
                            {locations.arrival_codes.map((code) => (
                                <option key={code} value={code}>{LOCATION_NAMES[code] || code}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !departure || !arrival}
                    className="h-12 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
                >
                    {loading ? 'Searching...' : 'Search Flights'}
                </button>
            </div>
        </form>
    );
};
