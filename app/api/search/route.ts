import { NextRequest, NextResponse } from 'next/server';
import { searchDramas } from '@/lib/apishort';

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider') || 'shortmax';
  const q = req.nextUrl.searchParams.get('q') || '';
  if (!q.trim()) return NextResponse.json({ items: [] });
  try {
    const items = await searchDramas(provider, q);
    return NextResponse.json({ provider, q, items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
