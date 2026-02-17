'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface HeadGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  onAssignSuccess?: () => void;
}

export function HeadGuestModal({ isOpen, onClose, eventId, eventName, onAssignSuccess }: HeadGuestModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const { token } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${backendUrl}/api/v1/events/${eventId}/head-guest`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ name, email, phone })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to assign head guest');
        }

        const data = await res.json();
        console.log("Head Guest Response:", data); // Debug log
        if (data.data?.tempPassword || data.tempPassword) {
            setTempPassword(data.data?.tempPassword || data.tempPassword);
        } else if (data.data?.user?.id || data.user?.id) {
             console.log("User assigned, but no temp password (likely existing user)");
        }

        setSuccess(true);
        
        if (onAssignSuccess) {
            onAssignSuccess();
        }
        
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    alert('Password copied to clipboard!');
  };

  const resetModal = () => {
      onClose();
      setSuccess(false);
      setName('');
      setEmail('');
      setPhone('');
      setTempPassword('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Assign Head Guest</h2>
          <button onClick={resetModal} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
             <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Head Guest Assigned!</h3>
                <p className="mt-2 text-sm text-gray-500">
                    Login credentials have been sent to <strong>{email}</strong>.
                </p>
                
                <div className="mt-6">
                    <button
                        onClick={resetModal}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-neutral-900 text-base font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 sm:text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        ) : (  <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
                Create a head guest account for <strong>{eventName}</strong>. 
                They will receive an email with their login credentials.
            </p>

            <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="pt-2">
                <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                {loading ? 'Creating...' : 'Create & Assign'}
                </button>
            </div>
            </form>
        )}
      </div>
    </div>
  );
}
