/**
 * Event-related types
 * Migrated from lib/types.ts
 */

export interface RoomInventoryItem {
    room_offer_id: string;
    room_name: string;
    available: number;
    max_capacity: number;
    price_per_room: number;
}

export interface Event {
    id: string;
    name: string;
    location: string;
    startDate: string;
    endDate: string;
    organizer: string;
    guestCount: number;
    hotelCount: number;
    inventoryConsumed: number;
    status: 'active' | 'upcoming' | 'completed';
    headGuestId?: string;
    roomsInventory?: RoomInventoryItem[];
}

export interface HeadGuest {
    id: string;
    name: string;
    email: string;
    phone: string;
    eventId: string;
    subGroupName: string;
}

export interface SubGuest {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    age?: number;
    type?: string;
    guestCount?: number;
    headGuestId: string;
    roomGroupId?: string;
    familyId?: string;
    arrivalDate?: string;
    departureDate?: string;
}

export interface Guest {
    id: string;
    name: string;
    email: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    foodPreference: string;
    allergies?: string;
    assigned: boolean;
}

export interface GuestInput {
    name: string;
    age: number;
    type?: 'adult' | 'child';
    phone?: string;
    email?: string;
    arrivalDate?: string;
    departureDate?: string;
    family_members?: GuestInput[];
}
