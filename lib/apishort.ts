// Server-only helper untuk APIShort.
// JANGAN import file ini dari Client Component. API key hanya dipakai di sini (server).
// Base URL + key dibaca dari env, jadi ganti provider API tinggal ganti .env.local.

export type Drama = {
  id: string | number;
  code?: string | number;
  title: string;
  name?: string;
  cover?: string;
  episodes?: number;
  summary?: string;
  overview?: string;
  rating?: number;
  genre?: string;
  tags?: string[];
  views?: number;
};

const BASE = (process.env.DRAMA_API_BASE_URL || 'https://apishort.com').replace(/\/$/, '');
const KEY = process.env.APISHORT_API_KEY || '';
const LANG = process.env.DRAMA_LANG || 'id';

// Cadangan: DramaBos — Free 1.000 request/bulan, daftar di dramabos.live/register.
// WAJIB pakai key, header Authorization: Bearer <key>. Tanpa key, endpoint-nya
// mengembalikan 404 HTML (sudah dites 24 Nov 2026) — jadi fallback ini hanya aktif
// kalau DRAMABOS_API_KEY diisi di .env.local / Vercel. Jangan taruh key ini di client.
const BOS_BASE = (process.env.DRAMABOS_BASE_URL || 'https://dramabos.live').replace(/\/$/, '');
const BOS_KEY = process.env.DRAMABOS_API_KEY || '';

function bosHeaders() {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (BOS_KEY && !BOS_KEY.includes('paste_key')) h['Authorization'] = `Bearer ${BOS_KEY}`;
  return h;
}

async function fetchBosJson(path: string) {
  if (!BOS_KEY || BOS_KEY.includes('paste_key')) return { ok: false, status: 0, url: `${BOS_BASE}${path}`, json: null, text: 'DRAMABOS_API_KEY belum diisi' };
  const url = `${BOS_BASE}${path}`;
  const res = await fetch(url, { headers: bosHeaders(), next: { revalidate: 3600 } });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { json = null; }
  return { ok: res.ok, status: res.status, url, json, text: text.slice(0, 500) };
}

function headers() {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (KEY && !KEY.includes('paste_key')) h['X-API-Key'] = KEY;
  return h;
}

// Normalisasi respons: APIShort -> { data: [...] | {...} }
// DramaBos/DracinAPI -> { status, results: [...] } atau { data: [...] }
export function normalizeList(json: any): Drama[] {
  const raw = Array.isArray(json) ? json : json?.data ?? json?.results ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map((d: any) => ({
    id: d.id ?? d.code ?? d.bookId ?? '',
    code: d.code,
    title: d.name ?? d.title ?? 'Tanpa judul',
    name: d.name ?? d.title,
    cover: d.cover ?? d.coverUrl ?? d.image,
    episodes: d.episodes ?? d.episodeCount ?? d.totalEpisodes,
    summary: d.summary ?? d.description ?? d.overview ?? '',
    overview: d.overview ?? d.summary ?? '',
    rating: d.rating,
    genre: Array.isArray(d.genre) ? d.genre.join(', ') : d.genre,
    tags: d.tags,
    views: d.views,
  })).filter((d) => d.id !== '');
}

export function normalizeDetail(json: any): Drama | null {
  const d = json?.data ?? json ?? null;
  if (!d || typeof d !== 'object') return null;
  const list = normalizeList([d]);
  return list[0] ?? null;
}

async function fetchJson(path: string) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { headers: headers(), next: { revalidate: 3600 } });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { json = null; }
  return { ok: res.ok, status: res.status, url, json, text: text.slice(0, 500) };
}

// Coba beberapa pola path sampai ada yang 200 + JSON.
// APIShort adalah transparent proxy, jadi tiap provider polanya sedikit beda.
async function fetchFirstOk(paths: string[]) {
  let last: any = null;
  for (const p of paths) {
    try {
      const r = await fetchJson(p);
      last = r;
      if (r.ok && r.json) return r;
    } catch { /* coba path berikutnya */ }
  }
  return last ?? { ok: false, status: 0, url: '', json: null, text: '' };
}

