import { NextRequest, NextResponse } from 'next/server';
import { getEpisodes } from '@/lib/apishort';

// GET /api/episodes?provider=shortmax&id=12961
// Mengambil SEMUA episode sekaligus lewat alleps (1 request APIShort per drama
// per jam, karena fetch di lib/apishort.ts di-cache 1 jam) lalu kembalikan
// semuanya dengan URL video yang sudah diproksi lewat /api/stream.
// Dipakai mode scroll /feed: scroll 57 episode tidak makan kuota lagi.
// URL HLS-nya signed dan berlaku ~8 jam — jangan simpan lama-lama.
function proxied(u?: string) {
  return u ? `/api/stream?u=${encodeURIComponent(u)}` : undefined;
}

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider') || 'shortmax';
  const id = req.nextUrl.searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });
  try {
    const episodes = await getEpisodes(provider, id);
    const list = episodes.map((e) => ({
      episode: e.episode,
      id: e.id,
      duration: e.duration,
      cover: e.cover,
      src: proxied(e.videoUrl),
      video720: proxied(e.video720),
      video1080: proxied(e.video1080),
      video480: proxied(e.video480),
    }));
    return NextResponse.json({ provider, id, totalEpisodes: list.length, episodes: list });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
