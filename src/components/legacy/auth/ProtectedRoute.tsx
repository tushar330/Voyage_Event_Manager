'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
    guestId?: string; // For guest routes, verify they can only access their own portal
}

export default function ProtectedRoute({ children, requiredRole, guestId }: ProtectedRouteProps) {
    const { isAuthenticated, user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        // Not authenticated - redirect to appropriate login
        if (!isAuthenticated || !user) {
            router.push('/sign-in');
            return;
        }

        // Check role matches
        if (requiredRole && user.role !== requiredRole) {
            // Wrong role - access denied or redirect home
            router.push('/');
            return;
        }

        // For guest routes, verify they can only access their own portal
        if (requiredRole === 'guest' && guestId && user.id !== guestId) {
            // Guest trying to access another guest's portal
            router.push(`/events/${user.eventId}/portal/${user.id}`);
            return;
        }
    }, [isAuthenticated, user, requiredRole, guestId, router, isLoading]);

    // Show nothing while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate-blue"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    // Role mismatch
    if (requiredRole && user.role !== requiredRole) {
        return null;
    }

    // Guest accessing wrong portal
    if (requiredRole === 'guest' && guestId && user.id !== guestId) {
        return null;
    }

    return <>{children}</>;
}
