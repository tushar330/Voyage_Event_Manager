"use client";

import { RoomInventory } from "@/types/allocation";

interface RoomInventoryGridProps {
  inventory: RoomInventory[];
}

export default function RoomInventoryGrid({ inventory }: RoomInventoryGridProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden h-fit sticky top-6">
      <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-neutral-900">Live Inventory</h2>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
           <span className="w-2 h-2 rounded-full bg-green-500"></span> Available
           <span className="w-2 h-2 rounded-full bg-red-500 ml-2"></span> Full
        </div>
      </div>
      
      <div className="divide-y divide-neutral-100">
        <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-neutral-50/30 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            <div className="col-span-2">Room Type</div>
            <div className="text-center">Cap</div>
            <div className="text-right">Avail / Total</div>
        </div>
        
        {inventory.map((room) => {
            const isFull = room.available <= 0;
            const utilization = room.total > 0 ? ((room.total - room.available) / room.total) * 100 : 100;
            
            return (
                <div key={room.room_offer_id} className="grid grid-cols-4 gap-4 px-6 py-4 items-center hover:bg-neutral-50 transition-colors">
                    {/* Room Type */}
                    <div className="col-span-2">
                        <p className="font-medium text-neutral-900">{room.room_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden max-w-[100px]">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${utilization}%` }}
                                ></div>
                            </div>
                            {isFull && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 uppercase tracking-wide">
                                    FULL
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Capacity */}
                    <div className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold">
                            {room.capacity}
                        </span>
                    </div>

                    {/* Available / Total */}
                    <div className="text-right font-mono text-sm">
                        <span className={isFull ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                            {room.available}
                        </span>
                        <span className="text-neutral-400 mx-1">/</span>
                        <span className="text-neutral-600">{room.total}</span>
                    </div>
                </div>
            )
        })}

        {inventory.length === 0 && (
             <div className="p-8 text-center text-neutral-500">
                No rooms available.
            </div>
        )}
      </div>
      
      <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-xs text-center text-neutral-400">
        Read-only view • Updates in real-time
      </div>
    </div>
  );
}
