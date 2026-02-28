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
  const [age, setAge] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const phoneRules: Record<string, { regex: RegExp; msg: string; label: string }> = {
    '+1': { regex: /^\d{10}$/, msg: '10 digits required', label: 'US/CAN (+1)' },
    '+44': { regex: /^\d{10,11}$/, msg: '10-11 digits required', label: 'UK (+44)' },
    '+91': { regex: /^\d{10}$/, msg: '10 digits required', label: 'IND (+91)' },
    '+61': { regex: /^\d{9}$/, msg: '9 digits required', label: 'AUS (+61)' },
  };

  const { token } = useAuth();

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const currentRule = phoneRules[countryCode];
    if (!currentRule.regex.test(phone)) {
        setError(`Invalid phone number format for ${currentRule.label}: ${currentRule.msg}`);
        return;
    }

    setShowConfirm(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirm(false);
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
            body: JSON.stringify({ name, email, phone: `${countryCode}${phone}`, age: parseInt(age, 10) })
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
      if (success && onAssignSuccess) {
          onAssignSuccess();
      }
      onClose();
      setSuccess(false);
      setShowConfirm(false);
      setName('');
      setEmail('');
      setPhone('');
      setAge('');
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
        ) : showConfirm ? (
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Confirm Head Guest Details</h3>
                <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm text-gray-700">
                    <p><span className="font-semibold w-24 inline-block">Name:</span> {name}</p>
                    <p><span className="font-semibold w-24 inline-block">Email:</span> {email}</p>
                    <p><span className="font-semibold w-24 inline-block">Age:</span> {age}</p>
                    <p><span className="font-semibold w-24 inline-block">Phone:</span> {countryCode} {phone}</p>
                </div>
                <p className="text-sm text-yellow-600 font-medium">Please double-check these details. A confirmation email will be sent immediately.</p>
                
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Edit Details
                    </button>
                    <button
                        onClick={handleConfirmedSubmit}
                        disabled={loading}
                        className="flex-1 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && (
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        Confirm & Assign
                    </button>
                </div>
            </div>
        ) : (  <form onSubmit={handleInitialSubmit} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <input
                  type="number"
                  required
                  min="18"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
              </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <div className="mt-1 flex gap-2">
                    <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                        {Object.entries(phoneRules).map(([code, rule]) => (
                            <option key={code} value={code}>
                                {rule.label}
                            </option>
                        ))}
                    </select>
                    <input
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="block w-2/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Number only"
                    />
                </div>
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
