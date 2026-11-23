import Image from 'next/image';
import Link from 'next/link';
import type { Drama } from '@/lib/apishort';

export default function DramaCard({ drama, provider }: { drama: Drama; provider: string }) {
  return (
    <Link href={`/drama?provider=${provider}&id=${drama.id}`} className="group block overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 transition hover:-translate-y-1 hover:ring-rose-400/60">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-800">
        {drama.cover ? (
          <Image src={drama.cover} alt={drama.title} fill className="object-cover transition duration-300 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 20vw" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-zinc-400">{drama.title}</div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-lg text-white shadow-xl">▶</span>
        </div>
        {drama.episodes ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{drama.episodes} episode</span>
        ) : null}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-white">{drama.title}</p>
        <p className="mt-1.5 text-xs text-zinc-400">
          Sub Indo{drama.rating ? ` • ★ ${drama.rating}` : ''}
        </p>
      </div>
    </Link>
  );
}
