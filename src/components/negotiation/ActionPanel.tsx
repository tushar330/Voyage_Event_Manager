import React from "react";

interface ActionPanelProps {
  isAgent: boolean;
  onLockDeal?: () => void;
  onSubmitCounter?: () => void;
  isSubmitting?: boolean;
  canLock?: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  isAgent,
  onLockDeal,
  onSubmitCounter,
  isSubmitting = false,
  canLock = false,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-end gap-3">
      {isAgent ? (
        <button
          onClick={onLockDeal}
          disabled={!canLock || isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Locking..." : "Accept & Lock Deal"}
        </button>
      ) : (
        <button
          onClick={onSubmitCounter}
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Counter Offer"}
        </button>
      )}
    </div>
  );
};
