import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db/db';

export async function GET() {
  try {
    const session = db.getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, session: null });
    }

    // Return session details without exposing tokens to the frontend client
    return NextResponse.json({
      authenticated: true,
      session: {
        email: session.email,
        name: session.name,
        picture: session.picture,
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    db.clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
  }
}
