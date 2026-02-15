"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Event } from "@/modules/events/types";
import { useAuth } from "@/context/AuthContext";

interface EventContextType {
  events: Event[];
  addEvent: (eventData: Partial<Event>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const fetchEvents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      // console.log("Fetched Events Data:", data); // Debug log removed

      // API Response structure: { success: true, data: { message: "...", events: [...] } }
      const eventsList = data.data?.events || [];

      const mappedEvents = eventsList.map((e: any) => ({
        id: e.id || e.ID,
        name: e.name !== undefined ? e.name : e.Name,
        location: e.location !== undefined ? e.location : e.Location,
        startDate: e.startDate || e.StartDate,
        endDate: e.endDate || e.EndDate,
        organizer: "Me",
        guestCount: 0,
        hotelCount: 0,
        inventoryConsumed: 0,
        status: (e.status || e.Status || "draft").toLowerCase(),
        headGuestId: e.headGuestId || e.HeadGuestID,
      }));
      // console.log("Mapped Events:", mappedEvents); // Debug log removed
      setEvents(mappedEvents);
    } catch (err: any) {
      console.error("Fetch events error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchEvents();
    } else {
      setEvents([]); // Clear events on logout or if not authenticated
    }
  }, [isAuthenticated, token]);

  const addEvent = async (eventData: Partial<Event>) => {
    if (!token) return;
    setLoading(true);
    try {
      const payload = {
        name: eventData.name,
        location: eventData.location,
        startDate: eventData.startDate, // Assuming ISO string from frontend
        endDate: eventData.endDate,
        hotelId: "default", // Backend requires this? It was string.
        roomsInventory: [],
      };

      const res = await fetch(`${backendUrl}/api/v1/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create event");
      }

      await fetchEvents(); // Refresh list
    } catch (err: any) {
      console.error("Create event error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: string, updatedEvent: Partial<Event>) => {
    if (!token) return;
    setLoading(true);
    try {
      const payload = {
        name: updatedEvent.name,
        location: updatedEvent.location,
        startDate: updatedEvent.startDate,
        endDate: updatedEvent.endDate,
        roomsInventory: updatedEvent.roomsInventory,
      };

      const res = await fetch(`${backendUrl}/api/v1/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to update event");
      }

      await fetchEvents();
    } catch (err: any) {
      console.error("Update event error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/events/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete event");
      }

      // Optimistically remove or refetch
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      console.error("Delete event error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <EventContext.Provider
      value={{ events, addEvent, updateEvent, deleteEvent, loading, error }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventProvider");
  }
  return context;
}
