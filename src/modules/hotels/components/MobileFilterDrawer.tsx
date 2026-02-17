"use client";
import { motion, AnimatePresence } from "framer-motion";
import FilterPanel from "./FilterPanel";
import { LocalFilterState, DEFAULT_FILTERS } from "../types";
import { countActiveFilters } from "./FilterPanel";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: LocalFilterState;
  setFilters: (f: LocalFilterState) => void;
  resultCount: number;
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  setFilters,
  resultCount,
}: MobileFilterDrawerProps) {
  const activeCount = countActiveFilters(filters);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-neutral-50 rounded-t-2xl max-h-[90vh] flex flex-col lg:hidden shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-300" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-neutral-900 text-lg">Filters</h3>
                {activeCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {activeCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filter content (scrollable) */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-1">
              <FilterPanel filters={filters} setFilters={setFilters} />
            </div>

            {/* Bottom action bar */}
            <div className="border-t border-neutral-200 bg-white px-5 py-4 flex gap-3 safe-bottom">
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="flex-1 py-3 rounded-xl border border-neutral-300 text-neutral-700 font-semibold text-sm hover:bg-neutral-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={onClose}
                className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                Show {resultCount} {resultCount === 1 ? "Hotel" : "Hotels"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
