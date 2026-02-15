export interface RoomInventory {
    room_offer_id: string;
    room_name: string;
    capacity: number;
    total: number;
    available: number;
}

export interface Guest {
    guest_id: string;
    guest_name: string;
}

export interface FamilyAllocation {
    family_id: string; // Used as the primary key for the family
    allocation_id?: string; // Present if allocated
    id?: string; // Alternative ID if backend sends snake_case or simply 'id'
    room_offer_id: string | null;
    room_name?: string;
    guests: Guest[];
}

export type EventStatus = "draft" | "allocating" | "locked" | "rooms_finalized" | "finalized";

export interface GetAllocationsResponse {
    event_id: string;
    status: EventStatus;
    rooms_inventory: RoomInventory[];
    allocations: FamilyAllocation[];
}

export interface AllocateRequest {
    event_id: string;
    family_id: string;
    room_offer_id: string;
}

export interface UpdateAllocationRequest {
    room_offer_id: string;
}
