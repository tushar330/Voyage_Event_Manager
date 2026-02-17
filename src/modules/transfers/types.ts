export interface Transfer {
    id: string;
    cab_type: string; // 'sedan', 'suv', 'hatchback'
    car_model: string;
    base_price_per_cab: number;
    capacity?: number;
    available_count: number;
}

export interface TransferSearchParams {
    cab_type?: string;
}
