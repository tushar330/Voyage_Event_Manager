import { Hotel, HotelDataWrapper, Banquet, Catering, RoomType } from '../types';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const API_URL = `${backendUrl}/api/v1`;

export const hotelApi = {
    /**
     * Fetch hotels for a specific city
     */
    async getHotelsByCity(cityId: string, token?: string): Promise<Hotel[]> {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/hotels?city_id=${cityId}`, { headers });
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

        const roomsList = result.data || result || [];
        return (Array.isArray(roomsList) ? roomsList : []).map((r: any) => ({
            id: r.id,
            hotelId: r.hotel_id || r.hotelId || hotelCode,
            name: r.name,
            price: r.total_fare || r.price || 0,
            capacity: r.max_capacity || r.capacity || 0,
            inventory: r.count || r.inventory || 0,
            description: r.description || ''
        }));
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

        const banquetsList = result.data || result || [];
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

        const cateringList = result.data || result || [];
        return (Array.isArray(cateringList) ? cateringList : []).map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.type || c.description || '', // Mapping Type to description since backend keeps it simple
            pricePerPerson: c.price_per_plate || c.pricePerPerson || 0,
            menuHighlights: c.menu_highlights || c.menuHighlights || []
        }));
    }
};