export async function getPopular(provider = 'shortmax', page = 1) {
  const p = provider.toLowerCase();
  const r = await fetchFirstOk([
    `/v1/${p}/api/v1/popular?lang=${LANG}&page=${page}`,
    `/v1/${p}/popular?lang=${LANG}&page=${page}`,
    `/v1/${p}/api/v1/home?lang=${LANG}&page=${page}`,
  ]);
  if (r.ok && r.json) return normalizeList(r.json);
  // Cadangan DramaBos (butuh DRAMABOS_API_KEY): /shortmax/api/v1/home
  const bos = await fetchBosJson(`/${p}/api/v1/home?lang=${LANG}&page=${page}`);
  if (bos.ok && bos.json) return normalizeList(bos.json);
  throw new Error(`Popular gagal di APIShort (${r.status}) dan DramaBos (${bos.status}). Cek API key di .env.local dan kuota Free APIShort 100/hari / DramaBos 1.000/bulan.`);
}

export async function searchDramas(provider = 'shortmax', q: string) {
  const query = encodeURIComponent(q);
  const p = provider.toLowerCase();
  const r = await fetchFirstOk([
    `/v1/${p}/api/v1/search?q=${query}&lang=${LANG}`,
    `/v1/${p}/api/v1/search?keyword=${query}&lang=${LANG}`,
    `/v1/${p}/search?q=${query}&lang=${LANG}`,
    `/v1/${p}/search?kw=${query}&lang=${LANG}`,
  ]);
  if (r.ok && r.json) return normalizeList(r.json);
  // Cadangan DramaBos: DramaBox pakai ?keyword=, provider lain pakai ?q=
  const bosPath = p === 'dramabox'
    ? `/${p}/api/v1/search?keyword=${query}&lang=${LANG}`
    : `/${p}/api/v1/search?q=${query}&lang=${LANG}`;
  const bos = await fetchBosJson(bosPath);
  if (bos.ok && bos.json) return normalizeList(bos.json);
  throw new Error(`Search gagal di APIShort (${r.status}) dan DramaBos (${bos.status}).`);
}

export async function getDetail(provider = 'shortmax', id: string) {
  const p = provider.toLowerCase();
  const r = await fetchFirstOk([
    `/v1/${p}/api/v1/detail/${id}?lang=${LANG}`,
    `/v1/${p}/detail/${id}?lang=${LANG}`,
    `/v1/${p}/api/v1/detail/${id}`,
  ]);
  if (r.ok && r.json) return normalizeDetail(r.json);
  const bos = await fetchBosJson(`/${p}/api/v1/detail/${id}?lang=${LANG}`);
  if (bos.ok && bos.json) return normalizeDetail(bos.json);
  throw new Error(`Detail gagal di APIShort (${r.status}) dan DramaBos (${bos.status}).`);
}

export type Episode = {
  episode: number;
  id: string | number;
  duration?: number;
  cover?: string;
  video720?: string;
  video1080?: string;
  video480?: string;
  videoUrl?: string;
};

export function normalizeEpisodes(json: any): Episode[] {
  const d = json?.data ?? json ?? {};
  const raw = Array.isArray(d) ? d : d.episodes ?? d.chapters ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map((e: any) => {
    const v = e.video ?? e.playUrl ?? {};
    // DramaBos streaming: { hlsUrl, quality: [{definition:'720p', url}] }
    const q720 = Array.isArray(e.quality) ? e.quality.find((q: any) => /720/.test(q.definition || ''))?.url : undefined;
    const q1080 = Array.isArray(e.quality) ? e.quality.find((q: any) => /1080/.test(q.definition || ''))?.url : undefined;
    const q480 = Array.isArray(e.quality) ? e.quality.find((q: any) => /480/.test(q.definition || ''))?.url : undefined;
    const url720 = e.hlsUrl || q720 || (typeof v === 'string' ? v : v.video_720 ?? v.video720 ?? v['720p']);
    const url1080 = q1080 || (typeof v === 'object' ? v.video_1080 ?? v.video1080 : undefined);
    const url480 = q480 || (typeof v === 'object' ? v.video_480 ?? v.video480 : undefined);
    return {
      episode: e.episode ?? e.episodeNo ?? e.ep ?? 0,
      id: e.id ?? '',
      duration: e.duration,
      cover: e.cover,
      video720: url720,
      video1080: url1080,
      video480: url480,
      videoUrl: url720 || url1080 || url480 || (typeof e.url === 'string' ? e.url : undefined),
    };
  }).filter((e) => e.episode);
}

