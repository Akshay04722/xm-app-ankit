// app/api/recently-viewed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRecentlyViewed, addRecentlyViewed } from '@/lib/Cdpguestapi';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get('guestRef');
  
  if (!ref) {
    return NextResponse.json({ error: 'guestRef query parameter is required' }, { status: 400 });
  }
  
  const items = await getRecentlyViewed(ref);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const { guestRef, post } = await req.json();
  if (!guestRef || !post?.id) {
    return NextResponse.json({ error: 'guestRef and post.id are required' }, { status: 400 });
  }
  const items = await addRecentlyViewed(guestRef, post);
  return NextResponse.json({ items });
}