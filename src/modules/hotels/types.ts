export interface Hotel {
    id: string;
    name: string;
    location: string;
    image: string;
    price: number;
    stars: number;
    rating: number;
    description: string;
    amenities: string[];
    type: string;
    discount?: number;
    occupancy: number;
    primary_room_offer_id?: string;
}

export interface HotelFilters {
    min_price?: number;
    max_price?: number;
    stars?: string; // Comma-separated string
    amenities?: string; // Comma-separated string
    rooms_single?: number;
    rooms_double?: number;
    rooms_triple?: number;
    rooms_quad?: number;
}

export interface LocalFilterState {
    priceRange: [number, number];
    stars: number[];
    minRating: number | null;
    amenities: string[];
    type: string[];
    freeCancellation: boolean;
    mealPlan: string[];
    venueSetting: string[];
    guestCapacity: number | null;
    foodType: string[];
    petFriendly: boolean;
}

export const DEFAULT_FILTERS: LocalFilterState = {
    priceRange: [0, 50000],
    stars: [],
    minRating: null,
    amenities: [],
    type: [],
    freeCancellation: false,
    mealPlan: [],
    venueSetting: [],
    guestCapacity: null,
    foodType: [],
    petFriendly: false,
};

export interface RoomType {
    id: string;
    hotelId: string;
    name: string;
    capacity: number;
    price: number;
    description?: string;
    inventory: number;
    total_fare?: number;
    max_capacity?: number;
    count?: number;
    amenities?: string[];
}

export interface RoomsInventory {
    hotel_id: string;
    room_types: RoomType[];
}

export interface Banquet {
    id: number; // uint
    name: string;
    capacity: number;
    facilities: string[];
    pricePerSlot: number;
}

export interface Catering {
    id: number; // uint
    name: string;
    description: string;
    menuHighlights: string[];
    pricePerPerson: number;
}

export interface HotelDataWrapper<T> {
    data: T[];
}
