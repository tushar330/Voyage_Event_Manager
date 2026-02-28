"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  NegotiationItem,
  ChatMessage,
  NegotiationRound,
} from "@/types/negotiation";
import { toast } from "sonner";

interface NegotiationState {
  items: NegotiationItem[];
  messages: ChatMessage[];
  status: "draft" | "sent_to_tbo" | "countered_by_tbo" | "locked" | "waiting_for_tbo_agent" | "waiting_for_agent";
  shareToken: string | null;
  eventDetails?: {
    name: string;
    date: string;
    location: string;
    totalBudget: number;
  };
  history: NegotiationRound[];
  expiry?: string; // ISO Date
}

interface NegotiationContextType extends NegotiationState {
  initNegotiation: (items: NegotiationItem[], eventDetails: any) => void;
  syncItemsFromCart: (freshItems: NegotiationItem[], eventDetails: any) => void;
  updateItemPrice: (itemId: string, price: number, isAgent: boolean) => void;
  updateItemMessage: (itemId: string, message: string) => void;
  sendMessage: (message: string, sender: "Agent" | "TBO Manager" | "System") => void;
  sendToHotel: () => void;
  submitCounterOffer: () => void;
  lockDeal: () => void;
  refreshState: () => void;
  updateEventDetails: (details: any) => void;
}

const NegotiationContext = createContext<NegotiationContextType | undefined>(
  undefined,
);

