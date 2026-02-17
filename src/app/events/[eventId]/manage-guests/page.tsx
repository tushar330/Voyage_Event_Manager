"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Guest {
  id: string;
  name: string;
  age: number;
  type: 'adult' | 'child';
  phone: string;
  email: string;
  event_id: string;
  family_id: string;
  arrival_date: string;
  departure_date: string;
}

interface APIResponse {
  success: boolean;
  data: {
    guests: Guest[];
  };
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
        if (result.success && result.data && result.data.guests) {
            setGuests(result.data.guests);
        } else {
             setGuests(result.data?.guests || []);
        }

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

  // Group guests by FamilyID
  const groupedGuests = guests.reduce((acc, guest) => {
    const key = guest.family_id || guest.id; // Use FamilyID if present, else ID (to group singles)
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(guest);
    return acc;
  }, {} as Record<string, Guest[]>);

  const guestGroups = Object.values(groupedGuests);

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
        <div className="flex items-center gap-4 mb-8">
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
              Manage RSVPs and guest details for Event ID: {eventId}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
             <button
                onClick={handleSendInvites}
                disabled={sendingInvites || loading}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

        {loading ? (
          <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl border border-neutral-200">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <p className="text-sm text-neutral-500">Loading guest list...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-neutral-700">
                      Name
                    </th>
                    <th className="px-6 py-4 font-semibold text-neutral-700">
                      Age
                    </th>
                    <th className="px-6 py-4 font-semibold text-neutral-700">
                      Family Members
                    </th>
                    <th className="px-6 py-4 font-semibold text-neutral-700">
                      Check-In / Out
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {guestGroups.length === 0 ? (
                      <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                              No guests found.
                          </td>
                      </tr>
                  ) : (
                      guestGroups.map((group) => {
                        const headGuest = group[0];
                        const otherMembers = group.slice(1);
                        const hasFamily = otherMembers.length > 0;
                        const isExpanded = expandedRowId === headGuest.id;
                        return (
                          <>
                            <tr
                              key={headGuest.id}
                              className={`transition-colors ${isExpanded ? "bg-purple-50" : "hover:bg-neutral-50"}`}
                            >
                              <td className="px-6 py-4 font-medium text-neutral-900">
                                <button 
                                  onClick={() => hasFamily && toggleRow(headGuest.id)}
                                  className={`flex items-center gap-2 ${hasFamily ? 'cursor-pointer hover:text-purple-600' : 'cursor-default'}`}
                                >
                                  {hasFamily && (
                                    <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                      ▶
                                    </span>
                                  )}
                                  <div className="text-left">
                                      <div>{headGuest.name}</div>
                                      <div className="text-xs text-neutral-500 font-normal">{headGuest.type}</div>
                                  </div>
                                </button>
                              </td>
                              <td className="px-6 py-4 text-neutral-600">
                                {headGuest.age}
                              </td>
                              <td className="px-6 py-4 text-neutral-600 text-xs">
                                 {hasFamily ? `${otherMembers.length} Family Member${otherMembers.length > 1 ? 's' : ''}` : 'None'}
                              </td>
                              <td className="px-6 py-4 text-neutral-600">
                                <div className="flex flex-col">
                                  <span>In: {headGuest.arrival_date ? new Date(headGuest.arrival_date).toLocaleDateString() : '-'}</span>
                                  <span className="text-xs text-neutral-400">
                                    Out: {headGuest.departure_date ? new Date(headGuest.departure_date).toLocaleDateString() : '-'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && hasFamily && (
                              <tr className="bg-neutral-50">
                                <td colSpan={4} className="px-6 py-4">
                                  <div className="ml-8 space-y-2">
                                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Family Members</p>
                                    {otherMembers.map(member => (
                                      <div key={member.id} className="flex items-center justify-between p-2 bg-white rounded border border-neutral-200 text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-neutral-900">{member.name}</span>
                                            <span className="text-neutral-500 text-xs">({member.age} yrs • {member.type})</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
  );
}
