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

// Daftar cadangan: 104 ID drama populer terakhir (24 Nov 2026).
// Dipakai kalau APIShort sedang gagal/kuota habis, supaya sitemap tidak
// pernah jadi cuma beranda saja.
const FALLBACK_IDS = [
  '10826','11532','11972','11989','12094','12157','12276','12886','12961','13058',
  '13166','13209','13501','13722','13821','13867','14529','14957','14999','15005',
  '15367','15454','15456','15519','15542','15820','15826','16144','16348','16352',
  '16552','16646','16653','16754','16768','17020','17051','17052','17148','17266',
  '17400','17514','17552','17597','17610','17721','17842','18323','18450','18721',
  '18939','19016','19067','19673','19756','19809','20456','20916','21236','22654',
  '23093','23409','23592','23601','23712','24402','24578','24736','24916','25079',
  '25164','25279','25465','2661','2746','3655','4332','4479','4881','5474','5527',
  '5576','5995','6157','6217','6342','6460','6704','6874','6920','6924','7028',
  '7289','7529','7614','7936','8151','8357','8714','896','9219','927','928','9883',
];

export async function GET() {
  const now = new Date().toISOString();
  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    { loc: BASE, lastmod: now, changefreq: 'daily', priority: '1' },
  ];
  let ids: string[] = [];
  try {
    const items = await getPopular('shortmax', 1);
    const seen = new Set<string>();
    for (const d of items) {
      const k = String(d.id);
      if (!seen.has(k)) { seen.add(k); ids.push(k); }
    }
  } catch {
    ids = [];
  }
  if (ids.length === 0) ids = FALLBACK_IDS;
  for (const k of ids) {
    urls.push({
      loc: `${BASE}/drama?provider=shortmax&id=${encodeURIComponent(k)}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.8',
    });
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
