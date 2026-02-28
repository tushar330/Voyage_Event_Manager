"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { NegotiationTable } from "@/components/negotiation/NegotiationTable";
import { ChatBox } from "@/components/negotiation/ChatBox";
import { ActionPanel } from "@/components/negotiation/ActionPanel";
import { NegotiationItem } from "@/types/negotiation";
import { Toaster, toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useEvents } from "@/context/EventContext";
import { useAuth } from "@/context/AuthContext";
import {
  NegotiationProvider,
  useNegotiation,
} from "@/context/NegotiationContext";

export default function AgentNegotiationPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <NegotiationProvider eventId={eventId}>
      <AgentNegotiationContent eventId={eventId} />
    </NegotiationProvider>
  );
}

function AgentNegotiationContent({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { cart, loading: cartLoading, fetchCart, updateCartItem } = useCart();
  const {
    items,
    messages,
    status,
    expiry,
    shareToken,
    sessionId,
    history,
    syncItemsFromCart,
    initNegotiation,
    updateItemPrice,
    updateItemMessage,
    sendMessage,
    sendToHotel,
    lockDeal,
    refreshState,
    updateEventDetails,
  } = useNegotiation();

  /* New Hook usage */
  const { events, updateEvent } = useEvents();
  const currentEvent = events.find((e) => e.id === eventId);
  /* New Hook usage End */

  // Add Auth Hook to wait for token
  const { isLoading: authLoading, token: authToken } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refresh state on mount, but wait for auth token first
  useEffect(() => {
    if (!authLoading && authToken) {
      refreshState();
    }
  }, [authLoading, authToken, refreshState]);

  // Poll for updates every 30 seconds when session is active

  useEffect(() => {
    if (!shareToken) return;
    const interval = setInterval(() => {
      refreshState();
    }, 30000);
    return () => clearInterval(interval);
  }, [shareToken]);

  // Always force-refresh cart when navigating to negotiation page
  useEffect(() => {
    if (eventId) {
      fetchCart(eventId);
    }
  }, [eventId]);

  // Always sync negotiation items from cart whenever cart changes
  useEffect(() => {
    if (!cart || cartLoading) return;

    const freshItems: any[] = [];
    let calculatedTotalBudget = 0;

    cart.hotels.forEach((group) => {
      group.rooms.forEach((room) => {
        if (room.status === "cart" || room.status === "approved") {
          const price = room.locked_price || 0;
          calculatedTotalBudget += price * room.quantity;
          freshItems.push({
            id: room.id,
            name: room.room_details?.name || "Room",
            type: "room",
            originalPrice: price,
            currentPrice: price,
            targetPrice: price,
            quantity: room.quantity,
            status: "pending",
          });
        }
      });

      group.banquets.forEach((banquet) => {
        if (banquet.status === "cart" || banquet.status === "approved") {
          const price = banquet.locked_price || 0;
          calculatedTotalBudget += price * banquet.quantity;
          freshItems.push({
            id: banquet.id,
            name: banquet.banquet_details?.name || "Banquet",
            type: "banquet",
            originalPrice: price,
            currentPrice: price,
            targetPrice: price,
            quantity: banquet.quantity,
            status: "pending",
          });
        }
      });

      group.catering.forEach((cat) => {
        if (cat.status === "cart" || cat.status === "approved") {
          const price = cat.locked_price || 0;
          calculatedTotalBudget += price * cat.quantity;
          freshItems.push({
            id: cat.id,
            name: cat.catering_details?.name || "Catering",
            type: "catering",
            originalPrice: price,
            currentPrice: price,
            targetPrice: price,
            quantity: cat.quantity,
            status: "pending",
          });
        }
      });
    });

    syncItemsFromCart(freshItems, {
      name: currentEvent?.name || "Event Name",
      date: currentEvent?.startDate
        ? new Date(currentEvent.startDate).toLocaleDateString()
        : "Date TBD",
      location: currentEvent?.location || "Location TBD",
      totalBudget: calculatedTotalBudget,
    });
  }, [cart, cartLoading, currentEvent, syncItemsFromCart]);

  // Start negotiation (Agent clicks "Start Negotiation")
  const handleStartNegotiation = async () => {
    if (!items.length) {
      toast.error("No items to negotiate");
      return;
    }
    setIsSubmitting(true);
    try {
      const eventDetails = {
        name: currentEvent?.name || "Event",
        date: currentEvent?.startDate
          ? new Date(currentEvent.startDate).toLocaleDateString()
          : "TBD",
        location: currentEvent?.location || "TBD",
        totalBudget: items.reduce((s, i) => s + (i.targetPrice || i.originalPrice) * i.quantity, 0),
      };
      await initNegotiation(items, eventDetails);
    } catch {
      toast.error("Failed to start negotiation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendToHotel = async () => {
    if (status === "waiting_for_tbo_agent") return;
    setIsSubmitting(true);
    try {
      await sendToHotel();
    } catch (error) {
      toast.error("Failed to send to TBO Manager");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLockDeal = async () => {
    if (
      !confirm(
        "Are you sure you want to accept the current offers and lock the deal?",
      )
    )
      return;

    setIsSubmitting(true);
    try {
      // lockDeal now calls backend which updates cart items and locks session
      await lockDeal();

      router.push(`/events/${eventId}/cart`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to lock deal");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartLoading && items.length === 0) {
    return (
      <div className="p-8 text-center">Loading negotiation details...</div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" richColors />
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              Negotiation Dashboard
            </h1>
            <p className="text-neutral-500 mt-1">
              Status:{" "}
              <span className="font-semibold uppercase text-blue-600">
                {status.replace(/_/g, " ")}
              </span>
            </p>
          </div>
          <Link
            href={`/events/${eventId}/cart`}
            className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
          >
            ← Back to Cart
          </Link>
        </header>

        {/* Expiry Warning */}
        {expiry && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Offer expires on{" "}
                  <span className="font-bold">
                    {new Date(expiry).toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Negotiation Table Full Width */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-8">
          <div className="p-4 border-b border-neutral-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">
              Items under Negotiation
            </h3>
            <button
              onClick={sessionId ? handleSendToHotel : handleStartNegotiation}
              disabled={
                status === "waiting_for_tbo_agent" ||
                status === "locked" ||
                isSubmitting ||
                items.length === 0
              }
              className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting
                ? "Sending..."
                : !sessionId
                ? "🚀 Start Negotiation"
                : status === "waiting_for_tbo_agent"
                ? "Sent to TBO"
                : "Send to TBO"}
            </button>
          </div>
          <NegotiationTable
            items={items}
            isAgent={true}
            onPriceChange={(id, price) => updateItemPrice(id, price, true)}
            onMessageChange={(id, msg) => updateItemMessage(id, msg)}
          />
        </div>

        {/* Bottom Section: History (Left) | Actions & Chat (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Negotiation History */}
          <div className="space-y-6">
            {history?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900">
                    Negotiation History
                  </h3>
                </div>
                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {(history || []).map((round) => (
                    <div
                      key={round.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${round.author === "Agent" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}
                          >
                            {round.author === "TBO Manager" ? "TBO Manager" : round.author}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {new Date(round.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-gray-400">
                          {round.id}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        <p>
                          Total:{" "}
                          <span className="font-semibold">
                            ₹
                            {round.items
                              .reduce(
                                (sum, i) =>
                                  sum +
                                  (round.author === "Agent"
                                    ? i.targetPrice || i.originalPrice
                                    : i.currentPrice) *
                                    i.quantity,
                                0,
                              )
                              .toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* If no history, show placeholder or nothing */}
            {(!history || history.length === 0) && (
               <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center text-gray-500 italic">
                 Negotiation history will appear here once started.
               </div>
            )}
          </div>

          {/* Right Column: Actions and Chat */}
          <div className="space-y-6 flex flex-col h-full">
            <ActionPanel
              isAgent={true}
              onLockDeal={handleLockDeal}
              isSubmitting={isSubmitting}
              canLock={status === "countered_by_tbo" || status === "waiting_for_agent"}
            />

            <div className="flex-1 min-h-[400px]">
              <ChatBox
                messages={messages}
                readOnly={false}
                onSendMessage={(msg) => sendMessage(msg, "Agent")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
