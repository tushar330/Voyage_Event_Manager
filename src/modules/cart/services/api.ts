import {
    CartResponse,
    AddToCartRequest,
    UpdateCartItemRequest
} from '../types';

const API_URL = '/api/v1'; // Base path for Next.js proxy or direct API

export const cartApi = {
    /**
     * Get cart for an event
     */
    async getCart(eventId: string, status?: string, token?: string): Promise<CartResponse> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let url = `/api/events/${eventId}/cart`;
        if (status) url += `?status=${status}`;

        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error('Failed to fetch cart');
        const result = await response.json();
        // Unwrap: response -> data -> cart
        const data = result.data || result;
        return data.cart || data;
    },

    /**
     * Add an item to the cart/wishlist
     */
    async addToCart(eventId: string, data: AddToCartRequest, token?: string): Promise<any> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/events/${eventId}/cart`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to add to cart');
        }

        return response.json();
    },

    /**
     * Update a cart item
     */
    async updateCartItem(eventId: string, cartItemId: string, data: UpdateCartItemRequest, token?: string): Promise<any> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/events/${eventId}/cart/${cartItemId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to update cart item');
        return response.json();
    },

    /**
     * Remove an item from the cart
     */
    async removeFromCart(eventId: string, cartItemId: string, token?: string): Promise<void> {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/events/${eventId}/cart/${cartItemId}`, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) throw new Error('Failed to remove from cart');
    }
};
