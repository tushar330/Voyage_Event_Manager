'use client';

import React, { useState } from 'react';

export interface TableGuest {
    id: string;
    familyId?: string;
    name: string;
    age?: number | string;
    type?: string;
    email?: string;
    phone?: string;
    arrivalDate?: string;
    departureDate?: string;
    originalData?: any; // To pass original domain objects back via callbacks
}

interface SharedGuestTableProps {
    guests: TableGuest[];
    // Optional interactive features
    showCheckboxes?: boolean;
    showActions?: boolean;
    // Callbacks
    onEdit?: (guest: any, isMainGuest?: boolean) => void;
    onDelete?: (id: string) => void;
    selectedIds?: Set<string>;
    onSelectAll?: () => void;
    onSelect?: (id: string) => void;
}

export default function SharedGuestTable({
    guests,
    showCheckboxes = false,
    showActions = false,
    onEdit,
    onDelete,
    selectedIds = new Set(),
    onSelectAll,
    onSelect
}: SharedGuestTableProps) {
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const renderDate = (dateString?: string) => {
        if (!dateString) return '-';
        if (dateString.includes('/')) return dateString; // Already DD/MM/YYYY
        if (dateString.includes('-') && dateString.length >= 10) {
            const datePart = dateString.substring(0, 10);
            const parts = datePart.split('-');
            if (parts.length === 3 && parts[0].length === 4) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    };

    // Group guests by their FamilyID (or fallback to an individual ID to group singles)
    const groupedGuestsObject = guests.reduce((acc, guest) => {
        const key = guest.familyId || guest.id;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(guest);
        return acc;
    }, {} as Record<string, TableGuest[]>);

    const guestGroups = Object.values(groupedGuestsObject);

    const toggleRow = (id: string) => {
        setExpandedRowId(prev => (prev === id ? null : id));
    };

    // Calculate dynamic colspan based on enabled features
    const totalColumns = 6 + (showCheckboxes ? 1 : 0) + (showActions ? 1 : 0);

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {showCheckboxes && (
                                <th className="px-6 py-3 text-left w-12">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        checked={guests.length > 0 && selectedIds.size === guests.length}
                                        onChange={onSelectAll}
                                        aria-label="Select all guests"
                                    />
                                </th>
                            )}
                            <th className="pr-6 pl-[52px] py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Name</th>
                            <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Age</th>
                            <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Email</th>
                            <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Phone</th>
                            <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Check-In / Out</th>
                            <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs">Family Members</th>
                            {showActions && (
                                <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {guestGroups.length === 0 ? (
                            <tr>
                                <td colSpan={totalColumns} className="px-6 py-12 text-center text-gray-500">
                                    No guests found matching your search.
                                </td>
                            </tr>
                        ) : (
                            guestGroups.map((group) => {
                                const headGuest = group[0];
                                const otherMembers = group.slice(1);
                                const hasFamily = otherMembers.length > 0;
                                const isExpanded = expandedRowId === headGuest.id;

                                return (
                                    <React.Fragment key={headGuest.id}>
                                        <tr className={`transition-colors ${isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                            {showCheckboxes && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                        checked={selectedIds.has(headGuest.id)}
                                                        onChange={() => onSelect?.(headGuest.id)}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {/*
                                                     * Fixed-width (w-5) toggle button — ALWAYS rendered for every row.
                                                     * For solo guests it is invisible (opacity-0) + non-interactive,
                                                     * so the name text starts at the exact same x-position for all rows.
                                                     */}
                                                    <button
                                                        onClick={() => hasFamily && toggleRow(headGuest.id)}
                                                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                                        className={[
                                                            'w-5 h-5 flex-shrink-0 flex items-center justify-center rounded transition-all duration-200',
                                                            hasFamily
                                                                ? 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 cursor-pointer'
                                                                : 'opacity-0 pointer-events-none cursor-default',
                                                            isExpanded ? 'text-blue-500' : '',
                                                        ].join(' ')}
                                                        aria-hidden={!hasFamily}
                                                    >
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                    <span
                                                        onClick={() => hasFamily && toggleRow(headGuest.id)}
                                                        className={`flex items-center gap-2 ${hasFamily ? 'cursor-pointer hover:text-blue-600' : ''}`}
                                                    >
                                                        {headGuest.name}
                                                        {headGuest.type && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${headGuest.type === 'child' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                {headGuest.type}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                {headGuest.age ? `${headGuest.age} yrs` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                {headGuest.email || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                {headGuest.phone || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>Check In: {renderDate(headGuest.arrivalDate)}</span>
                                                    <span className="text-xs text-gray-400">
                                                        Check Out: {renderDate(headGuest.departureDate)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {hasFamily ? (
                                                    <button
                                                        onClick={() => toggleRow(headGuest.id)}
                                                        className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${isExpanded ? 'text-blue-700' : 'text-blue-500 hover:text-blue-700'}`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {otherMembers.length} Member{otherMembers.length > 1 ? 's' : ''}
                                                    </button>
                                                ) : (
                                                    <span className="text-sm text-gray-400">None</span>
                                                )}
                                            </td>
                                            {showActions && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => onEdit?.(headGuest.originalData || headGuest, true)}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete?.(headGuest.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            )}
                                        </tr>

                                        {/* ── Expanded Family Members Panel ── */}
                                        {isExpanded && hasFamily && (
                                            <tr>
                                                <td colSpan={totalColumns} className="p-0">
                                                    <div className="bg-gradient-to-b from-blue-50/80 to-slate-50 border-t border-blue-100 px-8 py-4">
                                                        {/* Panel header */}
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
                                                                Family Members ({otherMembers.length})
                                                            </span>
                                                        </div>

                                                        {/* Member cards */}
                                                        <div className="flex flex-col gap-2">
                                                            {otherMembers.map((member) => (
                                                                <div
                                                                    key={member.id}
                                                                    className="flex items-center gap-4 bg-white rounded-lg border border-blue-100 px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                                                                >
                                                                    {/* Avatar initial */}
                                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-semibold text-sm">
                                                                        {member.name?.charAt(0)?.toUpperCase() || '?'}
                                                                    </div>

                                                                    {/* Name + type badge */}
                                                                    <div className="min-w-[140px]">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-gray-900 text-sm">{member.name}</span>
                                                                            {member.type && (
                                                                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${member.type === 'child' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                                    {member.type}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {member.age && (
                                                                            <p className="text-xs text-gray-400 mt-0.5">{member.age} yrs</p>
                                                                        )}
                                                                    </div>

                                                                    {/* Vertical divider */}
                                                                    <div className="w-px h-8 bg-gray-100 flex-shrink-0" />

                                                                    {/* Contact + dates */}
                                                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-500 flex-1">
                                                                        {member.email && (
                                                                            <span className="flex items-center gap-1.5">
                                                                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                                </svg>
                                                                                {member.email}
                                                                            </span>
                                                                        )}
                                                                        {member.phone && (
                                                                            <span className="flex items-center gap-1.5">
                                                                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                                </svg>
                                                                                {member.phone}
                                                                            </span>
                                                                        )}
                                                                        {(member.arrivalDate || member.departureDate) && (
                                                                            <span className="flex items-center gap-1.5">
                                                                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                </svg>
                                                                                {renderDate(member.arrivalDate)} → {renderDate(member.departureDate)}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Actions */}
                                                                    {showActions && (
                                                                        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                                                                            <button
                                                                                onClick={() => onEdit?.(member.originalData || member, false)}
                                                                                className="text-xs px-3 py-1 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => onDelete?.(member.id)}
                                                                                className="text-xs px-3 py-1 rounded-md border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
