"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useEvents } from "@/context/EventContext";
import { HotelCartGroup, CartItemDetail } from "@/modules/cart/types";
import { toast } from "sonner";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

type Tab = "cart" | "wishlist";

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  eventId,
}) => {
  const { cart, loading, removeFromCart, updateCartItem, fetchCart } =
    useCart();
  const { updateEvent, refreshEvents } = useEvents();
  const [activeTab, setActiveTab] = useState<Tab>("cart");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Fetch cart when drawer opens
  React.useEffect(() => {
    if (isOpen && eventId) {
      fetchCart(eventId);
    }
  }, [isOpen, eventId, fetchCart]);

  const filteredData = useMemo(() => {
    if (!cart) return { hotels: [], flights: [], total: 0 };

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

    return { hotels, flights, total };
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
            total: r.quantity,
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

      toast.success("Event finalized successfully!");
      onClose();
    } catch (error) {
      console.error("Finalize error:", error);
      toast.error("Failed to finalize event.");
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleMakePayment = async () => {
    setIsPaying(true);
    try {
      // Persist the cart total as budgetSpent on the event
      await updateEvent(eventId, {
        budgetSpent: filteredData.total,
      } as any);
      await refreshEvents();
      toast.info("Payment gateway coming soon! Budget bar has been updated.");
      onClose();
    } catch (err) {
      toast.error("Failed to update budget data.");
    } finally {
      setIsPaying(false);
    }
  };
  const getStartingPrice = (group: HotelCartGroup) => {
    if (group.rooms && group.rooms.length > 0) {
      const prices = group.rooms.map((r) => r.locked_price);
      return Math.min(...prices);
    }
    return group.hotel_details?.price || 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">
                {activeTab === "cart" ? "Your Cart" : "Your Wishlist"}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                {activeTab === "cart"
                  ? "Review your event selections"
                  : "Items you saved for later"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-neutral-100 rounded-xl">
            <button
              onClick={() => setActiveTab("cart")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === "cart"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Cart
            </button>
            <button
              onClick={() => setActiveTab("wishlist")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === "wishlist"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Wishlist
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-50/50">
          {loading && !cart ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mb-4"
              />
              <span>Loading...</span>
            </div>
          ) : filteredData.hotels.length === 0 &&
            filteredData.flights.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-neutral-300"
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
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {activeTab === "cart"
                    ? "Your cart is empty"
                    : "Your wishlist is empty"}
                </h3>
                <p className="text-neutral-500 text-sm">
                  {activeTab === "cart"
                    ? "Start adding hotels and services."
                    : "Save items here to review later."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
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
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-neutral-900">
                        {group.hotel_details?.name || "Unknown Hotel"}
                      </h4>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-neutral-500">
                          {group.hotel_details?.location}
                        </p>
                        <p className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Starts from ₹
                          {getStartingPrice(group).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
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

              {/* Flights */}
              {filteredData.flights.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                  <div className="p-4 bg-neutral-50 border-b border-neutral-200">
                    <h4 className="font-bold text-neutral-900">Flights</h4>
                  </div>
                  <div className="p-4 space-y-4">
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
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === "cart" && (
          <div className="p-6 bg-white border-t border-neutral-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                  Total Amount
                </p>
                <p className="text-2xl font-black text-neutral-900 mt-1">
                  ₹{filteredData.total.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-neutral-400 bg-neutral-100 px-2 py-1 rounded-full inline-block font-bold">
                  INCL. ALL TAXES
                </p>
              </div>
            </div>

            <button
              onClick={handleFinalize}
              disabled={filteredData.total === 0 || isFinalizing}
              className="w-full py-3 bg-neutral-900 text-white font-bold rounded-xl shadow-md hover:bg-black transition-all disabled:opacity-50 disabled:grayscale active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
            >
              {isFinalizing ? (
                <span>Finalizing...</span>
              ) : (
                <>
                  <span>Finalize Selection</span>
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
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>

            <button
              onClick={handleMakePayment}
              disabled={filteredData.total === 0 || isPaying}
              className="w-full py-3 bg-white border border-neutral-200 text-neutral-900 font-bold rounded-xl hover:bg-neutral-50 transition-all disabled:opacity-50 active:scale-[0.98] text-sm"
            >
              {isPaying ? "Updating..." : "Make Payment"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

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
      default:
        return "Inventory Item";
    }
  }, [item]);

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100 group relative">
      {/* Image only for non-hotel/non-room items provided in hideImage is false */}
      {!hideImage && item.type !== "hotel" && item.type !== "room" && (
        <div className="w-16 h-16 bg-neutral-200 rounded-lg flex-shrink-0 overflow-hidden">
          {/* Placeholder or real image if available in details */}
          <img
            src="/placeholder-item.jpg"
            className="w-full h-full object-cover"
            alt={name}
          />
        </div>
      )}

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h6 className="font-bold text-neutral-800 text-sm leading-tight">
            {name}
          </h6>
          {item.type !== "hotel" && (
            <span className="font-black text-neutral-900 text-sm italic">
              ₹{(item.locked_price * item.quantity).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center flex-wrap gap-3 mt-3">
          {/* Quantity Control */}
          <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => onUpdate(Math.max(1, item.quantity - 1))}
              className="px-2 py-0.5 text-neutral-500 hover:text-blue-600 transition-colors"
            >
              -
            </button>
            <span className="w-6 text-center text-xs font-black text-neutral-700">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdate(item.quantity + 1)}
              className="px-2 py-0.5 text-neutral-500 hover:text-blue-600 transition-colors"
            >
              +
            </button>
          </div>

          {/* Status Badge */}
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border shadow-sm ${
              item.status === "cart" || item.status === "approved"
                ? "bg-green-50 text-green-600 border-green-100"
                : "bg-yellow-50 text-yellow-600 border-yellow-100"
            }`}
          >
            {item.status}
          </span>

          {/* Add to Cart Button (Wishlist only) */}
          {activeTab === "wishlist" && (
            <button
              onClick={onMoveToCart}
              className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1"
            >
              <span>Add to Cart</span>
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Remove Button - Always visible slightly, fully on hover */}
      <button
        onClick={onRemove}
        className="text-neutral-400 hover:text-red-500 transition-colors absolute top-2 right-2 p-1.5 hover:bg-red-50 rounded-full bg-white/50 hover:bg-white border border-transparent hover:border-red-100 shadow-sm"
        title="Remove item"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};
