'use client';

import { mockMetrics } from '@/modules/dashboard/services/mockData';
import { MetricCard } from '@/components/ui/Card';
import { EventCard } from '@/components/ui/EventCard';
import EventModal from '@/components/legacy/EventModal';
import { useEvents } from '@/context/EventContext';
import { useState } from 'react';
import ProtectedRoute from '@/components/legacy/auth/ProtectedRoute';
import { useAuth, UserRole } from '@/context/AuthContext';

export default function DashboardPage() {
  const { events, loading } = useEvents();
  const [showEventModal, setShowEventModal] = useState(false);

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
              <p className="text-sm text-neutral-600 mt-1">
                Operational command center for group inventory management
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowEventModal(true)}
                className="px-6 py-3 bg-corporate-blue-100 hover:bg-corporate-blue-200 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                + Create Event
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 py-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate-blue-100"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-900">No events found</h3>
              <p className="mt-1 text-sm text-neutral-500">Get started by creating a new event.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Event Modal */}
        <EventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} />
      </div>
    </ProtectedRoute>
  );
}
