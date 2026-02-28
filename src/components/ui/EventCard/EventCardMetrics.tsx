import { memo } from 'react';
import { getInventoryRiskColor } from '@/modules/inventory/utils';
import { EventCardMetricsProps } from './types';

/**
 * EventCard Metrics subcomponent
 * Displays guest count, hotel count, and inventory consumption
 * Optimized with React.memo for performance
 */
export const EventCardMetrics = memo(function EventCardMetrics({
  guestCount,
  inventoryConsumed,
  budgetSpent = 0,
  totalBudget = 0,
  daysUntilEvent = 0,
  pendingActions = 0,
  pendingActionDetails = [],
}: EventCardMetricsProps) {
  const inventoryColor = getInventoryRiskColor(inventoryConsumed);

  const budgetUsage = totalBudget > 0 ? (budgetSpent / totalBudget) * 100 : 0;
  
  return (
    <div className="pt-4 border-t border-neutral-200">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Guests</p>
          <p className="text-lg font-semibold text-neutral-900">{guestCount}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-1">Inventory Used</p>
          <p className={`text-lg font-semibold ${inventoryColor}`}>{inventoryConsumed}%</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-1">Countdown</p>
          <p className="text-lg font-semibold text-neutral-900">
            {daysUntilEvent < 0 ? 'Ended' : daysUntilEvent === 0 ? 'Today' : `${daysUntilEvent} Days`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs mt-2">
         {pendingActions > 0 && (
          <div className="relative group/tooltip cursor-help">
             <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
               {pendingActions} Pending Action{pendingActions > 1 ? 's' : ''}
             </span>
             {pendingActionDetails && pendingActionDetails.length > 0 && (
               <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-3 bg-neutral-900 border border-neutral-700 shadow-xl rounded-lg text-white z-50">
                 <p className="font-semibold mb-2 pb-1 border-b border-neutral-700">Required Actions:</p>
                 <ul className="list-disc pl-4 space-y-1">
                   {pendingActionDetails.map((detail, idx) => (
                     <li key={idx} className="text-neutral-200 leading-snug">{detail}</li>
                   ))}
                 </ul>
                 {/* Tooltip Arrow */}
                 <div className="absolute left-6 top-full -mt-1 w-3 h-3 bg-neutral-900 border-b border-r border-neutral-700 transform rotate-45"></div>
               </div>
             )}
           </div>
         )}
         {totalBudget > 0 && (
            <div className="flex-1 ml-4 text-right" title={`Spent: ₹${budgetSpent.toLocaleString('en-IN')} / Total: ₹${totalBudget.toLocaleString('en-IN')}`}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-neutral-500">Budget Spent</p>
                <p className="text-neutral-900 font-medium text-[10px]">₹{budgetSpent.toLocaleString('en-IN')} / ₹{totalBudget.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full ${budgetUsage > 90 ? 'bg-red-500' : 'bg-corporate-blue-100'}`} 
                  style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                ></div>
              </div>
            </div>
         )}
      </div>
    </div>
  );
});
