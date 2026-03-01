import { ReactNode } from 'react';
import { Event } from '@/modules/events/types';

export interface EventCardProps {
    event: Event;
    className?: string;
}

export interface EventCardHeaderProps {
    name: string;
    location: string;
    startDate: string;
    endDate: string;
    status: Event['status'];
    eventManagerId?: string;
}

export interface EventCardMetricsProps {
    guestCount: number;
    inventoryConsumed: number;
    budgetSpent?: number;
    totalBudget?: number;
    daysUntilEvent?: number;
    pendingActions?: number;
    pendingActionDetails?: string[];
}
