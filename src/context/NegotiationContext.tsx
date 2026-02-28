"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  NegotiationItem,
  ChatMessage,
  NegotiationRound,
} from "@/types/negotiation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface NegotiationState {
  items: NegotiationItem[];
  messages: ChatMessage[];
  status: "draft" | "sent_to_tbo" | "countered_by_tbo" | "locked" | "waiting_for_tbo_agent" | "waiting_for_agent";
  shareToken: string | null;
  sessionId: string | null;
  eventDetails?: {
    name: string;
    date: string;
    location: string;
    totalBudget: number;
  };
  history: NegotiationRound[];
  expiry?: string;
}

interface NegotiationContextType extends NegotiationState {
  initNegotiation: (items: NegotiationItem[], eventDetails: any) => Promise<void>;
  syncItemsFromCart: (freshItems: NegotiationItem[], eventDetails: any) => void;
  updateItemPrice: (itemId: string, price: number, isAgent: boolean) => void;
  updateItemMessage: (itemId: string, message: string) => void;
  sendMessage: (message: string, sender: "Agent" | "TBO Manager" | "System") => void;
  sendToHotel: () => Promise<void>;
  submitCounterOffer: () => Promise<void>;
  lockDeal: () => Promise<void>;
  refreshState: () => Promise<void>;
  updateEventDetails: (details: any) => void;
  loadSessionByToken: (token: string) => Promise<void>;
}

const NegotiationContext = createContext<NegotiationContextType | undefined>(
  undefined,
);

