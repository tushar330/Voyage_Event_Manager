'use client';

import { useState, useMemo, useEffect } from 'react';
import { SubGuest, GuestInput } from '@/types';

interface GuestListProps {
    initialGuests: SubGuest[];
    onUpdateGuest: (guest: SubGuest) => void;
    onDeleteGuest: (guestId: string) => void;
    eventId: string;
    token: string | null;
    onGuestAdded?: () => void;
}

export default function GuestList({ initialGuests, onUpdateGuest, onDeleteGuest, eventId, token, onGuestAdded }: GuestListProps) {
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

    // --- Derived State ---
    const filteredGuests = useMemo(() => {
        return guests.filter(guest => {
            const name = (guest.name || '').toLowerCase();
            const email = (guest.email || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            return name.includes(query) || email.includes(query);
        });
    }, [guests, searchQuery]);

    // Group guests by FamilyID
    const groupedGuests = useMemo(() => {
        const groups = filteredGuests.reduce((acc, guest) => {
            // Use familyId if present, else use ID to treat as individual
            const key = guest.familyId || guest.id;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(guest);
            return acc;
        }, {} as Record<string, SubGuest[]>);
        return Object.values(groups);
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
        setIsAddModalOpen(true);
    };

    const openEditModal = (guest: SubGuest) => {
        setEditingGuest(guest);
        setIsAddModalOpen(true);
    };

    const handleSaveGuest = async (guestData: GuestInput) => {
        if (editingGuest) {
            // Edit Mode — keep existing behavior
            const updatedGuest = { ...editingGuest, name: guestData.name, age: guestData.age, email: guestData.email, phone: guestData.phone } as SubGuest;
            onUpdateGuest(updatedGuest);
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
                <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white shadow-lg transition-opacity z-50 flex items-center gap-2 ${
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedGuestIds.size === filteredGuests.length && filteredGuests.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Family Members</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {groupedGuests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No guests found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                groupedGuests.map(group => {
                                    const headGuest = group[0];
                                    const otherMembers = group.slice(1);
                                    const hasFamily = otherMembers.length > 0;
                                    const isExpanded = expandedRowId === headGuest.id;

                                    return (
                                        <>
                                            <tr key={headGuest.id} className={`hover:bg-gray-50 ${isExpanded ? "bg-purple-50" : ""}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input 
                                                        type="checkbox" 
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        checked={selectedGuestIds.has(headGuest.id)}
                                                        onChange={() => toggleSelectGuest(headGuest.id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button 
                                                        onClick={() => hasFamily && toggleRow(headGuest.id)}
                                                        className={`flex items-center gap-2 ${hasFamily ? 'cursor-pointer hover:text-blue-600' : 'cursor-default'}`}
                                                    >
                                                        {hasFamily && (
                                                            <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                                                ▶
                                                            </span>
                                                        )}
                                                        <div className="text-sm font-medium text-gray-900 text-left">
                                                            {headGuest.name}
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">{headGuest.phone || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                     <div className="text-sm text-gray-500">{headGuest.age ? `${headGuest.age} yrs` : '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                     <div className="text-sm text-gray-500">
                                                        {hasFamily ? `${otherMembers.length} Family Member${otherMembers.length > 1 ? 's' : ''}` : 'None'}
                                                     </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button 
                                                        onClick={() => openEditModal(headGuest)}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteSingle(headGuest.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && hasFamily && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={6} className="px-6 py-4">
                                                        <div className="ml-8 space-y-2">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Family Members</p>
                                                            {otherMembers.map(member => (
                                                                <div key={member.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="font-medium text-gray-900">{member.name}</span>
                                                                        <span className="text-gray-500 text-xs">({member.age ? `${member.age} yrs` : '-'})</span>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => openEditModal(member)} className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                                                                        <button onClick={() => handleDeleteSingle(member.id)} className="text-xs text-red-600 hover:text-red-800">Delete</button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
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
                            onSubmit={handleSaveGuest} 
                            onCancel={() => setIsAddModalOpen(false)} 
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
}

function GuestForm({ initialData, onSubmit, onCancel }: { 
    initialData: SubGuest | null, 
    onSubmit: (data: GuestInput) => void,
    onCancel: () => void 
}) {
    const isEditMode = !!initialData;
    const [name, setName] = useState(initialData?.name || '');
    const [age, setAge] = useState(initialData?.age?.toString() || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [phone, setPhone] = useState(initialData?.phone || '');
    const [arrivalDate, setArrivalDate] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [numFamilyMembers, setNumFamilyMembers] = useState('0');
    const [familyMembers, setFamilyMembers] = useState<FamilyMemberForm[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFamilyCountChange = (count: string) => {
        const num = Math.max(0, parseInt(count) || 0);
        setNumFamilyMembers(String(num));
        const current = [...familyMembers];
        if (num > current.length) {
            for (let i = current.length; i < num; i++) {
                current.push({ id: `fm-${i}`, name: '', age: '' });
            }
        } else {
            current.splice(num);
        }
        setFamilyMembers(current);
    };

    const updateFamilyMember = (id: string, field: keyof FamilyMemberForm, value: string) => {
        setFamilyMembers(members => members.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload: GuestInput = {
            name: name.trim(),
            age: parseInt(age) || 0,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            arrivalDate: arrivalDate ? new Date(arrivalDate).toISOString() : undefined,
            departureDate: departureDate ? new Date(departureDate).toISOString() : undefined,
        };

        if (!isEditMode && familyMembers.length > 0) {
            payload.family_members = familyMembers.map(m => ({
                name: m.name.trim(),
                age: parseInt(m.age) || 0,
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
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input type="tel" className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            {!isEditMode && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Arrival Date</label>
                            <input type="date" className={inputClass} value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Departure Date</label>
                            <input type="date" className={inputClass} value={departureDate} onChange={e => setDepartureDate(e.target.value)} />
                        </div>
                    </div>

                    {/* Family Members */}
                    <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">Family Members</label>
                            <input 
                                type="number" min="0" max="20" 
                                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={numFamilyMembers}
                                onChange={e => handleFamilyCountChange(e.target.value)}
                            />
                        </div>

                        {familyMembers.length > 0 && (
                            <div className="space-y-3">
                                {familyMembers.map((member, index) => (
                                    <div key={member.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-xs font-semibold text-gray-500 mb-2">Member {index + 1}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Name *</label>
                                                <input type="text" required className={inputClass} value={member.name} onChange={e => updateFamilyMember(member.id, 'name', e.target.value)} placeholder="Name" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Age *</label>
                                                <input type="number" min="0" max="120" required className={inputClass} value={member.age} onChange={e => updateFamilyMember(member.id, 'age', e.target.value)} placeholder="Age" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {familyMembers.length === 0 && (
                            <p className="text-xs text-gray-400 italic">No family members. Change the count to add.</p>
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
