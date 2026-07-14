import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { UserRecord } from 'firebase-admin/auth';

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

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate admin
    await authenticateAdmin(req);

    if (!adminAuth) {
      return NextResponse.json({ error: 'Admin SDK not initialized' }, { status: 500 });
    }

    const db = getFirestore();

    // 2. Fetch all users from Firebase Authentication (up to 1000 users)
    const listUsersResult = await adminAuth.listUsers(1000);
    const users = listUsersResult.users;

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found in Firebase Authentication to sync.',
        syncedCount: 0,
      });
    }

    let syncedCount = 0;
    
    // We will process updates in chunks to comply with Firestore batch limits (max 500 operations per batch)
    // For each user we write 1 user doc and 2 address subcollection docs, total 3 operations.
    // So we process in chunks of 150 users (450 operations).
    const chunkSize = 150;
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);
      const batch = db.batch();

      for (const userRecord of chunk) {
        const uid = userRecord.uid;
        const email = userRecord.email || '';
        const displayName = userRecord.displayName || '';

        // Extract or fallback first & last name
        let firstName = 'John';
        let lastName = 'Doe';
        if (displayName.trim()) {
          const parts = displayName.trim().split(/\s+/);
          firstName = parts[0] || 'John';
          lastName = parts.slice(1).join(' ') || 'Doe';
        } else if (email) {
          const prefix = email.split('@')[0];
          firstName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        }

        // Deterministic dummy phone number based on uid if not available in record
        let phoneHash = 0;
        for (let j = 0; j < uid.length; j++) {
          phoneHash += uid.charCodeAt(j);
        }
        const suffix = (phoneHash % 9000) + 1000;
        const phoneNumber = userRecord.phoneNumber || `+1 (555) 987-${suffix}`;

        const role = userRecord.customClaims?.role || 'user';
        const isAdmin = userRecord.customClaims?.isAdmin === true || role === 'admin';

        // 3. Define the user document data
        const userRef = db.collection('users').doc(uid);
        const userData = {
          uid,
          email,
          displayName,
          firstName,
          lastName,
          phoneNumber,
          role,
          isAdmin,
          photoURL: userRecord.photoURL || '',
          createdAt: userRecord.metadata.creationTime || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        batch.set(userRef, userData, { merge: true });

        // 4. Define the nested address documents (subcollection 'addresses')
        const homeAddressRef = userRef.collection('addresses').doc('home');
        const homeAddressData = {
          line1: '123 Main Street',
          line2: 'Apt 4B',
          city: 'New York',
          state: 'New York',
          country: 'United States',
          pincode: '10001',
          addressType: 'Home',
          firstName,
          lastName,
          phoneNumber,
          isDefault: true,
          updatedAt: new Date().toISOString(),
        };
        batch.set(homeAddressRef, homeAddressData, { merge: true });

        const workAddressRef = userRef.collection('addresses').doc('work');
        const workAddressData = {
          line1: '456 Corporate Blvd',
          line2: 'Suite 100',
          city: 'San Francisco',
          state: 'California',
          country: 'United States',
          pincode: '94105',
          addressType: 'Work',
          firstName,
          lastName,
          phoneNumber,
          isDefault: false,
          updatedAt: new Date().toISOString(),
        };
        batch.set(workAddressRef, workAddressData, { merge: true });

        syncedCount++;
      }

      // Commit the batch of writes
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${syncedCount} users and their addresses to Firestore.`,
      syncedCount,
    });
  } catch (error: any) {
    console.error('POST /api/admin/users/sync-firestore error:', error);
    return NextResponse.json({ error: error.message || 'Server error during sync' }, { status: 400 });
  }
}
