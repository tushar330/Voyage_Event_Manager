"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useEvents } from "@/context/EventContext";
import { HotelCartGroup, CartItemDetail } from "@/modules/cart/types";
import { Toaster, toast } from "sonner";

type Tab = "cart" | "wishlist";

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { cart, loading, removeFromCart, updateCartItem, fetchCart } =
    useCart();
  const { updateEvent } = useEvents();
  const [activeTab, setActiveTab] = useState<Tab>("cart");
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchCart(eventId);
    }
  }, [eventId, fetchCart]);

  // useEffect(() => {
  //   if (cart) {
  //       console.log("Cart Data:", cart);
  //       toast.info(`Cart: H:${cart.hotels?.length || 0} F:${cart.flights?.length || 0} T:${cart.transfers?.length || 0}`);
  //   }
  // }, [cart]);

  const filteredData = useMemo(() => {
    if (!cart) return { hotels: [], flights: [], transfers: [], total: 0 };

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

        // Keep group if it has any relevant items
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
    hotels.forEach((group) => {
      [...group.rooms, ...group.banquets, ...group.catering].forEach((item) => {
        total += item.locked_price * item.quantity;
      });
      if (group.hotel_wishlist_item) {
        total +=
          group.hotel_wishlist_item.locked_price *
          group.hotel_wishlist_item.quantity;
      }
    });
    flights.forEach((item) => {
      total += item.locked_price * item.quantity;
    });
    transfers.forEach((item) => {
      total += item.locked_price * item.quantity;
    });

    return { hotels, flights, transfers, total };
  }, [cart, activeTab]);

  const handleFinalize = async () => {
    try {
      setIsFinalizing(true);

      // 1. Gather all rooms from the cart
      const roomsToInventory = (cart?.hotels || []).flatMap((group) =>
        (group.rooms || [])
          .filter((r) => ["cart", "approved"].includes(r.status || "cart"))
          .map((r) => ({
            room_offer_id: r.room_details?.id || r.id,
            room_name: r.room_details?.name || "Room",
            available: r.quantity,
            max_capacity: r.room_details?.capacity || 2,
            price_per_room: r.locked_price,
          })),
      );

      if (roomsToInventory.length === 0) {
        toast.error("No rooms in cart to finalize.");
        return;
      }

      // 2. Update Event
      await updateEvent(eventId, {
        roomsInventory: roomsToInventory,
      });

      toast.success("Event finalized successfully! Rooms added to event.");
      // Optional: Redirect or refresh
      setTimeout(() => router.push(`/events/${eventId}`), 1000);
    } catch (error) {
      console.error("Finalize error:", error);
      toast.error("Failed to finalize event.");
    } finally {
      setIsFinalizing(false);
    }
  };

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
          <p className="text-neutral-500 font-medium">Loading your cart...</p>
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
      <Toaster position="top-right" richColors />
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              {activeTab === "cart" ? "Your Cart" : "Your Wishlist"}
            </h1>
            <p className="text-neutral-500 mt-2">
              {activeTab === "cart"
                ? "Review and manage your event selections"
                : "Items you saved, ready to move to cart"}
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
              href={`/events/${eventId}`}
              className="text-blue-600 font-medium hover:text-blue-800 transition-colors ml-4"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

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
                ? "Your cart is empty"
                : "Your wishlist is empty"}
            </h3>
            <p className="text-neutral-500 mb-8">
              {activeTab === "cart"
                ? "Start adding hotels and services to your event."
                : "You haven't saved any items yet."}
            </p>
            <Link
              href={`/events/${eventId}/hotels`}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
            >
              Browse Hotels
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hotels Group */}
              {filteredData.hotels.map((group, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden"
                >
                  <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center gap-4">
                    <img
                      src={
                        group.hotel_details?.image ||
                        group.hotel_details?.image_urls?.[0] ||
                        "/placeholder-hotel.jpg"
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
                      <CartItemRow
                        item={group.hotel_wishlist_item}
                        activeTab={activeTab}
                        onRemove={() =>
                          removeFromCart(eventId, group.hotel_wishlist_item!.id)
                        }
                        onUpdate={(qty) =>
                          updateCartItem(
                            eventId,
                            group.hotel_wishlist_item!.id,
                            { quantity: qty },
                          )
                        }
                        onMoveToCart={() =>
                          updateCartItem(
                            eventId,
                            group.hotel_wishlist_item!.id,
                            { status: "cart" },
                          )
                        }
                        hideImage={true}
                      />
                    )}

                    {/* Rooms */}
                    {(group.rooms || []).map((item) => (
                      <CartItemRow
                        key={item.id}
                        item={item}
                        activeTab={activeTab}
                        onRemove={() => removeFromCart(eventId, item.id)}
                        onUpdate={(qty) =>
                          updateCartItem(eventId, item.id, { quantity: qty })
                        }
                        onMoveToCart={() =>
                          updateCartItem(eventId, item.id, { status: "cart" })
                        }
                      />
                    ))}

                    {/* Banquets */}
                    {(group.banquets || []).map((item) => (
                      <CartItemRow
                        key={item.id}
                        item={item}
                        activeTab={activeTab}
                        onRemove={() => removeFromCart(eventId, item.id)}
                        onUpdate={(qty) =>
                          updateCartItem(eventId, item.id, { quantity: qty })
                        }
                        onMoveToCart={() =>
                          updateCartItem(eventId, item.id, { status: "cart" })
                        }
                      />
                    ))}

                    {/* Catering */}
                    {(group.catering || []).map((item) => (
                      <CartItemRow
                        key={item.id}
                        item={item}
                        activeTab={activeTab}
                        onRemove={() => removeFromCart(eventId, item.id)}
                        onUpdate={(qty) =>
                          updateCartItem(eventId, item.id, { quantity: qty })
                        }
                        onMoveToCart={() =>
                          updateCartItem(eventId, item.id, { status: "cart" })
                        }
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
                      <CartItemRow
                        key={item.id}
                        item={item}
                        activeTab={activeTab}
                        onRemove={() => removeFromCart(eventId, item.id)}
                        onUpdate={(qty) =>
                          updateCartItem(eventId, item.id, { quantity: qty })
                        }
                        onMoveToCart={() =>
                          updateCartItem(eventId, item.id, { status: "cart" })
                        }
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
                      <CartItemRow
                        key={item.id}
                        item={item}
                        activeTab={activeTab}
                        onRemove={() => removeFromCart(eventId, item.id)}
                        onUpdate={(qty) =>
                          updateCartItem(eventId, item.id, { quantity: qty })
                        }
                        onMoveToCart={() =>
                          updateCartItem(eventId, item.id, { status: "cart" })
                        }
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
                      <span>Taxes & Fees</span>
                      <span>Included</span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-4 mb-6">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-neutral-900 text-lg">
                        Total
                      </span>
                      <span className="font-black text-neutral-900 text-2xl">
                        ₹{filteredData.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleFinalize}
                      disabled={filteredData.total === 0 || isFinalizing}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                    >
                      {isFinalizing ? "Processing..." : "Finalize Selection"}
                    </button>

                    <button
                      onClick={() => toast.info("Payment gateway coming soon!")}
                      disabled={filteredData.total === 0}
                      className="w-full py-3 bg-white border border-neutral-200 text-neutral-900 font-bold rounded-xl hover:bg-neutral-50 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      Make Payment
                    </button>

                    <button
                      onClick={() =>
                        router.push(`/events/${eventId}/negotiation`)
                      }
                      disabled={filteredData.total === 0}
                      className="w-full py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>Start Negotiation</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM8 8a1 1 0 11-2 0 1 1 0 012 0zm5 1a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4 text-center">
                    <Link
                      href={`/events/${eventId}/hotels`}
                      className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline"
                    >
                      or Continue Shopping
                    </Link>
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

interface CartItemRowProps {
  item: CartItemDetail;
  activeTab: Tab;
  onRemove: () => void;
  onUpdate: (qty: number) => void;
  onMoveToCart: () => void;
  hideImage?: boolean;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  activeTab,
  onRemove,
  onUpdate,
  onMoveToCart,
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
          "/placeholder-hotel.jpg"
        );
      case "transfer":
         return "/placeholder-transfer.jpg";
      default:
        return "/placeholder-item.jpg";
    }
  }, [item]);

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100 group relative">
      {/* Thumbnail - hide for rooms/hotels or if explicity hidden */}
      {!hideImage && item.type !== "hotel" && item.type !== "room" && (
        <img
          src={image}
          alt={name}
          className="w-16 h-16 rounded-lg object-cover bg-neutral-100" // Reduced size from w-20 h-20
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
          {/* Quantity Control */}
          <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => onUpdate(Math.max(1, item.quantity - 1))}
              className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-blue-600 transition-colors hover:bg-neutral-50 rounded"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-bold text-neutral-900">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdate(item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-blue-600 transition-colors hover:bg-neutral-50 rounded"
            >
              +
            </button>
          </div>

          {/* Status Badge */}
          <span
            className={`text-[10px] text-neutral-500 font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
              item.status === "cart" || item.status === "approved"
                ? "bg-green-50 text-green-600"
                : "bg-yellow-50 text-yellow-600"
            }`}
          >
            {item.status}
          </span>

          {/* Add to Cart Button (Wishlist only) */}
          {activeTab === "wishlist" && (
            <button
              onClick={onMoveToCart}
              className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1"
            >
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="text-neutral-400 hover:text-red-500 transition-colors absolute top-4 right-4 p-2 hover:bg-red-50 rounded-full"
        title="Remove item"
      >
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
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
};
