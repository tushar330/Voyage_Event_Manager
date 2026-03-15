"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { allocationService } from "@/services/allocation";
import FamiliesList from "@/components/room-mapping/FamiliesList";
import RoomInventoryGrid from "@/components/room-mapping/RoomInventoryGrid";
import AIAllocationModal from "@/components/room-mapping/AIAllocationModal";
import Link from "next/link";
import { Toaster, toast } from "sonner";
import { AIAllocateResponse } from "@/types/allocation";

const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

interface RoomMappingDashboardProps {
  eventId: string;
  role: "agent" | "event_manager";
  guestId?: string;
}

export default function RoomMappingDashboard({ eventId, role, guestId }: RoomMappingDashboardProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showAllocationUI, setShowAllocationUI] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiData, setAiData] = useState<AIAllocateResponse | null>(null);

  const isValidId = eventId && isUUID(eventId);

  // -- Queries --

  // 1. Guests
  const guestsQuery = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
        if (!eventId || !token) throw new Error("Missing ID or token");
        return allocationService.fetchGuests(eventId, token);
    },
    enabled: !!isValidId && !!token,
  });

  // 2. Allocations (Source of Truth for assignments)
  const allocationsQuery = useQuery({
    queryKey: ["allocations", eventId],
    queryFn: async () => {
        if (!eventId || !token) throw new Error("Missing ID or token");
        return allocationService.fetchAllocations(eventId, token);
    },
    enabled: !!isValidId && !!token,
  });

  // -- Derived State --

  const {
      status: eventStatus,
      rooms_inventory: inventory,
      allocations: allocatedFamilies
  } = allocationsQuery.data ?? { status: "active", rooms_inventory: [], allocations: [] };

  const guests = guestsQuery.data ?? [];

  // Lifecycle Flags
  const isLockedOrFinalized = eventStatus === "finalized" || eventStatus === "locked";
  const hasAllocations = (allocatedFamilies?.length ?? 0) > 0;
  
  // "Allocating" mode is true if:
  // 1. We have existing allocations
  // 2. OR user clicked "Start Allocation"
  // 3. AND event is NOT finalized or locked
  const isAllocating = (hasAllocations || showAllocationUI) && !isLockedOrFinalized;

  // Group guests by family_id
  const guestsByFamily = useMemo(() => {
    if (!guests.length) return {};
    
    return guests.reduce((acc, guest) => {
        const fid = guest.family_id || "unknown"; 
        if (!acc[fid]) acc[fid] = [];
        acc[fid].push(guest);
        return acc;
    }, {} as Record<string, typeof guests>);
  }, [guests]);


  // Derived: Unallocated Families
  // Rule: All families (from guests) MINUS those present in allocatedFamilies
  const unallocatedFamilies = useMemo(() => {
    const allocatedFamilyIds = new Set(allocatedFamilies.map((a: any) => a.family_id));
    const allFamilyIds = Object.keys(guestsByFamily);
    
    return allFamilyIds
        .filter(fid => !allocatedFamilyIds.has(fid) && fid !== "unknown")
        .map(fid => ({
            family_id: fid,
            guests: guestsByFamily[fid]
        }));
  }, [guestsByFamily, allocatedFamilies]);


  // -- Mutations --

  const flashMessage = (type: "success" | "error", msg: string) => {
      if (type === "success") toast.success(msg);
      else toast.error(msg);
  };

  const allocateMutation = useMutation({
    mutationFn: async ({ familyId, roomOfferId }: { familyId: string; roomOfferId: string }) => {
      if (!token) throw new Error("No token");
      return allocationService.createAllocation({
        event_id: eventId,
        family_id: familyId,
        room_offer_id: roomOfferId,
      }, token);
    },
    onSuccess: () => {
      flashMessage("success", "Room assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["allocations", eventId] });
    },
    onError: (err: any) => flashMessage("error", err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ allocationId, roomOfferId }: { allocationId: string; roomOfferId: string }) => {
        if (!token) throw new Error("No token");
        return allocationService.updateAllocation(allocationId, { room_offer_id: roomOfferId }, token);
    },
    onSuccess: () => {
        flashMessage("success", "Room changed successfully");
        queryClient.invalidateQueries({ queryKey: ["allocations", eventId] });
    },
    onError: (err: any) => flashMessage("error", err.message),
  });

  const aiAllocateMutation = useMutation({
    mutationFn: async () => {
        if (!token) throw new Error("No token");
        return allocationService.aiAllocate(eventId, token);
    },
    onSuccess: (data: AIAllocateResponse) => {
        setAiData(data);
        setShowAIModal(true);
    },
    onError: (err: any) => flashMessage("error", err.message),
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
        if (!token) throw new Error("No token");
        return allocationService.finalizeEvent(eventId, token);
    },
    onSuccess: () => {
        flashMessage("success", role === "event_manager" ? "Allocations locked successfully." : "Event finalized. Room mapping is now locked.");
        queryClient.invalidateQueries({ queryKey: ["allocations", eventId] });
    },
    onError: (err: any) => flashMessage("error", err.message),
  });

  const reopenMutation = useMutation({
    mutationFn: async () => {
        if (!token) throw new Error("No token");
        return allocationService.reopenEvent(eventId, token);
    },
    onSuccess: () => {
        flashMessage("success", "Allocation reopened.");
        queryClient.invalidateQueries({ queryKey: ["allocations", eventId] });
    },
    onError: (err: any) => flashMessage("error", err.message),
  });

  // -- Handlers --

  const handleAllocate = (familyId: string, roomOfferId: string) => {
      allocateMutation.mutate({ familyId, roomOfferId });
  };

  const handleUpdate = (allocationId: string, roomOfferId: string) => {
      updateMutation.mutate({ allocationId, roomOfferId });
  };

  if (!isValidId) {
    return <div className="p-8 text-center text-red-600">Invalid Event ID</div>;
  }

  const isLoading = guestsQuery.isLoading || allocationsQuery.isLoading;
  const isError = guestsQuery.isError || allocationsQuery.isError;

  if (isLoading) return <div className="p-8 text-center text-neutral-500">Loading room mapping data...</div>;
  if (isError) return <div className="p-8 text-center text-red-600">Failed to load data. Please refresh.</div>;

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
                    Room Mapping
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        !isLockedOrFinalized ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"
                    }`}>
                        {eventStatus === "active" ? "ACTIVE" : eventStatus.toUpperCase()}
                    </span>
                </h1>
                <Link href={role === "agent" ? `/events/${eventId}` : `/events/${eventId}/portal/${guestId}`} className="text-sm text-neutral-500 hover:text-neutral-900 mt-1 block">
                    ← Back to Dashboard
                </Link>
            </div>

            <div className="flex items-center gap-3">
                <button 
                    onClick={() => {
                        guestsQuery.refetch();
                        allocationsQuery.refetch();
                    }}
                    className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50"
                >
                    Refresh
                </button>

                {/* Start Allocation Button (UX Only) - Agent Only */}
                {!isLockedOrFinalized && !hasAllocations && !showAllocationUI && role === "agent" && (
                    <button
                        onClick={() => setShowAllocationUI(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        Start Allocation
                    </button>
                )}

                {/* AI Auto Allocate Button - BOTH roles */}
                {!isLockedOrFinalized && (isAllocating || hasAllocations) && (
                    <button
                        id="ai-auto-allocate-btn"
                        onClick={() => aiAllocateMutation.mutate()}
                        disabled={aiAllocateMutation.isPending}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-colors flex items-center gap-1.5"
                    >
                        {aiAllocateMutation.isPending ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Analysing...
                            </>
                        ) : (
                            <>✨ AI Auto Allocate</>
                        )}
                    </button>
                )}

                {/* Lock / Finalize Button - BOTH */}
                {!isLockedOrFinalized && (isAllocating || hasAllocations) && (
                    <button
                        onClick={() => { 
                          if(confirm(role === "event_manager" ? "Lock allocations? Changes will require Agent approval." : "Lock and finalize rooms? This will prevent further changes.")) {
                            finalizeMutation.mutate(); 
                          }
                        }}
                        disabled={finalizeMutation.isPending}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 shadow-sm transition-colors"
                    >
                        {finalizeMutation.isPending ? "Locking..." : role === "event_manager" ? "Lock Mapping" : "Finalize & Lock"}
                    </button>
                )}

                {/* Reopen Button - Agent Only */}
                {isLockedOrFinalized && role === "agent" && (
                    <button
                        onClick={() => { if(confirm("Reopen event for allocation? This will unlock the event.")) reopenMutation.mutate(); }}
                        disabled={reopenMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors"
                    >
                        {reopenMutation.isPending ? "Reopening..." : "Reopen Allocation"}
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Status Warning Banner */}
      {isLockedOrFinalized && (
          <div className="bg-amber-50 border-b border-amber-100 px-8 py-3 text-center text-amber-800 text-sm font-medium flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {eventStatus === "locked" ? "Event is locked by Event Manager. Waiting for Agent Finalization." : "Event is finalized. Allocations are locked."}
          </div>
      )}

      {/* Main Content */}
      {(isAllocating || hasAllocations || isLockedOrFinalized) ? (
          <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <FamiliesList
                    allocatedFamilies={allocatedFamilies}
                    unallocatedFamilies={unallocatedFamilies}
                    inventory={inventory}
                    onAllocate={handleAllocate}
                    onUpdate={handleUpdate}
                    isReadOnly={isLockedOrFinalized}
                />
              </div>
              <div className="lg:col-span-1">
                <RoomInventoryGrid inventory={inventory} />
              </div>
          </div>
      ) : (
          <div className="max-w-7xl mx-auto px-8 py-24 text-center">
              <div className="bg-white p-12 rounded-2xl shadow-sm border border-neutral-100 max-w-lg mx-auto">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Ready to Allocate Rooms?</h3>
                <p className="text-neutral-600 mb-8">
                    You have {guests.length} guests and {inventory.reduce((sum: number, r: any) => sum + r.total, 0)} rooms available.
                </p>
                {role === "agent" ? (
                  <button
                      onClick={() => setShowAllocationUI(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:scale-105"
                  >
                      Start Allocation
                  </button>
                ) : (
                  <div className="px-6 py-3 bg-neutral-100 text-neutral-500 rounded-xl font-medium">
                      Waiting for Agent to initialize allocation
                  </div>
                )}
              </div>
          </div>
      )}
      {/* AI Allocation Results Modal */}
      {showAIModal && aiData && token && (
          <AIAllocationModal
              isOpen={showAIModal}
              onClose={() => setShowAIModal(false)}
              eventId={eventId}
              token={token}
              data={aiData}
              onApplySuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["allocations", eventId] });
                  setShowAIModal(false);
              }}
          />
      )}
    </div>
  );
}
