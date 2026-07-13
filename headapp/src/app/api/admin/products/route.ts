import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

// Helper to authenticate admin users
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

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate admin
    await authenticateAdmin(req);

    // 2. Parse request body
    const body = await req.json();
    const {
      sku,
      title,
      shortDescription,
      longDescription,
      additionalInformation,
      price,
      discountPrice,
      isNew,
      mainImageUrl,
      galleryImageUrls,
      sizes,
      colors,
      category,
      tags,
      stockCount
    } = body;

    // 3. Validation
    if (!sku || !sku.trim()) {
      return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (price === undefined || price === null || isNaN(Number(price))) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }
    if (stockCount === undefined || stockCount === null || isNaN(Number(stockCount))) {
      return NextResponse.json({ error: 'Valid stock count is required' }, { status: 400 });
    }

    // 4. Save to Firestore
    const db = getFirestore();
    const productDoc = {
      sku: sku.trim(),
      title: title.trim(),
      shortDescription: (shortDescription || '').trim(),
      longDescription: (longDescription || '').trim(),
      additionalInformation: (additionalInformation || '').trim(),
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      isNew: Boolean(isNew),
      mainImageUrl: (mainImageUrl || '').trim(),
      galleryImageUrls: Array.isArray(galleryImageUrls) ? galleryImageUrls.map(url => url.trim()) : [],
      sizes: Array.isArray(sizes) ? sizes : [],
      colors: Array.isArray(colors) ? colors : [],
      category: (category || '').trim(),
      tags: Array.isArray(tags) ? tags.map(tag => tag.trim()) : [],
      stockCount: Number(stockCount),
      updatedAt: new Date().toISOString()
    };

    await db.collection('products').doc(sku.trim()).set(productDoc);

    return NextResponse.json({
      success: true,
      message: `Product ${sku} has been successfully saved in Firestore.`,
      product: productDoc
    });

  } catch (error: any) {
    console.error('POST /api/admin/products error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req);
    const db = getFirestore();
    const snapshot = await db.collection('products').get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('GET /api/admin/products error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await authenticateAdmin(req);
    const { searchParams } = new URL(req.url);
    const sku = searchParams.get('sku');

    if (!sku) {
      return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
    }

    const db = getFirestore();
    await db.collection('products').doc(sku.trim()).delete();

    return NextResponse.json({
      success: true,
      message: `Product ${sku} has been successfully deleted from Firestore.`
    });
  } catch (error: any) {
    console.error('DELETE /api/admin/products error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 400 });
  }
}
