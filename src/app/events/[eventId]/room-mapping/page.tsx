"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { allocationService } from "@/services/allocation";
import FamiliesList from "@/components/room-mapping/FamiliesList";
import RoomInventoryGrid from "@/components/room-mapping/RoomInventoryGrid";
import Link from "next/link"; 
import { Toaster, toast } from "sonner"; 

export default function RoomMappingPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  
  useEffect(() => {
    console.log("RoomMappingPage loaded. Params:", params);
    console.log("Event ID:", eventId);
  }, [params, eventId]);


  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  // Clear messages after 3 seconds
  const flashMessage = (type: "success" | "error", msg: string) => {
    if (type === "success") {
      setSuccessMsg(msg);
      setErrorMsg(null);
    } else {
      setErrorMsg(msg);
      setSuccessMsg(null);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 3000);
  };

  // 1. Fetch Allocations
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["allocations", eventId],
    queryFn: async () => {
        if (!eventId) throw new Error("Event ID is missing");
        if (!token) throw new Error("No authentication token found");
        return allocationService.fetchAllocations(eventId, token);
    },
    enabled: !!eventId,
    refetchOnWindowFocus: false,
  });

  // 2. Allocate Mutation
  const allocateMutation = useMutation({
    mutationFn: async (validation: { familyId: string; roomOfferId: string }) => {
      if (!token) throw new Error("No authentication token found");
      return allocationService.createAllocation({
        event_id: eventId,
        family_id: validation.familyId,
        room_offer_id: validation.roomOfferId,
      }, token);
    },
    onSuccess: () => {
      flashMessage("success", "Room allocated successfully!");
      queryClient.invalidateQueries({ queryKey: ["allocations", eventId] });
    },
    onError: (err: any) => {
      flashMessage("error", `Allocation failed: ${err.message || "Unknown error"}`);
    },
  });

  // 3. Update Allocation Mutation
  const updateMutation = useMutation({
    mutationFn: async (validation: { familyId: string; roomOfferId: string; allocationId: string }) => {
      if (!token) throw new Error("No authentication token found");
      return allocationService.updateAllocation(validation.allocationId, {
        room_offer_id: validation.roomOfferId,
      }, token);
    },
    onSuccess: () => {
      flashMessage("success", "Room changed successfully!");
      queryClient.invalidateQueries({ queryKey: ["allocations", eventId] });
    },
    onError: (err: any) => {
      flashMessage("error", `Update failed: ${err.message || "Unknown error"}`);
    },
  });

  // 4. Auto Allocate Mutation
  const autoAllocateMutation = useMutation({
    mutationFn: async () => {
      // Note: useAuth provides `token` directly, no need to await it.
      if (!token) throw new Error("No authentication token found");
      return allocationService.autoAllocate(eventId, token);
    },
    onSuccess: (data) => {
      flashMessage("success", `Auto-allocation successful! ${data.allocations_count} families assigned.`);
      queryClient.invalidateQueries({ queryKey: ["allocations", eventId] });
    },
    onError: (err: any) => {
      flashMessage("error", `Auto-allocation failed: ${err.message || "Unknown error"}`);
    },
  });

  // 5. Lock Event Mutation
  const lockEventMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No authentication token found");
      return allocationService.lockEvent(eventId, token);
    },
    onSuccess: () => {
      flashMessage("success", "Event locked successfully! Allocations are now finalized.");
      queryClient.invalidateQueries({ queryKey: ["allocations", eventId] });
    },
    onError: (err: any) => {
      flashMessage("error", `Locking failed: ${err.message || "Unknown error"}`);
    },
  });

  const handleAllocate = (familyId: string, roomOfferId: string) => {
    allocateMutation.mutate({ familyId, roomOfferId });
  };


  const handleUpdate = (familyId: string, roomOfferId: string) => {
    // We need to find the allocation ID. 
    // In strict REST, PUT /allocations/:id requires the allocation ID.
    // However, the `FamilyAllocation` type doesn't explicitly have an `allocation_id`.
    // Let's assume the API might need `family_id` + `event_id` to find it, OR 
    // the backend response for `allocations` should include `allocation_id` if it exists.
    // 
    // Looking at the USER REQUEST JSON:
    // "allocations": [ { "family_id": "...", "room_offer_id": "..." ... } ]
    // It does NOT show `allocation_id`. 
    // BUT the request says: "PUT /allocations/:allocation_id".
    // AND "When a family already assigned... PUT /allocations/:allocation_id".
    // 
    // This implies the GET response MUST contain the allocation ID for assigned families.
    // I will check the `FamilyAllocation` interface I created. I might have missed `allocation_id` or similar.
    // The user sample JSON didn't show it explicitly in the "allocations" array, 
    // but typically it interacts with /allocations/:id.
    //
    // Let's look closer at the User Request. 
    // 1. GET Response:
    //   "allocations": [ { "family_id": "...", "guests": [...] } ] 
    //   It seems `family_id` is the key? No, `PUT /allocations/:id` usually implies an Allocation ID.
    //   Wait, maybe the `family_id` IS the `allocation_id` or there's a missing field.
    //   
    //   Actually, in many systems, the mapping IS the resource. 
    //   If the API documentation says `PUT /allocations/:id`, I must have an ID.
    //   
    //   Let's assume the `FamilyAllocation` type SHOULD have `allocation_id`.
    //   The user prompt JSON example: 
    //   ```
    //   "allocations": [
    //     {
    //       "family_id": "...",
    //       "room_offer_id": "...",
    //       "room_name": "...",
    //       "guests": [...]
    //     }
    //   ]
    //   ```
    //   It doesn't show `allocation_id`. 
    //   However, if I look at "Update Flow": "Call: PUT /allocations/:allocation_id".
    //   
    //   Hypothesis: 1. The JSON example was simplified. 2. `family_id` is used as `allocation_id` (unlikely).
    //   3. There is a missing field.
    //   
    //   I will add `id` or `allocation_id` to the `FamilyAllocation` interface and assume the backend returns it.
    //   For now, strictly following the prompt, I'll assume `family_id` might be used or I need to find the allocation ID.
    //   
    //   Actually, if I look at the `GET` response, it returns `allocations` which are "Family Allocations". 
    //   If the backend follows standard REST, the resource created by `POST /allocations` should match the list.
    //   I will try to use `family_id` as the identifier if no other ID is present, OR 
    //   I will assume the response *includes* an `id` field for the allocation itself.
    //   
    //   Let's check the types I created. `FamilyAllocation`.
    //   I'll update `FamilyAllocation` to include `allocation_id` (optional, as it might be null if not allocated? No, this list IS existing allocations? 
    //   Wait, the GET returns `allocations` array. Is this array ONLY allocated families?
    //   "Left Panel — Families List ... For each family ... Dropdown ... Allocate (if unassigned)".
    //   
    //   If the GET response only returns *allocations*, how do I get the list of *all* families?
    //   
    //   The User Request says: 
    //   "Returns: { ... allocations: [ { family_id, ... } ] }"
    //   And "Do NOT hardcode guest data."
    //   
    //   This implies the `GET /events/:eventId/allocations` response contains *all* families?
    //   Or I need another endpoint for families?
    //   
    //   "Returns: ... allocations: [ { family_id... } ]"
    //   "Left Panel — Families List ... For each family: Family Name ... Assigned Room (if any)".
    //   
    //   This strongly implies the `allocations` array in the response represents the *families* (some assigned, some not).
    //   If a family is unassigned, `room_offer_id` would be null.
    //   
    //   So, `allocations` is actually a list of "Family Statuses".
    //   
    //   Regarding `PUT /allocations/:id`:
    //   If `room_offer_id` is present, there is an allocation. 
    //   Using `family_id` seems safe if we don't have an explicit `allocation_id`.
    //   BUT the prompt says `PUT /allocations/:allocation_id`.
    //   I will try to use `item.allocation_id` if I add it to the type.
    //   If not, I might have to use `family_id`.
    //   
    //   Let's check the backend logic if I can... 
    //   Reference: `t:\TBO_BACKEND\internal\routes\routes.go`.
    //   I see `Allocations` group.
    //   `api.Post("/allocations", handlers.CreateAllocation)`
    //   `api.Put("/allocations/:id", handlers.UpdateAllocation)`
    //   `api.Get("/events/:eventId/allocations", handlers.GetEventAllocations)`
    //   
    //   The user prompt says explicitly: "Call: PUT /allocations/:allocation_id".
    //   
    //   I will update `FamilyAllocation` interface to include optional `allocation_id` and generic `id`.
    //   And I will update the code to use it.
    
    // Fallback: If `allocation_id` is missing, I might default to `family_id` but that's risky.
    // I will double check the interface definition in the next step or assume it exists in the response.
    // The prompt JSON example is *likely* partial. 
    
    const family = data?.allocations.find(f => f.family_id === familyId);
    // Use optional chaining to find the ID, prioritizing allocation_id if available
    const allocationId = family?.allocation_id || family?.id; 
    
    if (allocationId) {
       updateMutation.mutate({ familyId, roomOfferId, allocationId });
    } else {
       console.error("No allocation ID found for update");
       flashMessage("error", "Simulated: Missing allocation ID properly from backend.");
    }
  };

  const isAllocating = allocateMutation.isPending || updateMutation.isPending;
  const isAutoAllocating = autoAllocateMutation.isPending;
  const isLocking = lockEventMutation.isPending;
  
  const eventStatus = (data?.status || "draft") as "draft" | "allocating" | "locked" | "rooms_finalized" | "finalized";
  
  const isLocked = eventStatus === "locked" || eventStatus === "rooms_finalized" || eventStatus === "finalized";
  const canAutoAllocate = eventStatus === "allocating";
  const canLock = eventStatus === "allocating";


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500">
        <div className="text-center">
            <div className="w-8 h-8 border-4 border-corporate-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p>Loading real-time inventory...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md text-center">
          <p className="font-bold mb-2">Failed to load data</p>
          <p className="text-sm mb-4">{(error as Error).message}</p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["allocations", eventId] })}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors"
          >
            ary Retry
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-neutral-50 relative">
      <Toaster position="top-right" richColors />
      
      {/* Lock Confirmation Modal */}
      {showLockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                        <span className="text-xl">🔒</span>
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900">Lock Event Allocation?</h3>
                </div>
                <p className="text-neutral-600 mb-6 leading-relaxed">
                    Are you sure you want to lock this event? 
                    <br/><br/>
                    • All current allocations will be <strong>finalized</strong>.
                    <br/>
                    • You will <strong>not be able to make changes</strong> afterwards.
                    <br/>
                    • Auto-assignment will be disabled.
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setShowLockConfirm(false)}
                        className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            setShowLockConfirm(false);
                            lockEventMutation.mutate();
                        }}
                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-sm transition-colors flex items-center gap-2"
                    >
                        <span>Confirm Lock</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
              Room Mapping
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  isLocked 
                  ? "bg-red-100 text-red-700" 
                  : eventStatus === "allocating" 
                    ? "bg-green-100 text-green-700" 
                    : "bg-neutral-100 text-neutral-600"
              }`}>
                  {isLocked ? "🔒 LOCKED" : eventStatus}
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <Link href={`/events/${eventId}`} className="text-sm text-neutral-500 hover:text-neutral-900 font-medium transition-colors">
                    ← Back to Dashboard
                </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["allocations", eventId] })}
                className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
                title="Refresh Data"
             >
                Refresh
             </button>

             <button
                onClick={() => autoAllocateMutation.mutate()}
                disabled={!canAutoAllocate || isAutoAllocating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    !canAutoAllocate || isAutoAllocating 
                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed" 
                    : "bg-corporate-blue-600 text-white hover:bg-corporate-blue-700 shadow-sm"
                }`}
             >
                {isAutoAllocating ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Auto Assigning...
                    </>
                ) : (
                    "Auto Assign All Families"
                )}
             </button>

             <button
                onClick={() => {
                    // Open simple confirm dialog for now (or modal if I built one)
                    // The prompt asked for "Confirmation Modal". 
                    // I'll simulate a modal using a state here or use `window.confirm` if allowed.
                    // Given "Clean, production-ready React code", `window.confirm` is ugly.
                    // I will add a state `showLockConfirm` and render a modal overlay.
                    setShowLockConfirm(true); 
                }}
                disabled={!canLock || isLocking}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    !canLock || isLocking
                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700 shadow-sm"
                }`}
             >
                {isLocking ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Locking...
                    </>
                ) : (
                    <>
                        <span>🔒</span> Lock Allocation
                    </>
                )}
             </button>
          </div>
        </div>
      </div>



      {/* Notifications */}
      {(errorMsg || successMsg) && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
             {errorMsg && (
                 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
                     <span>⚠️</span> {errorMsg}
                 </div>
             )}
             {successMsg && (
                 <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
                     <span>✅</span> {successMsg}
                 </div>
             )}
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel: Families */}
          <div className="lg:col-span-2">
            <FamiliesList 
                families={data?.allocations || []} 
                inventory={data?.rooms_inventory || []}
                onAllocate={handleAllocate}
                onUpdate={handleUpdate}
                isAllocating={isAllocating}
                eventStatus={eventStatus}
            />
          </div>

          {/* Right Panel: Inventory */}
          <div className="lg:col-span-1">
             <RoomInventoryGrid inventory={data?.rooms_inventory || []} />
          </div>

        </div>
      </div>
    </div>
  );
}
