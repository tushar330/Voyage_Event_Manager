"use client";

import { useState, useEffect, useCallback } from "react";
import { AISuggestionItem, AIAllocateResponse } from "@/types/allocation";
import { allocationService } from "@/services/allocation";
import { toast } from "sonner";

/*
 * AIAllocationModal — Frontend for the Allocation Suggestion Engine
 */

interface AIAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  token: string;
  data: AIAllocateResponse;
  onApplySuccess: () => void;
}

export default function AIAllocationModal({
  isOpen,
  onClose,
  eventId,
  token,
  data,
  onApplySuccess,
}: AIAllocationModalProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!data.planValidity?.validityExpiresAt) return 0;
    const expires = new Date(data.planValidity.validityExpiresAt).getTime();
    if (isNaN(expires)) return 0;
    const now = Date.now();
    return Math.max(0, Math.floor((expires - now) / 1000));
  });

  const { suggestions = [], unplaceableFamilies = [], metrics, reasoning, planValidity,
    optimisationEffective, optimisationMessage } = data;
  const isPlanExpired = secondsLeft <= 0;
  
  const improvementPercent = metrics?.improvementPercent || 0;
  const threshold = 0;

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || isPlanExpired) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(id); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isOpen, isPlanExpired]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Pre-apply safety check (Phase 7) ─────────────────────────────────────
  const validateBeforeApply = useCallback(async (): Promise<boolean> => {
    if (isPlanExpired) {
      toast.error("Plan has expired. Please regenerate suggestions.");
      return false;
    }
    try {
      const fresh = await allocationService.fetchAllocations(eventId, token);
      const freshAllocatedFamilyIds = new Set(
        fresh.allocations.map((a: { family_id: string }) => a.family_id)
      );
      const driftedFamilies = suggestions.filter((s) =>
        freshAllocatedFamilyIds.has(s.familyId)
      );
      if (driftedFamilies.length > 0) {
        toast.error(
          `Inventory drift detected: ${driftedFamilies.length} ${
            driftedFamilies.length === 1 ? "family has" : "families have"
          } already been allocated. Please regenerate.`
        );
        return false;
      }
    } catch {
      toast.error("Could not verify inventory status. Please try again.");
      return false;
    }
    return true;
  }, [eventId, token, suggestions, isPlanExpired]);

  // ── Sequential apply ───────────────────────────────────────────────────────
  const handleApply = async () => {
    if (suggestions.length === 0) return;
    const isValid = await validateBeforeApply();
    if (!isValid) return;

    setIsApplying(true);
    setAppliedCount(0);
    let successCount = 0;

    for (const s of suggestions) {
      try {
        await allocationService.createAllocation(
          { event_id: eventId, family_id: s.familyId, room_offer_id: s.roomOfferId },
          token
        );
        successCount++;
        setAppliedCount(successCount);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Stopped after ${successCount}/${suggestions.length} allocations. Error: ${msg}`);
        setIsApplying(false);
        if (successCount > 0) onApplySuccess();
        return;
      }
    }

    toast.success(`✅ Suggested allocation applied — ${successCount} ${successCount === 1 ? "family" : "families"} assigned.`);
    setIsApplying(false);
    onApplySuccess();
    onClose();
  };

  if (!isOpen) return null;

  // ── Aggregate confidence ───────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !isApplying) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-modal-title"
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-neutral-100 bg-gradient-to-r from-indigo-50 to-blue-50 flex items-start justify-between">
          <div>
            <h2 id="ai-modal-title" className="text-xl font-black text-neutral-900 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              Suggested Allocation
            </h2>
          </div>

          {/* Validity countdown */}
          <div className="flex items-center gap-3">
            {suggestions.length > 0 && improvementPercent > threshold && (
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  isPlanExpired
                    ? "bg-red-100 text-red-700"
                    : secondsLeft < 60
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isPlanExpired ? "bg-red-500" : secondsLeft < 60 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                {isPlanExpired ? "Plan Expired" : `Valid ${formatCountdown(secondsLeft)}`}
              </div>
            )}
            <button
              onClick={onClose}
              disabled={isApplying}
              className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-white/70 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expired banner */}
        {isPlanExpired && suggestions.length > 0 && improvementPercent > threshold && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700 font-medium flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            This plan has expired. Close and regenerate suggestions.
          </div>
        )}

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Top-level effectiveness banner */}
          {suggestions.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-amber-700 mb-1">
                ⚠ Unable to improve allocation with current inventory
              </p>
              {unplaceableFamilies.length > 0 && (
                <p className="text-xs text-amber-600">
                  {unplaceableFamilies.length} {unplaceableFamilies.length === 1 ? "family" : "families"} could not be placed.
                </p>
              )}
            </div>
          ) : improvementPercent > threshold ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-sm">✓</span>
              <p className="text-sm font-semibold text-emerald-700">Better allocation available</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 text-lg">🟡</span>
              <p className="text-sm font-semibold text-amber-700">Current allocation is already optimal</p>
            </div>
          )}

          {/* Metric Cards */}
          {improvementPercent > threshold && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                value={`${metrics?.improvementPercent?.toFixed(1) || '0.0'}%`}
                label="Capacity Saved"
                colorClass="from-emerald-50 to-teal-50 border-emerald-100 text-emerald-600"
              />
              <MetricCard
                value={String(metrics?.roomsUsedAfter || 0)}
                label="Rooms Used"
                colorClass="from-blue-50 to-indigo-50 border-blue-100 text-blue-600"
              />
              <MetricCard
                value={`₹${(metrics?.totalCostOptimised || 0).toLocaleString("en-IN")}`}
                label="Cost Impact"
                colorClass="from-violet-50 to-purple-50 border-violet-100 text-violet-600"
                small
              />
            </div>
          )}

          {/* Suggestions Table — FIX 4: No reason column, no Why? button */}
          {suggestions.length > 0 && improvementPercent > threshold && (
            <div>
              <h3 className="text-sm font-bold text-neutral-700 mb-2">
                Suggested Assignments ({suggestions.length})
              </h3>
              <div className="rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-xs">
                      <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Family</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-neutral-600">Suggested Room</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-neutral-600">Fit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {suggestions.map((s, idx) => (
                      <SuggestionRow key={s.familyId} s={s} idx={idx} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unplaceable families */}
          {unplaceableFamilies.length > 0 && suggestions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-amber-700 mb-1">
                ⚠ {unplaceableFamilies.length}{" "}
                {unplaceableFamilies.length === 1 ? "family" : "families"} could not be placed
              </p>
              <p className="text-xs text-amber-600">
                No available room with sufficient capacity. Please add more rooms or adjust inventory.
              </p>
            </div>
          )}

          {/* Apply progress bar */}
          {isApplying && (
            <div className="space-y-1">
              <p className="text-xs text-neutral-600 font-medium">
                Applying… {appliedCount} / {suggestions.length}
              </p>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${(appliedCount / suggestions.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isApplying}
            className="px-5 py-2.5 bg-white border border-neutral-200 text-neutral-700 font-semibold text-sm rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            {suggestions.length > 0 && improvementPercent > threshold ? "Cancel" : "Close"}
          </button>
          
          {suggestions.length > 0 && improvementPercent > threshold && (
            <button
              id="ai-apply-allocation-btn"
              onClick={handleApply}
              disabled={isApplying || isPlanExpired}
              title={isPlanExpired ? "Plan expired — please regenerate" : undefined}
              className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Applying…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {isPlanExpired ? "Plan Expired" : "Apply Suggested Allocation"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  value, label, colorClass, small = false,
}: {
  value: string; label: string; colorClass: string; small?: boolean;
}) {
  return (
    <div className={`bg-gradient-to-br ${colorClass} border rounded-xl p-4 flex flex-col items-center text-center`}>
      <span className={`font-black ${small ? "text-lg" : "text-3xl"}`}>{value}</span>
      <span className="text-xs font-semibold mt-1 opacity-80">{label}</span>
    </div>
  );
}

function SuggestionRow({ s, idx }: { s: AISuggestionItem; idx: number }) {
  const fitColor =
    s.capacityWaste === 0
      ? "text-emerald-700 bg-emerald-50 ring-emerald-200"
      : s.capacityWaste <= 1
      ? "text-blue-700 bg-blue-50 ring-blue-200"
      : "text-amber-700 bg-amber-50 ring-amber-200";

  return (
    <tr className={idx % 2 === 0 ? "bg-white" : "bg-neutral-50/50"}>
      <td className="px-4 py-2.5">
        <span className="font-mono text-xs text-neutral-500">{s.familyId.slice(0, 8)}…</span>
      </td>
      <td className="px-4 py-2.5">
        <span className="font-medium text-neutral-800">{s.roomName}</span>
      </td>
      <td className="px-4 py-2.5 text-center">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${fitColor}`}>
          {s.familySize}/{s.capacity}
        </span>
      </td>
    </tr>
  );
}
