"use client";

import { FamilyAllocation, RoomInventory } from "@/types/allocation";
import { useState } from "react";

interface FamiliesListProps {
  families: FamilyAllocation[];
  inventory: RoomInventory[];
  onAllocate: (familyId: string, roomOfferId: string) => void;
  onUpdate: (familyId: string, roomOfferId: string) => void; // Using familyId to find allocation, or we can pass allocation object
  isAllocating: boolean;
  eventStatus: string;
}

export default function FamiliesList({
  families,
  inventory,
  onAllocate,
  onUpdate,
  isAllocating,
  eventStatus,
}: FamiliesListProps) {
  const [selectedRooms, setSelectedRooms] = useState<Record<string, string>>({});

  const handleRoomSelect = (familyId: string, roomId: string) => {
    setSelectedRooms((prev) => ({ ...prev, [familyId]: roomId }));
  };

  const isAllocationDisabled = eventStatus !== "allocating";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
        <h2 className="text-lg font-bold text-neutral-900">Families</h2>
        <p className="text-sm text-neutral-500">
          Assign rooms to families securely
        </p>
      </div>
      <div className="divide-y divide-neutral-100 max-h-[calc(100vh-250px)] overflow-y-auto">
        {families.map((family) => {
          const isAssigned = !!family.room_offer_id;
          const selectedRoomId = selectedRooms[family.family_id] || "";
          const familySize = family.guests.length;

          // Find the selected room from inventory to check capacity/availability
          const targetRoom = inventory.find((r) => r.room_offer_id === selectedRoomId);
          
          // Validation logic for "Allocate" button
          let canAllocate = true;
          if (!selectedRoomId) canAllocate = false;
          if (targetRoom) {
             if (targetRoom.available <= 0 && targetRoom.room_offer_id !== family.room_offer_id) canAllocate = false; // Allow if it is same room? No, this is for new selection.
             // Actually backend handles "available", but UI should block zero availability room selection ideally.
             // But if we selected a room that is full, we can't allocate.
             if (targetRoom.available <= 0) canAllocate = false;
             if (familySize > targetRoom.capacity) canAllocate = false;
          } else {
             canAllocate = false;
          }

          // Separate validation for "Update" (Change Room)
          // Ideally similar: needs a selected room, room must have capacity & availability.
          
          const handleAction = () => {
             if (isAssigned) {
                onUpdate(family.family_id, selectedRoomId);
             } else {
                onAllocate(family.family_id, selectedRoomId);
             }
             // Clear selection after action? Maybe not until success, but parent handles that.
          };

          return (
            <div key={family.family_id} className="p-6 hover:bg-neutral-50 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    {family.guests[0]?.guest_name || "Unknown Family"} 
                    {family.guests.length > 1 && ` + ${family.guests.length - 1}`}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {family.guests.map((g) => (
                      <span key={g.guest_id} className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full">
                        {g.guest_name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    isAssigned 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {!isAssigned && <span>⚠️</span>}
                    {isAssigned ? "Assigned" : "Unassigned"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-corporate-blue-500 focus:border-corporate-blue-500 transition-all disabled:bg-neutral-100 disabled:text-neutral-400"
                    value={selectedRoomId}
                    onChange={(e) => handleRoomSelect(family.family_id, e.target.value)}
                    disabled={isAllocationDisabled || isAllocating}
                  >
                    <option value="">
                      {isAssigned 
                        ? `Current: ${family.room_name}` 
                        : "Select a room..."}
                    </option>
                    {inventory.map((room) => {
                      const isFull = room.available <= 0;
                      const isTooSmall = familySize > room.capacity;
                      const isCurrent = room.room_offer_id === family.room_offer_id;
                      
                      // Disable if full or too small, UNLESS it's the current room (though re-selecting current is no-op)
                      // Actually, for "Change Room", we want to filter out current room usually, or just show it.
                      // If it is current, we don't need to disable it, but selecting it does nothing.
                      
                      const disabled = !isCurrent && (isFull || isTooSmall);

                      return (
                        <option 
                          key={room.room_offer_id} 
                          value={room.room_offer_id}
                          disabled={disabled}
                        >
                          {room.room_name} (Cap: {room.capacity}, Avail: {room.available}) 
                          {isFull && !isCurrent ? " - Full" : ""}
                          {isTooSmall && !isCurrent ? " - Too Small" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <button
                  onClick={handleAction}
                  disabled={!canAllocate || isAllocating || isAllocationDisabled}
                  className={`h-10 px-4 rounded-lg text-sm font-medium transition-all ${
                     !canAllocate || isAllocating || isAllocationDisabled
                     ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                     : isAssigned
                       ? "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                       : "bg-corporate-blue-600 text-white hover:bg-corporate-blue-700 shadow-sm"
                  }`}
                >
                  {isAllocating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : isAssigned ? (
                    "Change Room"
                  ) : (
                    "Allocate"
                  )}
                </button>
              </div>
            </div>
          );
        })}
        {families.length === 0 && (
            <div className="p-8 text-center text-neutral-500">
                No families found.
            </div>
        )}
      </div>
    </div>
  );
}
