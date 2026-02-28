"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { cartApi } from "@/modules/cart/services/api";
import {
  CartResponse,
  CartItemType,
  AddToCartRequest,
  UpdateCartItemRequest,
} from "@/modules/cart/types";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cart: CartResponse | null;
  loading: boolean;
  error: string | null;
  fetchCart: (eventId: string) => Promise<void>;
  addToCart: (eventId: string, data: AddToCartRequest) => Promise<void>;
  removeFromCart: (eventId: string, cartItemId: string) => Promise<void>;
  removeHotelGroupFromCart: (eventId: string, hotelId: string) => Promise<void>;
  updateCartItem: (
    eventId: string,
    cartItemId: string,
    updates: UpdateCartItemRequest,
  ) => Promise<void>;
  clearCartError: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchCart = useCallback(
    async (eventId: string) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await cartApi.getCart(eventId, undefined, token);
        if (data) {
          data.hotels = data.hotels || [];
          data.flights = data.flights || [];
          data.transfers = data.transfers || [];
        }
        setCart(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch cart");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  const addToCart = async (eventId: string, data: AddToCartRequest) => {
    if (!token) throw new Error("Authentication required");
    setLoading(true);
    setError(null);
    try {
      await cartApi.addToCart(eventId, data, token);
      await fetchCart(eventId);
    } catch (err: any) {
      setError(err.message || "Failed to add to cart");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (eventId: string, cartItemId: string) => {
    if (!token) throw new Error("Authentication required");
    setLoading(true);
    setError(null);
    try {
      await cartApi.removeFromCart(eventId, cartItemId, token);
      await fetchCart(eventId);
    } catch (err: any) {
      setError(err.message || "Failed to remove item");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeHotelGroupFromCart = async (eventId: string, hotelId: string) => {
    if (!token) throw new Error("Authentication required");
    setLoading(true);
    setError(null);
    try {
      await cartApi.removeHotelGroupFromCart(eventId, hotelId, token);
      await fetchCart(eventId);
    } catch (err: any) {
      setError(err.message || "Failed to remove hotel group");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (
    eventId: string,
    cartItemId: string,
    updates: UpdateCartItemRequest,
  ) => {
    if (!token) throw new Error("Authentication required");
    setLoading(true);
    setError(null);
    try {
      await cartApi.updateCartItem(eventId, cartItemId, updates, token);
      await fetchCart(eventId);
    } catch (err: any) {
      setError(err.message || "Failed to update item");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCartError = () => setError(null);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        fetchCart,
        addToCart,
        removeFromCart,
        removeHotelGroupFromCart,
        updateCartItem,
        clearCartError,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
