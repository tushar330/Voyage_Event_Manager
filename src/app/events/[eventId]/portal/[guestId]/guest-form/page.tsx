'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function GuestFormPage({ params }: { params: Promise<{ eventId: string; guestId: string }> }) {
    const { eventId, guestId } = use(params);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        countryCode: '+91',
        arrivalDate: '',
        departureDate: '',
        dietaryRequirements: '',
    });
    const [eventDates, setEventDates] = useState<{ start: string; end: string } | null>(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
                const res = await fetch(`${backendUrl}/api/v1/events/${eventId}`);
                if (res.ok) {
                    const data = await res.json();
                    const event = data?.data?.event || data?.event || data;
                    if (event) {
                        setEventDates({
                            start: (event.start_date || event.startDate || '').split('T')[0],
                            end: (event.end_date || event.endDate || '').split('T')[0]
                        });
                    }
                }
            } catch (err) {
                console.error("Error fetching event:", err);
            }
        };
        fetchEvent();
    }, [eventId]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let phoneString = formData.phone.trim();
        if (phoneString && !phoneString.startsWith('+')) {
            phoneString = `${formData.countryCode} ${phoneString}`;
        }

        const digitsOnly = phoneString.replace(/\D/g, '');
        if (!digitsOnly || digitsOnly.length < 10) {
            alert('Please enter a valid phone number with at least 10 digits.');
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));


        setIsSuccess(true);
        setIsSubmitting(false);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                    <p className="text-gray-600">
                        Your details have been successfully received. We look forward to seeing you!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-600 px-6 py-4">
                    <h1 className="text-xl font-bold text-white">Guest Registration</h1>
                    <p className="text-blue-100 text-sm mt-1">Please fill in your details below</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number *</label>
                        <div className="flex mt-1 shadow-sm rounded-md">
                            <select
                                value={formData.countryCode}
                                onChange={e => setFormData({ ...formData, countryCode: e.target.value })}
                                className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            >
                                <option value="+1">+1 (US)</option>
                                <option value="+44">+44 (UK)</option>
                                <option value="+91">+91 (IN)</option>
                                <option value="+61">+61 (AU)</option>
                                <option value="+971">+971 (AE)</option>
                            </select>
                            <input
                                type="tel"
                                id="phone"
                                required
                                className="flex-1 rounded-r-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Phone number"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="arrivalDate" className="block text-sm font-medium text-gray-700">Arrival Date *</label>
                            <input
                                type="date"
                                id="arrivalDate"
                                required
                                min={eventDates?.start}
                                max={eventDates?.end}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                value={formData.arrivalDate}
                                onChange={e => setFormData({ ...formData, arrivalDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700">Departure Date *</label>
                            <input
                                type="date"
                                id="departureDate"
                                required
                                min={formData.arrivalDate || eventDates?.start}
                                max={eventDates?.end}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                value={formData.departureDate}
                                onChange={e => setFormData({ ...formData, departureDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="dietary" className="block text-sm font-medium text-gray-700">Dietary Requirements</label>
                        <textarea
                            id="dietary"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            placeholder="e.g. Vegetarian, Nut Allergy..."
                            value={formData.dietaryRequirements}
                            onChange={e => setFormData({ ...formData, dietaryRequirements: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Submitting...' : 'Confirm Registration'}
                    </button>
                </form>
            </div>
        </div>
    );
}
