"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useHotelDiscovery } from "@/modules/hotels/hooks/useHotelDiscovery";
import { Hotel, HotelFilters, LocalFilterState, DEFAULT_FILTERS } from "@/modules/hotels/types";
import { useAuth } from "@/context/AuthContext";
import { Toaster, toast } from "sonner";
import { useCart } from "@/context/CartContext";
import FilterPanel, { countActiveFilters } from "@/modules/hotels/components/FilterPanel";
import MobileFilterDrawer from "@/modules/hotels/components/MobileFilterDrawer";

import { useEffect } from "react";

// --- Components ---

const SearchBar = ({ onSearch }: { onSearch: (query: string) => void }) => {
  return (
    <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 rounded-xl shadow-lg mb-8 text-white">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <label className="block text-xs uppercase font-bold text-blue-200 mb-1">
            City, Hotel, or Area
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by hotel name or location"
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-100 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-white/50"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-3.5 text-blue-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="flex items-end">
          <button className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-lg shadow-md transition-all transform hover:scale-[1.02]">
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Room Cluster Component ---

interface RoomCluster {
  id: string;
  label: string;
  occupants: number;
  count: number;
}

const RoomClusterSelector = ({
  clusters,
  setClusters,
}: {
  clusters: RoomCluster[];
  setClusters: any;
}) => {
  const updateCount = (id: string, delta: number) => {
    setClusters((prev: RoomCluster[]) =>
      prev.map((c) =>
        c.id === id ? { ...c, count: Math.max(0, c.count + delta) } : c,
      ),
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {clusters.map((cluster) => (
        <div
          key={cluster.id}
          className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 flex flex-col items-center justify-center transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-2 mb-2 text-neutral-600">
            {/* Icon based on occupants */}
            <div className="flex">
              {[...Array(cluster.occupants)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i > 0 ? "-ml-2" : ""} text-blue-500`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              ))}
            </div>
            <span className="font-semibold text-sm">{cluster.label}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => updateCount(cluster.id, -1)}
              className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 flex items-center justify-center font-bold disabled:opacity-50"
              disabled={cluster.count <= 0}
            >
              -
            </button>
            <span
              className={`text-lg font-bold ${cluster.count > 0 ? "text-blue-600" : "text-neutral-400"}`}
            >
              {cluster.count}
            </span>
            <button
              onClick={() => updateCount(cluster.id, 1)}
              className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center font-bold"
            >
              +
            </button>
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            {cluster.occupants} Person{cluster.occupants > 1 ? "s" : ""}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Quick Filter Pills (horizontal strip above results) ---
const QuickFilterStrip = ({
  filters,
  setFilters,
}: {
  filters: LocalFilterState;
  setFilters: (f: LocalFilterState) => void;
}) => {
  const quickFilters = [
    {
      label: "Free Cancellation",
      active: filters.freeCancellation,
      toggle: () => setFilters({ ...filters, freeCancellation: !filters.freeCancellation }),
    },
    {
      label: "5★ Hotels",
      active: filters.stars.includes(5),
      toggle: () =>
        setFilters({
          ...filters,
          stars: filters.stars.includes(5)
            ? filters.stars.filter((s) => s !== 5)
            : [...filters.stars, 5],
        }),
    },
    {
      label: "4★ & Above",
      active: filters.stars.includes(4) && filters.stars.includes(5),
      toggle: () => {
        const has4and5 = filters.stars.includes(4) && filters.stars.includes(5);
        setFilters({
          ...filters,
          stars: has4and5
            ? filters.stars.filter((s) => s !== 4 && s !== 5)
            : [...new Set([...filters.stars, 4, 5])],
        });
      },
    },
    {
      label: "8+ Rating",
      active: filters.minRating === 8,
      toggle: () =>
        setFilters({ ...filters, minRating: filters.minRating === 8 ? null : 8 }),
    },
    {
      label: "Breakfast",
      active: filters.mealPlan.includes("Breakfast Included"),
      toggle: () =>
        setFilters({
          ...filters,
          mealPlan: filters.mealPlan.includes("Breakfast Included")
            ? filters.mealPlan.filter((m) => m !== "Breakfast Included")
            : [...filters.mealPlan, "Breakfast Included"],
        }),
    },
    {
      label: "Pool",
      active: filters.amenities.includes("Pool"),
      toggle: () =>
        setFilters({
          ...filters,
          amenities: filters.amenities.includes("Pool")
            ? filters.amenities.filter((a) => a !== "Pool")
            : [...filters.amenities, "Pool"],
        }),
    },
    {
      label: "WiFi",
      active: filters.amenities.includes("WiFi"),
      toggle: () =>
        setFilters({
          ...filters,
          amenities: filters.amenities.includes("WiFi")
            ? filters.amenities.filter((a) => a !== "WiFi")
            : [...filters.amenities, "WiFi"],
        }),
    },
    {
      label: "Pet Friendly",
      active: filters.petFriendly,
      toggle: () => setFilters({ ...filters, petFriendly: !filters.petFriendly }),
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4 -mx-1 px-1">
      {quickFilters.map((qf) => (
        <button
          key={qf.label}
          onClick={qf.toggle}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium border transition-all duration-150 flex-shrink-0 ${
            qf.active
              ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20"
              : "bg-white text-neutral-600 border-neutral-200 hover:border-blue-300 hover:text-blue-600"
          }`}
        >
          {qf.active && (
            <span className="mr-1">✓</span>
          )}
          {qf.label}
        </button>
      ))}
    </div>
  );
};

// --- Page Component ---

export default function HotelListingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<LocalFilterState>(DEFAULT_FILTERS);
  const [sortOption, setSortOption] = useState<
    "price_low" | "price_high" | "rating" | "popularity"
  >("popularity");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [roomClusters, setRoomClusters] = useState<RoomCluster[]>([
    { id: "single", label: "Single", occupants: 1, count: 5 },
    { id: "double", label: "Double", occupants: 2, count: 10 },
    { id: "triple", label: "Triple", occupants: 3, count: 2 },
    { id: "quad", label: "Quad", occupants: 4, count: 0 },
  ]);

  // Derive backend HotelFilters from room cluster selections
  const roomFilters = useMemo<HotelFilters>(() => {
    const f: HotelFilters = {};
    roomClusters.forEach((c) => {
      if (c.count > 0) {
        if (c.id === "single") f.rooms_single = c.count;
        if (c.id === "double") f.rooms_double = c.count;
        if (c.id === "triple") f.rooms_triple = c.count;
        if (c.id === "quad") f.rooms_quad = c.count;
      }
    });
    return f;
  }, [roomClusters]);

  // Auto-persist room demand to localStorage for hotel details page
  useEffect(() => {
    const demand = roomClusters.reduce(
      (acc, cluster) => {
        acc[cluster.id] = cluster.count;
        return acc;
      },
      {} as Record<string, number>,
    );
    localStorage.setItem(`demand_${eventId}`, JSON.stringify(demand));
  }, [roomClusters, eventId]);

  const {
    hotels: discoveredHotels,
    loading,
    error,
    event,
  } = useHotelDiscovery({ eventId, filters: roomFilters });

  const { token } = useAuth();
  const { cart, fetchCart, addToCart, removeFromCart } = useCart();

  useEffect(() => {
    if (eventId) {
      fetchCart(eventId);
    }
  }, [eventId, fetchCart]);

  const wishlistIds = useMemo(() => {
    if (!cart) return [];
    return cart.hotels
      .filter((h) => h.hotel_wishlist_item)
      .map((h) => h.hotel_details?.id || "");
  }, [cart]);

  const toggleWishlist = async (hotel: Hotel, e: React.MouseEvent) => {
    e.stopPropagation();

    if (wishlistIds.includes(hotel.id)) {
      const hotelGroup = cart?.hotels.find(
        (h) => h.hotel_details?.id === hotel.id,
      );
      if (hotelGroup?.hotel_wishlist_item) {
        try {
          await removeFromCart(eventId, hotelGroup.hotel_wishlist_item.id);
          toast.success("Removed from wishlist");
        } catch (err: any) {
          toast.error(err.message || "Failed to remove from wishlist");
        }
      }
    } else {
      try {
        await addToCart(eventId, {
          type: "hotel",
          refId: hotel.id,
          quantity: 1,
          status: "wishlist"
        });
        toast.success("Added to wishlist!");
      } catch (err: any) {
        toast.error(err.message || "Failed to add to wishlist");
      }
    }
  };

  // Filter & Sort Logic — all client-side filters
  const filteredHotels = useMemo(() => {
    return discoveredHotels
      .filter((hotel: Hotel) => {
        // Search
        const matchesSearch =
          hotel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hotel.location?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        // Price
        if (
          (hotel.price || 0) < filters.priceRange[0] ||
          (hotel.price || 0) > filters.priceRange[1]
        )
          return false;

        // Stars
        if (filters.stars.length > 0 && !filters.stars.includes(hotel.stars))
          return false;

        // Min Rating
        if (filters.minRating !== null && (hotel.rating || 0) < filters.minRating)
          return false;

        // Type
        if (filters.type.length > 0 && !filters.type.includes(hotel.type))
          return false;

        // Amenities (Check if hotel has ALL selected amenities)
        if (filters.amenities.length > 0) {
          const hasAllAmenities = filters.amenities.every((a: string) =>
            hotel.amenities?.some(
              (ha) => ha.toLowerCase() === a.toLowerCase()
            ),
          );
          if (!hasAllAmenities) return false;
        }

        // Free Cancellation — filter on amenities containing "Free Cancellation" or "Cancellation"
        if (filters.freeCancellation) {
          const hasFreeCancel = hotel.amenities?.some(
            (a) => a.toLowerCase().includes("free cancellation") || a.toLowerCase().includes("cancellation")
          );
          if (!hasFreeCancel) return false;
        }

        // Meal Plan — filter on amenities
        if (filters.mealPlan.length > 0) {
          const hasAnyMeal = filters.mealPlan.some((mp) =>
            hotel.amenities?.some(
              (a) => a.toLowerCase().includes(mp.toLowerCase().split(" ")[0])
            ),
          );
          if (!hasAnyMeal) return false;
        }

        // Pet Friendly — filter on amenities
        if (filters.petFriendly) {
          const isPetFriendly = hotel.amenities?.some(
            (a) => a.toLowerCase().includes("pet")
          );
          if (!isPetFriendly) return false;
        }

        // Venue Setting — filter on amenities/type containing venue keywords
        if (filters.venueSetting.length > 0) {
          const hasVenue = filters.venueSetting.some((vs) =>
            hotel.amenities?.some(
              (a) => a.toLowerCase().includes(vs.toLowerCase())
            ),
          );
          if (!hasVenue) return false;
        }

        // Food Type — filter on amenities
        if (filters.foodType.length > 0) {
          const hasFood = filters.foodType.some((ft) =>
            hotel.amenities?.some(
              (a) => a.toLowerCase().includes(ft.toLowerCase())
            ),
          );
          if (!hasFood) return false;
        }

        // Guest Capacity — filter on occupancy
        if (filters.guestCapacity !== null) {
          if ((hotel.occupancy || 0) < filters.guestCapacity) return false;
        }

        return true;
      })
      .sort((a: Hotel, b: Hotel) => {
        switch (sortOption) {
          case "price_low":
            return (a.price || 0) - (b.price || 0);
          case "price_high":
            return (b.price || 0) - (a.price || 0);
          case "rating":
            return (b.rating || 0) - (a.rating || 0);
          default:
            return (b.rating || 0) - (a.rating || 0);
        }
      });
  }, [discoveredHotels, filters, searchQuery, sortOption]);

  const handleSelectHotel = (hotelId: string) => {
    const demand = roomClusters.reduce(
      (acc, cluster) => {
        acc[cluster.id] = cluster.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    localStorage.setItem(`demand_${eventId}`, JSON.stringify(demand));
    router.push(`/events/${eventId}/hotels/${hotelId}`);
  };

  const activeFilterCount = countActiveFilters(filters);

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Toaster position="top-right" richColors />
        {/* Header with Wishlist Toggle */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Find Hotels</h1>
          <div className="flex gap-4">
            <Link
              href={`/events/${eventId}`}
              className="px-6 py-3 bg-white border border-neutral-200 rounded-xl font-bold text-neutral-600 hover:text-neutral-900 transition-all shadow-sm flex items-center gap-2 hover:bg-neutral-50"
            >
              Dashboard
            </Link>
            <Link
              href={`/events/${eventId}/cart`}
              className="px-6 py-3 bg-neutral-900 overflow-hidden text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg transform active:scale-95 flex items-center gap-3 group relative"
            >
              <div className="flex -space-x-2">
                {cart?.hotels.slice(0, 3).map((group, i) => (
                  <img
                    key={i}
                    src={group.hotel_details?.image || "/placeholder-hotel.jpg"}
                    className="w-6 h-6 rounded-full border-2 border-neutral-900 object-cover"
                    alt=""
                  />
                ))}
              </div>
              <span>View Cart</span>
              {cart &&
                (cart.hotels?.length > 0 || cart.flights?.length > 0) && (
                  <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full inline-block animate-pulse">
                    {(cart.hotels || []).reduce(
                      (acc, h) =>
                        acc +
                        (h.rooms?.length || 0) +
                        (h.banquets?.length || 0) +
                        (h.catering?.length || 0) +
                        (h.hotel_wishlist_item ? 1 : 0),
                      0,
                    ) + (cart.flights?.length || 0)}
                  </span>
                )}
            </Link>
          </div>
        </div>

        {/* Room Cluster Selector */}
        <RoomClusterSelector
          clusters={roomClusters}
          setClusters={setRoomClusters}
        />

        {/* Top Search */}
        <SearchBar onSearch={setSearchQuery} />

        {/* Quick Filter Strip (visible on all sizes) */}
        <QuickFilterStrip filters={filters} setFilters={setFilters} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Filters (desktop only) */}
          <div className="hidden lg:block lg:col-span-1">
            <FilterPanel filters={filters} setFilters={setFilters} />
          </div>

          {/* Right Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sort Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-neutral-900">
                  {filteredHotels.length} Hotels Found
                </span>
                {activeFilterCount > 0 && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
                    {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"} applied
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="bg-transparent font-medium text-neutral-800 focus:outline-none cursor-pointer"
                >
                  <option value="popularity">Popularity</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">User Rating</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-neutral-200 shadow-sm">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"
                  />
                  <p className="text-neutral-600 font-medium">
                    Discovering best hotels for your event...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-white rounded-xl border border-red-200">
                  <h3 className="text-lg font-bold text-red-900">
                    Error discovering hotels
                  </h3>
                  <p className="text-neutral-500">{error}</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredHotels.map((hotel: Hotel, index: number) => {
                    const isWishlisted = wishlistIds.includes(hotel.id);
                    return (
                      <motion.div
                        key={hotel.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        onClick={() => handleSelectHotel(hotel.id)}
                        className="bg-white rounded-xl shadow-sm border border-neutral-200 hover:shadow-md hover:border-blue-300 overflow-hidden flex flex-col md:flex-row transition-all duration-200 cursor-pointer group relative"
                      >
                        {/* Wishlist Button on Card */}
                        <button
                          onClick={(e) => toggleWishlist(hotel, e)}
                          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white shadow-sm transition-all group-wishlist"
                        >
                          <svg
                            className={`w-6 h-6 transition-colors ${isWishlisted ? "text-red-500 fill-current" : "text-white md:text-white group-hover:text-red-500"}`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            fill="none"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                            />
                          </svg>
                        </button>

                        {/* Image */}
                        <div className="w-full md:w-64 h-48 md:h-auto relative bg-neutral-200">
                          <img
                            src={hotel.image}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                          />
                          {hotel.discount && (
                            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                              {hotel.discount}% OFF
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-neutral-900 hover:text-blue-600 transition-colors">
                                  {hotel.name}
                                </h3>
                                <div className="flex text-amber-400 text-sm">
                                  {[...Array(hotel.stars)].map((_, i) => (
                                    <span key={i}>★</span>
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-neutral-500 flex items-center gap-1 mb-3">
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
                              <div className="flex flex-wrap gap-2">
                                {hotel.amenities
                                  .slice(0, 4)
                                  .map((a: string) => (
                                    <span
                                      key={a}
                                      className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded"
                                    >
                                      {a}
                                    </span>
                                  ))}
                                {hotel.amenities.length > 4 && (
                                  <span className="text-xs text-neutral-400">
                                    +{hotel.amenities.length - 4} more
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block">
                                Max Occupancy: {hotel.occupancy} guests
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="bg-corporate-blue-600 text-white font-bold p-2.5 rounded-lg inline-block text-lg">
                                {hotel.rating}
                              </div>
                              <p className="text-xs text-neutral-500 mt-1">
                                {hotel.rating >= 9
                                  ? "Exceptional"
                                  : hotel.rating >= 8
                                    ? "Excellent"
                                    : hotel.rating >= 7
                                      ? "Very Good"
                                      : "Good"}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-end mt-4 pt-4 border-t border-neutral-100">
                            <div>
                              <span className="text-xs text-neutral-400 line-through">
                                ₹
                                {Math.round(hotel.price * 1.2).toLocaleString()}
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xs text-neutral-500 font-medium">
                                  Starts from
                                </span>
                                <span className="text-2xl font-bold text-neutral-900">
                                  ₹{hotel.price.toLocaleString()}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  / night
                                </span>
                              </div>
                              <p className="text-xs text-emerald-600 font-medium my-1">
                                Free Cancellation
                              </p>
                            </div>
                            <button className="px-6 py-2.5 rounded-lg font-semibold transition-colors bg-white border-2 border-corporate-blue-600 text-corporate-blue-600 hover:bg-corporate-blue-50">
                              View Details
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {filteredHotels.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-20 bg-white rounded-xl border border-neutral-200"
                    >
                      <div className="text-5xl mb-4">🏨</div>
                      <h3 className="text-lg font-bold text-neutral-900">
                        No hotels match your filters
                      </h3>
                      <p className="text-neutral-500 mt-1">
                        Try adjusting your filters or search query.
                      </p>
                      <button
                        onClick={() => {
                          setFilters(DEFAULT_FILTERS);
                          setSearchQuery("");
                        }}
                        className="mt-4 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter FAB */}
      <button
        onClick={() => setMobileFilterOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 lg:hidden flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-full shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
        {activeFilterCount > 0 && (
          <span className="bg-white text-blue-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        resultCount={filteredHotels.length}
      />
    </div>
  );
}
