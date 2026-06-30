import { NextRequest, NextResponse } from 'next/server';
import { getRecentlyViewed, addRecentlyViewed } from '@/lib/cdpGuestApi';

// Name of the cookie the Sitecore Cloud SDK sets for the guest reference.
// VERIFY this against your actual deployed cookie — inspect Application > Cookies
// in DevTools after the Cloud SDK initializes; common names are `bx_guestref` or similar,
// but this is not guaranteed and must be confirmed for your SDK version.
const GUEST_REF_COOKIE = 'bx_guestref';

export async function GET(req: NextRequest) {
  const guestRef = req.cookies.get(GUEST_REF_COOKIE)?.value;
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
  const guestRef = req.cookies.get(GUEST_REF_COOKIE)?.value;
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