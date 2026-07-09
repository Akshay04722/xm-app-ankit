import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { UserRecord } from 'firebase-admin/auth';

interface MappedUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isAdmin: boolean;
  role: string;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

// Helper to authenticate admin users via custom claims
async function authenticateAdmin(req: NextRequest) {
  
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK is not initialized.');
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header.');
  }

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await adminAuth.verifyIdToken(token);
  
  const isAdmin = decodedToken.isAdmin === true || decodedToken.role === 'admin';
  if (!isAdmin) {
    throw new Error('Access Denied: Only users with admin privileges can perform this action.');
  }

  return decodedToken;
}

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    if (!adminAuth) {
      return NextResponse.json({ error: 'Admin SDK not initialized' }, { status: 500 });
    }

    // List up to 1000 users
    const listUsersResult = await adminAuth.listUsers(1000);
    console.log(listUsersResult);
    let users: MappedUser[] = listUsersResult.users.map((userRecord: UserRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email || '',
      displayName: userRecord.displayName || '',
      photoURL: userRecord.photoURL || '',
      isAdmin: userRecord.customClaims?.isAdmin === true || userRecord.customClaims?.role === 'admin',
      role: userRecord.customClaims?.role || 'user',
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
    }));

    if (search) {
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(search) ||
          u.displayName.toLowerCase().includes(search) ||
          u.uid.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await authenticateAdmin(req);

    const body = await req.json();
    const { targetUid, isAdmin } = body;

    if (!targetUid) {
      return NextResponse.json({ error: 'Missing targetUid' }, { status: 400 });
    }

    if (!adminAuth) {
      return NextResponse.json({ error: 'Admin SDK not initialized' }, { status: 500 });
    }

    const role = isAdmin ? 'admin' : 'user';
    await adminAuth.setCustomUserClaims(targetUid, { role, isAdmin });

    return NextResponse.json({ success: true, role, isAdmin });
  } catch (error: any) {
    console.error('POST /api/admin/users error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const selfDecoded = await authenticateAdmin(req);

    const { searchParams } = new URL(req.url);
    const targetUid = searchParams.get('uid');

    if (!targetUid) {
      return NextResponse.json({ error: 'Missing uid parameter' }, { status: 400 });
    }

    if (!adminAuth) {
      return NextResponse.json({ error: 'Admin SDK not initialized' }, { status: 500 });
    }

    // Prevent admin from deleting themselves (self-deletion safeguard)
    if (selfDecoded.uid === targetUid) {
      return NextResponse.json({ error: 'Safety block: You cannot delete your own admin account.' }, { status: 400 });
    }

    await adminAuth.deleteUser(targetUid);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 400 });
  }
}
