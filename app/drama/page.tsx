import Image from 'next/image';
import Link from 'next/link';
import { getDetail } from '@/lib/apishort';

export const revalidate = 3600;

export default async function DramaPage({ searchParams }: { searchParams: { provider?: string; id?: string } }) {
  const provider = searchParams.provider || 'shortmax';
  const id = searchParams.id || '';
  if (!id) return <p>Tambahkan ?id= di URL. Contoh: /drama?provider=shortmax&amp;id=12961</p>;
  let drama: any = null;
  let error = '';
  try { drama = await getDetail(provider, id); } catch (e: any) { error = e.message; }
  if (error) return <div className="rounded-2xl bg-red-950/60 p-4 text-sm text-red-200">{error}</div>;
  if (!drama) return <p>Drama tidak ditemukan.</p>;
  const total = drama.episodes || 0;
  const eps = total ? Array.from({ length: Math.min(total, 60) }, (_, i) => i + 1) : [1];
  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-800">
        {drama.cover && <Image src={drama.cover} alt={drama.title} fill className="object-cover" unoptimized />}
      </div>
      <div>
        <h1 className="text-2xl font-bold">{drama.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">{total ? `${total} episode` : ''}{drama.rating ? ` • ★ ${drama.rating}` : ''}{drama.genre ? ` • ${drama.genre}` : ''}</p>
        {drama.tags && <p className="mt-2 flex flex-wrap gap-2">{drama.tags.map((t: string) => <span key={t} className="rounded-full bg-zinc-800 px-2 py-1 text-xs">{t}</span>)}</p>}
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">{drama.summary || drama.overview || 'Sinopsis belum tersedia untuk judul ini.'}</p>
        <h2 className="mt-6 font-bold">Episode (klik untuk nonton)</h2>
        <p className="mt-1 text-xs text-zinc-400">Tombol Play memanggil /api/play — hanya dipakai saat diklik, supaya kuota Free hemat. Kalau play mengembalikan 404, endpoint play untuk provider itu butuh path lain / paket berbayar — lihat pesan error di halaman Watch.</p>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {eps.map((ep) => (
            <Link key={ep} href={`/watch?provider=${provider}&id=${drama.id}&ep=${ep}`} className="rounded-lg bg-zinc-900 py-2 text-center text-sm ring-1 ring-zinc-700 hover:bg-amber-400 hover:text-black">{ep}</Link>
          ))}
        </div>
        {total > 60 && <p className="mt-2 text-xs text-zinc-500">Ditampilkan 60 episode pertama.</p>}
      </div>
    </div>
  );
}
