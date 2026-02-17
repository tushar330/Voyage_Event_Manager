"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "sonner";
import { flightApi } from "@/modules/flights/services/api";
import { Flight, FlightSearchParams } from "@/modules/flights/types";
import { FlightSearch } from "@/components/flights/FlightSearch";
import { FlightList } from "@/components/flights/FlightList";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

// Mock data for flights
const getMockFlights = (from: string, to: string): Flight[] => [
    {
        id: "mock-f1",
        flight_number: "AI-101",
        airline_name: "Air India",
        departure_code: from,
        arrival_code: to,
        departure_time: new Date().toISOString(),
        arrival_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        base_price: 5500,
        available_seats: 12
    },
    {
        id: "mock-f2",
        flight_number: "6E-543",
        airline_name: "IndiGo",
        departure_code: from,
        arrival_code: to,
        departure_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        arrival_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        base_price: 4200,
        available_seats: 8
    }
];


// Mock data for flights

export default function FlightsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { addToCart } = useCart();
  const { token } = useAuth();

  // Flight State
  const [flights, setFlights] = useState<Flight[]>([]);
  const [flightLoading, setFlightLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFlightSearch = async (searchParams: FlightSearchParams) => {
    setFlightLoading(true);
    setHasSearched(true);
    try {
      console.log("Searching flights with params:", searchParams);
      // Construct query string manually to verify
      const queryString = new URLSearchParams(searchParams as any).toString();
      console.log("Query string:", queryString);

      const data = await flightApi.searchFlights(searchParams, token || undefined);
      console.log("API Response Data:", data);
      
      const responseData = data as any;
      console.log("Data type:", typeof responseData);
      console.log("Is Array:", Array.isArray(responseData));

      let flightsData: Flight[] = [];

      if (Array.isArray(responseData)) {
        flightsData = responseData;
      } else if (responseData && Array.isArray(responseData.data)) {
        flightsData = responseData.data;
      } else if (responseData && Array.isArray(responseData.flights)) {
        flightsData = responseData.flights;
      }

      if (flightsData.length > 0) {
         setFlights(flightsData);
         toast.success(`Found ${flightsData.length} flights from API`);
      } else {
         console.warn("API returned empty flight data or invalid format, using mock data");
         // Log what we actually got to help debugging
         console.warn("Received data structure:", JSON.stringify(data, null, 2));
         
         const mockData = getMockFlights(searchParams.departure_code, searchParams.arrival_code);
         setFlights(mockData);
         toast.info("Showing mock flights (API returned no results)");
      }
    } catch (error) {
      console.error("Flight search failed:", error);
      // Fallback to mock
      const mockData = getMockFlights(searchParams.departure_code, searchParams.arrival_code);
      setFlights(mockData);
      toast.error("API failed. Showing mock flights.");
    } finally {
      setFlightLoading(false);
    }
  };

  const handleAddFlight = async (flightId: string, seats: number) => {
    await addToCart(eventId, {
      type: "flight",
      refId: flightId,
      quantity: seats,
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
                    <h1 className="text-3xl font-bold text-neutral-900">Flight Booking</h1>
                    <p className="text-neutral-500 mt-1">Search and book flights for your guests</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        href={`/events/${eventId}/transfers`}
                         className="px-4 py-2 text-sm font-bold text-neutral-600 hover:text-neutral-900 transition-colors"
                    >
                        Switch to Transfers
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
        <div className="max-w-4xl mx-auto">
            <FlightSearch onSearch={handleFlightSearch} loading={flightLoading} token={token || undefined} />
            
            {flightLoading ? (
                    <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
            ) : (
                hasSearched && <FlightList flights={flights} onAdd={handleAddFlight} />
            )}
        </div>
      </div>
    </div>
  );
}
