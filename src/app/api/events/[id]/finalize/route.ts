import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: eventId } = await params;
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const targetUrl = `${backendUrl}/api/v1/events/${eventId}/finalize`;

        const authHeader = req.headers.get('Authorization') || '';
        const res = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            return NextResponse.json({ error: errorText || 'Backend Error' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Finalize API Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
