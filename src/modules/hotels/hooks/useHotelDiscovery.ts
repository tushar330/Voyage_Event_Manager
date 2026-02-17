import { useState, useEffect, useMemo } from 'react';
import { hotelApi } from '../services/api';
import { Hotel } from '../types';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventContext';

import { HotelFilters } from '../types';

interface UseHotelDiscoveryProps {
    eventId: string;
    filters?: HotelFilters;
}

export const useHotelDiscovery = ({ eventId, filters }: UseHotelDiscoveryProps) => {
    const { events } = useEvents();
    const { token } = useAuth();
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const event = useMemo(() => events.find(e => e.id === eventId), [events, eventId]);

    const guestLoad = useMemo(() => {
        if (!event) return 0;
        // Logic to derive guest load from event, using guestCount as fallback
        return (event as any).guestCount || 0;
    }, [event]);

    useEffect(() => {
        const discoverHotels = async () => {
            if (!event || !event.location || !token) return;

            setLoading(true);
            setError(null);
            try {
                // Fetch hotels by city (using event.location as city_id)
                const cityHotels = await hotelApi.getHotelsByCity(event.location, token || undefined, filters);

                // Filter by occupancy is now handled by backend rooms_* params if provided, 
                // but we keep a fallback safety check if no room config is active
                const filtered = cityHotels.filter(hotel => (hotel.occupancy || 0) >= guestLoad);

                setHotels(filtered);

                // Also cache the cityId for the detail page fallback
                localStorage.setItem(`last_city_id_${eventId}`, event.location);
            } catch (err: any) {
                console.error('Hotel discovery error:', err);
                setError(err.message || 'Failed to discover hotels');
            } finally {
                setLoading(false);
            }
        };

        discoverHotels();
    }, [event, guestLoad, eventId, token, filters]);

    return {
        hotels,
        loading,
        error,
        event
    };
};
