"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { GuestInput } from "@/types";

interface EventDetails {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  description?: string;
}

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return "";
  try {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
    const yearOpts: Intl.DateTimeFormatOptions = { ...opts, year: "numeric" };
    if (!end || start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("en-IN", yearOpts);
    }
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString("en-IN", opts)}\u2013${end.getDate()}, ${start.getFullYear()}`;
    }
    if (start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString("en-IN", opts)} \u2013 ${end.toLocaleDateString("en-IN", opts)}, ${start.getFullYear()}`;
    }
    return `${start.toLocaleDateString("en-IN", yearOpts)} \u2013 ${end.toLocaleDateString("en-IN", yearOpts)}`;
  } catch {
    return startDate;
  }
}

function getEventEmoji(name: string): string {
  const l = name.toLowerCase();
  if (l.includes("wedding") || l.includes("marriage") || l.includes("shaadi") || l.includes("vivah")) return "\uD83D\uDC8D";
  if (l.includes("birthday") || l.includes("bday")) return "\uD83C\uDF82";
  if (l.includes("conference") || l.includes("summit") || l.includes("meet")) return "\uD83C\uDFDB\uFE0F";
  if (l.includes("party") || l.includes("celebration")) return "\uD83C\uDF89";
  if (l.includes("corporate") || l.includes("annual")) return "\uD83C\uDFE2";
  if (l.includes("gala") || l.includes("award")) return "\uD83C\uDFC6";
  return "\uD83C\uDF8A";
}

interface FamilyMember {
  id: string;
  name: string;
  age: string;
  phone?: string;
  countryCode?: string;
  email?: string;
  arrivalDate?: string;
  departureDate?: string;
}

