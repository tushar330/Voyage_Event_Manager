"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NegotiationTable } from "@/components/negotiation/NegotiationTable";
import { ChatBox } from "@/components/negotiation/ChatBox";
import { ActionPanel } from "@/components/negotiation/ActionPanel";
import { Toaster, toast } from "sonner";
import {
  NegotiationProvider,
  useNegotiation,
} from "@/context/NegotiationContext";

export default function HotelNegotiationPage() {
  const params = useParams();
  const token = params.token as string;
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    // Resolve token to eventId (In real app, backend does this on initial fetch)
    const storedEventId = localStorage.getItem(`token_map_${token}`);
    if (storedEventId) {
      setEventId(storedEventId);
    } else {
      toast.error("Invalid or expired negotiation link.");
    }
  }, [token]);

  if (!eventId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Loading Negotiation...
          </h2>
          <p className="text-gray-500 mt-2">Verifying secure link</p>
        </div>
      </div>
    );
  }

  return (
    <NegotiationProvider eventId={eventId}>
      <HotelNegotiationContent />
    </NegotiationProvider>
  );
}

function HotelNegotiationContent() {
  const {
    items,
    messages,
    status,
    history,
    eventDetails,
    updateItemPrice,
    updateItemMessage,
    submitCounterOffer,
    sendMessage,
    refreshState,
  } = useNegotiation();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refresh state on mount
  useEffect(() => {
    refreshState();
  }, []);

  const handleSubmitCounter = async () => {
    if (status === "locked") return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      submitCounterOffer();
    } catch (error) {
      toast.error("Failed to submit counter offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalOffer = items.reduce(
    (sum, item) => sum + item.currentPrice * item.quantity,
    0,
  );
  const targetTotal = items.reduce(
    (sum, item) =>
      sum + (item.targetPrice || item.originalPrice) * item.quantity,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" richColors />
      <div className="max-w-6xl mx-auto">
        {/* Event Header & Budget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {eventDetails?.name || "Corporate Event"}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {eventDetails?.date || "Date TBD"}
                </span>
                <span className="flex items-center gap-1">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {eventDetails?.location || "Location TBD"}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-right">
              <div className="mb-0">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Target Budget
                </span>
                <span className="text-xl font-bold text-gray-900">
                  ₹{eventDetails?.totalBudget?.toLocaleString() ?? "N/A"}
                </span>
              </div>
            </div>
          </div>

          <hr className="my-4 border-gray-100" />

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
              Budget Analysis
            </h3>

            {/* Visual Bar Chart */}
            <div className="space-y-4">
              {/* Target Budget Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Target Budget</span>
                  <span className="font-bold text-gray-900">
                    ₹{eventDetails?.totalBudget?.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gray-800 h-2.5 rounded-full"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>

              {/* Current Offer Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Current Offer Total</span>
                  <span
                    className={`font-bold ${totalOffer > (eventDetails?.totalBudget || 0) ? "text-red-600" : "text-green-600"}`}
                  >
                    ₹{totalOffer.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${totalOffer > (eventDetails?.totalBudget || 0) ? "bg-red-500" : "bg-green-500"}`}
                    style={{
                      width: `${Math.min((totalOffer / (eventDetails?.totalBudget || 1)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                {totalOffer > (eventDetails?.totalBudget || 0) && (
                  <p className="text-xs text-red-500 mt-1">
                    Exceeds budget by ₹
                    {(
                      totalOffer - (eventDetails?.totalBudget || 0)
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">
                  Proposal Details
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    status === "sent_to_hotel"
                      ? "bg-yellow-100 text-yellow-800"
                      : status === "locked"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {status === "sent_to_hotel"
                    ? "Action Required"
                    : status.replace(/_/g, " ")}
                </span>
              </div>
              <NegotiationTable
                items={items}
                isAgent={false}
                onPriceChange={(id, price) => updateItemPrice(id, price, false)}
                onMessageChange={(id, msg) => updateItemMessage(id, msg)}
              />
            </div>

            {/* Negotiation History */}
            {history?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="p-4 border-b border-neutral-200 bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-900">Negotiation History</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {(history || []).map((round) => (
                            <div key={round.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${round.author === 'Agent' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                            {round.author}
                                        </span>
                                        <span className="text-sm text-gray-500 ml-2">
                                            {new Date(round.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono text-gray-400">{round.id}</span>
                                </div>
                                <div className="text-sm text-gray-700">
                                    <p>Total: <span className="font-semibold">₹{round.items.reduce((sum, i) => sum + (round.author === 'Agent' ? (i.targetPrice || i.originalPrice) : i.currentPrice) * i.quantity, 0).toLocaleString()}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <ActionPanel
              isAgent={false}
              onSubmitCounter={handleSubmitCounter}
              isSubmitting={isSubmitting}
            />

            <ChatBox
              messages={messages}
              onSendMessage={(msg) => sendMessage(msg, "Hotel")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
