"use client";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LocalFilterState, DEFAULT_FILTERS } from "../types";

// --- Constants ---
const AMENITIES_LIST = [
  "WiFi", "Pool", "Parking", "Breakfast", "AC", "Spa",
  "Gym", "Restaurant", "Bar", "Room Service", "Laundry",
  "Business Center", "Airport Shuttle", "EV Charging",
];

const PROPERTY_TYPES = ["Hotel", "Resort", "Villa", "Apartment", "Guest House", "Hostel"];

const VENUE_SETTINGS = ["Banquet Hall", "Open Lawn", "Terrace", "Poolside", "Beachfront", "Ballroom"];

const FOOD_TYPES = ["Veg", "Non-Veg", "Multi-Cuisine", "Halal", "Kosher"];

const MEAL_PLANS = ["Breakfast Included", "Half Board", "Full Board", "All Inclusive"];

const RATING_OPTIONS = [
  { label: "9+", value: 9, desc: "Exceptional" },
  { label: "8+", value: 8, desc: "Excellent" },
  { label: "7+", value: 7, desc: "Very Good" },
];

const GUEST_CAPACITY_OPTIONS = [
  { label: "50+ Guests", value: 50 },
  { label: "100+ Guests", value: 100 },
  { label: "200+ Guests", value: 200 },
  { label: "500+ Guests", value: 500 },
];

// --- Helper: Count active filters ---
function countActiveFilters(filters: LocalFilterState): number {
  let count = 0;
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) count++;
  count += filters.stars.length;
  if (filters.minRating !== null) count++;
  count += filters.amenities.length;
  count += filters.type.length;
  if (filters.freeCancellation) count++;
  count += filters.mealPlan.length;
  count += filters.venueSetting.length;
  if (filters.guestCapacity !== null) count++;
  count += filters.foodType.length;
  if (filters.petFriendly) count++;
  return count;
}

// --- Sub-components ---

