"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { NegotiationTable } from "@/components/negotiation/NegotiationTable";
import { ChatBox } from "@/components/negotiation/ChatBox";
import { ActionPanel } from "@/components/negotiation/ActionPanel";
import { Toaster, toast } from "sonner";
import ProtectedRoute from "@/components/legacy/auth/ProtectedRoute";
import { UserRole } from "@/context/AuthContext";
import {
  NegotiationProvider,
  useNegotiation,
} from "@/context/NegotiationContext";
import Link from "next/link";

export default function TboNegotiationPage() {
  const params = useParams();
  const token = params.token as string;

  return (
    <ProtectedRoute requiredRole={UserRole.TBO_AGENT}>
      <NegotiationProvider>
        <TboNegotiationContent token={token} />
      </NegotiationProvider>
    </ProtectedRoute>
  );
}

function TboNegotiationContent({ token }: { token: string }) {
  const router = useRouter();
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
    loadSessionByToken,
  } = useNegotiation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load session from backend on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadSessionByToken(token);
      setLoading(false);
    };
    load();
  }, [token]);

  const handleSubmitCounter = async () => {
    if (status === "waiting_for_agent" || status === "locked") return;
    setIsSubmitting(true);
    try {
      await submitCounterOffer();
      toast.success("Proposal sent back to Booking Agent!");
      setTimeout(() => router.push("/tbo-admin"), 1500);
    } catch (error) {
      toast.error("Failed to submit counter offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900">
            Loading Negotiation...
          </h2>
          <p className="text-gray-500 mt-2">Fetching session from server</p>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Session Not Found
          </h2>
          <p className="text-gray-500 mt-2">This negotiation link may be invalid or expired.</p>
          <Link href="/tbo-admin" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" richColors />
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
            <Link href="/tbo-admin" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                <span>&larr;</span> Back to Dashboard
            </Link>
        </div>

        {/* Event Header & Budget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 border-t-4 border-t-yellow-400">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {eventDetails?.name || "Corporate Event"}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {eventDetails?.date || "Date TBD"}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {eventDetails?.location || "Location TBD"}
                </span>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-right border border-yellow-100">
              <div className="mb-0">
                <span className="text-xs font-bold text-yellow-800 uppercase tracking-wider block">
                  Agent's Target Budget
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
              Profit Margin Analysis
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Booking Agent's Desired Total</span>
                  <span className="font-bold text-red-600">
                    ₹{targetTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Your Current Offer Total (to Agent)</span>
                  <span className="font-bold text-green-600 text-lg">
                    ₹{totalOffer.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{
                      width: `${Math.min((targetTotal / Math.max(totalOffer, 1)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                {totalOffer > targetTotal && (
                  <p className="text-xs text-green-700 mt-2 font-medium">
                    +₹{(totalOffer - targetTotal).toLocaleString()} above Agent's target
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Negotiation Table — Full Width */}
        <div className="space-y-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">
                  Negotiate with Booking Agent
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    status === "waiting_for_tbo_agent"
                      ? "bg-yellow-100 text-yellow-800"
                      : status === "locked"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {status === "waiting_for_tbo_agent" ? "Needs Review" : status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="p-4 bg-yellow-50/50 border-b border-yellow-100 text-sm text-yellow-800">
                  <strong>Instruction:</strong> Adjust "Your Offer" column to add TBO's profit margin before sending back to the Booking Agent.
              </div>
              <NegotiationTable
                items={items}
                isAgent={false} 
                onPriceChange={(id, price) => updateItemPrice(id, price, false)}
                onMessageChange={(id, msg) => updateItemMessage(id, msg)}
              />
            </div>
        </div>

        {/* Below Table: History (left) | Action + Chat (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left: History */}
          <div>
            {history?.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden h-full">
                <div className="p-4 border-b border-neutral-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900">History</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {(history || []).map((round) => (
                    <div key={round.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${round.author === 'Agent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {round.author === 'TBO Manager' ? 'TBO Manager' : 'Booking Agent'}
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
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center h-full flex items-center justify-center">
                <p className="text-gray-400 text-sm">No negotiation history yet</p>
              </div>
            )}
          </div>

          {/* Right: Action + Chat stacked */}
          <div className="space-y-6">
            <ActionPanel
              isAgent={false}
              onSubmitCounter={handleSubmitCounter}
              isSubmitting={isSubmitting}
            />

            <ChatBox
              messages={messages}
              onSendMessage={(msg) => sendMessage(msg, "TBO Manager")} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
