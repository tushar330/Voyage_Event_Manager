"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function PortalDashboard() {
  const params = useParams();
  const eventId = params.eventId as string;
  const guestId = params.guestId as string;
  const { token } = useAuth();

  const [stats, setStats] = useState({
    totalGuests: 0,
    assignedGuests: 0,
    totalRooms: 0,
    filledRooms: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

        // TODO: These endpoints need to return the actual lists.
        // Currently checking if they exist in routes.go
        // events.Get("/:id/guests", repo.GetGuests)
        // events.Get("/:id/allocations", repo.GetEventAllocations)

        const [guestsRes, allocationsRes] = await Promise.all([
          fetch(`${backendUrl}/api/v1/events/${eventId}/guests`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${backendUrl}/api/v1/events/${eventId}/allocations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (guestsRes.ok && allocationsRes.ok) {
          const guestsData = await guestsRes.json();
          const allocationsData = await allocationsRes.json();

          const guests = guestsData.guests || [];

          const myGuests = guests.filter(
            (g: any) =>
              g.familyId ===
              guests.find((me: any) => me.id === guestId)?.familyId,
          );

          // Simplify for "Working" state:
          setStats({
            totalGuests: guests.length,
            assignedGuests: 0, // Need allocation logic
            totalRooms: 0,
            filledRooms: 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [eventId, guestId, token]);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to Your Event Portal
        </h1>
        <p className="text-gray-600 mt-2">Manage your group</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Guests</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalGuests}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* More stats can be re-enabled when logic is solid */}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/events/${eventId}/portal/${guestId}/rooms`}
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Manage Room Assignments
              </h3>
              <p className="text-sm text-gray-600">Assign guests to rooms</p>
            </div>
          </Link>

          <Link
            href={`/events/${eventId}/portal/${guestId}/guests`}
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Guests</h3>
              <p className="text-sm text-gray-600">View and share guest link</p>
            </div>
          </Link>

          <Link
            href={`/events/${eventId}/portal/${guestId}/venue`}
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
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
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Explore Venues</h3>
              <p className="text-sm text-gray-600">
                View curated hotel options
              </p>
            </div>
          </Link>

          <Link
            href={`/events/${eventId}/portal/${guestId}/cart`}
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                View Event Selections
              </h3>
              <p className="text-sm text-gray-600">
                See cart &amp; wishlist for this event
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
