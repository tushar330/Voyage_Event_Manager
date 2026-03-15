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

// ─── AI Allocation Types ───────────────────────────────────────────────────

export interface AISuggestionItem {
    familyId: string;
    roomOfferId: string;
    roomName: string;
    familySize: number;
    capacity: number;
    allocationScore: number;
    capacityWaste: number;
    roomPrice: number;
    confidenceScore: number; // packing tightness [0,1]
    // FIX 3: reason removed — was heuristic guess, not data-driven
}

export interface PlanValidity {
    generatedAt: string;        // ISO timestamp
    validityExpiresAt: string;  // ISO timestamp (generatedAt + 5 min)
    validForSeconds: number;
}

export interface AIMetrics {
    capacityWasteBefore: number;
    capacityWasteAfter: number;
    improvementPercent: number;
    totalCostOptimised: number;
    roomsUsedBefore: number;
    roomsUsedAfter: number;
    utilisationImprovementPercent: number;
}

export interface AIAllocateResponse {
    suggestions: AISuggestionItem[];
    unplaceableFamilies: string[];
    metrics: AIMetrics;
    reasoning: string;
    planValidity: PlanValidity;
    optimisationEffective: boolean; // FIX 1: < 5% improvement = false
    optimisationMessage: string;    // FIX 1: set when not effective
}
