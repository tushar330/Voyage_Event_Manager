"use client";

import { useEffect, useState } from "react";
import VenueShowcaseCard from "@/components/legacy/portal/VenueShowcaseCard";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { CuratedVenue } from "@/types";

export default function VenuePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { token } = useAuth();
  const [venues, setVenues] = useState<CuratedVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      if (!token || !eventId) return;

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${backendUrl}/api/v1/events/${eventId}/venues`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          // Adjust based on your backend response format, e.g., data.venues or directly data
          setVenues(data.data?.venues || data.venues || []);
        } else {
          toast.error("Failed to load venues");
        }
      } catch (error) {
        console.error("Error fetching venues:", error);
        toast.error("Error fetching venues");
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [eventId, token]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium space-y-4 pb-20 mt-4 text-xl">Loading venues...</div>;
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="border-b border-gray-100 pb-8 mt-4">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
          Venues & Stays
        </h1>
        <p className="text-gray-500 mt-2 font-medium">
          Carefully selected accommodations and event spaces curated for your
          group.
        </p>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-blue-900">
              Agent-Verified Locations
            </h3>
            <p className="text-sm text-blue-800/80 mt-1 leading-relaxed font-medium">
              Click on any venue to explore detailed room types, virtual tours,
              and curated meal plans.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {venues.map((venue) => (
          <VenueShowcaseCard key={venue.id} venue={venue} />
        ))}
      </div>

      {venues.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="text-gray-500 font-bold">
            No venues registered for this event yet.
          </p>
        </div>
      )}
    </div>
  );
}
