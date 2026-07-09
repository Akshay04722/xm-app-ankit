import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (!adminAuth) {
      return NextResponse.json({ error: 'Admin SDK not initialized' }, { status: 500 });
    }

    try {
      await adminAuth.getUserByEmail(email.trim().toLowerCase());
      return NextResponse.json({ exists: true });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        return NextResponse.json({ exists: false });
      }
      throw err;
    }
  } catch (error: any) {
    console.error('POST /api/auth/check-email error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