// Collapsible section wrapper
function FilterSection({
  title,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  badge?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-left group"
      >
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-neutral-800 text-sm">{title}</h4>
          {badge !== undefined && badge > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Toggle switch
function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group py-1">
      <span className="text-sm text-neutral-700 group-hover:text-neutral-900">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
          checked ? "bg-blue-600" : "bg-neutral-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

// Pill chip (toggleable)
function PillChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
          : "bg-white text-neutral-600 border-neutral-200 hover:border-blue-300 hover:text-blue-600"
      }`}
    >
      {label}
    </button>
  );
}

// Checkbox item
function CheckboxItem({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  count?: number;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer"
      />
      <span className="text-sm text-neutral-600 group-hover:text-neutral-900 flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-neutral-400">{count}</span>
      )}
    </label>
  );
}

// --- Active Filter Tags ---
function ActiveFilterTags({
  filters,
  setFilters,
}: {
  filters: LocalFilterState;
  setFilters: (f: LocalFilterState) => void;
}) {
  const tags: { label: string; onRemove: () => void }[] = [];

  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) {
    tags.push({
      label: `₹${filters.priceRange[0].toLocaleString()} - ₹${filters.priceRange[1].toLocaleString()}`,
      onRemove: () => setFilters({ ...filters, priceRange: [0, 50000] }),
    });
  }
  filters.stars.forEach((s) =>
    tags.push({
      label: `${s}★`,
      onRemove: () => setFilters({ ...filters, stars: filters.stars.filter((x) => x !== s) }),
    })
  );
  if (filters.minRating !== null) {
    tags.push({
      label: `${filters.minRating}+ Rating`,
      onRemove: () => setFilters({ ...filters, minRating: null }),
    });
  }
  if (filters.freeCancellation) {
    tags.push({
      label: "Free Cancellation",
      onRemove: () => setFilters({ ...filters, freeCancellation: false }),
    });
  }
  if (filters.petFriendly) {
    tags.push({
      label: "Pet Friendly",
      onRemove: () => setFilters({ ...filters, petFriendly: false }),
    });
  }
  filters.type.forEach((t) =>
    tags.push({
      label: t,
      onRemove: () => setFilters({ ...filters, type: filters.type.filter((x) => x !== t) }),
    })
  );
  filters.amenities.forEach((a) =>
    tags.push({
      label: a,
      onRemove: () => setFilters({ ...filters, amenities: filters.amenities.filter((x) => x !== a) }),
    })
  );
  filters.mealPlan.forEach((m) =>
    tags.push({
      label: m,
      onRemove: () => setFilters({ ...filters, mealPlan: filters.mealPlan.filter((x) => x !== m) }),
    })
  );
  filters.venueSetting.forEach((v) =>
    tags.push({
      label: v,
      onRemove: () => setFilters({ ...filters, venueSetting: filters.venueSetting.filter((x) => x !== v) }),
    })
  );
  filters.foodType.forEach((f) =>
    tags.push({
      label: f,
      onRemove: () => setFilters({ ...filters, foodType: filters.foodType.filter((x) => x !== f) }),
    })
  );
  if (filters.guestCapacity !== null) {
    tags.push({
      label: `${filters.guestCapacity}+ Guests`,
      onRemove: () => setFilters({ ...filters, guestCapacity: null }),
    });
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pb-3 border-b border-neutral-100 mb-1">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
        >
          {tag.label}
          <button
            onClick={tag.onRemove}
            className="w-3.5 h-3.5 rounded-full hover:bg-blue-200 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

// --- Main FilterPanel ---
export default function FilterPanel({
  filters,
  setFilters,
}: {
  filters: LocalFilterState;
  setFilters: (f: LocalFilterState) => void;
}) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const activeCount = countActiveFilters(filters);

  const toggleArrayItem = useCallback(
    <T,>(arr: T[], item: T): T[] =>
      arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
    []
  );

  const visibleAmenities = showAllAmenities ? AMENITIES_LIST : AMENITIES_LIST.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 sticky top-24 h-fit max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain" style={{ scrollbarWidth: "thin" }}>
      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b border-neutral-100 sticky top-0 bg-white z-10 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-neutral-900 text-base">Filters</h3>
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="px-5">
        {/* Active filter tags */}
        <div className="pt-3">
          <ActiveFilterTags filters={filters} setFilters={setFilters} />
        </div>

        {/* 1. Price Range */}
        <FilterSection title="Price per Night" badge={filters.priceRange[0] > 0 || filters.priceRange[1] < 50000 ? 1 : 0}>
          <div className="space-y-3">
            <div className="relative pt-2">
              {/* Track background */}
              <div className="h-1.5 bg-neutral-200 rounded-full relative">
                <div
                  className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  style={{
                    left: `${(filters.priceRange[0] / 50000) * 100}%`,
                    right: `${100 - (filters.priceRange[1] / 50000) * 100}%`,
                  }}
                />
              </div>
              {/* Min slider */}
              <input
                type="range"
                min={0}
                max={50000}
                step={500}
                value={filters.priceRange[0]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val < filters.priceRange[1]) {
                    setFilters({ ...filters, priceRange: [val, filters.priceRange[1]] });
                  }
                }}
                className="absolute top-2 w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-600 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
              />
              {/* Max slider */}
              <input
                type="range"
                min={0}
                max={50000}
                step={500}
                value={filters.priceRange[1]}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > filters.priceRange[0]) {
                    setFilters({ ...filters, priceRange: [filters.priceRange[0], val] });
                  }
                }}
                className="absolute top-2 w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-600 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5">
                <span className="text-[10px] text-neutral-400 block">Min</span>
                <span className="text-sm font-semibold text-neutral-800">₹{filters.priceRange[0].toLocaleString()}</span>
              </div>
              <div className="w-4 h-px bg-neutral-300" />
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5">
                <span className="text-[10px] text-neutral-400 block">Max</span>
                <span className="text-sm font-semibold text-neutral-800">₹{filters.priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>
        </FilterSection>

        {/* 2. Star Rating */}
        <FilterSection title="Star Rating" badge={filters.stars.length}>
          <div className="flex flex-wrap gap-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setFilters({ ...filters, stars: toggleArrayItem(filters.stars, star) })}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
                  filters.stars.includes(star)
                    ? "bg-amber-50 border-amber-400 text-amber-700 shadow-sm"
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-amber-300"
                }`}
              >
                <span className="text-amber-400">★</span>
                {star}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* 3. User Rating */}
        <FilterSection title="Guest Rating" badge={filters.minRating !== null ? 1 : 0}>
          <div className="flex flex-wrap gap-2">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  setFilters({
                    ...filters,
                    minRating: filters.minRating === opt.value ? null : opt.value,
                  })
                }
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all duration-150 ${
                  filters.minRating === opt.value
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm"
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-emerald-300"
                }`}
              >
                <span className={`font-bold ${filters.minRating === opt.value ? "text-emerald-600" : "text-neutral-800"}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-neutral-400">{opt.desc}</span>
              </button>
            ))}
          </div>
        </FilterSection>

        {/* 4. Quick Toggles */}
        <FilterSection title="Policies" badge={(filters.freeCancellation ? 1 : 0) + (filters.petFriendly ? 1 : 0)}>
          <div className="space-y-1">
            <ToggleSwitch
              label="Free Cancellation"
              checked={filters.freeCancellation}
              onChange={(v) => setFilters({ ...filters, freeCancellation: v })}
            />
            <ToggleSwitch
              label="Pet Friendly"
              checked={filters.petFriendly}
              onChange={(v) => setFilters({ ...filters, petFriendly: v })}
            />
          </div>
        </FilterSection>

        {/* 5. Property Type */}
        <FilterSection title="Property Type" badge={filters.type.length}>
          <div className="space-y-0.5">
            {PROPERTY_TYPES.map((type) => (
              <CheckboxItem
                key={type}
                label={type}
                checked={filters.type.includes(type)}
                onChange={() =>
                  setFilters({ ...filters, type: toggleArrayItem(filters.type, type) })
                }
              />
            ))}
          </div>
        </FilterSection>

        {/* 6. Amenities */}
        <FilterSection title="Amenities" badge={filters.amenities.length}>
          <div className="space-y-0.5">
            {visibleAmenities.map((item) => (
              <CheckboxItem
                key={item}
                label={item}
                checked={filters.amenities.includes(item)}
                onChange={() =>
                  setFilters({ ...filters, amenities: toggleArrayItem(filters.amenities, item) })
                }
              />
            ))}
          </div>
          {AMENITIES_LIST.length > 6 && (
            <button
              onClick={() => setShowAllAmenities(!showAllAmenities)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              {showAllAmenities ? "Show Less" : `+${AMENITIES_LIST.length - 6} More`}
              <svg
                className={`w-3 h-3 transition-transform ${showAllAmenities ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </FilterSection>

        {/* 7. Meal Plans */}
        <FilterSection title="Meal Plans" badge={filters.mealPlan.length} defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {MEAL_PLANS.map((meal) => (
              <PillChip
                key={meal}
                label={meal}
                active={filters.mealPlan.includes(meal)}
                onClick={() =>
                  setFilters({ ...filters, mealPlan: toggleArrayItem(filters.mealPlan, meal) })
                }
              />
            ))}
          </div>
        </FilterSection>

        {/* 8. Event Specific — Venue & Food */}
        <FilterSection title="Venue & Events" badge={filters.venueSetting.length + filters.foodType.length + (filters.guestCapacity !== null ? 1 : 0)} defaultOpen={false}>
          <div className="space-y-4">
            {/* Venue Setting */}
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Venue Setting</p>
              <div className="flex flex-wrap gap-2">
                {VENUE_SETTINGS.map((v) => (
                  <PillChip
                    key={v}
                    label={v}
                    active={filters.venueSetting.includes(v)}
                    onClick={() =>
                      setFilters({ ...filters, venueSetting: toggleArrayItem(filters.venueSetting, v) })
                    }
                  />
                ))}
              </div>
            </div>

            {/* Guest Capacity */}
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Guest Capacity</p>
              <div className="flex flex-wrap gap-2">
                {GUEST_CAPACITY_OPTIONS.map((opt) => (
                  <PillChip
                    key={opt.value}
                    label={opt.label}
                    active={filters.guestCapacity === opt.value}
                    onClick={() =>
                      setFilters({
                        ...filters,
                        guestCapacity: filters.guestCapacity === opt.value ? null : opt.value,
                      })
                    }
                  />
                ))}
              </div>
            </div>

            {/* Food Type */}
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Food Type</p>
              <div className="flex flex-wrap gap-2">
                {FOOD_TYPES.map((f) => (
                  <PillChip
                    key={f}
                    label={f}
                    active={filters.foodType.includes(f)}
                    onClick={() =>
                      setFilters({ ...filters, foodType: toggleArrayItem(filters.foodType, f) })
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </FilterSection>
      </div>
    </div>
  );
}

export { countActiveFilters };
