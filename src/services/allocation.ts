import { AllocateRequest, GetAllocationsResponse, UpdateAllocationRequest, EventDetails, Guest, RoomInventory, AllocatedFamily, AIAllocateResponse } from "@/types/allocation";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const API_BASE_URL = `${backendUrl}/api/v1`;

async function fetchWithAuth(url: string, token: string | null, options: RequestInit = {}) {
    if (!token) {
        throw new Error("No authentication token available");
    }

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers as Record<string, string>,
    };

    // Ensure double slashes aren't created if base url ends with / and url starts with /
    const baseUrl = API_BASE_URL.replace(/\/$/, "");
    const endpoint = url.startsWith("/") ? url : `/${url}`;

    const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMessage = response.statusText;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
            // Parsing failed, use status text
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

export const allocationService = {
    fetchEvent: async (eventId: string, token: string): Promise<EventDetails> => {
        const response = await fetchWithAuth(`/events/${eventId}`, token);
        // Normalized: unwrap nested "data" or "event" keys
        const event = response?.data?.event ?? response?.event ?? null;
        if (!event) throw new Error("Invalid event response shape");
        return event;
    },

    fetchGuests: async (eventId: string, token: string): Promise<Guest[]> => {
        const response = await fetchWithAuth(`/events/${eventId}/guests`, token);
        // Normalized: unwrap { guests: [] } or { success: true, data: { guests: [] } }
        const rawGuests = response?.data?.guests ?? response?.guests ?? [];

        return rawGuests.map((g: any) => ({
            guest_id: g.guest_id ?? g.id ?? g.ID,
            guest_name: g.guest_name ?? g.name ?? g.Name,
            family_id: g.family_id ?? g.FamilyID,
            is_event_manager: g.is_event_manager ?? g.IsEventManager ?? false,
        }));
    },

    fetchAllocations: async (eventId: string, token: string): Promise<{
        status: string;
        rooms_inventory: RoomInventory[];
        allocations: AllocatedFamily[];
    }> => {
        const response = await fetchWithAuth(`/events/${eventId}/allocations`, token);
        const payload = response?.data ?? response;

        return {
            status: payload?.status ?? payload?.Status ?? "draft",
            rooms_inventory: (payload?.rooms_inventory ?? payload?.RoomsInventory ?? []).map((room: any) => ({
                ...room,
                total: room.total ?? room.Total ?? room.available ?? room.Available,
            })),
            allocations: payload?.allocations ?? payload?.Allocations ?? []
        };
    },

    createAllocation: async (data: AllocateRequest, token: string): Promise<void> => {
        return fetchWithAuth(`/allocations`, token, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    updateAllocation: async (allocationId: string, data: UpdateAllocationRequest, token: string): Promise<void> => {
        return fetchWithAuth(`/allocations/${allocationId}`, token, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    autoAllocate: async (eventId: string, token: string): Promise<{ message: string; allocations_count: number }> => {
        return fetchWithAuth(`/events/${eventId}/auto-allocate`, token, {
            method: "POST",
        });
    },

    finalizeEvent: async (eventId: string, token: string): Promise<void> => {
        return fetchWithAuth(`/events/${eventId}/finalize`, token, {
            method: "POST",
        });
    },

    reopenEvent: async (eventId: string, token: string): Promise<void> => {
        return fetchWithAuth(`/events/${eventId}/reopen`, token, {
            method: "POST",
        });
    },

    aiAllocate: async (eventId: string, token: string): Promise<AIAllocateResponse> => {
        return fetchWithAuth(`/events/${eventId}/ai-allocate`, token, {
            method: "POST",
        });
    },
};
