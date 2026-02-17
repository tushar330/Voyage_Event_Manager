import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Verify that the userId from auth matches the one we might be sending, 
    // or just rely on the auth() check and inject the ClerkID into the backend request.
    
    // Forward to Go Backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const res = await fetch(`${backendUrl}/api/v1/agents/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass the Clerk ID securely if needed, but the backend should probably verify the token too.
        // For now, we'll trust the Next.js server context and pass the ID.
        'X-Clerk-User-Id': userId, 
      },
      body: JSON.stringify({ ...body, clerkId: userId }),
    });

    if (!res.ok) {
        const errorData = await res.text();
        return NextResponse.json({ error: errorData }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Onboarding API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
