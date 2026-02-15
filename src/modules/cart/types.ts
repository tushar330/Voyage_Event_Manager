export type CartItemType = 'room' | 'banquet' | 'catering' | 'flight' | 'hotel';
export type CartItemStatus = 'wishlist' | 'approved' | 'booked';

export interface CartItem {
    id: string; // UUID
    event_id: string; // UUID
    type: CartItemType;
    ref_id: string;
    parent_hotel_id?: string;
    status: CartItemStatus;
    quantity: number;
    locked_price: number;
    notes?: string;
    added_by: string; // UUID
    created_at: string;
    updated_at: string;
}

export interface CartItemDetail {
    id: string;
    type: CartItemType;
    status: CartItemStatus;
    quantity: number;
    locked_price: number;
    notes?: string;
    created_at: string;

    // Populated based on 'type'
    room_details?: any;
    banquet_details?: any;
    catering_details?: any;
    flight_details?: any;
    hotel_details?: any;
}

export interface HotelCartGroup {
    hotel_details: any; // Full Hotel object
    rooms: CartItemDetail[];
    banquets: CartItemDetail[];
    catering: CartItemDetail[];
    hotel_wishlist_item?: CartItemDetail; // Support direct hotel wishlist
}

export interface CartResponse {
    event_id: string;
    hotels: HotelCartGroup[];
    flights: CartItemDetail[];
}

export interface AddToCartRequest {
    type: CartItemType;
    refId: string;       // ID of the room/banquet/hotel/etc.
    quantity?: number;   // Default: 1
    notes?: string;
}

export interface UpdateCartItemRequest {
    quantity?: number;
    notes?: string;
    status?: CartItemStatus;
}
