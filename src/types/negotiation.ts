export interface NegotiationItem {
    id: string;
    name: string;
    type: 'room' | 'banquet' | 'catering' | 'other';
    originalPrice: number;
    currentPrice: number;
    targetPrice?: number; // Only visible to Agent
    quantity: number;
    status: 'pending' | 'accepted' | 'rejected' | 'countered';
    message?: string; // Item-level remark
}

export interface NegotiationRound {
    id: string; // e.g. "round-1"
    timestamp: string;
    items: NegotiationItem[];
    author: 'Agent' | 'TBO Manager' | 'Hotel'; // Keeping 'Hotel' for backward comp with old localstorage if needed
}

export interface NegotiationDiff {
    itemId: string;
    field: string;
    oldValue: any;
    newValue: any;
    delta: number;
}

export interface ChatMessage {
    id: string;
    sender: 'Agent' | 'TBO Manager' | 'Hotel' | 'System';
    message: string;
    timestamp: string;
}
