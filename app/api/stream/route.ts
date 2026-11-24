import { NextRequest, NextResponse } from 'next/server';

// Proxy HLS (playlist + segmen .ts) lewat domain sendiri.
// Alasan: CDN video (akamai-static.shorttv.live) TIDAK mengirim header
// Access-Control-Allow-Origin, jadi hls.js di browser diblokir CORS dan
// player menampilkan "Gagal memutar stream" — padahal URL-nya hidup kalau
// di-curl. Lewat proxy ini, browser hanya bicara ke domain sendiri.
// Hanya host video yang diizinkan (bukan open proxy).
const ALLOWED_HOSTS = [
  'akamai-static.shorttv.live',
  'cdn.dramabos.live',
  'cdn.dracinapi.com',
];
const ALLOWED_SUFFIXES = ['.shorttv.live', '.dramabox.com', '.reelshort.com'];

function allowed(u: URL) {
  return ALLOWED_HOSTS.includes(u.hostname) || ALLOWED_SUFFIXES.some((s) => u.hostname.endsWith(s));
}

function proxyUrl(u: string) {
  return `/api/stream?u=${encodeURIComponent(u)}`;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('u') || '';
  if (!raw) return NextResponse.json({ error: 'u wajib diisi' }, { status: 400 });
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: 'URL tidak valid' }, { status: 400 });
  }
  if (target.protocol !== 'https:' || !allowed(target)) {
    return NextResponse.json({ error: 'Host video tidak diizinkan' }, { status: 403 });
  }

  const headers: Record<string, string> = { Accept: '*/*' };
  const range = req.headers.get('range');
  if (range) headers['Range'] = range;

  let res: Response;
  try {
    res = await fetch(target.toString(), { headers });
  } catch (e: any) {
    return NextResponse.json({ error: `Gagal mengambil video: ${e.message}` }, { status: 502 });
  }
  if (!res.ok) return NextResponse.json({ error: `CDN mengembalikan ${res.status}` }, { status: res.status });

  const contentType = res.headers.get('content-type') || '';
  const isPlaylist = contentType.includes('mpegURL') || target.pathname.endsWith('.m3u8');

  if (isPlaylist) {
    // Tulis ulang playlist: setiap baris segmen (dan URI kunci) diarahkan
    // lewat proxy ini juga, karena path relatif aslinya tidak berlaku lagi.
    const text = await res.text();
    const rewritten = text
      .split('\n')
      .map((line) => {
        const t = line.trim();
        if (!t) return line;
        if (t.startsWith('#')) {
          return line.replace(/URI="([^"]+)"/, (_m, uri) => `URI="${proxyUrl(new URL(uri, target).toString())}"`);
        }
        return proxyUrl(new URL(t, target).toString());
      })
      .join('\n');
    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-mpegURL',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const outHeaders: Record<string, string> = {
    'Content-Type': contentType || 'application/octet-stream',
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': '*',
  };
  const len = res.headers.get('content-length');
  if (len) outHeaders['Content-Length'] = len;
  const cr = res.headers.get('content-range');
  if (cr) outHeaders['Content-Range'] = cr;
  const ar = res.headers.get('accept-ranges');
  if (ar) outHeaders['Accept-Ranges'] = ar;
  return new NextResponse(res.body, { status: res.status, headers: outHeaders });
}
