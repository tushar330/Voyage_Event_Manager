import { AllocateRequest, GetAllocationsResponse, UpdateAllocationRequest } from "@/types/allocation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

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
        throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
}

export const allocationService = {
    fetchAllocations: async (eventId: string, token: string): Promise<GetAllocationsResponse> => {
        return fetchWithAuth(`/events/${eventId}/allocations`, token);
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

    lockEvent: async (eventId: string, token: string): Promise<{ message: string; status: string }> => {
        return fetchWithAuth(`/events/${eventId}/lock`, token, {
            method: "POST",
        });
    },
};
