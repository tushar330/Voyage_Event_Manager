"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import EventModal from "@/components/legacy/EventModal";
import { useEvents } from "@/context/EventContext";
import { useCart } from "@/context/CartContext";

import { useEffect } from "react";

interface Hotel {
  id: string;
  name: string;
  location: string;
  rooms: number;
}

const HOTELS: Hotel[] = [
  { id: "1", name: "Hotel Grand Palace", location: "Downtown", rooms: 15 },
  { id: "2", name: "Sunrise Residency", location: "Beachside", rooms: 8 },
  { id: "3", name: "City View Inn", location: "City Center", rooms: 12 },
];

type Section = "hotels" | "guests" | "settlements" | "postbooking";

export default function EventDashboardPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const { events, loading: eventsLoading, error: eventsError } = useEvents();
  const { cart, fetchCart } = useCart();
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (eventId) {
      fetchCart(eventId);
    }
  }, [eventId, fetchCart]);

  const currentEvent = events.find((e) => e.id === eventId);

  if (eventsLoading) {
    return <div className="p-8 text-center">Loading event details...</div>;
  }

  if (!currentEvent && !eventsLoading) {
    return (
      <div className="p-8 text-center text-red-500">
        Event not found. Please try refreshing or check the URL.
      </div>
    );
  }

  const handleSectionClick = (section: Section) => {
    setActiveSection(activeSection === section ? null : section);
    // Reset internal states when switching sections if needed
    if (section !== "hotels") {
      setSelectedHotelId(null);
    }
  };

  const handleHotelSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling to section click if needed
    setSelectedHotelId(id === selectedHotelId ? null : id);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Event Dashboard
          </h1>
          <p className="text-neutral-600 mt-1">
            Manage all aspects of your event from one place.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Details
          </button>
          <button
            onClick={() => {
              const url = `${window.location.origin}/events/${eventId}/guests`;
              navigator.clipboard.writeText(url);
              const btn = document.getElementById("copy-btn");
              if (btn) {
                const originalText = btn.innerText;
                btn.innerText = "Copied!";
                btn.classList.add(
                  "bg-green-600",
                  "text-white",
                  "border-green-600",
                );
                btn.classList.remove(
                  "bg-white",
                  "text-neutral-600",
                  "border-neutral-200",
                );
                setTimeout(() => {
                  btn.innerText = originalText;
                  btn.classList.remove(
                    "bg-green-600",
                    "text-white",
                    "border-green-600",
                  );
                  btn.classList.add(
                    "bg-white",
                    "text-neutral-600",
                    "border-neutral-200",
                  );
                }, 2000);
              }
            }}
            id="copy-btn"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            Copy Guest Invite Link
          </button>
          <Link
            href={`/events/${eventId}/cart`}
            className="relative flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-all shadow-lg active:scale-95 group"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Cart
            {cart && (cart.hotels?.length > 0 || cart.flights?.length > 0) && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm ring-1 ring-red-100 animate-in zoom-in duration-300">
                {(cart.hotels || []).reduce(
                  (acc, h) =>
                    acc +
                    (h.rooms?.length || 0) +
                    (h.banquets?.length || 0) +
                    (h.catering?.length || 0) +
                    (h.hotel_wishlist_item ? 1 : 0),
                  0,
                ) + (cart.flights?.length || 0)}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Main Sections Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Concierge & Bookings (Span 8) */}
        <div className="xl:col-span-8 space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 border-b border-neutral-200 pb-4 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </span>
            Bookings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Hotels Section Toggle */}
            <Link
              href={`/events/${eventId}/hotels`}
              className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <svg
                    className="w-6 h-6"
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
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                Hotels
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Manage hotel allocations and room mappings.
              </p>
            </Link>

            {/* Flights Section Toggle */}
            <Link
              href={`/events/${eventId}/flights`}
              className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="p-2 rounded-lg bg-sky-50 text-sky-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                Flights
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Book searches and manage flight manifests.
              </p>
            </Link>

            {/* Packages Section (Non-functional) */}
            <div className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left">
              <div className="flex items-start justify-between mb-4">
                <span className="p-2 rounded-lg bg-violet-50 text-violet-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                Packages
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Vacation bundles and custom packages.
              </p>
            </div>

            {/* Umrah Section (Non-functional) */}
            <div className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left">
              <div className="flex items-start justify-between mb-4">
                <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                Umrah
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Religious travel and pilgrimage services.
              </p>
            </div>

            {/* Car Rental Section (Non-functional) */}
            <div className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left">
              <div className="flex items-start justify-between mb-4">
                <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                Car Rental
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Self-drive vehicle booking.
              </p>
            </div>

            {/* Transfer Section (Non-functional) */}
            <Link
              href={`/events/${eventId}/transfers`}
              className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="p-2 rounded-lg bg-teal-50 text-teal-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                Transfer Services
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Airport pickups and cab bookings.
              </p>
            </Link>

            {/* Rail Section (Non-functional) */}
            <div className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left">
              <div className="flex items-start justify-between mb-4">
                <span className="p-2 rounded-lg bg-red-50 text-red-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                Rail
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Train ticket bookings.
              </p>
            </div>

            {/* Cabs Section Toggle (Non-functional) */}
            <div className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left">
              <div className="flex items-start justify-between mb-4">
                <span className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                    />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                Cabs
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Arrange transportation for guests.
              </p>
            </div>

            {/* Catering Section Toggle (Non-functional) */}
            <div className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left">
              <div className="flex items-start justify-between mb-4">
                <span className="p-2 rounded-lg bg-pink-50 text-pink-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                Catering
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Menu planning and dietary requests.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Guest & Event Operations (Span 4) */}
        <div className="xl:col-span-4 space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 border-b border-neutral-200 pb-4 flex items-center gap-2">
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </span>
            Guest Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6">
            {/* Room Mapping Section Toggle */}
            <Link
              href={`/events/${eventId}/room-mapping`}
              className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left flex items-start gap-4"
            >
              <div className="shrink-0">
                <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 block">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                    />
                  </svg>
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                  Room Mapping
                </h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Visualize and assign rooms.
                </p>
              </div>
            </Link>

            {/* Guests Section Toggle */}
            <Link
              href={`/events/${eventId}/manage-guests`}
              className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left flex items-start gap-4"
            >
              <div className="shrink-0 relative">
                <span className="p-2 rounded-lg bg-purple-50 text-purple-600 block">
                  <svg
                    className="w-6 h-6"
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
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                  Guests
                </h3>
                <p className="text-sm mt-1 text-left text-neutral-600">
                  View guest lists and RSVPs.
                </p>
              </div>
            </Link>

            {/* Queues Section (Non-functional) */}
            <div className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left flex items-start gap-4">
              <div className="shrink-0">
                <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 block">
                  <svg
                    className="w-6 h-6"
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
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                  Queues
                </h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Manage waiting lists.
                </p>
              </div>
            </div>

            {/* Settlements Section Toggle */}
            <button
              onClick={() => handleSectionClick("settlements")}
              className={`p-6 rounded-lg transition-all cursor-pointer group text-left flex items-start gap-4 w-full ${
                activeSection === "settlements"
                  ? "bg-emerald-600 border border-emerald-600 shadow-md transform scale-[1.02]"
                  : "card hover:shadow-md"
              }`}
            >
              <div className="shrink-0 relative">
                <span
                  className={`p-2 rounded-lg block ${activeSection === "settlements" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"}`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                {activeSection === "settlements" && (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse absolute -top-1 -right-1" />
                )}
              </div>
              <div>
                <h3
                  className={`text-lg font-semibold group-hover:text-corporate-blue-100 transition-colors ${activeSection === "settlements" ? "text-white group-hover:text-white" : "text-neutral-900"}`}
                >
                  Settlements
                </h3>
                <p
                  className={`text-sm mt-1 text-left ${activeSection === "settlements" ? "text-white/80" : "text-neutral-600"}`}
                >
                  Manage invoices and payment links.
                </p>
              </div>
            </button>

            {/* Post-Booking Section Link */}
            <Link
              href={`/events/${eventId}/post-booking`}
              className="card p-6 hover:shadow-md transition-all cursor-pointer group text-left flex items-start gap-4"
            >
              <div className="shrink-0 relative">
                <span className="p-2 rounded-lg bg-orange-50 text-orange-600 block">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                  Post-Booking
                </h3>
                <p className="text-sm mt-1 text-left text-neutral-600">
                  Manage cancellations.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Content Section */}
      <div className="min-h-[300px] transition-all duration-500 ease-in-out">
        {activeSection === "hotels" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutral-900">
                Registered Hotels
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {HOTELS.map((hotel) => {
                const isSelected = selectedHotelId === hotel.id;

                return (
                  <div
                    key={hotel.id}
                    onClick={(e) => handleHotelSelect(hotel.id, e)}
                    className={`cursor-pointer rounded-xl border p-6 transition-all duration-200 ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 shadow-xl ring-4 ring-blue-100"
                        : "bg-white border-neutral-200 hover:border-blue-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3
                          className={`font-semibold text-lg ${isSelected ? "text-white" : "text-neutral-900"}`}
                        >
                          {hotel.name}
                        </h3>
                        <p
                          className={`text-sm mt-1 ${isSelected ? "text-white/90" : "text-neutral-500"}`}
                        >
                          {hotel.location}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="bg-white/20 p-1.5 rounded-full text-white">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div
                      className={`mt-6 flex items-center gap-2 text-sm ${isSelected ? "text-white/90" : "text-neutral-500"}`}
                    >
                      <svg
                        className="w-4 h-4"
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
                      <span>{hotel.rooms} Rooms Available</span>
                    </div>

                    {isSelected && (
                      <div className="mt-6 pt-6 border-t border-white/20 animate-in fade-in zoom-in-95 duration-200">
                        <Link
                          href={`/events/${eventId}/hotels/${hotel.id}/rooms`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full block text-center bg-white text-blue-600 font-semibold py-2.5 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm"
                        >
                          Map Rooms
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSection === "settlements" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettlementSection />
          </div>
        )}

        {!activeSection && (
          <div className="text-center py-24">
            <p className="text-neutral-400">
              Select a category above to view details
            </p>
          </div>
        )}
      </div>
      {/* Event Modal */}
      <EventModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        event={currentEvent}
      />
    </div>
  );
}

// Settlement Section Component (Agent View)
function SettlementSection() {
  const [markupType, setMarkupType] = useState<"percent" | "fixed">("percent");
  const [markupValue, setMarkupValue] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // CONSTANTS & MOCK DATA
  const BASE_COST = 12500; // Base cost of rooms/services
  const TAX_RATE = 0.18; // 18% Tax

  // CALCULATIONS
  const markupAmount =
    markupType === "percent" ? BASE_COST * (markupValue / 100) : markupValue;

  const subtotal = BASE_COST + markupAmount;
  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;

  const handleGenerateLink = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedLink(
        `${window.location.origin}/pay/inv-${Math.random().toString(36).substr(2, 9)}`,
      );
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:col-span-3 gap-8">
      {/* LEFT: Configuration & Details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Markup Configuration */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Markup Configuration
            </h3>
            <span className="text-xs font-medium px-2 py-1 bg-neutral-100 rounded text-neutral-600">
              Admin Only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Markup Type
              </label>
              <div className="flex bg-neutral-100 p-1 rounded-lg">
                <button
                  onClick={() => setMarkupType("percent")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${markupType === "percent" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
                >
                  Percentage (%)
                </button>
                <button
                  onClick={() => setMarkupType("fixed")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${markupType === "fixed" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
                >
                  Fixed Amount ($)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Markup Value
                {markupType === "percent" ? " (%)" : " ($)"}
              </label>
              <input
                type="number"
                min="0"
                value={markupValue}
                onChange={(e) => setMarkupValue(Number(e.target.value))}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Link Generation Result */}
        {generatedLink && (
          <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Payment Link Generated
                </h3>
                <p className="text-neutral-600 text-sm mt-1">
                  Share this link with your client to collect payment.
                </p>

                <div className="mt-4 flex gap-2">
                  <code className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-sm font-mono text-neutral-700 break-all">
                    {generatedLink}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedLink)}
                    className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Final Invoice Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm sticky top-24">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">
            Settlement Summary
          </h3>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Base Room Cost</span>
              <span>${BASE_COST.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-emerald-600 font-medium bg-emerald-50 -mx-2 px-2 py-1 rounded">
              <span>
                Markup ({markupType === "percent" ? `${markupValue}%` : "Fixed"}
                )
              </span>
              <span>
                +$
                {markupAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>
                $
                {subtotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex justify-between text-neutral-600 border-b border-neutral-100 pb-4">
              <span>Estimated Tax (18%)</span>
              <span>
                $
                {taxAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-bold text-neutral-900">
                Estimated Total
              </span>
              <span className="text-2xl font-black text-neutral-900">
                $
                {total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              disabled={isGenerating}
              onClick={handleGenerateLink}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101"
                    />
                  </svg>
                  Generate Payment Link
                </>
              )}
            </button>
            <button className="w-full py-3 bg-white border border-neutral-200 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-all">
              Download PDF Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
