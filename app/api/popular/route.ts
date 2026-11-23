import { NextRequest, NextResponse } from 'next/server';
import { getPopular } from '@/lib/apishort';

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider') || 'shortmax';
  const page = Number(req.nextUrl.searchParams.get('page') || '1');
  try {
    const items = await getPopular(provider, page);
    return NextResponse.json({ provider, items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
