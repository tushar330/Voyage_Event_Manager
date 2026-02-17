import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.toString();
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const targetUrl = `${backendUrl}/api/v1/transfers?${query}`;

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
        console.error('Transfers API Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
