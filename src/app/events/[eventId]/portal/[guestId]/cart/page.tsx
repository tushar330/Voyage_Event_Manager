"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { HotelCartGroup, CartItemDetail } from "@/modules/cart/types";

type Tab = "cart" | "wishlist";

export default function GuestCartPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const guestId = params.guestId as string;

  const { cart, loading, fetchCart } = useCart();
  const [activeTab, setActiveTab] = useState<Tab>("cart");

  useEffect(() => {
    if (eventId) {
      fetchCart(eventId);
    }
  }, [eventId, fetchCart]);

  const filteredData = useMemo(() => {
    if (!cart)
      return {
        hotels: [],
        flights: [],
        transfers: [],
        total: 0,
        totalTaxesAndFees: 0,
        grandTotal: 0,
      };

    const targetStatus =
      activeTab === "cart" ? ["cart", "approved", "booked"] : ["wishlist"];

    // Filter Hotels and their items
    const hotels = (cart.hotels || [])
      .map((group) => {
        const rooms = (group.rooms || []).filter((i) =>
          targetStatus.includes(i.status || "cart"),
        );
        const banquets = (group.banquets || []).filter((i) =>
          targetStatus.includes(i.status || "cart"),
        );
        const catering = (group.catering || []).filter((i) =>
          targetStatus.includes(i.status || "cart"),
        );
        const hotelWishlist =
          group.hotel_wishlist_item &&
          targetStatus.includes(group.hotel_wishlist_item.status || "cart")
            ? group.hotel_wishlist_item
            : undefined;

        if (
          rooms.length > 0 ||
          banquets.length > 0 ||
          catering.length > 0 ||
          hotelWishlist
        ) {
          return {
            ...group,
            rooms,
            banquets,
            catering,
            hotel_wishlist_item: hotelWishlist,
          };
        }
        return null;
      })
      .filter(Boolean) as HotelCartGroup[];

    // Filter Flights
    const flights = (cart.flights || []).filter((i) =>
      targetStatus.includes(i.status || "cart"),
    );

    // Filter Transfers
    const transfers = (cart.transfers || []).filter((i) =>
      targetStatus.includes(i.status || "cart"),
    );

    // Calculate Total
    let total = 0;
    let totalTaxesAndFees = 0;
    hotels.forEach((group) => {
      [...group.rooms, ...group.banquets, ...group.catering].forEach((item) => {
        total += item.locked_price * item.quantity;
        totalTaxesAndFees += item.tax_and_fees || 0;
      });
      if (group.hotel_wishlist_item) {
        total +=
          group.hotel_wishlist_item.locked_price *
          group.hotel_wishlist_item.quantity;
        totalTaxesAndFees += group.hotel_wishlist_item.tax_and_fees || 0;
      }
    });
    flights.forEach((item) => {
      total += item.locked_price * item.quantity;
      totalTaxesAndFees += item.tax_and_fees || 0;
    });
    transfers.forEach((item) => {
      total += item.locked_price * item.quantity;
      totalTaxesAndFees += item.tax_and_fees || 0;
    });

    const grandTotal = total + totalTaxesAndFees;

    return { hotels, flights, transfers, total, totalTaxesAndFees, grandTotal };
  }, [cart, activeTab]);

  const getStartingPrice = (group: HotelCartGroup) => {
    if (group.rooms && group.rooms.length > 0) {
      const prices = group.rooms.map((r) => r.locked_price);
      return Math.min(...prices);
    }
    return group.hotel_details?.price || 0;
  };

  if (loading && !cart) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"
          />
          <p className="text-neutral-500 font-medium">
            Loading event selections...
          </p>
        </div>
      </div>
    );
  }

  const isEmpty =
    filteredData.hotels.length === 0 &&
    filteredData.flights.length === 0 &&
    filteredData.transfers.length === 0;

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              {activeTab === "cart" ? "Event Selections" : "Saved for Later"}
            </h1>
            <p className="text-neutral-500 mt-2">
              {activeTab === "cart"
                ? "Current selections for your event"
                : "Items saved for consideration"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setActiveTab("cart")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  activeTab === "cart"
                    ? "bg-neutral-900 text-white shadow-md"
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                Cart
              </button>
              <button
                onClick={() => setActiveTab("wishlist")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  activeTab === "wishlist"
                    ? "bg-neutral-900 text-white shadow-md"
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                Wishlist
              </button>
            </div>

            <Link
              href={`/events/${eventId}/portal/${guestId}`}
              className="text-blue-600 font-medium hover:text-blue-800 transition-colors ml-4"
            >
              ← Back to Portal
            </Link>
          </div>
        </header>

        {/* Read-only notice */}
        <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          <svg
            className="w-5 h-5 shrink-0 text-blue-500"
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
          <span>
            This is a <strong>read-only view</strong> of the current event
            selections made by your event coordinator.
          </span>
        </div>

        {isEmpty ? (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-12 text-center">
            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-neutral-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              {activeTab === "cart"
                ? "No selections yet"
                : "No saved items yet"}
            </h3>
            <p className="text-neutral-500">
              {activeTab === "cart"
                ? "Your event coordinator hasn't added any selections yet."
                : "No items have been saved for consideration yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hotels Group */}
              {filteredData.hotels.map((group, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden"
                >
                  {/* Hotel Header */}
                  <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center gap-4">
                    <img
                      src={
                        group.hotel_details?.image ||
                        group.hotel_details?.image_urls?.[0] ||
                        "/images/placeholder.jpg"
                      }
                      alt={group.hotel_details?.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-neutral-900 text-lg">
                        {group.hotel_details?.name || "Unknown Hotel"}
                      </h4>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-neutral-500">
                          {group.hotel_details?.location}
                        </p>
                        <p className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Starts from ₹
                          {getStartingPrice(group).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Hotel Wishlist Item */}
                    {group.hotel_wishlist_item && (
                      <ReadOnlyCartItemRow
                        item={group.hotel_wishlist_item}
                        activeTab={activeTab}
                        hideImage={true}
                      />
                    )}

                    {/* Rooms */}
                    {(group.rooms || []).map((item) => (
                      <ReadOnlyCartItemRow
                        key={item.id}
                        item={item}
                        activeTab={activeTab}
                      />
                    ))}

                    {/* Banquets */}
                    {(group.banquets || []).map((item) => (
                      <ReadOnlyCartItemRow
                        key={item.id}
                        item={item}
                        activeTab={activeTab}
                      />
                    ))}

                    {/* Catering */}
                    {(group.catering || []).map((item) => (
                      <ReadOnlyCartItemRow
                        key={item.id}
                        item={item}
                        activeTab={activeTab}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Flights Group */}
              {filteredData.flights.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                  <div className="p-4 bg-neutral-50 border-b border-neutral-200">
                    <h4 className="font-bold text-neutral-900">Flights</h4>
                  </div>
                  <div className="p-6 space-y-4">
                    {filteredData.flights.map((item) => (
                      <ReadOnlyCartItemRow
                        key={item.id}
                        item={item}
                        activeTab={activeTab}
                        hideImage={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Transfers Group */}
              {filteredData.transfers.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                  <div className="p-4 bg-neutral-50 border-b border-neutral-200">
                    <h4 className="font-bold text-neutral-900">Transfers</h4>
                  </div>
                  <div className="p-6 space-y-4">
                    {filteredData.transfers.map((item) => (
                      <ReadOnlyCartItemRow
                        key={item.id}
                        item={item}
                        activeTab={activeTab}
                        hideImage={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Summary Sidebar - Only for Cart */}
            {activeTab === "cart" && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sticky top-8">
                  <h3 className="font-bold text-neutral-900 text-xl mb-6">
                    Order Summary
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal</span>
                      <span>₹{filteredData.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Taxes &amp; Fees</span>
                      <span>
                        ₹{filteredData.totalTaxesAndFees.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-4">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-neutral-900 text-lg">
                        Total
                      </span>
                      <span className="font-black text-neutral-900 text-2xl">
                        ₹{filteredData.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 text-xs text-neutral-400 text-center bg-neutral-50 rounded-lg p-3">
                    Selections are managed by your event coordinator
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ReadOnlyCartItemRowProps {
  item: CartItemDetail;
  activeTab: Tab;
  hideImage?: boolean;
}

const ReadOnlyCartItemRow: React.FC<ReadOnlyCartItemRowProps> = ({
  item,
  activeTab,
  hideImage = false,
}) => {
  const name = useMemo(() => {
    switch (item.type) {
      case "room":
        return item.room_details?.name || "Room Offer";
      case "banquet":
        return item.banquet_details?.name || "Banquet Hall";
      case "catering":
        return item.catering_details?.name || "Catering Plan";
      case "flight":
        return "Flight Booking";
      case "hotel":
        return "Hotel Selection";
      case "transfer":
        return item.transfer_details?.car_model || "Transfer";
      default:
        return "Inventory Item";
    }
  }, [item]);

  const image = useMemo(() => {
    switch (item.type) {
      case "room":
        return item.room_details?.image_urls?.[0] || "/placeholder-room.jpg";
      case "banquet":
        return (
          item.banquet_details?.image_urls?.[0] || "/placeholder-banquet.jpg"
        );
      case "catering":
        return (
          item.catering_details?.image_urls?.[0] || "/placeholder-catering.jpg"
        );
      case "flight":
        return "/placeholder-flight.jpg";
      case "hotel":
        return (
          item.hotel_details?.image ||
          item.hotel_details?.image_urls?.[0] ||
          "/images/placeholder.jpg"
        );
      case "transfer":
        return "/images/cab.jpg";
      default:
        return "/placeholder-item.jpg";
    }
  }, [item]);

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100">
      {/* Thumbnail - hide for rooms/hotels or if explicitly hidden */}
      {!hideImage && item.type !== "hotel" && item.type !== "room" && (
        <img
          src={image}
          alt={name}
          className="w-16 h-16 rounded-lg object-cover bg-neutral-100"
        />
      )}

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h6 className="font-bold text-neutral-800 text-lg leading-tight">
            {name}
          </h6>
          {item.type !== "hotel" && (
            <span className="font-black text-neutral-900 text-lg">
              ₹{(item.locked_price * item.quantity).toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wide">
          {item.type}
        </p>

        <div className="flex items-center flex-wrap gap-4 mt-3">
          {/* Quantity Display (read-only) */}
          {item.type !== "hotel" && (
            <div className="flex items-center bg-white border border-neutral-200 rounded-lg px-3 py-1 shadow-sm gap-2">
              <span className="text-xs text-neutral-500 font-medium">Qty</span>
              <span className="text-sm font-bold text-neutral-900">
                {item.quantity}
              </span>
            </div>
          )}

          {/* Status Badge */}
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
              item.status === "cart" || item.status === "approved"
                ? "bg-green-50 text-green-600"
                : item.status === "booked"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-yellow-50 text-yellow-600"
            }`}
          >
            {item.status}
          </span>
        </div>
      </div>
    </div>
  );
};
