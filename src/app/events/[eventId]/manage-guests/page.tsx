"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import SharedGuestTable, { TableGuest } from "@/components/shared/SharedGuestTable";

interface Guest {
  ID: string;
  guest_id?: string;
  // snake_case aliases for GORM json tags
  id?: string;
  Name: string;
  guest_name?: string;
  name?: string;
  Age: number;
  age?: number;
  Type: 'adult' | 'child';
  type?: string;
  Phone: string;
  phone?: string;
  Email: string;
  email?: string;
  EventID: string;
  FamilyID: string;
  family_id?: string;
  ArrivalDate: string;
  arrival_date?: string;
  DepartureDate: string;
  departure_date?: string;
}

interface APIResponse {
  guests: Guest[];
  error?: string;
}

export default function ManageGuestsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { token, isAuthenticated } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [sendingInvites, setSendingInvites] = useState(false);

  const handleSendInvites = async () => {
    if (!confirm("Are you sure you want to send email invitations to all guests?")) return;
    
    setSendingInvites(true);
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${backendUrl}/api/v1/events/${eventId}/send-invites`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!res.ok) throw new Error("Failed to send invites");
        
        const data = await res.json();
        alert(`Success! ${data.data.emails_queued} invitation emails queued.`);
    } catch (err) {
        console.error("Failed to send invites:", err);
        alert("Failed to send invitations. Please try again.");
    } finally {
        setSendingInvites(false);
    }
  };

  useEffect(() => {
    const fetchGuests = async () => {
      if (!token || !isAuthenticated) return;
      
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
        const rawGuests = result.guests || [];
        // Normalize fields: backend returns PascalCase from GORM
        const normalized: Guest[] = rawGuests.map(g => ({
          ...g,
          ID: g.guest_id || g.ID || g.id || '',
          id: g.guest_id || g.ID || g.id || '',
          Name: g.guest_name || g.Name || g.name || '',
          name: g.guest_name || g.Name || g.name || '',
          Age: g.Age ?? g.age ?? 0,
          age: g.Age ?? g.age ?? 0,
          Type: ((g.Age ?? g.age ?? 0) < 16) ? 'child' : 'adult',
          type: ((g.Age ?? g.age ?? 0) < 16) ? 'child' : 'adult',
          Phone: g.Phone || g.phone || '',
          phone: g.Phone || g.phone || '',
          Email: g.Email || g.email || '',
          email: g.Email || g.email || '',
          EventID: g.EventID || '',
          FamilyID: g.FamilyID || g.family_id || '',
          family_id: g.FamilyID || g.family_id || '',
          ArrivalDate: g.ArrivalDate || g.arrival_date || '',
          arrival_date: g.ArrivalDate || g.arrival_date || '',
          DepartureDate: g.DepartureDate || g.departure_date || '',
          departure_date: g.DepartureDate || g.departure_date || '',
        }));
        setGuests(normalized);

      } catch (error) {
        console.error("Error fetching guests:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
        fetchGuests();
    }
  }, [eventId, token, isAuthenticated]);

  // Group guests by FamilyID internally mapped to SharedTable format
  const mappedGuests: TableGuest[] = guests.map(g => ({
      id: g.id || g.ID,
      familyId: g.family_id || g.FamilyID,
      name: g.name || g.Name,
      age: g.age ?? g.Age,
      type: g.type || g.Type,
      email: g.email || g.Email,
      phone: g.phone || g.Phone,
      arrivalDate: g.arrival_date || g.ArrivalDate,
      departureDate: g.departure_date || g.DepartureDate,
      originalData: g
  }));

  const toggleRow = (id: string) => {
    if (expandedRowId === id) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(id);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header row: back button, title, and actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/events/${eventId}`}
              className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6 text-neutral-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                Guest Management
              </h1>
              <p className="text-sm text-neutral-600">
                Manage RSVPs and guest details for Event
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSendInvites}
              disabled={sendingInvites || loading || guests.length === 0}
              title={guests.length === 0 ? "No guests to invite" : "Send invitations"}
              className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {sendingInvites ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Invitations
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl border border-neutral-200">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <p className="text-sm text-neutral-500">Loading guest list...</p>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <SharedGuestTable guests={mappedGuests} />
          </div>
        )}
      </div>
    </div>
  );
}