// TERVERIFIKASI 24 Nov 2026 (tanpa key, langsung jalan):
// GET /v1/shortmax/api/v1/alleps/12961?lang=id
// -> { data: { code, cover, episodes: [{ episode: 1, duration: 167, id: 900342,
//      video: { video_1080, video_720, video_480: "https://.../main.m3u8?auth_key=..." } }] } }
// URL-nya signed, expires_in 28799 detik (~8 jam) — jangan simpan lama-lama, ambil saat user klik Play.
export async function getEpisodes(provider = 'shortmax', id: string) {
  const p = provider.toLowerCase();
  const candidates =
    p === 'dramabox'
      ? [
          `/v1/dramabox/api/dramabox/allepisode?bookId=${id}`,
          `/v1/dramabox/api/v1/alleps/${id}?lang=${LANG}`,
        ]
      : [
          `/v1/${p}/api/v1/alleps/${id}?lang=${LANG}`,
          `/v1/${p}/api/v1/episodes/${id}?lang=${LANG}`,
        ];
  const r = await fetchFirstOk(candidates);
  if (r.ok && r.json) {
    const eps = normalizeEpisodes(r.json);
    if (eps.length) return eps;
  }
  // Cadangan DramaBos: GET /{provider}/api/v1/episodes/{id} (Bearer key)
  const bos = await fetchBosJson(`/${p}/api/v1/episodes/${id}?lang=${LANG}`);
  if (bos.ok && bos.json) {
    const eps = normalizeEpisodes(bos.json);
    if (eps.length) return eps;
  }
  throw new Error(`Episodes gagal di APIShort (${r.status}) dan DramaBos (${bos.status}).`);
}

export async function getPlay(provider = 'shortmax', id: string, ep = 1) {
  const episodes = await getEpisodes(provider, id);
  const found = episodes.find((e) => e.episode === ep) ?? episodes[ep - 1] ?? episodes[0];
  if (found?.videoUrl) {
    // Kembalikan bentuk yang sama seperti fetchJson supaya /api/play tidak perlu diubah total.
    return { ok: true, status: 200, url: '', json: { episode: found, episodes }, text: '' };
  }
  // Cadangan DramaBos streaming langsung: GET /{p}/api/v1/play/{id}/{ep}
  // ShortMax pakai /shortmax/api/v1/play/{code} (tanpa /ep), DramaBox pakai /download/{id}.
  const p = provider.toLowerCase();
  const bosPaths = p === 'shortmax'
    ? [`/${p}/api/v1/play/${id}?lang=${LANG}`]
    : p === 'dramabox'
      ? [`/${p}/api/v1/download/${id}?lang=${LANG}`]
      : [`/${p}/api/v1/play/${id}/${ep}?lang=${LANG}`];
  for (const path of bosPaths) {
    const bos = await fetchBosJson(path);
    const d = bos.json ?? {};
    const hls = d.hlsUrl ?? d.url ?? d.videoUrl;
    if (bos.ok && typeof hls === 'string') {
      const epObj: Episode = { episode: ep, id, video720: hls, videoUrl: hls };
      return { ok: true, status: 200, url: '', json: { episode: epObj, episodes }, text: '' };
    }
  }
  throw new Error(`Episode ${ep} tidak punya URL video di APIShort maupun DramaBos.`);
}

export const PROVIDERS = ['shortmax', 'dramabox', 'reelshort', 'netshort', 'flickreels', 'melolo', 'goodshort'];
