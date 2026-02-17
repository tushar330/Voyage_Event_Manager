"use client";

import { use, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GuestInput } from "@/types";

interface FamilyMember {
  id: string;
  name: string;
  age: string;
}

export default function GuestsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { token } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [familyMemberCount, setFamilyMemberCount] = useState("0");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [specialRequest, setSpecialRequest] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  // Mock event data
  const eventData = {
    name: "Ananya & Rahul Wedding",
    location: "Jaipur, Rajasthan",
    dates: "February 12-14, 2026",
    bannerImage: "🎊",
  };

  const itinerary = [
    { day: "Day 1", event: "Welcome Dinner", time: "7:00 PM", date: "Feb 12" },
    { day: "Day 2", event: "Wedding Ceremony", time: "6:00 PM", date: "Feb 13" },
    { day: "Day 3", event: "Reception", time: "8:00 PM", date: "Feb 14" },
  ];

  // Cancellation Form State
  const [cancelName, setCancelName] = useState("");
  const [cancelRoom, setCancelRoom] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const [cancellationRequests, setCancellationRequests] = useState([
    {
      id: "1",
      guestName: "Rajesh Kumar",
      roomType: "Deluxe Suite",
      reason: "Family emergency",
      status: "pending" as const,
      requestDate: "2026-02-01",
    },
    {
      id: "2",
      guestName: "Amit Patel",
      roomType: "Executive Suite",
      reason: "Health issues",
      status: "pending" as const,
      requestDate: "2026-02-03",
    },
  ]);

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest = {
      id: Math.random().toString(36).substr(2, 9),
      guestName: cancelName,
      roomType: cancelRoom,
      reason: cancelReason,
      status: "pending" as const,
      requestDate: new Date().toISOString().split("T")[0],
    };
    setCancellationRequests([newRequest, ...cancellationRequests]);
    setCancelName("");
    setCancelRoom("");
    setCancelReason("");
    alert("Cancellation request submitted successfully!");
  };

  // Handle family member count change
  const handleFamilyCountChange = (count: string) => {
    const num = Math.max(0, parseInt(count) || 0);
    setFamilyMemberCount(String(num));

    const currentMembers = [...familyMembers];
    if (num > currentMembers.length) {
      for (let i = currentMembers.length; i < num; i++) {
        currentMembers.push({
          id: `${i + 1}`,
          name: "",
          age: "",
        });
      }
    } else if (num < currentMembers.length) {
      currentMembers.splice(num);
    }
    setFamilyMembers(currentMembers);
  };

  // Update family member
  const updateFamilyMember = (
    id: string,
    field: keyof FamilyMember,
    value: string,
  ) => {
    setFamilyMembers((members) =>
      members.map((member) =>
        member.id === id ? { ...member, [field]: value } : member,
      ),
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    // Build the payload
    const payload: GuestInput = {
      name: name.trim(),
      age: parseInt(age) || 0,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      arrivalDate: arrivalDate ? new Date(arrivalDate).toISOString() : undefined,
      departureDate: departureDate ? new Date(departureDate).toISOString() : undefined,
    };

    // Add family members if any
    if (familyMembers.length > 0) {
      payload.family_members = familyMembers.map((member) => ({
        name: member.name.trim(),
        age: parseInt(member.age) || 0,
      }));
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${backendUrl}/api/v1/events/${eventId}/guests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || `Registration failed (${response.status})`);
      }

      setSubmitStatus('success');
    } catch (error: any) {
      console.error("Error submitting guest registration:", error);
      setErrorMessage(error.message || "Something went wrong. Please try again.");
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-1">
            Thank you, <span className="font-semibold">{name}</span>!
          </p>
          <p className="text-gray-600">
            Your details{familyMembers.length > 0 ? ` and ${familyMembers.length} family member${familyMembers.length > 1 ? 's' : ''} have` : ' have'} been successfully registered.
          </p>
          <p className="text-sm text-gray-500 mt-4">We look forward to seeing you at the event!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Event Banner */}
      <div className="bg-gradient-premium text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-6xl">{eventData.bannerImage}</span>
          </div>
          <h1 className="text-4xl font-bold text-center mb-2">
            {eventData.name}
          </h1>
          <p className="text-center text-white/90">
            {eventData.location} • {eventData.dates}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Event Overview */}
          <section className="card p-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Event Overview
            </h2>
            <div className="prose prose-sm max-w-none text-neutral-700">
              <p>
                Join us for a spectacular celebration of love and togetherness.
                This three-day event promises unforgettable moments, exquisite
                dining, and world-class hospitality in the heart of Jaipur.
              </p>
              <p className="mt-3">
                We have secured exclusive group rates at premium hotels with
                specially curated packages for our guests. Please complete your
                registration to reserve your accommodation.
              </p>
            </div>
          </section>

          {/* Itinerary */}
          <section className="card p-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              Event Itinerary
            </h2>
            <div className="space-y-4">
              {itinerary.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-corporate-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-neutral-900">
                        {item.event}
                      </h3>
                      <span className="text-sm text-neutral-600">
                        {item.date}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600">
                      {item.day} • {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Guest Registration Form */}
          <section className="card p-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              Guest Registration
            </h2>

            {/* Error Banner */}
            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Your Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Age & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              {/* Check-in and Check-out */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Number of Family Members */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Number of Family Members (Excluding You)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={familyMemberCount}
                  onChange={(e) => handleFamilyCountChange(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                />
              </div>

              {/* Family Members Details */}
              {familyMembers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Family Members Details
                  </h3>
                  {familyMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                    >
                      <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                        Member {index + 1}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) =>
                              updateFamilyMember(member.id, "name", e.target.value)
                            }
                            required
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            Age *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="120"
                            value={member.age}
                            onChange={(e) =>
                              updateFamilyMember(member.id, "age", e.target.value)
                            }
                            required
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                            placeholder="Age"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Special Request */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Special Request (Optional)
                </label>
                <textarea
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent resize-none"
                  placeholder="Any special requirements or requests (e.g., dietary preferences, accessibility needs)"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-corporate-blue-100 hover:bg-corporate-blue-200 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    `Submit Registration${familyMembers.length > 0 ? ` (${1 + familyMembers.length} Guests)` : ''}`
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Submit Cancellation Request */}
          <section className="card p-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              Submit Cancellation Request
            </h2>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    value={cancelName}
                    onChange={(e) => setCancelName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning/20 focus:border-warning"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Room Type/Details *
                  </label>
                  <input
                    type="text"
                    value={cancelRoom}
                    onChange={(e) => setCancelRoom(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning/20 focus:border-warning"
                    placeholder="e.g. Deluxe Suite - Room 302"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Reason for Cancellation *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-warning/20 focus:border-warning resize-none"
                  placeholder="Please provide a brief reason for cancellation"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg transition-colors border border-neutral-900"
              >
                Submit Cancellation Request
              </button>
              <p className="text-xs text-neutral-500 text-center">
                Note: Requests are subject to review and hotel cancellation policies.
              </p>
            </form>
          </section>

          {/* Cancellation Requests List */}
          {cancellationRequests.length > 0 && (
            <section className="card p-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                Cancellation Requests
              </h2>
              <div className="space-y-3">
                {cancellationRequests.map((request) => (
                  <details
                    key={request.id}
                    className="bg-neutral-50 rounded-lg border border-neutral-200 overflow-hidden"
                  >
                    <summary className="p-4 cursor-pointer hover:bg-neutral-100 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">👤</span>
                        <div>
                          <div className="font-semibold text-neutral-900">
                            {request.guestName}
                          </div>
                          <div className="text-sm text-neutral-600">
                            {request.roomType}
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </summary>
                    <div className="p-4 border-t border-neutral-200 bg-white">
                      <div className="mb-3">
                        <div className="text-sm font-medium text-neutral-700 mb-1">
                          Cancellation Reason:
                        </div>
                        <div className="text-sm text-neutral-900 bg-neutral-50 p-3 rounded-lg">
                          {request.reason}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500">
                        Requested on{" "}
                        {new Date(request.requestDate).toLocaleDateString()}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Booking Details */}
          <section className="card p-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              Booking Details
            </h2>
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">
                Booking Status
              </h3>
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-warning/10 text-warning">
                  ⏳ Pending
                </span>
              </div>
              <p className="text-sm text-neutral-600 mt-3">
                Your booking details will be displayed here once your
                registration is confirmed.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
