export interface Flight {
    id: string;
    flight_number: string;
    airline_name: string;
    departure_code: string;
    arrival_code: string;
    departure_time: string;
    arrival_time: string;
    base_price: number;
    available_seats: number;
}

export interface FlightSearchParams {
    departure_code: string;
    arrival_code: string;
}

export interface LocationResponse {
    departure_codes: string[];
    arrival_codes: string[];
}
