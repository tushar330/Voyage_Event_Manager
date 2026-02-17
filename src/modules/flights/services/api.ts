import { Flight, FlightSearchParams, LocationResponse } from '../types';

const API_URL = '/api/v1/flights';

export const flightApi = {
    async getLocations(token?: string): Promise<LocationResponse> {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(`/api/flights/locations`, { headers });
        if (!response.ok) throw new Error('Failed to fetch locations');
        const data = await response.json();
        return data.data || data;
    },

    async searchFlights(params: FlightSearchParams, token?: string): Promise<Flight[]> {
        const query = new URLSearchParams(params as any).toString();
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Use the frontend proxy path, not the full backend URL directly if configured that way
        const response = await fetch(`/api/flights?${query}`, { headers });
        if (!response.ok) throw new Error('Failed to search flights');
        const data = await response.json();
        return data.data || data;
    }
};
