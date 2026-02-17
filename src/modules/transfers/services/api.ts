import { Transfer, TransferSearchParams } from '../types';

const API_URL = '/api/transfers';

export const transferApi = {
    async getTransfers(params?: TransferSearchParams, token?: string): Promise<Transfer[]> {
        let url = API_URL;
        if (params && params.cab_type) {
            const query = new URLSearchParams({ cab_type: params.cab_type }).toString();
            url += `?${query}`;
        }
        
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error('Failed to fetch transfers');
            const data = await response.json();
            
            console.log("Transfers API Response:", data); // Debug log

            if (Array.isArray(data)) {
                return data;
            } else if (data.data && Array.isArray(data.data)) {
                return data.data;
            } else if (data.data && data.data.data && Array.isArray(data.data.data)) {
                // Handle nested pagination structure { success: true, data: { count: 11, data: [...] } }
                return data.data.data;
            } else if (data.transfers && Array.isArray(data.transfers)) {
                 return data.transfers;
            }
            
            console.warn("Unexpected transfers API response format:", data);
            return [];
        } catch (error) {
            console.error("Error fetching transfers:", error);
            throw error;
        }
    }
};