export default function GuestsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { token } = useAuth();

  // Event data — fetched from API
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      setEventLoading(true);
      setEventError("");
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

        const authToken =
          token ??
          (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        const headers: Record<string, string> = {};
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

        const res = await fetch(`${backendUrl}/api/v1/events/${eventId}`, { headers });
        if (!res.ok) throw new Error(`Event not found (${res.status})`);
        const data = await res.json();
        const raw = data?.data?.event ?? data?.event ?? data;
        setEvent({
          id: raw.id ?? raw.ID ?? eventId,
          name: raw.name ?? raw.Name ?? "Event",
          location: raw.location ?? raw.Location ?? "",
          startDate: raw.start_date ?? raw.startDate ?? raw.StartDate ?? "",
          endDate: raw.end_date ?? raw.endDate ?? raw.EndDate ?? "",
          status: (raw.status ?? raw.Status ?? "upcoming").toLowerCase(),
          description: raw.description ?? raw.Description ?? "",
        });
      } catch (err: any) {
        console.error("[GuestsPage] Failed to load event:", err);
        setEventError(err.message ?? "Failed to load event details");
      } finally {
        setEventLoading(false);
      }
    };
    fetchEvent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Form state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
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

  // Cancellation Form State
  const [cancelName, setCancelName] = useState("");
  const [cancelRoom, setCancelRoom] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancellationRequests, setCancellationRequests] = useState<Array<{
    id: string; guestName: string; roomType: string;
    reason: string; status: "pending" | "approved" | "rejected"; requestDate: string;
  }>>([]);

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
          phone: "",
          countryCode: "+91",
          email: "",
          arrivalDate: "",
          departureDate: "",
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

  const formatDateForApi = (dateString?: string) => {
    if (!dateString) return undefined;
    // Check if string is DD/MM/YYYY
    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`).toISOString();
        }
    }
    // Assuming YYYY-MM-DD from the HTML input
    if (dateString.includes('-') && dateString.length >= 10) {
        return new Date(`${dateString.substring(0, 10)}T00:00:00Z`).toISOString();
    }
    try {
        return new Date(dateString).toISOString();
    } catch {
        return dateString;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    // Enforce phone constraint
    let phoneString = phone.trim();
    if (phoneString && !phoneString.startsWith('+')) {
        phoneString = `${countryCode} ${phoneString}`;
    }

    const digitsOnly = phoneString.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 10) {
        setErrorMessage('Please enter a valid phone number with at least 10 digits.');
        setSubmitStatus('error');
        setIsSubmitting(false);
        return;
    }

    // Build the payload
    const payload: GuestInput = {
      name: name.trim(),
      age: parseInt(age) || 0,
      type: (parseInt(age) || 0) < 16 ? 'child' : 'adult',
      phone: phoneString,
      email: email.trim() || undefined,
      arrivalDate: formatDateForApi(arrivalDate),
      departureDate: formatDateForApi(departureDate),
    };

    // Add family members if any
    if (familyMembers.length > 0) {
      payload.family_members = familyMembers.map((member) => ({
        name: member.name.trim(),
        age: parseInt(member.age) || 0,
        type: (parseInt(member.age) || 0) < 16 ? 'child' : 'adult',
        phone: member.phone?.trim() ? (member.phone.trim().startsWith('+') ? member.phone.trim() : `${(member as any).countryCode || '+91'} ${member.phone.trim()}`) : undefined,
        email: member.email?.trim() || undefined,
        arrivalDate: formatDateForApi(member.arrivalDate),
        departureDate: formatDateForApi(member.departureDate),
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

  // Loading state
  if (eventLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-corporate-blue-100 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 text-sm">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Event not found
  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-500 text-sm">{eventError || "This invitation link may be invalid or expired."}</p>
        </div>
      </div>
    );
  }

  const dateRange = formatDateRange(event.startDate, event.endDate);
  const eventEmoji = getEventEmoji(event.name);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Event Banner */}
      <div className="bg-gradient-premium text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-6xl">{eventEmoji}</span>
          </div>
          <h1 className="text-4xl font-bold text-center mb-2">
            {event.name}
          </h1>
          <p className="text-center text-white/90">
            {event.location && <span>{event.location}</span>}
            {event.location && dateRange && <span> • </span>}
            {dateRange && <span>{dateRange}</span>}
          </p>
          {event.status && event.status !== "active" && (
            <div className="flex justify-center mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white capitalize">
                {event.status}
              </span>
            </div>
          )}
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
              {event.description ? (
                <p>{event.description}</p>
              ) : (
                <>
                  <p>
                    You have been invited to <strong>{event.name}</strong>
                    {event.location ? ` in ${event.location}` : ""}.
                    {dateRange ? ` The event takes place on ${dateRange}.` : ""}
                  </p>
                  <p className="mt-3">
                    Please complete your registration below so we can make the
                    necessary arrangements for your stay and participation.
                  </p>
                </>
              )}
            </div>

            {/* Event Info Pills */}
            <div className="flex flex-wrap gap-3 mt-5">
              {event.location && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-sm text-blue-700 font-medium">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location}
                </div>
              )}
              {dateRange && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full text-sm text-purple-700 font-medium">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {dateRange}
                </div>
              )}
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
                    Phone *
                  </label>
                  <div className="flex shadow-sm rounded-lg">
                    <select
                        value={countryCode}
                        onChange={e => setCountryCode(e.target.value)}
                        className="rounded-l-lg border border-r-0 border-neutral-300 bg-neutral-50 px-3 py-2 text-neutral-700 focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent text-sm w-24"
                    >
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+91">+91</option>
                        <option value="+61">+61</option>
                        <option value="+971">+971</option>
                    </select>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 px-4 py-2 border border-neutral-300 rounded-r-lg focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
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
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={arrivalDate}
                    min={event?.startDate ? new Date(event.startDate).toISOString().split('T')[0] : undefined}
                    max={event?.endDate ? new Date(event.endDate).toISOString().split('T')[0] : undefined}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    min={arrivalDate || (event?.startDate ? new Date(event.startDate).toISOString().split('T')[0] : undefined)}
                    max={event?.endDate ? new Date(event.endDate).toISOString().split('T')[0] : undefined}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            Phone *
                          </label>
                          <div className="flex shadow-sm rounded-lg">
                            <select
                                value={(member as any).countryCode || "+91"}
                                onChange={e => updateFamilyMember(member.id, "countryCode" as any, e.target.value)}
                                className="rounded-l-lg border border-r-0 border-neutral-300 bg-neutral-50 px-2 py-2 text-neutral-700 focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent text-xs"
                            >
                                <option value="+1">+1</option>
                                <option value="+44">+44</option>
                                <option value="+91">+91</option>
                                <option value="+61">+61</option>
                                <option value="+971">+971</option>
                            </select>
                            <input
                              type="tel"
                              required
                              value={member.phone || ""}
                              onChange={(e) =>
                                updateFamilyMember(member.id, "phone", e.target.value)
                              }
                              className="flex-1 px-3 py-2 border border-neutral-300 rounded-r-lg text-sm focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                              placeholder="9876543210"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={member.email || ""}
                            onChange={(e) =>
                              updateFamilyMember(member.id, "email", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                            placeholder="member@example.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            Arrival Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={member.arrivalDate || ""}
                            min={event?.startDate ? new Date(event.startDate).toISOString().split('T')[0] : undefined}
                            max={event?.endDate ? new Date(event.endDate).toISOString().split('T')[0] : undefined}
                            onChange={(e) =>
                              updateFamilyMember(member.id, "arrivalDate", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            Departure Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={member.departureDate || ""}
                            min={member.arrivalDate || (event?.startDate ? new Date(event.startDate).toISOString().split('T')[0] : undefined)}
                            max={event?.endDate ? new Date(event.endDate).toISOString().split('T')[0] : undefined}
                            onChange={(e) =>
                              updateFamilyMember(member.id, "departureDate", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-corporate-blue-100 focus:border-transparent"
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
