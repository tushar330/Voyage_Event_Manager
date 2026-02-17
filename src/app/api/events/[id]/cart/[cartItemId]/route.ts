import { NextResponse } from 'next/server';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string, cartItemId: string }> }
) {
    try {
        const { id: eventId, cartItemId } = await params;
        const body = await req.json();

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const targetUrl = `${backendUrl}/api/v1/events/${eventId}/cart/${cartItemId}`;

        const authHeader = req.headers.get('Authorization') || '';
        const res = await fetch(targetUrl, {
            method: 'PATCH',
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
        console.error('Cart PATCH Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string, cartItemId: string }> }
) {
    try {
        const { id: eventId, cartItemId } = await params;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const targetUrl = `${backendUrl}/api/v1/events/${eventId}/cart/${cartItemId}`;

        const authHeader = req.headers.get('Authorization') || '';
        const res = await fetch(targetUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': authHeader,
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            return NextResponse.json({ error: errorText || 'Backend Error' }, { status: res.status });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Cart DELETE Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
