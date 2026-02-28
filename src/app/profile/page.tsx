'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventContext';
import ProtectedRoute from '@/components/legacy/auth/ProtectedRoute';
import { UserRole } from '@/context/AuthContext';
import Link from 'next/link';
import { User, Mail, Phone, Tag, Building2, Key, MapPin, CheckCircle2, PartyPopper } from 'lucide-react';

interface AgentProfile {
  user_id: string;
  agency_name: string;
  agency_code: string;
  location: string;
  business_phone: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  agent_profile: AgentProfile;
}

export default function ProfilePage() {
  const { token, user } = useAuth();
  const { events } = useEvents();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${backendUrl}/api/v1/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  // Filter only completed or ended events (status === 'completed')
  const completedEvents = events.filter(
    (e) => e.status === 'completed'
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const initials = (name?: string) => {
    if (!name) return 'AG';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  };

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-gradient-premium border-b border-white/10 px-8 py-6 shadow-inner-highlight">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
              <p className="text-sm text-white/80 mt-0.5">Your personal and agency information</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-8 max-w-5xl mx-auto space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-corporate-blue-100" />
            </div>
          ) : error ? (
            <div className="card p-6 text-center text-red-500">
              <p>Failed to load profile: {error}</p>
            </div>
          ) : profile ? (
            <>
              {/* --- Personal Info Card --- */}
              <div className="card overflow-hidden">
                {/* Hero banner */}
                <div className="h-24 bg-gradient-corporate" />
                <div className="px-8 pb-8">
                  {/* Avatar */}
                  <div className="-mt-10 mb-4 flex items-end justify-between">
                    <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center">
                      <span className="text-2xl font-bold text-corporate-blue-100">
                        {initials(profile.name)}
                      </span>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-corporate-blue-100/10 text-corporate-blue-100 capitalize border border-corporate-blue-100/20">
                      {profile.role}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-neutral-900">{profile.name}</h2>
                  <p className="text-sm text-neutral-500 mb-6">{profile.email}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoField label="Full Name" value={profile.name} icon={User} />
                    <InfoField label="Email Address" value={profile.email} icon={Mail} />
                    <InfoField label="Phone Number" value={profile.phone || '—'} icon={Phone} />
                    <InfoField label="Role" value={profile.role} icon={Tag} capitalize />
                  </div>
                </div>
              </div>

              {/* --- Agency Details Card --- */}
              {profile.agent_profile && (
                <div className="card p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-corporate-blue-100/10 flex items-center justify-center text-corporate-blue-100">
                      <Building2 size={18} />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">Agency Details</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoField label="Agency Name" value={profile.agent_profile.agency_name || '—'} icon={Building2} />
                    <InfoField label="Agency Code" value={profile.agent_profile.agency_code || '—'} icon={Key} mono />
                    <InfoField label="Location" value={profile.agent_profile.location || '—'} icon={MapPin} />
                    <InfoField label="Business Phone" value={profile.agent_profile.business_phone || '—'} icon={Phone} />
                  </div>
                </div>
              )}

              {/* --- Completed Events --- */}
              <div className="card p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 size={18} />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">Completed Events</h3>
                  </div>
                  <span className="text-sm font-medium text-neutral-500">
                    {completedEvents.length} event{completedEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {completedEvents.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-neutral-200 rounded-xl">
                    <div className="flex justify-center mb-3 text-neutral-300">
                      <PartyPopper size={40} />
                    </div>
                    <p className="text-neutral-500 text-sm">No completed events yet</p>
                    <p className="text-neutral-400 text-xs mt-1">Events will appear here once they are completed</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 bg-neutral-50 hover:border-neutral-200 hover:bg-white transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          {/* Color accent */}
                          <div className="w-2 h-10 rounded-full bg-emerald-400 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-neutral-900 group-hover:text-corporate-blue-100 transition-colors">
                              {event.name}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {event.location} &nbsp;·&nbsp; {formatDate(event.startDate)} – {formatDate(event.endDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-right">
                          <div className="hidden sm:block">
                            <p className="text-xs text-neutral-400">Guests</p>
                            <p className="text-sm font-semibold text-neutral-700">{event.guestCount ?? 0}</p>
                          </div>
                          {event.budget != null && (
                            <div className="hidden sm:block">
                              <p className="text-xs text-neutral-400">Budget</p>
                              <p className="text-sm font-semibold text-neutral-700">
                                ₹{event.budget.toLocaleString('en-IN')}
                              </p>
                            </div>
                          )}
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Completed
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}

/* ---- Reusable info field component ---- */
function InfoField({
  label,
  value,
  icon: Icon,
  mono,
  capitalize,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
      {Icon && <span className="text-corporate-blue-100 mt-0.5"><Icon size={18} /></span>}
      <div className="min-w-0">
        <p className="text-xs font-medium text-neutral-400 mb-1">{label}</p>
        <p
          className={`text-sm font-semibold text-neutral-800 truncate ${mono ? 'font-mono tracking-wide' : ''} ${capitalize ? 'capitalize' : ''}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
