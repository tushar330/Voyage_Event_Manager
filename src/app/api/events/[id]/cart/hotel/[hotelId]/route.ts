import { NextResponse } from 'next/server';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string, hotelId: string }> }
) {
    try {
        const { id: eventId, hotelId } = await params;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const targetUrl = `${backendUrl}/api/v1/events/${eventId}/cart/hotel/${hotelId}`;

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
        console.error('Cart Hotel DELETE Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
