import { Hotel, HotelDataWrapper, Banquet, Catering, RoomType, HotelFilters } from '../types';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const API_URL = `${backendUrl}/api/v1`;

/** Returns true if the string is a valid UUID (v4 or any standard format). */
const isUUID = (val: unknown): val is string =>
    typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export const hotelApi = {
    /**
     * Fetch hotels for a specific city
     */
    async getHotelsByCity(cityId: string, token?: string, filters?: HotelFilters): Promise<Hotel[]> {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const params = new URLSearchParams({ city_id: cityId });

        if (filters) {
            // 1. Core
            if (filters.priceRange) {
                params.append("min_price", filters.priceRange.min.toString());
                params.append("max_price", filters.priceRange.max.toString());
            } else {
                // Fallback to legacy fields if priceRange not set but min_price/max_price are
                if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
                if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
            }

            if (filters.starRating !== undefined) params.append("stars", filters.starRating.toString());
            else if (filters.stars !== undefined) params.append("stars", filters.stars.toString()); // legacy fallback

            if (filters.userRating !== undefined) params.append("rating", filters.userRating.toString());

            if (filters.propertyTypes && filters.propertyTypes.length > 0) {
                params.append("type", filters.propertyTypes[0]);
            }

            // 2. Room - General Occupancy (>=, not exact match)
            if (filters.occupancy !== undefined) params.append("occupancy", filters.occupancy.toString());
            if (filters.guests_per_room !== undefined) params.append("guests_per_room", filters.guests_per_room.toString());

            // Room Type Inventory Filters (exact capacity match, Strict AND)
            // IMPORTANT: Only send params if count > 0. Omit entirely if zero.
            if (filters.rooms_single && filters.rooms_single > 0) params.append("rooms_single", filters.rooms_single.toString());
            if (filters.rooms_double && filters.rooms_double > 0) params.append("rooms_double", filters.rooms_double.toString());
            if (filters.rooms_triple && filters.rooms_triple > 0) params.append("rooms_triple", filters.rooms_triple.toString());
            if (filters.rooms_quad && filters.rooms_quad > 0) params.append("rooms_quad", filters.rooms_quad.toString());

            // Advanced: room_config JSON for custom capacities
            if (filters.roomConfig && filters.roomConfig.length > 0) {
                params.append("room_config", JSON.stringify(filters.roomConfig));
            }

            if (filters.roomAmenities && filters.roomAmenities.length > 0) {
                params.append("room_amenities", filters.roomAmenities.join(","));
            }

            if (filters.freeCancellation) {
                params.append("free_cancellation", "true");
            }

            if (filters.skip_cache) {
                params.append("skip_cache", "true");
            }
        }

        const response = await fetch(`/api/hotels?${params.toString()}`, { headers });
        if (!response.ok) throw new Error('Failed to fetch hotels');
        const result = await response.json();

        // Map backend PascalCase to camelCase
        const hotelsList = result.data || [];
        return hotelsList.map((h: any) => {
            // Calculate starting price from rooms if available
            const roomPrices = (h.rooms || []).map((r: any) => Number(r.total_fare || r.price || 0)).filter((p: number) => p > 0);
            const minRoomPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : 0;

            return {
                id: h.id || h.hotel_code,
                name: h.name,
                location: h.address || h.location,
                amenities: h.facilities || h.amenities || [],
                stars: h.star_rating || h.stars || 0,
                image: (h.image_urls && h.image_urls[0]) || h.image || '',
                occupancy: h.occupancy || 0,
                // Fallbacks for missing fields in basic list
                price: h.price || minRoomPrice || 0,
                rating: h.rating || 4.5,
                description: h.description || '',
                primary_room_offer_id: (h.rooms && h.rooms.length > 0) ? h.rooms[0].id : null,
                type: h.type || 'Hotel'
            };
        });
    },

    /**
     * Fetch rooms for a specific hotel
     */
    async getRooms(hotelCode: string, token?: string): Promise<RoomType[]> {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/hotels/${hotelCode}/rooms`, { headers });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch rooms for hotel ${hotelCode}: ${response.status} ${errorText}`);
        }
        const result = await response.json();

        const roomsList = result?.data || result?.rooms || (Array.isArray(result) ? result : []);
        return (Array.isArray(roomsList) ? roomsList : []).map((r: any) => {
            // The cart backend does a UUID lookup on room_offers, so we MUST send a UUID.
            // Try every field that might hold the UUID, in priority order.
            const roomId =
                isUUID(r.room_offer_id) ? r.room_offer_id :
                    isUUID(r.offer_id) ? r.offer_id :
                        isUUID(r.room_uuid) ? r.room_uuid :
                            isUUID(r.id) ? r.id :
                                r.room_offer_id || r.id; // last-resort fallback (may still fail)



            return {
                id: roomId,
                hotelId: r.hotel_id || r.hotelId || hotelCode,
                name: r.name,
                price: r.total_fare || r.price || 0,
                capacity: r.max_capacity || r.capacity || 0,
                inventory: r.count || r.inventory || 0,
                description: r.description || ''
            };
        });
    },

    /**
     * Fetch banquets for a specific hotel
     */
    async getBanquets(hotelCode: string, token?: string): Promise<Banquet[]> {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/hotels/${hotelCode}/banquets`, { headers });
        if (!response.ok) throw new Error('Failed to fetch banquets');
        const result = await response.json();

        const banquetsList = Array.isArray(result) ? result : (result.data || []);
        return (Array.isArray(banquetsList) ? banquetsList : []).map((b: any) => ({
            id: b.id,
            name: b.name,
            capacity: b.capacity || 0,
            pricePerSlot: b.price_per_day || b.pricePerSlot || 0,
            facilities: b.facilities || []
        }));
    },

    /**
     * Fetch catering options for a specific hotel
     */
    async getCatering(hotelCode: string, token?: string): Promise<Catering[]> {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/hotels/${hotelCode}/catering`, { headers });
        if (!response.ok) throw new Error('Failed to fetch catering');
        const result = await response.json();

        const cateringList = Array.isArray(result) ? result : (result.data || []);
        return (Array.isArray(cateringList) ? cateringList : []).map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.type || c.description || '', // Mapping Type to description since backend keeps it simple
            pricePerPerson: c.price_per_plate || c.pricePerPerson || 0,
            menuHighlights: c.menu_highlights || c.menuHighlights || []
        }));
    }
};
