import { getPopular } from '@/lib/apishort';

const BASE = 'https://cintaku.media21.web.id';

export const revalidate = 3600;

// Sitemap dibuat manual sebagai XML agar karakter '&' di URL drama
// di-escape menjadi '&amp;' — wajib di XML. Versi sebelumnya memakai
// MetadataRoute.Sitemap dan '&' keluar mentah sehingga Google menolak
// sitemap ("1 error", 0 halaman ditemukan).
function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET() {
  const now = new Date().toISOString();
  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    { loc: BASE, lastmod: now, changefreq: 'daily', priority: '1' },
  ];
  try {
    const items = await getPopular('shortmax', 1);
    const seen = new Set<string>();
    for (const d of items) {
      const k = String(d.id);
      if (seen.has(k)) continue;
      seen.add(k);
      urls.push({
        loc: `${BASE}/drama?provider=shortmax&id=${encodeURIComponent(k)}`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }
  } catch {
    // Sitemap tetap berisi beranda walau daftar drama gagal dimuat.
  }
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `<url>\n<loc>${esc(u.loc)}</loc>\n<lastmod>${u.lastmod}</lastmod>\n<changefreq>${u.changefreq}</changefreq>\n<priority>${u.priority}</priority>\n</url>`
      )
      .join('\n') +
    `\n</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
