import { NextRequest, NextResponse } from 'next/server';
import { getDetail } from '@/lib/apishort';

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider') || 'shortmax';
  const id = req.nextUrl.searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });
  try {
    const drama = await getDetail(provider, id);
    if (!drama) return NextResponse.json({ error: 'Drama tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ provider, drama });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
