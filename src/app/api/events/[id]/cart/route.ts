import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: eventId } = await params;
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        let targetUrl = `${backendUrl}/api/v1/events/${eventId}/cart`;

        if (status) {
            targetUrl += `?status=${status}`;
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
        console.error('Cart GET Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: eventId } = await params;
        const body = await req.json();

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const targetUrl = `${backendUrl}/api/v1/events/${eventId}/cart`;

        const authHeader = req.headers.get('Authorization') || '';
        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errorText = await res.text();
            return NextResponse.json({ error: errorText || 'Backend Error' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Cart POST Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
