"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useHotelDiscovery } from "@/modules/hotels/hooks/useHotelDiscovery";
import { Hotel } from "@/modules/hotels/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/modules/cart/services/api";
import { useAuth } from "@/context/AuthContext";
import { Toaster, toast } from "sonner";
import { useCart } from "@/context/CartContext";

import { useEffect } from "react";

// --- Components ---

const SearchBar = ({ onSearch }: { onSearch: (query: string) => void }) => {
  return (
    <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 rounded-xl shadow-lg mb-8 text-white">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 relative">
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
        <div className="md:col-span-3">
          <label className="block text-xs uppercase font-bold text-blue-200 mb-1">
            Check-in
          </label>
          <input
            type="date"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:bg-white/20"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs uppercase font-bold text-blue-200 mb-1">
            Check-out
          </label>
          <input
            type="date"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:bg-white/20"
          />
        </div>
        <div className="md:col-span-2 flex items-end">
          <button className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-lg shadow-md transition-all transform hover:scale-[1.02]">
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

const FilterPanel = ({
  filters,
  setFilters,
}: {
  filters: any;
  setFilters: any;
}) => {
  const amenitiesList = ["WiFi", "Pool", "Parking", "Breakfast", "AC", "Spa"];
  const typesList = ["Hotel", "Resort", "Guest House"];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sticky top-24 h-fit">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-neutral-900 text-lg">Filters</h3>
        <button
          onClick={() =>
            setFilters({
              priceRange: [0, 20000],
              stars: [],
              amenities: [],
              type: [],
            })
          }
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Price Range */}
      <div className="mb-8">
        <h4 className="font-semibold text-neutral-800 mb-3">Price Range</h4>
        <input
          type="range"
          min="0"
          max="20000"
          step="500"
          value={filters.priceRange[1]}
          onChange={(e) =>
            setFilters({ ...filters, priceRange: [0, Number(e.target.value)] })
          }
          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-sm text-neutral-600 mt-2">
          <span>₹0</span>
          <span>₹{filters.priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Star Rating */}
      <div className="mb-8">
        <h4 className="font-semibold text-neutral-800 mb-3">Star Rating</h4>
        <div className="space-y-2">
          {[5, 4, 3, 2].map((star) => (
            <label
              key={star}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.stars.includes(star)}
                onChange={(e) => {
                  const newStars = e.target.checked
                    ? [...filters.stars, star]
                    : filters.stars.filter((s: number) => s !== star);
                  setFilters({ ...filters, stars: newStars });
                }}
                className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500"
              />
              <div className="flex text-amber-400">
                {[...Array(star)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div className="mb-8">
        <h4 className="font-semibold text-neutral-800 mb-3">Property Type</h4>
        <div className="space-y-2">
          {typesList.map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.type.includes(type)}
                onChange={(e) => {
                  const newTypes = e.target.checked
                    ? [...filters.type, type]
                    : filters.type.filter((t: string) => t !== type);
                  setFilters({ ...filters, type: newTypes });
                }}
                className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500"
              />
              <span className="text-neutral-600 text-sm">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h4 className="font-semibold text-neutral-800 mb-3">Amenities</h4>
        <div className="space-y-2">
          {amenitiesList.map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.amenities.includes(item)}
                onChange={(e) => {
                  const newAmenities = e.target.checked
                    ? [...filters.amenities, item]
                    : filters.amenities.filter((a: string) => a !== item);
                  setFilters({ ...filters, amenities: newAmenities });
                }}
                className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500"
              />
              <span className="text-neutral-600 text-sm">{item}</span>
            </label>
          ))}
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

// --- Room Cluster Component ---

// --- Page Component ---

export default function HotelListingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const {
    hotels: discoveredHotels,
    loading,
    error,
    event,
  } = useHotelDiscovery({ eventId });

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    priceRange: [0, 20000],
    stars: [] as number[],
    amenities: [] as string[],
    type: [] as string[],
  });
  const [sortOption, setSortOption] = useState<
    "price_low" | "price_high" | "rating" | "popularity"
  >("popularity");

  const [roomClusters, setRoomClusters] = useState<RoomCluster[]>([
    { id: "single", label: "Single", occupants: 1, count: 5 },
    { id: "double", label: "Double", occupants: 2, count: 10 },
    { id: "triple", label: "Triple", occupants: 3, count: 2 },
    { id: "quad", label: "Quad", occupants: 4, count: 0 },
  ]);

  const { token } = useAuth();
  const queryClient = useQueryClient();
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

  // Wishlist Mutation (Deprecated - using CartContext now)

  const toggleWishlist = async (hotel: Hotel, e: React.MouseEvent) => {
    e.stopPropagation();

    if (wishlistIds.includes(hotel.id)) {
      // Find the cart item ID for this hotel wishlist item
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
        });
        toast.success("Added to wishlist!");
      } catch (err: any) {
        toast.error(err.message || "Failed to add to wishlist");
      }
    }
  };

  // Filter & Sort Logic
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

        // Type
        if (filters.type.length > 0 && !filters.type.includes(hotel.type))
          return false;

        // Amenities (Check if hotel has ALL selected amenities)
        if (filters.amenities.length > 0) {
          const hasAllAmenities = filters.amenities.every((a: string) =>
            hotel.amenities?.includes(a),
          );
          if (!hasAllAmenities) return false;
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
            return (b.rating || 0) - (a.rating || 0); // Popularity fallback
        }
      });
  }, [discoveredHotels, filters, searchQuery, sortOption]);

  const handleSelectHotel = (hotelId: string) => {
    // Save current demand/clusters to localStorage for the details page
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Filters */}
          <div className="hidden lg:block lg:col-span-1">
            <FilterPanel filters={filters} setFilters={setFilters} />
          </div>

          {/* Right Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sort Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 flex justify-between items-center">
              <span className="font-semibold text-neutral-900">
                {filteredHotels.length} Hotels Found
              </span>
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
                                Excellent
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
                      <h3 className="text-lg font-bold text-neutral-900">
                        No hotels found
                      </h3>
                      <p className="text-neutral-500">
                        Try adjusting your filters or search query.
                      </p>
                      <button
                        onClick={() => {
                          setFilters({
                            priceRange: [0, 20000],
                            stars: [],
                            amenities: [],
                            type: [],
                          });
                          setSearchQuery("");
                        }}
                        className="mt-4 text-blue-600 font-medium hover:underline"
                      >
                        Clear Filters
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
