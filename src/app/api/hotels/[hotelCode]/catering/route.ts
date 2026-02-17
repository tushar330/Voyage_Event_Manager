import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ hotelCode: string }> }
) {
    try {
        const { hotelCode } = await params;
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

        const authHeader = req.headers.get('Authorization') || '';
        const res = await fetch(`${backendUrl}/api/v1/hotels/${hotelCode}/catering`, {
            headers: {
                'Authorization': authHeader,
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            return NextResponse.json({ error: errorText || 'Backend Error' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Hotel Catering Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
