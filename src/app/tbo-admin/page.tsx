"use client";

import React, { useEffect, useState } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "sonner";
import ProtectedRoute from "@/components/legacy/auth/ProtectedRoute";

interface NegotiationSession {
  id: string;
  event_id: string;
  status: string;
  share_token: string;
  current_round: number;
  updated_at: string;
  // This will be populated from the Preload("Event")
  Event?: {
    name: string;
    location: string;
    start_date: string;
  };
}

export default function TboAdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.TBO_AGENT}>
      <TboDashboardContent />
    </ProtectedRoute>
  );
}

function TboDashboardContent() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [sessions, setSessions] = useState<NegotiationSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNegotiations();
  }, [token]);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await fetch(`${backendUrl}/api/v1/admin/negotiations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch negotiations");
      }

      const data = await res.json();
      setSessions(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Could not load negotiations");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting_for_tbo_agent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Action Required
          </span>
        );
      case "waiting_for_agent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Waiting on Agent
          </span>
        );
      case "locked":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Deal Locked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status.replace(/_/g, " ")}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Toaster position="top-right" richColors />

      {/* TBO Admin Header */}
      <div className="bg-gradient-premium border-b border-white/10 px-8 py-4 shadow-inner-highlight flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              TBO Admin Portal
            </h1>
            <p className="text-xs text-blue-100 mt-0.5 opacity-90">
              Welcome back, {user?.name || "Manager"}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-white hover:text-red-300 transition-colors text-sm font-medium"
        >
          Sign Out
        </button>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            Active Negotiations
          </h2>
          <button
            onClick={fetchNegotiations}
            disabled={loading}
            className="text-sm bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-4 py-2 rounded-lg shadow-sm font-medium transition-all disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">
              No active negotiations
            </h3>
            <p className="text-neutral-500">
              There are currently no proposals from booking agents.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-xl border border-neutral-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Round
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {session.Event?.name || "Unknown Event"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.Event?.location || "No location"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(session.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.current_round}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.updated_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/tbo-admin/negotiation/${session.share_token}`}
                        className="text-blue-600 hover:text-blue-900 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Review Offer
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
