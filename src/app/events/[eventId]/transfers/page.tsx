"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Toaster, toast } from "sonner";
import { transferApi } from "@/modules/transfers/services/api";
import { Transfer } from "@/modules/transfers/types";
import { TransferList } from "@/components/transfers/TransferList";
import { useCart } from "@/context/CartContext";

export default function TransfersPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { addToCart } = useCart();
  const { token, isLoading, isAuthenticated } = useAuth();

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransfers = async () => {
      setLoading(true);
      try {
        const data = await transferApi.getTransfers(undefined, token || undefined);
        if (Array.isArray(data)) {
            setTransfers(data);
        } else {
            console.error("Transfers data is not an array:", data);
            setTransfers([]);
            toast.error("Received invalid data from server");
        }
      } catch (error) {
        console.error("Failed to load transfers", error);
        toast.error("Failed to load transfer options");
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading && isAuthenticated) {
        loadTransfers();
    } else if (!isLoading && !isAuthenticated) {
        setLoading(false);
    }
  }, [isLoading, isAuthenticated, token]);

  const handleAddTransfer = async (transferId: string, quantity: number) => {
    // Check if it's a mock item
    const isMock = transferId.startsWith('mock-');
    if (isMock) {
        // For mock items, we might need a specific handling if the backend expects real UUIDs.
        // But for now let's try sending it.
        // If the backend validation fails, we might just simulate adding it to cart logic client-side
        // but given the context contains api calls, we proceed with standard flow.
    }

    await addToCart(eventId, {
      type: "transfer",
      refId: transferId,
      quantity: quantity,
      status: "cart", // Direct booking as per guide
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Transfer Services</h1>
                    <p className="text-neutral-500 mt-1">Book cabs and buses for your guests</p>
                </div>
                <div className="flex items-center gap-4">
                   <Link
                        href={`/events/${eventId}/flights`}
                        className="px-4 py-2 text-sm font-bold text-neutral-600 hover:text-neutral-900 transition-colors"
                    >
                        Switch to Flights
                    </Link>
                     <Link
                        href={`/events/${eventId}/cart`}
                        className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 font-bold rounded-xl hover:bg-neutral-50 transition-colors shadow-sm"
                    >
                        View Cart
                    </Link>
                    <Link
                        href={`/events/${eventId}`}
                        className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors shadow-lg"
                    >
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="max-w-6xl mx-auto">
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-64 bg-neutral-200 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <TransferList transfers={transfers} onAdd={handleAddTransfer} />
            )}
         </div>
      </div>
    </div>
  );
}
