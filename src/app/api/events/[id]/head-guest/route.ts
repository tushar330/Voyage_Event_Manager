import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: eventId } = await params;
    const body = await req.json();
    const { name, email, phone } = body;

    if (!email || !name) {
        return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
    }

    // 1. Create Clerk User
    let clerkUser;
    try {
        const client = await clerkClient();
        clerkUser = await client.users.createUser({
            emailAddress: [email],
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1
              
            ).join(' '),
            password: 'ChangeMe123!', // Temporary password policy
            skipPasswordChecks: true,
            skipPasswordRequirement: true,
        });
    } catch (clerkErr: any) {
        console.error('Clerk Create Error:', clerkErr);
        // If user already exists, we might want to find them. 
        // For now return error.
        return NextResponse.json({ error: clerkErr.errors?.[0]?.message || 'Failed to create Clerk user' }, { status: 400 });
    }

    // 2. Call Go Backend to create DB User and Link to Event
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const res = await fetch(`${backendUrl}/api/v1/events/${eventId}/event-manager`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': userId, // Agent's ID
        },
        body: JSON.stringify({
            clerkId: clerkUser.id,
            name,
            email,
            phone
        })
    });

    if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json({ error: errorText || 'Backend Error' }, { status: res.status });
    }

    const data = await res.json();
    
    // Return the created user details (and maybe temp password if we generated one)
    return NextResponse.json({ ...data, tempPassword: 'ChangeMe123!' });

  } catch (error) {
    console.error('Event Manager API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