export const NegotiationProvider: React.FC<{
  children: React.ReactNode;
  eventId?: string;
}> = ({ children, eventId }) => {
  const { token: authToken } = useAuth();

  const [state, setState] = useState<NegotiationState>({
    items: [],
    messages: [],
    status: "draft",
    shareToken: null,
    sessionId: null,
    history: [],
  });

  // Keep chat in localStorage (backend doesn't have a chat model yet)
  const loadChat = (key: string) => {
    try {
      const saved = localStorage.getItem(`chat_${key}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  };

  const saveChat = (key: string, msgs: ChatMessage[]) => {
    try { localStorage.setItem(`chat_${key}`, JSON.stringify(msgs)); } catch {}
  };

  // ── initNegotiation: Call POST /api/v1/negotiation/init ──────────────
  const initNegotiation = useCallback(async (items: NegotiationItem[], eventDetails: any) => {
    if (!eventId || !authToken) return;

    // Build target prices map: cart_item_id -> targetPrice
    const targetPrices: Record<string, number> = {};
    items.forEach((item) => {
      targetPrices[item.id] = item.targetPrice || item.originalPrice;
    });

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/negotiation/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          cart_id: eventId,
          target_prices: targetPrices,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start negotiation");
      }

      const data = await res.json();

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
        status: "waiting_for_tbo_agent",
        shareToken: data.share_token,
        sessionId: data.session_id,
        eventDetails,
        history: [],
      });

      toast.success("Negotiation started! Share the link with TBO Manager.");
    } catch (error: any) {
      toast.error(error.message || "Failed to start negotiation");
      console.error("initNegotiation error:", error);
    }
  }, [eventId, authToken]);

  // ── syncItemsFromCart: update local items (Agent side, before init) ──
  const syncItemsFromCart = useCallback((freshItems: NegotiationItem[], eventDetails: any) => {
    setState((prev) => {
      // If we already have a session, don't overwrite items — they come from backend rounds
      if (prev.sessionId) {
        return {
          ...prev,
          eventDetails: eventDetails || prev.eventDetails,
        };
      }

      // Pre-init: merge fresh cart items into draft state
      const prevMap = new Map(prev.items.map((i) => [i.id, i]));
      const merged: NegotiationItem[] = freshItems.map((fresh) => {
        const existing = prevMap.get(fresh.id);
        if (existing) {
          return {
            ...existing,
            name: fresh.name,
            quantity: fresh.quantity,
            originalPrice: fresh.originalPrice,
          };
        }
        return fresh;
      });

      const unchanged =
        merged.length === prev.items.length &&
        merged.every((m, i) => JSON.stringify(m) === JSON.stringify(prev.items[i]));
      if (unchanged && JSON.stringify(prev.eventDetails) === JSON.stringify(eventDetails)) {
        return prev;
      }

      return {
        ...prev,
        items: merged,
        eventDetails,
      };
    });
  }, []);

  const updateItemPrice = useCallback((itemId: string, price: number, isAgent: boolean) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return isAgent
          ? { ...item, targetPrice: price }
          : { ...item, currentPrice: price };
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
    setState((prev) => {
      const newMsgs = [...prev.messages, newMsg];
      const chatKey = prev.shareToken || eventId || "default";
      saveChat(chatKey, newMsgs);
      return { ...prev, messages: newMsgs };
    });
  };

  // ── sendToHotel (Agent sends proposal to TBO) ── calls POST /negotiation/counter as agent
  const sendToTbo = useCallback(async () => {
    if (!state.shareToken || !authToken) return;

    const newPrices: Record<string, number> = {};
    state.items.forEach((item) => {
      newPrices[item.id] = item.targetPrice || item.originalPrice;
    });

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/negotiation/counter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          session_token: state.shareToken,
          new_prices: newPrices,
          remarks: "Agent proposal update",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send proposal");
      }

      const data = await res.json();

      setState((prev) => ({
        ...prev,
        status: "waiting_for_tbo_agent",
        history: [
          ...prev.history,
          {
            id: `round-${data.round || prev.history.length + 1}`,
            timestamp: new Date().toISOString(),
            items: JSON.parse(JSON.stringify(prev.items)),
            author: "Agent" as const,
          },
        ],
      }));

      sendMessage("Offer sent to TBO Manager", "System");
      toast.success("Offer sent to TBO Manager!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send offer");
    }
  }, [state.shareToken, state.items, authToken]);

  // ── submitCounterOffer (TBO Manager sends counter) ──
  const submitCounterOffer = useCallback(async () => {
    if (!state.shareToken) return;

    const newPrices: Record<string, number> = {};
    state.items.forEach((item) => {
      newPrices[item.id] = item.currentPrice;
    });

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/negotiation/counter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          session_token: state.shareToken,
          new_prices: newPrices,
          remarks: "TBO Manager counter offer",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit counter offer");
      }

      const data = await res.json();

      setState((prev) => ({
        ...prev,
        status: "waiting_for_agent",
        history: [
          ...prev.history,
          {
            id: `round-${data.round || prev.history.length + 1}`,
            timestamp: new Date().toISOString(),
            items: JSON.parse(JSON.stringify(prev.items)),
            author: "TBO Manager" as const,
          },
        ],
      }));

      sendMessage("Counter offer received from TBO Manager", "System");
      toast.success("Counter offer submitted!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit counter offer");
    }
  }, [state.shareToken, state.items]);

  // ── lockDeal: POST /api/v1/negotiation/lock ──
  const lockDeal = useCallback(async () => {
    if (!state.sessionId || !authToken) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/negotiation/lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          session_id: state.sessionId,
        }),
      });

      if (!res.ok) {
        let errMsg = "Failed to lock deal";
        try {
          const errData = await res.json();
          if (errData.error) errMsg = errData.error;
        } catch(e) {}
        throw new Error(errMsg);
      }

      setState((prev) => ({ ...prev, status: "locked" }));
      sendMessage("Deal Locked by Agent", "System");
      toast.success("Deal Locked! Cart items updated with negotiated prices.");
    } catch (error: any) {
      toast.error(error.message || "Failed to lock deal");
    }
  }, [state.sessionId, authToken]);

  // ── refreshState: GET /api/v1/negotiation/token/:token ──
  // Loads the latest session state from backend
  const refreshState = useCallback(async () => {
    // DO NOT try to load until we have an auth token on the agent side
    // (TBO side will use this without auth token, handled separately)
    // Wait for eventId or shareToken
    if (!state.shareToken && !eventId) return;

    // If we have a shareToken, load from backend
    if (state.shareToken) {
      await loadSessionByTokenInternal(state.shareToken);
      return;
    }

    // If we only have eventId but no shareToken, check if there's already a session
    // (for when the agent navigates back to the negotiation page)
    // We'll use the old localStorage approach as a fallback for finding the token
    const saved = localStorage.getItem(`negotiation_${eventId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.shareToken) {
          await loadSessionByTokenInternal(parsed.shareToken);
          return;
        }
      } catch {}
    }
  }, [state.shareToken, eventId, authToken]);

  // Internal function to load session from backend by token
  const loadSessionByTokenInternal = async (shareToken: string) => {
    try {
      const url = `${BACKEND_URL}/api/v1/negotiation/token/${shareToken}`;
      console.log("[NegotiationContext] Loading session from:", url);
      const headers: Record<string, string> = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      const res = await fetch(url, { headers });
      console.log("[NegotiationContext] Response status:", res.status);
      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        console.error("[NegotiationContext] Error response:", errorBody);
        return;
      }

      const data = await res.json();
      const session = data.session;
      const event = data.event;

      // Skip update if nothing changed (prevents overwriting local edits during polling)
      const rounds = session.rounds || [];
      const backendRound = session.current_round;
      const backendStatus = session.status;
      
      if (
        state.sessionId === session.id &&
        state.status === backendStatus &&
        state.history.length === rounds.length
      ) {
        // Nothing changed on the backend — don't overwrite local edits
        return;
      }

      // Build items from the latest round's proposal_snapshot
      const latestRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
      const proposalItems = latestRound ? (latestRound.proposal_snapshot || []) : [];

      // Map proposal items to NegotiationItem format
      // Latest round has the most recent prices
      const mappedItems: NegotiationItem[] = proposalItems.map((p: any) => ({
        id: p.cart_item_id,
        name: p.name || p.type || "Item",
        type: p.type || "other",
        originalPrice: p.original_price !== undefined ? p.original_price : p.price,
        currentPrice: p.price,
        targetPrice: p.price,
        quantity: p.quantity || 1,
        status: "pending" as const,
      }));

      // If we have round 1 (agent's initial), set targetPrice from it
      // and keep currentPrice from the latest round (the current offer)
      if (rounds.length >= 1) {
        const round1Items = rounds[0].proposal_snapshot || [];
        const round1Map = new Map<string, number>(round1Items.map((r: any) => [r.cart_item_id, r.price as number]));
        mappedItems.forEach((item) => {
          const targetPrice = round1Map.get(item.id);
          if (targetPrice !== undefined) {
            item.targetPrice = targetPrice;
          }
          // Ensure currentPrice is never undefined/NaN
          if (item.currentPrice === undefined || isNaN(item.currentPrice)) {
            item.currentPrice = item.targetPrice ?? 0;
          }
        });
      }

      // Build history from all rounds
      const mappedHistory: NegotiationRound[] = rounds.map((r: any, idx: number) => ({
        id: `round-${r.round_number}`,
        timestamp: r.created_at,
        items: (r.proposal_snapshot || []).map((p: any) => {
          let targetPrice = p.price;
          if (rounds.length >= 1) {
             const r1Item = (rounds[0].proposal_snapshot || []).find((r1: any) => r1.cart_item_id === p.cart_item_id);
             if (r1Item) targetPrice = r1Item.price;
          }
          return {
            id: p.cart_item_id,
            name: p.name || p.type || "Item",
            type: p.type || "other",
            originalPrice: p.original_price !== undefined ? p.original_price : p.price,
            currentPrice: p.price,
            targetPrice: targetPrice,
            quantity: p.quantity || 1,
            status: "pending" as const,
          };
        }),
        author: r.modified_by === "agent" ? "Agent" as const : "TBO Manager" as const,
      }));

      // Load chat from localStorage
      const chatMsgs = loadChat(shareToken);

      setState({
        items: mappedItems,
        messages: chatMsgs.length > 0 ? chatMsgs : [
          { id: "init", sender: "System", message: "Negotiation Session Loaded", timestamp: new Date().toISOString() },
        ],
        status: session.status || "draft",
        shareToken: session.share_token,
        sessionId: session.id,
        eventDetails: {
          name: event.name || "Event",
          date: event.start_date || "TBD",
          location: event.location || "TBD",
          totalBudget: mappedItems.reduce((sum: number, i: NegotiationItem) => sum + i.targetPrice! * i.quantity, 0),
        },
        history: mappedHistory,
      });

      // Also store the token mapping for cross-reference
      if (eventId) {
        localStorage.setItem(`negotiation_${eventId}`, JSON.stringify({ shareToken: session.share_token, sessionId: session.id }));
      }
    } catch (error) {
      console.error("Failed to load session by token:", error);
    }
  };

  // Public version for TBO admin pages
  const loadSessionByToken = useCallback(async (token: string) => {
    await loadSessionByTokenInternal(token);
  }, []);

  const updateEventDetails = React.useCallback((details: any) => {
    setState((prev) => {
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
        updateItemMessage,
        sendMessage,
        sendToHotel: sendToTbo,
        submitCounterOffer,
        lockDeal,
        refreshState,
        updateEventDetails,
        loadSessionByToken,
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
