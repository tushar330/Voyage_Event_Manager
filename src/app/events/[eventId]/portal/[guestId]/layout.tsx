'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PortalHeader from '@/components/legacy/portal/PortalHeader';
import ProtectedRoute from '@/components/legacy/auth/ProtectedRoute';
import { useAuth, UserRole } from '@/context/AuthContext';

interface Event {
    id: string;
    name: string;
}

interface Guest {
    id: string;
    name: string;
}

export default function PortalLayout({
    children,
}: {
    children: ReactNode;
}) {
    const params = useParams();
    const eventId = params.eventId as string;
    const guestId = params.guestId as string;
    const { token } = useAuth();

    const [event, setEvent] = useState<Event | null>(null);
    const [headGuest, setHeadGuest] = useState<Guest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return; // Wait for auth

            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

                // Fetch Event
                const eventRes = await fetch(`${backendUrl}/api/v1/events/${eventId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!eventRes.ok) throw new Error('Event not found');
                const eventData = await eventRes.json();
                
                // Fetch Guest
                const guestRes = await fetch(`${backendUrl}/api/v1/guests/${guestId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!guestRes.ok) throw new Error('Guest not found');
                const guestData = await guestRes.json();

                setEvent(eventData.data.event); 
                setHeadGuest(guestData.data.guest);
            } catch (err: any) {
                console.error("Portal validation error:", err);
                setError(err.message || 'Validation failed');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId, guestId, token]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading portal...</div>;
    }

    if (error || !headGuest || !event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-600 text-xl font-semibold">Invalid portal access</p>
                    <p className="text-gray-600 mt-2">Guest ID: {guestId}</p>
                    <p className="text-sm text-gray-500 mt-4">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute requiredRole={UserRole.HEAD_GUEST} guestId={guestId}>
            <div className="min-h-screen bg-gray-50">
                <PortalHeader eventName={event.name} headGuestName={headGuest.name} />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}

