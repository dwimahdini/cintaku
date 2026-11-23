import Image from 'next/image';
import Link from 'next/link';
import { getDetail } from '@/lib/apishort';

export const revalidate = 3600;

export default async function DramaPage({ searchParams }: { searchParams: { provider?: string; id?: string } }) {
  const provider = searchParams.provider || 'shortmax';
  const id = searchParams.id || '';
  if (!id) return <p className="mt-10 text-center text-zinc-400">Drama tidak ditemukan.</p>;
  let drama: any = null;
  try { drama = await getDetail(provider, id); } catch { drama = null; }
  if (!drama) {
    return (
      <div className="mt-10 rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/10">
        <p className="text-3xl">😔</p>
        <p className="mt-3 font-bold">Drama ini belum bisa dibuka</p>
        <p className="mt-1 text-sm text-zinc-400">Periksa koneksi internetmu, lalu coba lagi.</p>
        <Link href="/" className="mt-5 inline-block rounded-full bg-rose-500 px-6 py-2.5 text-sm font-bold text-white">Kembali ke Beranda</Link>
      </div>
    );
  }
  const total = drama.episodes || 0;
  const eps = total ? Array.from({ length: Math.min(total, 100) }, (_, i) => i + 1) : [1];
  return (
    <div>
      <div className="relative -mx-4 overflow-hidden rounded-b-[2rem] sm:mx-0 sm:mt-6 sm:rounded-[2rem]">
        {drama.cover && <Image src={drama.cover} alt="" fill className="object-cover opacity-30 blur-[2px] scale-105" unoptimized />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b10] via-[#0b0b10]/70 to-transparent" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:p-10">
          <div className="relative w-40 shrink-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20 sm:w-56">
            {drama.cover && <Image src={drama.cover} alt={drama.title} width={224} height={299} className="aspect-[3/4] w-full object-cover" unoptimized />}
          </div>
          <div className="max-w-2xl self-end">
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{drama.title}</h1>
            <p className="mt-2 text-sm text-zinc-300">
              {total ? `${total} episode` : ''}{drama.rating ? ` • ★ ${drama.rating}` : ''}{drama.genre ? ` • ${drama.genre}` : ''} • Subtitle Indonesia
            </p>
            {drama.tags && drama.tags.length > 0 && (
              <p className="mt-3 flex flex-wrap gap-2">
                {drama.tags.map((t: string) => <span key={t} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-200 ring-1 ring-white/15">{t}</span>)}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/watch?provider=${provider}&id=${drama.id}&ep=1`} className="rounded-full bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-rose-500/30 transition hover:bg-rose-600">▶ Tonton Episode 1</Link>
              <Link href="/" className="rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20">← Beranda</Link>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 max-w-3xl">
        <h2 className="text-xl font-extrabold">Sinopsis</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">{drama.summary || drama.overview || 'Sinopsis belum tersedia untuk judul ini.'}</p>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-extrabold sm:text-2xl">Semua Episode</h2>
          <p className="text-sm text-zinc-400">{total ? `${total} episode` : ''}</p>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
          {eps.map((ep) => (
            <Link key={ep} href={`/watch?provider=${provider}&id=${drama.id}&ep=${ep}`} className="rounded-xl bg-white/5 py-3 text-center text-sm font-semibold ring-1 ring-white/10 transition hover:bg-rose-500 hover:text-white hover:ring-rose-500">{ep}</Link>
          ))}
        </div>
        {total > 100 && <p className="mt-3 text-xs text-zinc-500">Ditampilkan 100 episode pertama.</p>}
      </section>
    </div>
  );
}
