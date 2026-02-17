"use client";

import React, { useState } from 'react';
import { Transfer } from '@/modules/transfers/types';
import { toast } from 'sonner';

interface TransferListProps {
    transfers: Transfer[];
    onAdd: (transferId: string, quantity: number) => Promise<void>;
}

export const TransferList: React.FC<TransferListProps> = ({ transfers, onAdd }) => {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [qtyMap, setQtyMap] = useState<Record<string, number>>({});

    const handleAdd = async (transfer: Transfer) => {
        const qty = qtyMap[transfer.id] || 1;
        setLoadingMap(prev => ({ ...prev, [transfer.id]: true }));
        try {
            console.log("Adding to cart:", transfer.id, qty);
            await onAdd(transfer.id, qty);
            toast.success('Transfer added to cart!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add transfer to cart');
        } finally {
            setLoadingMap(prev => ({ ...prev, [transfer.id]: false }));
        }
    };

    if (transfers.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200">
                <p className="text-neutral-500 font-medium">No transfers available.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transfers.map(transfer => (
                <div key={transfer.id} className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all flex flex-col">
                    <div className="h-32 bg-neutral-100 flex items-center justify-center relative overflow-hidden group">
                        {/* Placeholder Car Image or Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-300 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /> {/* Abstract transport icon */}
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-2 7 2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v5zM5 10v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                         <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded text-neutral-900 border border-neutral-200">
                            {transfer.cab_type.toUpperCase()}
                        </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-neutral-900 text-lg mb-1">{transfer.car_model}</h3>
                        <p className="text-sm text-neutral-500 mb-4">
                            Max Capacity: {transfer.capacity || (transfer.cab_type === 'sedan' ? 4 : transfer.cab_type === 'suv' ? 6 : 4)} Passengers
                        </p>
                        
                        <div className="mt-auto pt-4 border-t border-neutral-100 flex items-center justify-between">
                             <div>
                                <span className="text-xs text-neutral-400 block">Base Price</span>
                                <span className="font-black text-neutral-900 text-xl">₹{transfer.base_price_per_cab.toLocaleString()}</span>
                                {transfer.available_count < 5 && transfer.available_count > 0 && (
                                    <span className="text-[10px] font-bold text-red-500 block mt-1">
                                        Only {transfer.available_count} left!
                                    </span>
                                )}
                                {transfer.available_count === 0 && (
                                     <span className="text-[10px] font-bold text-neutral-400 block mt-1">
                                        Out of Stock
                                    </span>
                                )}
                             </div>

                             <div className="flex items-center gap-3">
                                <div className="flex items-center bg-neutral-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setQtyMap(prev => ({...prev, [transfer.id]: Math.max(1, (prev[transfer.id] || 1) - 1)}))}
                                        disabled={transfer.available_count === 0 || (qtyMap[transfer.id] || 1) <= 1}
                                        className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-white rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center font-bold text-sm">
                                        {qtyMap[transfer.id] || 1}
                                    </span>
                                    <button
                                        onClick={() => setQtyMap(prev => ({...prev, [transfer.id]: Math.min(transfer.available_count, (prev[transfer.id] || 1) + 1)}))}
                                        disabled={transfer.available_count === 0 || (qtyMap[transfer.id] || 1) >= transfer.available_count}
                                        className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-white rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleAdd(transfer)}
                                    disabled={loadingMap[transfer.id] || transfer.available_count === 0}
                                    className="h-10 px-4 bg-neutral-900 text-white font-bold rounded-xl text-sm hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                                >
                                    {transfer.available_count === 0 ? 'Sold Out' : loadingMap[transfer.id] ? 'Adding...' : 'Add'}
                                </button>
                             </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
