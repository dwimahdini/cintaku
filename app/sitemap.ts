import type { MetadataRoute } from 'next';
import { getPopular } from '@/lib/apishort';

const BASE = 'https://cintaku.media21.web.id';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [{ url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 }];
  try {
    const items = await getPopular('shortmax', 1);
    const seen = new Set<string>();
    for (const d of items) {
      const k = String(d.id);
      if (seen.has(k)) continue;
      seen.add(k);
      urls.push({
        url: `${BASE}/drama?provider=shortmax&id=${encodeURIComponent(k)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  } catch {
    // Sitemap tetap berisi beranda walau daftar drama gagal dimuat.
  }
  return urls;
}
