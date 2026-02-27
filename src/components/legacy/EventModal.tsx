"use client";

import { useState, useEffect } from "react";
import { useEvents } from "@/context/EventContext";
import { Event } from "@/modules/events/types";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event; // Optional event for editing
}

export default function EventModal({
  isOpen,
  onClose,
  event,
}: EventModalProps) {
  const { addEvent, updateEvent } = useEvents();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    startDate: "",
    endDate: "",
    organizer: "",
  });

  // Populate form when event prop changes or modal opens
  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        name: event.name || "",
        location: event.location || "",
        startDate: event.startDate
          ? new Date(event.startDate).toISOString().split("T")[0]
          : "",
        endDate: event.endDate
          ? new Date(event.endDate).toISOString().split("T")[0]
          : "",
        organizer: event.organizer || "Me", // Default to 'Me' if missing
      });
    } else if (!event && isOpen) {
      // Reset for create mode
      setFormData({
        name: "",
        location: "",
        startDate: "",
        endDate: "",
        organizer: "Me", // Default to 'Me' for new events
      });
    }
  }, [event, isOpen]);

  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (event) {
        // Update Mode
        await updateEvent(event.id, {
          name: formData.name,
          location: formData.location,
          startDate: formData.startDate,
          endDate: formData.endDate,
          organizer: formData.organizer,
        });
        onClose();
      } else {
        // Create Mode
        const newEvent = {
          name: formData.name,
          location: formData.location,
          startDate: formData.startDate,
          endDate: formData.endDate,
          organizer: formData.organizer,
          status: "upcoming" as const,
          guestCount: 0,
          hotelCount: 0,
          inventoryConsumed: 0,
        };
        await addEvent(newEvent as any);
        setStep(2); // Show success
        setTimeout(() => {
          onClose();
          setStep(1);
        }, 2000);
      }
    } catch (e) {
      console.error("Failed to save event", e);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    onClose();
    setStep(1);
    setFormData({
      name: "",
      location: "",
      startDate: "",
      endDate: "",
      organizer: "",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              {event ? "Edit Event" : "Create New Event"}
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              {step === 1 ? "Event Details" : "Success!"}
            </p>
          </div>
          <button
            onClick={resetAndClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-blue-100"
                  placeholder="e.g., Ananya & Rahul Wedding"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Location *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-blue-100"
                >
                  <option value="" disabled>
                    Select Location
                  </option>
                  <option value="DEL">DEL</option>
                </select>
                <p className="text-sm text-neutral-500 mt-1">Delhi</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    min={today}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value, endDate: formData.endDate && formData.endDate < e.target.value ? e.target.value : formData.endDate })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate || today}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Organizer *
                </label>
                <input
                  type="text"
                  value={formData.organizer}
                  onChange={(e) =>
                    setFormData({ ...formData, organizer: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-blue-100"
                  placeholder="e.g., Ananya Sharma"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                {event ? "Event Updated" : "Inventory Vault Created"}
              </h3>
              <p className="text-neutral-600">
                {event
                  ? "Your event details have been updated."
                  : "Your dedicated inventory vault has been created successfully."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 1 && (
          <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
            <button
              onClick={resetAndClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                !formData.name ||
                !formData.location ||
                !formData.startDate ||
                !formData.endDate ||
                !formData.organizer
              }
              className="px-6 py-2 bg-corporate-blue-100 hover:bg-corporate-blue-200 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Saving..."
                : event
                  ? "Update Event"
                  : "Create Event"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
