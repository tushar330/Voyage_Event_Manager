'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function SignUpPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [agencyName, setAgencyName] = React.useState('');
  const [agencyCode, setAgencyCode] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [businessPhone, setBusinessPhone] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${backendUrl}/api/v1/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                email,
                password,
                phone,
                agencyName,
                agencyCode,
                location,
                businessPhone
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Signup failed');
        }

        console.log('Signup success:', data);
        
        // Auto-login
        login(data.token, data.user);

    } catch (err: any) {
        console.error('Signup error:', err);
        setError(err.message || 'Failed to sign up');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Register new agency
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already registered?{' '}
          <Link href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Personal Details */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Details</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                        <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                </div>
            </div>

            {/* Agency Details */}
            <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Agency Profile</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label htmlFor="agencyName" className="block text-sm font-medium text-gray-700">Agency Name</label>
                        <input id="agencyName" required value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label htmlFor="agencyCode" className="block text-sm font-medium text-gray-700">Agency Code</label>
                        <input id="agencyCode" required value={agencyCode} onChange={(e) => setAgencyCode(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                        <input id="location" required value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                     <div>
                        <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700">Business Phone</label>
                        <input id="businessPhone" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Commenting out unused functions to keep the file clean if we revert, 
// or just deleting them by excluding them from the replacement block above.
// The above block replaces everything from handleSubmit down to the end of the component return.
// We need to be careful with the StartLine/EndLine.
