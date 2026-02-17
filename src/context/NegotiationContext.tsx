"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  NegotiationItem,
  ChatMessage,
  NegotiationRound,
} from "@/types/negotiation";
import { toast } from "sonner";

interface NegotiationState {
  items: NegotiationItem[];
  messages: ChatMessage[];
  status: "draft" | "sent_to_hotel" | "countered_by_hotel" | "locked";
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
  updateItemPrice: (itemId: string, price: number, isAgent: boolean) => void;
  updateItemMessage: (itemId: string, message: string) => void;
  sendMessage: (message: string, sender: "Agent" | "Hotel" | "System") => void;
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
        // Merge with default state to ensure new fields like history are present
        setState((prev) => ({
          ...prev,
          ...parsed,
          history: parsed.history || [],
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

  const initNegotiation = (items: NegotiationItem[], eventDetails: any) => {
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
  };

  const updateItemPrice = (itemId: string, price: number, isAgent: boolean) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return isAgent
          ? { ...item, targetPrice: price } // Agent updates target
          : { ...item, currentPrice: price }; // Hotel updates offer
      }),
    }));
  };

  const updateItemMessage = (itemId: string, message: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, message };
      }),
    }));
  };

  const sendMessage = (
    message: string,
    sender: "Agent" | "Hotel" | "System",
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
    author: "Agent" | "Hotel",
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

  const sendToHotel = () => {
    setState((prev) => {
      const snapshot = createSnapshot("Agent", prev);
      return {
        ...prev,
        status: "sent_to_hotel",
        history: [...(prev.history || []), snapshot],
      };
    });
    sendMessage("Offer sent to Hotel", "System");
    toast.success("Offer sent to Hotel!");
  };

  const submitCounterOffer = () => {
    setState((prev) => {
      const snapshot = createSnapshot("Hotel", prev);
      return {
        ...prev,
        status: "countered_by_hotel",
        history: [...(prev.history || []), snapshot],
      };
    });
    sendMessage("Counter offer received from Hotel", "System");
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
      setState((prev) => ({
        ...prev,
        ...parsed,
        history: parsed.history || [],
      }));
    }
  };

  const updateEventDetails = (details: any) => {
    setState((prev) => ({ ...prev, eventDetails: details }));
  };

  return (
    <NegotiationContext.Provider
      value={{
        ...state,
        initNegotiation,
        updateItemPrice,
        updateItemMessage, // New export
        sendMessage,
        sendToHotel,
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
