/**
 * Global shared types
 * Domain-specific types should be in their respective modules
 */

// Re-export from modules for backward compatibility
export type { Event, EventManager, SubGuest, Guest, GuestInput } from '@/modules/events/types';

// Inventory types
export interface Hotel {
    id: string;
    name: string;
    location: string;
    allotment: number;
    consumed: number;
    remaining: number;
}

export interface RoomAllocation {
    id: string;
    eventId: string;
    eventManagerId: string;
    roomType: string;
    maxCapacity: number;
    hotelName: string;
}

export interface RoomGroup {
    id: string;
    allocationId: string;
    guestIds: string[];
    customLabel?: string;
}

export interface CuratedVenue {
    id: string;
    name: string;
    location: string;
    description: string;
    images: string[];
    amenities: string[];
    eventId: string;
    status?: "wishlist" | "cart" | "approved";
}

// Metric types (dashboard)
export interface MetricData {
    label: string;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
}

// Auth types (re-export from context)
export type { User, UserRole } from '@/context/AuthContext';