export const NegotiationProvider: React.FC<{
  children: React.ReactNode;
  eventId?: string;
}> = ({ children, eventId }) => {
  const [state, setState] = useState<NegotiationState>({
    items: [],
    messages: [],
    status: "draft",
    shareToken: null,
    history: [],
  });

  // Load state from localStorage on mount
  useEffect(() => {
    if (!eventId) return;
    const saved = localStorage.getItem(`negotiation_${eventId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Map old "Hotel" values to "TBO Manager" for existing persistent data
        const mappedMessages = (parsed.messages || []).map((m: any) => ({
          ...m,
          sender: m.sender === "Hotel" ? "TBO Manager" : m.sender,
          message: m.message.replace(/Hotel/g, "TBO Manager")
        }));
        const mappedHistory = (parsed.history || []).map((h: any) => ({
          ...h,
          author: h.author === "Hotel" ? "TBO Manager" : h.author
        }));
        
        // Merge with default state to ensure new fields like history are present
        setState((prev) => ({
          ...prev,
          ...parsed,
          messages: mappedMessages,
          history: mappedHistory,
        }));
      } catch (e) {
        console.error("Failed to parse negotiation state", e);
      }
    }
  }, [eventId]);

  // Persist state changes
  useEffect(() => {
    if (!eventId || !state.items.length) return;
    localStorage.setItem(`negotiation_${eventId}`, JSON.stringify(state));
  }, [state, eventId]);

  // Sync state across tabs
  useEffect(() => {
    if (!eventId) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `negotiation_${eventId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setState((prev) => ({
            ...prev,
            ...parsed,
            history: parsed.history || [],
          }));
        } catch (err) {
          console.error("Failed to parse cross-tab negotiation state", err);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [eventId]);

  const initNegotiation = useCallback((items: NegotiationItem[], eventDetails: any) => {
    if (state.items.length > 0) return; // Already initialized
    const token = "neg_" + Math.random().toString(36).substr(2, 9);

    // Default expiry to 24 hours from now
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);

    setState({
      items,
      messages: [
        {
          id: "init",
          sender: "System",
          message: "Negotiation Session Created",
          timestamp: new Date().toISOString(),
        },
      ],
      status: "draft",
      shareToken: token,
      eventDetails,
      history: [],
      expiry: expiryDate.toISOString(),
    });
    localStorage.setItem(`token_map_${token}`, eventId!);
  }, [state.items.length, eventId]);

  /**
   * syncItemsFromCart: always keeps negotiation items in sync with the cart.
   * - Adds new cart items not yet in the negotiation state.
   * - Removes negotiation items that no longer exist in cart.
   * - Updates originalPrice if the cart's locked_price changed.
   * - Preserves targetPrice / currentPrice (negotiation-specific values).
   */
  const syncItemsFromCart = useCallback((freshItems: NegotiationItem[], eventDetails: any) => {
    setState((prev) => {
      const freshIds = new Set(freshItems.map((i) => i.id));
      const prevMap = new Map(prev.items.map((i) => [i.id, i]));

      // Merge: keep existing negotiation state for known items, add new ones
      const merged: NegotiationItem[] = freshItems.map((fresh) => {
        const existing = prevMap.get(fresh.id);
        if (existing) {
          return {
            ...existing,
            name: fresh.name,
            quantity: fresh.quantity,
            originalPrice: fresh.originalPrice, // Update if cart price changed
          };
        }
        return fresh; // New item from cart
      });

      // Only update if something actually changed
      const unchanged =
        merged.length === prev.items.length &&
        merged.every((m, i) => JSON.stringify(m) === JSON.stringify(prev.items[i]));
      if (unchanged && JSON.stringify(prev.eventDetails) === JSON.stringify(eventDetails)) {
        return prev;
      }

      // If no items at all yet, also initialise the session
      if (prev.items.length === 0 && merged.length > 0) {
        const token = "neg_" + Math.random().toString(36).substr(2, 9);
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);
        if (eventId) localStorage.setItem(`token_map_${token}`, eventId);
        return {
          ...prev,
          items: merged,
          eventDetails,
          shareToken: prev.shareToken || token,
          messages: prev.messages.length === 0
            ? [{ id: "init", sender: "System" as const, message: "Negotiation Session Created", timestamp: new Date().toISOString() }]
            : prev.messages,
          expiry: prev.expiry || expiryDate.toISOString(),
        };
      }

      return { ...prev, items: merged, eventDetails };
    });
  }, [eventId]);

  const updateItemPrice = useCallback((itemId: string, price: number, isAgent: boolean) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return isAgent
          ? { ...item, targetPrice: price } // Agent updates target
          : { ...item, currentPrice: price }; // Hotel updates offer
      }),
    }));
  }, []);

  const updateItemMessage = useCallback((itemId: string, message: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, message };
      }),
    }));
  }, []);

  const sendMessage = (
    message: string,
    sender: "Agent" | "TBO Manager" | "System",
  ) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender,
      message,
      timestamp: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
    }));
  };

  const createSnapshot = (
    author: "Agent" | "TBO Manager",
    currentState: NegotiationState,
  ): NegotiationRound => {
    // Logic to determine round ID could be improved, but length + 1 is simple enough for now
    return {
      id: `round-${(currentState.history?.length || 0) + 1}`,
      timestamp: new Date().toISOString(),
      items: JSON.parse(JSON.stringify(currentState.items)),
      author,
    };
  };

  const sendToTbo = () => {
    setState((prev) => {
      const snapshot = createSnapshot("Agent", prev);
      return {
        ...prev,
        status: "sent_to_tbo",
        history: [...(prev.history || []), snapshot],
      };
    });
    sendMessage("Offer sent to TBO Manager", "System");
    toast.success("Offer sent to TBO Manager!");
  };

  const submitCounterOffer = () => {
    setState((prev) => {
      const snapshot = createSnapshot("TBO Manager", prev);
      return {
        ...prev,
        status: "countered_by_tbo",
        history: [...(prev.history || []), snapshot],
      };
    });
    sendMessage("Counter offer received from TBO Manager", "System");
    toast.success("Counter offer submitted!");
  };

  const lockDeal = () => {
    setState((prev) => ({ ...prev, status: "locked" }));
    sendMessage("Deal Locked by Agent", "System");
    toast.success("Deal Locked!");
  };

  const refreshState = () => {
    if (!eventId) return;
    const saved = localStorage.getItem(`negotiation_${eventId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      const mappedMessages = (parsed.messages || []).map((m: any) => ({
        ...m,
        sender: m.sender === "Hotel" ? "TBO Manager" : m.sender,
        message: m.message.replace(/Hotel/g, "TBO Manager")
      }));
      const mappedHistory = (parsed.history || []).map((h: any) => ({
        ...h,
        author: h.author === "Hotel" ? "TBO Manager" : h.author
      }));

      setState((prev) => ({
        ...prev,
        ...parsed,
        messages: mappedMessages,
        history: mappedHistory,
      }));
    }
  };

  const updateEventDetails = React.useCallback((details: any) => {
    setState((prev) => {
      // Prevent infinite loops by checking if details actually changed deeply
      if (JSON.stringify(prev.eventDetails) === JSON.stringify(details)) {
        return prev;
      }
      return { ...prev, eventDetails: details };
    });
  }, []);

  return (
    <NegotiationContext.Provider
      value={{
        ...state,
        initNegotiation,
        syncItemsFromCart,
        updateItemPrice,
        updateItemMessage, // New export
        sendMessage,
        sendToHotel: sendToTbo, // Re-export as sendToHotel so UI components don't break
        submitCounterOffer,
        lockDeal,
        refreshState,
        updateEventDetails,
      }}
    >
      {children}
    </NegotiationContext.Provider>
  );
};

export const useNegotiation = () => {
  const context = useContext(NegotiationContext);
  if (context === undefined) {
    throw new Error("useNegotiation must be used within a NegotiationProvider");
  }
  return context;
};
