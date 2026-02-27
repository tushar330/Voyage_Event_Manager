"use client";

import { use, useEffect, useState } from "react";
import GuestLinkGenerator from '@/components/legacy/portal/GuestLinkGenerator';
import GuestList from '@/components/legacy/portal/GuestList';
import { useAuth } from "@/context/AuthContext";
import { SubGuest } from "@/types";

interface Guest {
  ID: string;
  guest_id?: string;
  Name: string;
  guest_name?: string;
  Age: number;
  Type: 'adult' | 'child';
  Phone: string;
  Email: string;
  EventID: string;
  FamilyID: string;
  ArrivalDate: string;
  DepartureDate: string;
  // Loose typing for safety when mapping
  [key: string]: any;
}

interface APIResponse {
  guests: Guest[];
  error?: string;
}

export default function GuestsPage({ params }: { params: Promise<{ eventId: string; guestId: string }> }) {
    const { eventId, guestId } = use(params);
    const { token, isAuthenticated } = useAuth();
    const [guests, setGuests] = useState<SubGuest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchGuests = async () => {
        if (!token) return;

        try {
            setLoading(true);
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const response = await fetch(`${backendUrl}/api/v1/events/${eventId}/guests`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch guests");
            }

            const result: APIResponse = await response.json();
            const allGuests = result.guests || [];
            
            console.log("Looking for GuestID (Organizer):", guestId);
            if (allGuests.length > 0) {
                console.log("[DEBUG] First guest from API:", JSON.stringify(allGuests[0], null, 2));
            }

            const mappedGuests: SubGuest[] = allGuests.map(g => ({
                id: g.guest_id || g.ID || g.id || '',
                name: g.guest_name || g.Name || g.name || '',
                email: g.Email || g.email || '',
                phone: g.Phone || g.phone || '',
                age: g.Age || g.age || 0,
                headGuestId: guestId,
                familyId: g.FamilyID || g.familyId || g.family_id || '',
                guestCount: 1,
                roomGroupId: g.RoomGroupID || g.roomGroupId || '',
                arrivalDate: g.ArrivalDate || g.arrival_date || g.arrivalDate || undefined,
                departureDate: g.DepartureDate || g.departure_date || g.departureDate || undefined
            }));

            console.log(`Displaying ${mappedGuests.length} guests.`);
            setGuests(mappedGuests);
        } catch (error) {
            console.error("Error fetching guests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchGuests();
        }
    }, [eventId, guestId, token, isAuthenticated]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Guest Management</h1>
                <p className="text-gray-600 mt-2">
                    Manage your guest list, add details, and track RSVP status.
                </p>
            </div>

            <GuestLinkGenerator eventId={eventId} guestId={guestId} />

            <div className="pt-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Guest List</h2>
                {loading ? (
                    <div className="flex justify-center p-8 text-gray-500">Loading guests...</div>
                ) : (
                <GuestList 
                    initialGuests={guests} 
                    onUpdateGuest={handleUpdateGuest}
                    onDeleteGuest={handleDeleteGuest}
                    eventId={eventId}
                    token={token}
                    onGuestAdded={fetchGuests}
                />
                )}
            </div>
        </div>
    );

    async function handleUpdateGuest(updatedGuest: SubGuest) {
        if (!token) return;

        // Optimistic Update
        setGuests(prev => prev.map(g => g.id === updatedGuest.id ? updatedGuest : g));

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const response = await fetch(`${backendUrl}/api/v1/guests/${updatedGuest.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: updatedGuest.id,
                    ID: updatedGuest.id, // Go Backend Mapping
                    guest_id: updatedGuest.id, // Go Backend Mapping
                    name: updatedGuest.name,
                    guest_name: updatedGuest.name, // Go backend mapping
                    Name: updatedGuest.name, // Go backend mapping
                    email: updatedGuest.email,
                    Email: updatedGuest.email,
                    phone: updatedGuest.phone,
                    Phone: updatedGuest.phone,
                    age: Number(updatedGuest.age),
                    Age: Number(updatedGuest.age),
                    type: updatedGuest.type,
                    Type: updatedGuest.type,
                    family_id: updatedGuest.familyId,
                    FamilyID: updatedGuest.familyId,
                    arrivalDate: updatedGuest.arrivalDate,
                    arrival_date: updatedGuest.arrivalDate, // Go backend mapping
                    ArrivalDate: updatedGuest.arrivalDate,
                    departureDate: updatedGuest.departureDate,
                    departure_date: updatedGuest.departureDate, // Go backend mapping
                    DepartureDate: updatedGuest.departureDate,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error("Backend Guest Update Error response:", errorData);
                throw new Error("Failed to update guest");
            }

            console.log("Guest updated successfully", {
                arrivalDate: updatedGuest.arrivalDate,
                departureDate: updatedGuest.departureDate
            });
            // Refetch to ensure displayed data matches what DB stored
            fetchGuests();
        } catch (error) {
            console.error("Error updating guest:", error);
            alert("Failed to update guest. Please try again.");
            // Revert optimistic update? Or just let user retry.
        }
    }

    async function handleDeleteGuest(guestId: string) {
        if (!token) return;

        // Optimistic Delete
        setGuests(prev => prev.filter(g => g.id !== guestId));

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const response = await fetch(`${backendUrl}/api/v1/guests/${guestId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to delete guest");
            }
            console.log("Guest deleted successfully");
        } catch (error) {
            console.error("Error deleting guest:", error);
            alert("Failed to delete guest.");
            // Revert logic would typically be here (e.g. refetch)
        }
    }
}
