import React from "react";
import { NegotiationItem } from "@/types/negotiation";
import { VarianceIndicator } from "./VarianceIndicator";

interface NegotiationTableProps {
  items: NegotiationItem[];
  isAgent: boolean;
  onPriceChange?: (id: string, newPrice: number) => void;
  onMessageChange?: (id: string, message: string) => void;
}

export const NegotiationTable: React.FC<NegotiationTableProps> = ({
  items,
  isAgent,
  onPriceChange,
  onMessageChange,
}) => {
  const [localPrices, setLocalPrices] = React.useState<Record<string, string>>({});

  // Sync external props to local state only when they differ mathematically, to allow empty strings during typing
  React.useEffect(() => {
    setLocalPrices((prev) => {
      const next = { ...prev };
      let changed = false;
      items.forEach((item) => {
        const val = isAgent ? item.targetPrice : item.currentPrice;
        const currentLocal = prev[item.id];
        // If local is undefined, or mathematically different, update it
        if (currentLocal === undefined || (currentLocal !== "" && Number(currentLocal) !== val)) {
          next[item.id] = String(val);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [items, isAgent]);

  const handlePriceChangeLocal = (id: string, val: string) => {
    setLocalPrices(prev => ({ ...prev, [id]: val }));
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && onPriceChange) {
      onPriceChange(id, parsed);
    } else if (val === "" && onPriceChange) {
      onPriceChange(id, 0); // fallback if completely cleared
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]"
            >
              Item
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]"
            >
              Type
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]"
            >
              Quantity
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
            >
              Original Price
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[130px]"
            >
              {isAgent ? "Target Price" : "Requested Price"}
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]"
            >
              {isAgent ? "Current Offer" : "Your Offer"}
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]"
            >
              Variance
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <React.Fragment key={item.id}>
              <tr className={item.message ? "bg-blue-50/30" : ""}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                  {/* Message Indicator */}
                  {item.message && (
                    <div className="text-xs text-blue-600 mt-1 italic flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                      {item.message}
                    </div>
                  )}
                  {/* Add Remark Input (Toggle could be better but keeping simple for now) */}
                  <button
                    className="text-xs text-gray-400 hover:text-indigo-600 underline mt-1 block"
                    onClick={() => {
                      const msg = prompt(
                        "Add a remark for this item:",
                        item.message || "",
                      );
                      if (msg !== null && onMessageChange)
                        onMessageChange(item.id, msg);
                    }}
                  >
                    {item.message ? "Edit Remark" : "Add Remark"}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.quantity}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                  ₹{(item.originalPrice ?? 0).toLocaleString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {/* Agent can edit their target price. Hotel sees it as read-only requested price */}
                  {isAgent ? (
                    <div className="relative rounded-md shadow-sm w-[130px]">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                        <span className="text-gray-500 text-xs">₹</span>
                      </div>
                      <input
                        type="number"
                        className="block w-full rounded-md border-0 py-1.5 pl-5 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
                        value={localPrices[item.id] ?? item.targetPrice}
                        onChange={(e) => handlePriceChangeLocal(item.id, e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="font-medium">₹{(item.targetPrice || item.originalPrice).toLocaleString()}</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {isAgent ? (
                    // Agent view: Read-only current offer (from Hotel) or Original if not yet countered
                    <span className="font-medium">₹{(item.currentPrice ?? 0).toLocaleString()}</span>
                  ) : (
                    // Hotel view: Editable input for Counter Offer
                    <div className="relative rounded-md shadow-sm w-[130px]">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                        <span className="text-gray-500 text-xs">₹</span>
                      </div>
                      <input
                        type="number"
                        className="block w-full rounded-md border-0 py-1.5 pl-5 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6"
                        value={localPrices[item.id] ?? (item.currentPrice ?? 0)}
                        onChange={(e) => handlePriceChangeLocal(item.id, e.target.value)}
                      />
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  <VarianceIndicator
                    current={item.currentPrice ?? 0}
                    target={isAgent ? (item.targetPrice ?? 0) : (item.originalPrice ?? 0)}
                  />
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
