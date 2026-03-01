export interface RoomInventory {
    room_offer_id: string;
    room_name: string;
    available: number;
    max_capacity: number;
    total: number;
    price_per_room?: number;
}

export interface Guest {
    guest_id: string;
    guest_name: string;
    family_id: string;
    is_event_manager?: boolean;
}

// Strictly for unallocated families derived from guests
export interface UnallocatedFamily {
    family_id: string;
    guests: Guest[];
}

// Strictly for allocated families from backend
export interface AllocatedFamily {
    family_id: string;
    allocation_id: string; // Mandatory
    room_offer_id: string;
    room_name: string;
    guests: Guest[];
}

export type EventStatus = "draft" | "locked" | "rooms_finalized" | "finalized";

export interface EventDetails {
    id: string;
    status: EventStatus;
    rooms_inventory: RoomInventory[];
}

export interface GetAllocationsResponse {
    event_id: string;
    status: EventStatus;
    rooms_inventory: RoomInventory[];
    allocations: AllocatedFamily[];
}

export interface AllocateRequest {
    event_id: string;
    family_id: string;
    room_offer_id: string;
}

export interface UpdateAllocationRequest {
    room_offer_id: string;
}
