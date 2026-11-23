import { NextRequest, NextResponse } from 'next/server';
import { getEpisodes } from '@/lib/apishort';

// GET /api/play?provider=shortmax&id=12961&ep=1
// Mengambil daftar episode via alleps (terverifikasi), lalu pilih episode yang diminta.
// URL HLS-nya signed dan berlaku ~8 jam — jadi panggil ini hanya saat user klik Play.
export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider') || 'shortmax';
  const id = req.nextUrl.searchParams.get('id') || '';
  const ep = Number(req.nextUrl.searchParams.get('ep') || '1');
  if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });
  try {
    const episodes = await getEpisodes(provider, id);
    const found = episodes.find((e) => e.episode === ep) ?? episodes[ep - 1] ?? episodes[0];
    if (!found?.videoUrl) return NextResponse.json({ error: `Episode ${ep} tidak punya URL video`, episodes }, { status: 404 });
    return NextResponse.json({ provider, id, ep, src: found.videoUrl, video720: found.video720, video1080: found.video1080, episode: found, totalEpisodes: episodes.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
