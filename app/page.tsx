import Image from 'next/image';
import Link from 'next/link';
import DramaCard from '@/components/DramaCard';
import { Banner300, NativeBanner } from '@/components/Adsterra';
import { getPopular, searchDramas } from '@/lib/apishort';

export const revalidate = 3600;

const GENRES = [
  { label: 'Romansa', q: 'cinta' },
  { label: 'CEO & Pewaris', q: 'CEO' },
  { label: 'Balas Dendam', q: 'balas dendam' },
  { label: 'Pernikahan', q: 'pernikahan' },
  { label: 'Keluarga', q: 'keluarga' },
  { label: 'Fantasi', q: 'dewa' },
];

function dedupe(items: any[]) {
  const seen = new Set<string>();
  return items.filter((d) => {
    const k = String(d.id);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export default async function Home({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q || '';
  let items: any[] = [];
  let error = '';
  try {
    items = dedupe(q ? await searchDramas('shortmax', q) : await getPopular('shortmax', 1));
  } catch (e: any) {
    error = 'Maaf, daftar drama belum bisa dimuat. Periksa koneksi internetmu, lalu coba lagi.';
  }
  const featured = !q && items.length > 0 ? items[0] : null;
  const trending = featured ? items.slice(1) : items;

  return (
    <div>
      {!q && featured && (
        <section className="relative -mx-4 overflow-hidden rounded-b-[2rem] sm:mx-0 sm:mt-6 sm:rounded-[2rem]">
          {featured.cover && (
            <Image src={featured.cover} alt="" fill className="object-cover opacity-40 blur-[2px] scale-105" unoptimized />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b10] via-[#0b0b10]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b10] via-transparent to-transparent" />
          <div className="relative flex gap-6 p-6 sm:p-10">
            <div className="relative hidden w-44 shrink-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20 sm:block">
              {featured.cover && <Image src={featured.cover} alt={featured.title} width={176} height={234} className="aspect-[3/4] w-full object-cover" unoptimized />}
            </div>
            <div className="max-w-xl self-center">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200 ring-1 ring-rose-400/40">🔥 Paling banyak ditonton hari ini</p>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">{featured.title}</h1>
              <p className="mt-2 text-sm text-zinc-300">
                {featured.episodes ? `${featured.episodes} episode` : ''}{featured.rating ? ` • ★ ${featured.rating}` : ''} • Subtitle Indonesia
              </p>
              {featured.summary && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-300 sm:text-base">{featured.summary}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/watch?provider=shortmax&id=${featured.id}&ep=1`} className="rounded-full bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-rose-500/30 transition hover:bg-rose-600">▶ Tonton Sekarang</Link>
                <Link href={`/drama?provider=shortmax&id=${featured.id}`} className="rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20">Lihat Detail</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {!q && !featured && !error && (
        <section className="mt-6 rounded-[2rem] bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 p-8 sm:p-12">
          <h1 className="max-w-xl text-3xl font-extrabold leading-tight sm:text-5xl">Drama China pendek, subtitle Indonesia.</h1>
          <p className="mt-3 max-w-lg text-sm text-rose-50 sm:text-base">Romansa, CEO, balas dendam, dan kisah cinta lainnya — tonton langsung di browser, gratis.</p>
        </section>
      )}

      <section id="cari" className="mt-8">
        <form action="/" className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Cari drama favoritmu, mis. cinta, CEO, balas dendam…" className="min-w-0 flex-1 rounded-full bg-white/10 px-5 py-3.5 text-sm text-white placeholder:text-zinc-400 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-rose-400" />
          <button className="shrink-0 rounded-full bg-rose-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600">Cari</button>
        </form>
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {GENRES.map((g) => (
            <Link key={g.label} href={`/?q=${encodeURIComponent(g.q)}`} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ring-1 transition ${q === g.q ? 'bg-rose-500 text-white ring-rose-500' : 'bg-white/5 text-zinc-300 ring-white/15 hover:bg-white/10 hover:text-white'}`}>{g.label}</Link>
          ))}
        </div>
      </section>

      {!q && <NativeBanner />}

      {error && (
        <div className="mt-10 rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/10">
          <p className="text-3xl">😔</p>
          <p className="mt-3 font-bold">Daftar drama belum bisa dimuat</p>
          <p className="mt-1 text-sm text-zinc-400">Periksa koneksi internetmu, lalu coba lagi.</p>
          <Link href="/" className="mt-5 inline-block rounded-full bg-rose-500 px-6 py-2.5 text-sm font-bold text-white">Coba Lagi</Link>
        </div>
      )}

      {!error && items.length === 0 && (
        <div className="mt-10 rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/10">
          <p className="text-3xl">🔍</p>
          <p className="mt-3 font-bold">Tidak ada hasil untuk “{q}”</p>
          <p className="mt-1 text-sm text-zinc-400">Coba kata kunci lain, misalnya “cinta” atau “CEO”.</p>
        </div>
      )}

      {!error && items.length > 0 && (
        <section id="trending" className="mt-10 scroll-mt-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">{q ? `Hasil untuk “${q}”` : 'Trending Hari Ini'}</h2>
              <p className="mt-1 text-sm text-zinc-400">{q ? `${items.length} judul ditemukan` : 'Drama paling banyak ditonton hari ini, subtitle Indonesia.'}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {trending.map((d) => <DramaCard key={`${d.id}`} drama={d} provider="shortmax" />)}
          </div>
          <Banner300 />
        </section>
      )}
    </div>
  );
}
