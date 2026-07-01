import { NextRequest, NextResponse } from 'next/server';
import { getRecentlyViewed, addRecentlyViewed } from '@/lib/Cdpguestapi';

// Name of the cookie the Sitecore Cloud SDK sets for the guest reference.
// VERIFY this against your actual deployed cookie — inspect Application > Cookies
// in DevTools after the Cloud SDK initializes; common names are `bx_guestref` or similar,
// but this is not guaranteed and must be confirmed for your SDK version.
const GUEST_REF_COOKIE = 'bx_guestref';

function getGuestRef(req: NextRequest): string | undefined {
  // 1. Try older Engage SDK cookie name
  const bxRef = req.cookies.get(GUEST_REF_COOKIE)?.value;
  if (bxRef) return bxRef;

  // 2. Try newer Cloud SDK cookie name (starts with 'bid_')
  const bidCookie = req.cookies.getAll().find(c => c.name.startsWith('bid_'));
  if (bidCookie?.value) return bidCookie.value;

  // 3. Fallback in development mode to sc_cid or a fallback uuid
  if (process.env.NODE_ENV === 'development') {
    const cid = req.cookies.get('sc_cid')?.value;
    if (cid) return cid;
    return 'dev-mock-guest-ref-123';
  }

  return undefined;
}

export async function GET(req: NextRequest) {
  console.log('GET /api/recently-viewed requested. All cookies:', req.cookies.getAll().map(c => `${c.name}=${c.value}`));
  const guestRef = getGuestRef(req);
  console.log('Resolved Guest Reference for GET:', guestRef);
  if (!guestRef) {
    return NextResponse.json({ items: [] });
  }

  try {
    const items = await getRecentlyViewed(guestRef);
    return NextResponse.json({ items });
  } catch (err) {
    console.error('GET /api/recently-viewed failed:', err);
    return NextResponse.json({ items: [] }, { status: 200 }); // fail soft — never break the page
  }
}

export async function POST(req: NextRequest) {
  const guestRef = getGuestRef(req);
  console.log('Resolved Guest Reference for POST:', guestRef);
  if (!guestRef) {
    return NextResponse.json({ items: [] });
  }

  const body = await req.json();
  const { id, title, date, imageSrc, href } = body || {};

  if (!id || !title) {
    return NextResponse.json({ error: 'id and title are required' }, { status: 400 });
  }

  try {
    const items = await addRecentlyViewed(guestRef, { id, title, date, imageSrc, href });
    return NextResponse.json({ items });
  } catch (err) {
    console.error('POST /api/recently-viewed failed:', err);
    return NextResponse.json({ items: [] }, { status: 200 }); // fail soft
  }
}