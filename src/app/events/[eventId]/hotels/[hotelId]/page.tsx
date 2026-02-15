"use client";
import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { hotelApi } from "@/modules/hotels/services/api";
import { Hotel, RoomType, Banquet, Catering } from "@/modules/hotels/types";
import { motion, AnimatePresence } from "framer-motion";

const TIME_SLOTS = [
  "Morning (9 AM - 1 PM)",
  "Afternoon (2 PM - 6 PM)",
  "Evening (6 PM - 10 PM)",
  "Full Day (9 AM - 10 PM)",
];

import { useAuth } from "@/context/AuthContext";
import { useEvents } from "@/context/EventContext";

export default function HotelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { updateEvent } = useEvents();
  const hotelId = params.hotelId as string;
  const eventId = params.eventId as string;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [banquets, setBanquets] = useState<Banquet[]>([]);
  const [catering, setCatering] = useState<Catering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // requirements state (default zero, will load from storage)
  const [requirements, setRequirements] = useState({
    single: 0,
    double: 0,
    triple: 0,
    quad: 0,
  });

  useEffect(() => {
    const savedDemand = localStorage.getItem(`demand_${eventId}`);
    if (savedDemand) {
      setRequirements(JSON.parse(savedDemand));
    } else {
      setRequirements({ single: 5, double: 10, triple: 2, quad: 0 });
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Pass token to all API calls
        const [roomsRes, banquetsRes, cateringRes] = await Promise.all([
          hotelApi.getRooms(hotelId, token || undefined),
          hotelApi.getBanquets(hotelId, token || undefined),
          hotelApi.getCatering(hotelId, token || undefined),
        ]);

        setRooms(roomsRes);
        setBanquets(banquetsRes);
        setCatering(cateringRes);

        const cityId = localStorage.getItem(`last_city_id_${eventId}`) || "";
        const allHotels = await hotelApi.getHotelsByCity(
          cityId,
          token || undefined,
        );
        const currentHotel = allHotels.find((h) => h.id === hotelId);
        if (currentHotel) setHotel(currentHotel);
      } catch (err: any) {
        console.error("Error fetching hotel details:", err);
        setError("Failed to load hotel details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hotelId, eventId, token]);

  // wrapper for compatible access
  const REQUIREMENTS = requirements;

  // State for selected rooms: { [roomId]: quantity }
  const [selectedRooms, setSelectedRooms] = useState<Record<string, number>>(
    {},
  );

  // State for banquet and catering
  const [attendeeCount, setAttendeeCount] = useState(100);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedBanquetHall, setSelectedBanquetHall] = useState<number | null>(
    null,
  );
  const [selectedMealPlan, setSelectedMealPlan] = useState<number | null>(null);
  const [eventDate, setEventDate] = useState<string>("");
  const [eventTime, setEventTime] = useState<string>("");

  // Categorized Rooms
  const categorizedRooms = useMemo(() => {
    return {
      single: rooms.filter((r) => r.capacity === 1),
      double: rooms.filter((r) => r.capacity === 2),
      triple: rooms.filter((r) => r.capacity >= 3),
    };
  }, [rooms]);

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500">
        {error || "Hotel not found."}
      </div>
    );
  }

  // --- Helpers ---

  const handleUpdateRoom = (roomId: string, change: number) => {
    setSelectedRooms((prev) => {
      const current = prev[roomId] || 0;
      const next = Math.max(0, current + change);
      return { ...prev, [roomId]: next };
    });
  };

  const getSubtotal = () => {
    let total = 0;
    rooms.forEach((room) => {
      const qty = selectedRooms[room.id] || 0;
      total += qty * room.price;
    });
    return total;
  };

  const getCategoryCount = (categoryRooms: RoomType[]) => {
    return categoryRooms.reduce(
      (sum, room) => sum + (selectedRooms[room.id] || 0),
      0,
    );
  };

  const getBanquetCost = () => {
    if (!selectedBanquetHall) return 0;
    const hall = banquets.find((h: Banquet) => h.id === selectedBanquetHall);
    return hall ? hall.pricePerSlot : 0;
  };

  const getCateringCost = () => {
    if (!selectedMealPlan) return 0;
    const plan = catering.find((p: Catering) => p.id === selectedMealPlan);
    return plan ? (plan.pricePerPerson || 0) * attendeeCount : 0;
  };

  const calculateTaxes = (amount: number) => amount * 0.18; // 18% Tax

  const roomsSubtotal = getSubtotal();
  const banquetCost = getBanquetCost();
  const cateringCost = getCateringCost();
  const subtotal = roomsSubtotal + banquetCost + cateringCost;
  const taxes = calculateTaxes(subtotal);
  const totalAmount = subtotal + taxes;

  const handleSaveMapping = async () => {
    if (!hotel) return;

    // Transform selectedRooms to roomsInventory payload
    const roomsInventoryPayload = Object.entries(selectedRooms)
      .filter(([_, qty]) => qty > 0)
      .map(([roomId, qty]) => {
        const room = rooms.find((r) => r.id === roomId);
        return {
          room_offer_id: roomId,
          room_name: room?.name || "Unknown Room",
          available: qty,
          max_capacity: room?.capacity || 0,
          price_per_room: room?.price || 0,
        };
      });

    const mappingData = {
      hotelId: hotel.id,
      hotelName: hotel.name,
      selectedRooms,
      totalAmount,
      timestamp: new Date().toISOString(),
    };

    try {
      // Send update request to backend
      await updateEvent(eventId, {
        roomsInventory: roomsInventoryPayload,
      });

      // Also save to local storage for backward compatibility / backup
      localStorage.setItem(`mapping_${eventId}`, JSON.stringify(mappingData));

      console.log("Saving Mapping:", mappingData);
      router.push(`/events/${eventId}/room-mapping`);
    } catch (err) {
      console.error("Failed to save mapping:", err);
      // Optional: Show error to user
    }
  };

  // --- UI Components ---
  const RoomCounter = ({ room }: { room: RoomType }) => {
    const count = selectedRooms[room.id] || 0;
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleUpdateRoom(room.id, -1)}
          disabled={count === 0}
          className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${count === 0 ? "border-neutral-200 text-neutral-300 cursor-not-allowed" : "border-neutral-300 text-neutral-600 hover:bg-neutral-100 hover:border-neutral-400"}`}
        >
          -
        </button>
        <span className="w-6 text-center font-medium text-neutral-900">
          {count}
        </span>
        <button
          onClick={() => handleUpdateRoom(room.id, 1)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-100 hover:border-neutral-400 transition-colors"
        >
          +
        </button>
      </div>
    );
  };

  const RoomRow = ({ room }: { room: RoomType }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
      <div className="mb-3 sm:mb-0">
        <h5 className="font-semibold text-neutral-800">{room.name}</h5>
        <div className="flex items-center gap-2 text-sm text-neutral-500 mt-1">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Max {room.capacity}
          </span>
          {/* Add more details if available in RoomOffer */}
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-6">
        <div className="text-right">
          <span className="block font-bold text-neutral-900">
            ₹{room.price.toLocaleString()}
          </span>
        </div>
        <RoomCounter room={room} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header / Breadcrumb */}
      <div className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Link
              href={`/events/${eventId}/hotels`}
              className="hover:text-blue-600"
            >
              Hotels
            </Link>
            <span>/</span>
            <span className="font-medium text-neutral-900">
              {hotel?.name || "Hotel Details"}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"
          />
          <p className="text-neutral-500 font-medium">
            Loading inventory and details...
          </p>
        </div>
      ) : error ? (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-neutral-500">{error}</p>
          <Link
            href={`/events/${eventId}/hotels`}
            className="mt-4 inline-block text-blue-600 font-medium hover:underline"
          >
            Back to Hotels
          </Link>
        </div>
      ) : !hotel ? (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            Hotel not found
          </h2>
          <Link
            href={`/events/${eventId}/hotels`}
            className="mt-4 inline-block text-blue-600 font-medium hover:underline"
          >
            Back to Hotels
          </Link>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: Hotel Details & Rooms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Hotel Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="h-64 relative bg-neutral-200">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                    <h1 className="text-3xl font-bold">{hotel.name}</h1>
                    <p className="flex items-center gap-1 text-white/90 mt-1">
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
                      {hotel.location}
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex gap-4 mb-6 text-sm">
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-medium">
                      {hotel.type}
                    </div>
                    <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-lg font-medium flex items-center gap-1">
                      <span>{hotel.stars} ★</span>
                      <span>({hotel.rating}/10)</span>
                    </div>
                  </div>
                  <p className="text-neutral-600 leading-relaxed mb-6">
                    {hotel.description}
                  </p>
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-3">
                      Amenities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities.map((a) => (
                        <span
                          key={a}
                          className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Room Selection */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-neutral-900">
                    Select Rooms
                  </h2>
                  <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                    Event Needs: {REQUIREMENTS.single} Single,{" "}
                    {REQUIREMENTS.double} Double
                  </span>
                </div>

                {/* Single Rooms */}
                {categorizedRooms.single.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 font-semibold text-neutral-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                        Single Rooms
                      </div>
                      {(() => {
                        const count = getCategoryCount(categorizedRooms.single);
                        const needed = REQUIREMENTS.single;
                        const remaining = Math.max(0, needed - count);
                        const isMet = count >= needed;

                        return (
                          <span
                            className={`text-sm font-medium ${isMet ? "text-green-600" : "text-orange-600"}`}
                          >
                            {remaining}{" "}
                            {remaining === 1 ? "single room" : "single rooms"}{" "}
                            required
                            {isMet && (
                              <span className="ml-1 text-green-600">✓</span>
                            )}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {categorizedRooms.single.map((room) => (
                        <RoomRow key={room.id} room={room} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Double Rooms */}
                {categorizedRooms.double.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 font-semibold text-neutral-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                        Double Rooms
                      </div>
                      {(() => {
                        const count = getCategoryCount(categorizedRooms.double);
                        const needed = REQUIREMENTS.double;
                        const remaining = Math.max(0, needed - count);
                        const isMet = count >= needed;

                        return (
                          <span
                            className={`text-sm font-medium ${isMet ? "text-green-600" : "text-orange-600"}`}
                          >
                            {remaining}{" "}
                            {remaining === 1 ? "double room" : "double rooms"}{" "}
                            required
                            {isMet && (
                              <span className="ml-1 text-green-600">✓</span>
                            )}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {categorizedRooms.double.map((room) => (
                        <RoomRow key={room.id} room={room} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Triple Rooms */}
                {categorizedRooms.triple.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 font-semibold text-neutral-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                        Triple Rooms
                      </div>
                      {(() => {
                        const count = getCategoryCount(categorizedRooms.triple);
                        const needed = REQUIREMENTS.triple;
                        const remaining = Math.max(0, needed - count);
                        const isMet = count >= needed;

                        return (
                          <span
                            className={`text-sm font-medium ${isMet ? "text-green-600" : "text-neutral-500"}`}
                          >
                            {remaining}{" "}
                            {remaining === 1 ? "triple room" : "triple rooms"}{" "}
                            required
                            {isMet && (
                              <span className="ml-1 text-green-600">✓</span>
                            )}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {categorizedRooms.triple.map((room) => (
                        <RoomRow key={room.id} room={room} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Banquet Hall Selection */}
              <div className="space-y-6 mt-8">
                <h2 className="text-xl font-bold text-neutral-900">
                  Banquet Hall Selection
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Shared Controls */}
                  <div className="lg:col-span-1 space-y-4">
                    {/* Attendee Count */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                      <h3 className="font-semibold text-neutral-900 mb-4">
                        Number of Attendees
                      </h3>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() =>
                            setAttendeeCount(Math.max(0, attendeeCount - 10))
                          }
                          className="w-10 h-10 flex items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-100 hover:border-neutral-400 transition-colors"
                        >
                          -
                        </button>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-neutral-900">
                            {attendeeCount}
                          </div>
                          <div className="text-sm text-neutral-500">people</div>
                        </div>
                        <button
                          onClick={() => setAttendeeCount(attendeeCount + 10)}
                          className="w-10 h-10 flex items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-100 hover:border-neutral-400 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-neutral-500 mt-3 text-center">
                        Adjust in increments of 10
                      </p>
                    </div>

                    {/* Time Slot Selection */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                      <h3 className="font-semibold text-neutral-900 mb-4">
                        Event Date & Duration
                      </h3>

                      {/* Date Picker */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Event Date
                        </label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>

                      {/* Duration/Slot Selection */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Duration
                        </label>
                        <div className="space-y-2">
                          {TIME_SLOTS.map((slot) => (
                            <label
                              key={slot}
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                                selectedTimeSlot === slot
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="timeSlot"
                                checked={selectedTimeSlot === slot}
                                onChange={() => setSelectedTimeSlot(slot)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span
                                className={`text-sm ${selectedTimeSlot === slot ? "font-medium text-blue-900" : "text-neutral-700"}`}
                              >
                                {slot}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Hall Types */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                      <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 font-semibold text-neutral-700">
                        Available Banquet Halls
                      </div>
                      <div className="p-6 space-y-4">
                        {banquets.map((hall: Banquet) => (
                          <label
                            key={hall.id}
                            className={`block p-4 border rounded-xl cursor-pointer transition-all ${
                              selectedBanquetHall === hall.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <input
                                  type="radio"
                                  name="banquetHall"
                                  checked={selectedBanquetHall === hall.id}
                                  onChange={() =>
                                    setSelectedBanquetHall(hall.id)
                                  }
                                  className="mt-1 w-4 h-4 text-blue-600"
                                />
                                <div className="flex-1">
                                  <h4
                                    className={`font-semibold ${selectedBanquetHall === hall.id ? "text-blue-900" : "text-neutral-900"}`}
                                  >
                                    {hall.name}
                                  </h4>
                                  <p className="text-sm text-neutral-600 mt-1">
                                    Capacity: Up to {hall.capacity} people
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {hall.facilities.map((facility: string) => (
                                      <span
                                        key={facility}
                                        className={`px-2 py-1 rounded-full text-xs ${
                                          selectedBanquetHall === hall.id
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-neutral-100 text-neutral-600"
                                        }`}
                                      >
                                        {facility}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div
                                  className={`font-bold text-lg ${selectedBanquetHall === hall.id ? "text-blue-600" : "text-neutral-900"}`}
                                >
                                  ₹{(hall.pricePerSlot || 0).toLocaleString()}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  per slot
                                </div>
                              </div>
                            </div>
                          </label>
                        ))}
                        {attendeeCount > 0 && selectedBanquetHall && (
                          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
                              <strong>Note:</strong> Selected hall capacity
                              should accommodate {attendeeCount} attendees.
                              {(() => {
                                const hall = banquets.find(
                                  (h: Banquet) => h.id === selectedBanquetHall,
                                );
                                if (hall && attendeeCount > hall.capacity) {
                                  return (
                                    <span className="block mt-1 text-amber-900 font-medium">
                                      ⚠️ Attendee count exceeds hall capacity!
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Catering F&B Section */}
              <div className="space-y-6 mt-8">
                <h2 className="text-xl font-bold text-neutral-900">
                  Catering & F&B
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Display Shared Info */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                      <h3 className="font-semibold text-neutral-900 mb-4">
                        Event Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-neutral-500">
                            Attendees
                          </div>
                          <div className="text-2xl font-bold text-neutral-900">
                            {attendeeCount}
                          </div>
                        </div>
                        <div className="border-t border-neutral-200 pt-3">
                          <div className="text-sm text-neutral-500 mb-2">
                            Event Date
                          </div>
                          <div
                            className={`text-sm font-medium ${eventDate ? "text-neutral-900" : "text-neutral-400"}`}
                          >
                            {eventDate
                              ? new Date(eventDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )
                              : "Not selected"}
                          </div>
                        </div>
                        <div className="border-t border-neutral-200 pt-3">
                          <div className="text-sm text-neutral-500 mb-2">
                            Duration
                          </div>
                          <div
                            className={`text-sm font-medium ${selectedTimeSlot ? "text-neutral-900" : "text-neutral-400"}`}
                          >
                            {selectedTimeSlot || "Not selected"}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-4 italic">
                        Same as banquet configuration
                      </p>
                    </div>
                  </div>

                  {/* Right: Meal Plans */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                      <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 font-semibold text-neutral-700">
                        Select Meal Plan
                      </div>
                      <div className="p-6 space-y-4">
                        {catering.map((plan: Catering) => (
                          <label
                            key={plan.id}
                            className={`block p-4 border rounded-xl cursor-pointer transition-all ${
                              selectedMealPlan === plan.id
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <input
                                  type="radio"
                                  name="mealPlan"
                                  checked={selectedMealPlan === plan.id}
                                  onChange={() => setSelectedMealPlan(plan.id)}
                                  className="mt-1 w-4 h-4 text-emerald-600"
                                />
                                <div className="flex-1">
                                  <h4
                                    className={`font-semibold ${selectedMealPlan === plan.id ? "text-emerald-900" : "text-neutral-900"}`}
                                  >
                                    {plan.name}
                                  </h4>
                                  <p className="text-sm text-neutral-600 mt-1">
                                    {plan.description}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {plan.menuHighlights.map((item: string) => (
                                      <span
                                        key={item}
                                        className={`px-2 py-1 rounded-full text-xs ${
                                          selectedMealPlan === plan.id
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-neutral-100 text-neutral-600"
                                        }`}
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div
                                  className={`font-bold text-lg ${selectedMealPlan === plan.id ? "text-emerald-600" : "text-neutral-900"}`}
                                >
                                  ₹{(plan.pricePerPerson || 0).toLocaleString()}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  per person
                                </div>
                                {selectedMealPlan === plan.id &&
                                  attendeeCount > 0 && (
                                    <div className="text-sm font-medium text-emerald-700 mt-1">
                                      Total: ₹
                                      {(
                                        (plan.pricePerPerson || 0) *
                                        attendeeCount
                                      ).toLocaleString()}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Booking Summary (Sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-100 overflow-hidden">
                <div className="bg-neutral-900 text-white p-5">
                  <h3 className="font-bold text-lg">Booking Summary</h3>
                  <p className="text-white/70 text-sm mt-1">{hotel.name}</p>
                </div>

                <div className="p-5">
                  {/* Selected Items List */}
                  <div className="space-y-3 mb-6 min-h-[100px]">
                    {Object.keys(selectedRooms).length === 0 &&
                    !selectedBanquetHall &&
                    !selectedMealPlan ? (
                      <p className="text-neutral-400 text-center py-4 italic text-sm">
                        No items selected yet.
                      </p>
                    ) : (
                      <>
                        {/* Rooms */}
                        {Object.entries(selectedRooms).map(([id, qty]) => {
                          const room = rooms.find((r) => r.id === id);
                          if (!room || qty === 0) return null;
                          return (
                            <div
                              key={id}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-neutral-600">
                                {room.name}{" "}
                                <span className="text-neutral-400">x{qty}</span>
                              </span>
                              <span className="font-medium text-neutral-900">
                                ₹{(room.price * qty).toLocaleString()}
                              </span>
                            </div>
                          );
                        })}

                        {/* Banquet Hall */}
                        {selectedBanquetHall && (
                          <div className="flex justify-between text-sm pt-2 border-t border-neutral-100">
                            <span className="text-neutral-600">
                              {
                                banquets.find(
                                  (h) => h.id === selectedBanquetHall,
                                )?.name
                              }
                              <span className="text-neutral-400 block text-xs">
                                {eventDate
                                  ? new Date(eventDate).toLocaleDateString(
                                      "en-US",
                                      { month: "short", day: "numeric" },
                                    )
                                  : selectedTimeSlot || "Time slot TBD"}
                              </span>
                            </span>
                            <span className="font-medium text-neutral-900">
                              ₹{getBanquetCost().toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Catering */}
                        {selectedMealPlan && (
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-600">
                              {
                                catering.find((p) => p.id === selectedMealPlan)
                                  ?.name
                              }
                              <span className="text-neutral-400 block text-xs">
                                {attendeeCount} people
                              </span>
                            </span>
                            <span className="font-medium text-neutral-900">
                              ₹{getCateringCost().toLocaleString()}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-dashed border-neutral-200 pt-4 space-y-2">
                    {roomsSubtotal > 0 && (
                      <div className="flex justify-between text-neutral-500 text-sm">
                        <span>Rooms Subtotal</span>
                        <span>₹{roomsSubtotal.toLocaleString()}</span>
                      </div>
                    )}
                    {banquetCost > 0 && (
                      <div className="flex justify-between text-neutral-500 text-sm">
                        <span>Banquet Hall</span>
                        <span>₹{banquetCost.toLocaleString()}</span>
                      </div>
                    )}
                    {cateringCost > 0 && (
                      <div className="flex justify-between text-neutral-500 text-sm">
                        <span>Catering</span>
                        <span>₹{cateringCost.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-500 text-sm pt-2 border-t border-neutral-100">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-500 text-sm">
                      <span>Tax (18%)</span>
                      <span>₹{taxes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-neutral-100">
                      <span className="font-bold text-lg text-neutral-900">
                        Total
                      </span>
                      <span className="font-bold text-2xl text-blue-600">
                        ₹{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveMapping}
                    disabled={totalAmount === 0}
                    className={`w-full mt-6 py-3.5 rounded-lg font-bold text-white transition-all transform active:scale-95 ${
                      totalAmount === 0
                        ? "bg-neutral-300 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
                    }`}
                  >
                    Save Mapping & Continue
                  </button>
                  <p className="text-xs text-center text-neutral-400 mt-3">
                    You can review the mapping in the next step.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
