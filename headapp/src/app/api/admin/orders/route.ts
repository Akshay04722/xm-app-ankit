import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

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

    const db = getFirestore();
    const ordersSnap = await db.collection("orders").get();

    const ordersList: any[] = [];
    ordersSnap.forEach((doc) => {
      ordersList.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort by createdAt descending
    ordersList.sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return NextResponse.json({ success: true, orders: ordersList });
  } catch (error: any) {
    console.error('GET /api/admin/orders error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 400 });
  }
}
