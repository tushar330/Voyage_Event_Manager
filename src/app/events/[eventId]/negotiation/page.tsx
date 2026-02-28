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
    history,
    syncItemsFromCart,
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Refresh state on mount to ensure we have latest from localStorage
  useEffect(() => {
    refreshState();
  }, []);

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

  useEffect(() => {
    if (shareToken) {
      setShareUrl(`${window.location.origin}/negotiation/${shareToken}`);
    }
  }, [shareToken]);

  const handleSendToHotel = async () => {
    if (status === "sent_to_tbo") return;
    setIsSubmitting(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      sendToHotel();
    } catch (error) {
      toast.error("Failed to send to hotel");
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
      // Persist the negotiated prices back to the genuine backend cart
      await Promise.all(
        items.map((item) =>
          updateCartItem(eventId, item.id, { locked_price: item.currentPrice })
        )
      );

      // Calculate total negotiated budget
      const negotiatedTotal = items.reduce(
        (sum, item) => sum + item.currentPrice * item.quantity,
        0
      );

      // Update the event's budgetSpent
      if (currentEvent) {
        await updateEvent(eventId, {
          ...currentEvent,
          budgetSpent: negotiatedTotal
        });
      }

      lockDeal();
      toast.success("Deal Locked!");
      router.push(`/events/${eventId}/cart`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to lock deal and update cart prices");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Share Link Card - Only show if initiated */}
            {shareUrl && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-blue-900">
                    Share with TBO Manager
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Send this link to the TBO Manager to start negotiating.
                  </p>
                </div>
                <div className="flex gap-2">
                  <code className="bg-white px-3 py-1.5 rounded border border-blue-200 text-xs text-blue-800 font-mono hidden sm:block">
                    {shareUrl}
                  </code>
                  <button
                    onClick={copyShareLink}
                    className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            )}

            {/* Negotiation Table */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-4 border-b border-neutral-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">
                  Items under Negotiation
                </h3>
                <button
                  onClick={handleSendToHotel}
                  disabled={
                    status === "sent_to_tbo" ||
                    status === "locked" ||
                    isSubmitting
                  }
                  className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {status === "sent_to_tbo"
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

            {/* Negotiation History */}
            {history?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900">
                    Negotiation History
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
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
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Actions */}
            <ActionPanel
              isAgent={true}
              onLockDeal={handleLockDeal}
              isSubmitting={isSubmitting}
              canLock={status === "countered_by_tbo"}
            />

            {/* Chat */}
            <ChatBox
              messages={messages}
              readOnly={false}
              onSendMessage={(msg) => sendMessage(msg, "Agent")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
