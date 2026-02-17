import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const cityId = searchParams.get('city_id');

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        let targetUrl = `${backendUrl}/api/v1/hotels`;

        if (cityId) {
            targetUrl += `?city_id=${cityId}`;
        }

        const authHeader = req.headers.get('Authorization') || '';
        const res = await fetch(targetUrl, {
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
        console.error('Hotels API Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
