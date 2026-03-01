'use client';

import { useState, useMemo, useEffect } from 'react';
import { SubGuest, GuestInput } from '@/types';
import SharedGuestTable, { TableGuest } from '@/components/shared/SharedGuestTable';

interface GuestListProps {
    initialGuests: SubGuest[];
    onUpdateGuest: (guest: SubGuest) => void;
    onDeleteGuest: (guestId: string) => void;
    eventId: string;
    token: string | null;
    onGuestAdded?: () => void;
    eventDates?: { start: string; end: string };
}

export default function GuestList({ initialGuests, onUpdateGuest, onDeleteGuest, eventId, token, onGuestAdded, eventDates }: GuestListProps) {
    const [guests, setGuests] = useState<SubGuest[]>(initialGuests);
    
    // Sync local state if initialGuests changes (e.g. after API refetch parent-side)
    useEffect(() => {
        setGuests(initialGuests);
    }, [initialGuests]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    
    // --- Add/Edit State ---
    const [editingGuest, setEditingGuest] = useState<SubGuest | null>(null);
    const [isEditingMainGuest, setIsEditingMainGuest] = useState(false);

    // --- Derived State ---
    const filteredGuests = useMemo(() => {
        return guests.filter(guest => {
            const name = (guest.name || '').toLowerCase();
            const email = (guest.email || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            return name.includes(query) || email.includes(query);
        });
    }, [guests, searchQuery]);

    // Group guests by FamilyID and map to TableGuest
    const mappedGuests: TableGuest[] = useMemo(() => {
        return filteredGuests.map(guest => ({
            id: guest.id,
            familyId: guest.familyId,
            name: guest.name,
            age: guest.age,
            type: guest.type,
            email: guest.email,
            phone: guest.phone,
            arrivalDate: guest.arrivalDate,
            departureDate: guest.departureDate,
            originalData: guest
        }));
    }, [filteredGuests]);

    // --- Delete Confirmation State ---
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        type: 'single' | 'batch';
        guestId?: string; // For single delete
    }>({ isOpen: false, type: 'single' });

    // --- Toast State ---
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };



    // --- Actions ---
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // --- Actions ---


    const toggleRow = (id: string) => {
        if (expandedRowId === id) {
            setExpandedRowId(null);
        } else {
            setExpandedRowId(id);
        }
    };

    const toggleSelectAll = () => {
        if (selectedGuestIds.size === filteredGuests.length) {
            setSelectedGuestIds(new Set());
        } else {
            setSelectedGuestIds(new Set(filteredGuests.map(g => g.id)));
        }
    };

    const toggleSelectGuest = (id: string) => {
        const newSelected = new Set(selectedGuestIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedGuestIds(newSelected);
    };

    const handleExport = () => {
        const headers = ['Name', 'Email', 'Phone', 'Room Group'];
        const rows = filteredGuests.map(g => [
            g.name || '',
            g.email || '',
            g.phone || '',
            g.roomGroupId || 'Unassigned'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'guest_list.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeleteSelected = () => {
        setDeleteConfirmation({ isOpen: true, type: 'batch' });
    };

    const handleDeleteSingle = (id: string) => {
         setDeleteConfirmation({ isOpen: true, type: 'single', guestId: id });
    };

    const confirmDelete = () => {
        if (deleteConfirmation.type === 'batch') {
             selectedGuestIds.forEach(id => onDeleteGuest(id));
             setSelectedGuestIds(new Set());
        } else if (deleteConfirmation.type === 'single' && deleteConfirmation.guestId) {
             onDeleteGuest(deleteConfirmation.guestId);
        }
        setDeleteConfirmation({ isOpen: false, type: 'single' });
    };

    const openAddModal = () => {
        setEditingGuest(null);
        setIsEditingMainGuest(false);
        setIsAddModalOpen(true);
    };

    const openEditModal = (guest: SubGuest, isMainGuest: boolean = false) => {
        setEditingGuest(guest);
        setIsEditingMainGuest(isMainGuest);
        setIsAddModalOpen(true);
    };

    const handleSaveGuest = async (guestData: GuestInput) => {
        if (editingGuest) {
            // Edit Mode — keep existing behavior
            const updatedGuest = { 
                ...editingGuest, 
                name: guestData.name, 
                age: guestData.age, 
                email: guestData.email, 
                phone: guestData.phone,
                arrivalDate: guestData.arrivalDate,
                departureDate: guestData.departureDate
            } as SubGuest;
            onUpdateGuest(updatedGuest);
            // Trigger refetch from DB so dates and other fields show the persisted values
            onGuestAdded?.();

            // Handle new family members added during edit
            if (guestData.family_members && guestData.family_members.length > 0) {
                try {
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
                    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    // The family ID to use: if the main member already has a familyId, use it.
                    // Otherwise use their own ID as the family group identifier.
                    const targetFamilyId = editingGuest.familyId || editingGuest.id;

                    // If main member had no familyId, first PATCH them to assign themselves a family group
                    if (!editingGuest.familyId) {
                        await fetch(`${backendUrl}/api/v1/guests/${editingGuest.id}`, {
                            method: 'PATCH',
                            headers,
                            body: JSON.stringify({
                                id: editingGuest.id,
                                ID: editingGuest.id,
                                guest_id: editingGuest.id,
                                family_id: targetFamilyId,
                                FamilyID: targetFamilyId,
                            })
                        });
                    }

                    // Now POST each new member and immediately PATCH to enforce family_id
                    for (const fm of guestData.family_members) {
                        const postPayload = {
                            name: fm.name,
                            age: fm.age,
                            type: fm.type,
                            email: fm.email,
                            phone: fm.phone,
                            arrivalDate: fm.arrivalDate,
                            departureDate: fm.departureDate,
                        };

                        const res = await fetch(`${backendUrl}/api/v1/events/${eventId}/guests`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify(postPayload)
                        });

                        if (!res.ok) {
                            console.error('Failed to add family member:', fm.name);
                            continue;
                        }

                        // Backend ignores family_id on POST and auto-generates its own.
                        // The response gives us that auto-generated family_id: data.family_id
                        let responseData: any = {};
                        try { responseData = await res.json(); } catch {}

                        const autoFamilyId = responseData?.data?.family_id;
                        if (!autoFamilyId) {
                            console.error('No family_id in POST response, cannot relocate guest');
                            continue;
                        }

                        // Refetch the guest list to find the newly created guest by their auto family_id
                        const listRes = await fetch(`${backendUrl}/api/v1/events/${eventId}/guests`, { headers });
                        if (!listRes.ok) { console.error('Failed to refetch guest list'); continue; }
                        const listData = await listRes.json();
                        const allGuests: any[] = listData?.guests || [];

                        // Find guests that were assigned the auto-generated family_id
                        const newGuests = allGuests.filter((g: any) => {
                            const gFamilyId = g.FamilyID || g.family_id || '';
                            return gFamilyId === autoFamilyId;
                        });

                        // PATCH each of them to the correct targetFamilyId
                        for (const ng of newGuests) {
                            const ngId = ng.guest_id || ng.ID || ng.id;
                            if (!ngId) continue;
                            await fetch(`${backendUrl}/api/v1/guests/${ngId}`, {
                                method: 'PATCH',
                                headers,
                                body: JSON.stringify({
                                    id: ngId,
                                    ID: ngId,
                                    guest_id: ngId,
                                    family_id: targetFamilyId,
                                    FamilyID: targetFamilyId,
                                })
                            });
                        }
                    }

                    onGuestAdded?.();
                } catch (error) {
                    console.error('Error adding new family members:', error);
                }
            }

            showToast('Guest updated successfully');
            setIsAddModalOpen(false);
        } else {
            // Add Mode — call the API
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                const response = await fetch(`${backendUrl}/api/v1/events/${eventId}/guests`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(guestData),
                });
                if (!response.ok) {
                    const result = await response.json().catch(() => ({}));
                    throw new Error(result.error || 'Failed to add guest');
                }
                showToast('Guest added successfully');
                setIsAddModalOpen(false);
                onGuestAdded?.();
            } catch (error: any) {
                console.error('Error adding guest:', error);
                showToast(error.message || 'Failed to add guest', 'error');
            }
        }
    };

    return (
        <div className="space-y-4">
            {/* Toast Notification */}
            {toast.visible && (
                <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white shadow-lg transition-opacity z-[100] flex items-center gap-2 ${
                    toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                }`}>
                    {toast.type === 'success' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    {toast.message}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search guests..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="flex gap-2">
                     <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                    <button
                        onClick={openAddModal}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Guest
                    </button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedGuestIds.size > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center text-sm text-blue-900">
                    <span>{selectedGuestIds.size} guests selected</span>
                    <button 
                        onClick={handleDeleteSelected}
                        className="text-red-600 hover:text-red-700 font-medium"
                    >
                        Delete Selected
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="w-full">
                <SharedGuestTable 
                    guests={mappedGuests}
                    showCheckboxes={true}
                    showActions={true}
                    onEdit={openEditModal}
                    onDelete={handleDeleteSingle}
                    selectedIds={selectedGuestIds}
                    onSelectAll={toggleSelectAll}
                    onSelect={toggleSelectGuest}
                />
            </div>

            {/* Edit/Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingGuest ? 'Edit Guest' : 'Add New Guest'}
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <GuestForm 
                            initialData={editingGuest} 
                            isMainGuest={isEditingMainGuest}
                            onSubmit={handleSaveGuest} 
                            onCancel={() => setIsAddModalOpen(false)} 
                            showToast={showToast}
                            eventDates={eventDates}
                        />
                    </div>
                </div>
            )}
            
            {/* Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                             <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Delete Guest?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to delete {deleteConfirmation.type === 'batch' ? `${selectedGuestIds.size} guests` : 'this guest'}? This action cannot be undone.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button 
                                onClick={() => setDeleteConfirmation({ isOpen: false, type: 'single' })}
                                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface FamilyMemberForm {
    id: string;
    name: string;
    age: string;
    email: string;
    phone: string;
    countryCode: string;
    arrivalDate: string;
    departureDate: string;
}

function GuestForm({ initialData, isMainGuest = false, onSubmit, onCancel, showToast, eventDates }: { 
    initialData: SubGuest | null, 
    isMainGuest?: boolean,
    onSubmit: (data: GuestInput) => void,
    onCancel: () => void,
    showToast: (msg: string, type: 'error' | 'success') => void;
    eventDates?: { start: string; end: string };
}) {
    const isEditMode = !!initialData;
    const [name, setName] = useState(initialData?.name || '');
    const [age, setAge] = useState(initialData?.age?.toString() || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [phone, setPhone] = useState(initialData?.phone || '');
    const [countryCode, setCountryCode] = useState('+91');
    const parseInitialDate = (dateString?: string) => {
        if (!dateString) return '';
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        if (dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts[0].length === 4) return dateString.substring(0, 10); // YYYY-MM-DD
            if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return dateString.substring(0, 10);
    };

    const [arrivalDate, setArrivalDate] = useState(parseInitialDate(initialData?.arrivalDate));
    const [departureDate, setDepartureDate] = useState(parseInitialDate(initialData?.departureDate));
    const [numFamilyMembers, setNumFamilyMembers] = useState('0');
    const [familyMembers, setFamilyMembers] = useState<FamilyMemberForm[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFamilyCountChange = (count: string) => {
        const num = Math.max(0, parseInt(count) || 0);
        setNumFamilyMembers(String(num));
        const current = [...familyMembers];
        if (num > current.length) {
            for (let i = current.length; i < num; i++) {
                current.push({ id: `fm-${i}`, name: '', age: '', email: '', phone: '', countryCode: '+91', arrivalDate: '', departureDate: '' });
            }
        } else {
            current.splice(num);
        }
        setFamilyMembers(current);
    };

    const updateFamilyMember = (id: string, field: keyof FamilyMemberForm, value: string) => {
        setFamilyMembers(members => members.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const formatDateForApi = (dateString?: string) => {
        if (!dateString) return undefined;
        // Check if string is DD/MM/YYYY (from initial payload parsing reverse map)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Enforce phone constraint for Event Manager (Main Guest)
        let phoneString = phone.trim();
        if (phoneString && !phoneString.startsWith('+')) {
            phoneString = `${countryCode} ${phoneString}`;
        }

        const digitsOnly = phoneString.replace(/\D/g, '');
        if (!digitsOnly || digitsOnly.length < 10) {
            showToast('Please enter a valid phone number with at least 10 digits.', 'error');
            return;
        }

        setIsSubmitting(true);

        const payload: GuestInput = {
            name: name.trim(),
            age: parseInt(age) || 0,
            email: email.trim() || undefined,
            phone: phoneString,
            arrivalDate: formatDateForApi(arrivalDate),
            departureDate: formatDateForApi(departureDate),
        };

        if ((!isEditMode || isMainGuest) && familyMembers.length > 0) {
            payload.family_members = familyMembers.map(m => ({
                name: m.name.trim(),
                age: parseInt(m.age) || 0,
                type: (parseInt(m.age) || 0) < 16 ? 'child' : 'adult',
                email: m.email.trim() || undefined,
                phone: m.phone.trim() ? (m.phone.trim().startsWith('+') ? m.phone.trim() : `${m.countryCode} ${m.phone.trim()}`) : undefined,
                arrivalDate: formatDateForApi(m.arrivalDate),
                departureDate: formatDateForApi(m.departureDate),
            }));
        }

        await onSubmit(payload);
        setIsSubmitting(false);
    };

    const inputClass = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm";

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Main Guest Fields */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input type="text" required className={inputClass} value={name} onChange={e => setName(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Age *</label>
                    <input type="number" min="0" max="120" required className={inputClass} value={age} onChange={e => setAge(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone *</label>
                    <div className="flex mt-1 shadow-sm rounded-md">
                        <select
                            value={countryCode}
                            onChange={e => setCountryCode(e.target.value)}
                            className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        >
                            <option value="+1">+1 (US)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+91">+91 (IN)</option>
                            <option value="+61">+61 (AU)</option>
                            <option value="+971">+971 (AE)</option>
                        </select>
                        <input type="tel" required className="flex-1 rounded-r-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input type="email" required className={inputClass} value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Arrival Date *</label>
                    <input type="date" required className={inputClass} value={arrivalDate} min={eventDates?.start} max={eventDates?.end} onChange={e => setArrivalDate(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Departure Date *</label>
                    <input type="date" required className={inputClass} value={departureDate} min={arrivalDate || eventDates?.start} max={eventDates?.end} onChange={e => setDepartureDate(e.target.value)} />
                </div>
            </div>

            {(!isEditMode || (isEditMode && isMainGuest)) && (
                <>
                    {/* Family Members */}
                    <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-medium text-gray-700">Family Members</label>
                            <button
                                type="button"
                                onClick={() => {
                                    const nextId = `fm-${Date.now()}-${familyMembers.length}`;
                                    setFamilyMembers([...familyMembers, { id: nextId, name: '', age: '', email: '', phone: '', countryCode: '+91', arrivalDate: '', departureDate: '' }]);
                                    setNumFamilyMembers(String(familyMembers.length + 1));
                                }}
                                className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add Family Member
                            </button>
                        </div>

                        {familyMembers.length > 0 && (
                            <div className="space-y-3">
                                {familyMembers.map((member, index) => (
                                    <div key={member.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs font-semibold text-gray-500">New Family Member {index + 1}</p>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const newMembers = familyMembers.filter((_, i) => i !== index);
                                                    setFamilyMembers(newMembers);
                                                    setNumFamilyMembers(String(newMembers.length));
                                                }}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                                                <input type="text" required className={inputClass} value={member.name} onChange={e => updateFamilyMember(member.id, 'name', e.target.value)} placeholder="Full name" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Age *</label>
                                                <input type="number" min="0" max="120" required className={inputClass} value={member.age} onChange={e => updateFamilyMember(member.id, 'age', e.target.value)} placeholder="Age" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                                                <input type="email" required className={inputClass} value={member.email} onChange={e => updateFamilyMember(member.id, 'email', e.target.value)} placeholder="Email address" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                                                <div className="flex shadow-sm rounded-md">
                                                    <select
                                                        value={member.countryCode}
                                                        onChange={e => updateFamilyMember(member.id, 'countryCode', e.target.value)}
                                                        className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-2 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                                    >
                                                        <option value="+1">+1</option>
                                                        <option value="+44">+44</option>
                                                        <option value="+91">+91</option>
                                                        <option value="+61">+61</option>
                                                        <option value="+971">+971</option>
                                                    </select>
                                                    <input type="tel" required className="flex-1 rounded-r-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" value={member.phone} onChange={e => updateFamilyMember(member.id, 'phone', e.target.value)} placeholder="Phone" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Arrival Date *</label>
                                                <input type="date" required className={inputClass} value={member.arrivalDate} min={eventDates?.start} max={eventDates?.end} onChange={e => updateFamilyMember(member.id, 'arrivalDate', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Departure Date *</label>
                                                <input type="date" required className={inputClass} value={member.departureDate} min={member.arrivalDate || eventDates?.start} max={eventDates?.end} onChange={e => updateFamilyMember(member.id, 'departureDate', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {familyMembers.length === 0 && (
                            <p className="text-xs text-gray-400 italic">No new family members added. Click the button above to add one.</p>
                        )}
                    </div>
                </>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : `Add Guest${familyMembers.length > 0 ? ` (${1 + familyMembers.length})` : ''}`)}
                </button>
            </div>
        </form>
    );
}
