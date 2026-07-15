import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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

export async function PUT(req: NextRequest) {
  try {
    await authenticateAdmin(req);

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'success', 'failed', 'cancelled', 'returned'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const db = getFirestore();
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderSnap.data();
    const previousStatus = orderData?.status;
    const cart = orderData?.cart;

    // Adjust stock based on status transition
    if (previousStatus !== status) {
      const batch = db.batch();
      let adjusted = false;

      // 1. If old status was success and new status is NOT success, increment stock (restore)
      if (previousStatus === 'success' && status !== 'success') {
        if (Array.isArray(cart) && cart.length > 0) {
          for (const item of cart) {
            if (item.sku) {
              const productRef = db.collection('products').doc(item.sku.trim());
              batch.set(productRef, {
                stockCount: FieldValue.increment(Number(item.quantity || 1)),
                updatedAt: new Date().toISOString(),
              }, { merge: true });
              adjusted = true;
            }
          }
        }
      }
      // 2. If old status was NOT success and new status is success, decrement stock
      else if (previousStatus !== 'success' && status === 'success') {
        if (Array.isArray(cart) && cart.length > 0) {
          for (const item of cart) {
            if (item.sku) {
              const productRef = db.collection('products').doc(item.sku.trim());
              batch.set(productRef, {
                stockCount: FieldValue.increment(-Number(item.quantity || 1)),
                updatedAt: new Date().toISOString(),
              }, { merge: true });
              adjusted = true;
            }
          }
        }
      }

      if (adjusted) {
        await batch.commit();
      }
    }

    // Prepare update payload
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'cancelled') {
      updateData.cancelReason = orderData?.cancelReason || 'Cancelled by Admin';
      updateData.cancelledAt = orderData?.cancelledAt || new Date().toISOString();
    } else if (status === 'returned') {
      updateData.returnReason = orderData?.returnReason || 'Returned by Admin';
      updateData.returnedAt = orderData?.returnedAt || new Date().toISOString();
    }

    await orderRef.update(updateData);

    return NextResponse.json({ success: true, message: 'Order status updated successfully' });
  } catch (error: any) {
    console.error('PUT /api/admin/orders error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 400 });
  }
}

