import Image from 'next/image';
import Link from 'next/link';
import type { Drama } from '@/lib/apishort';

export default function DramaCard({ drama, provider }: { drama: Drama; provider: string }) {
  return (
    <Link href={`/drama?provider=${provider}&id=${drama.id}`} className="group block overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-zinc-800 hover:ring-amber-400">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-800">
        {drama.cover ? (
          <Image src={drama.cover} alt={drama.title} fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 640px) 50vw, 25vw" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-zinc-400">{drama.title}</div>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-white">{drama.title}</p>
        <p className="mt-1 text-xs text-zinc-400">
          {drama.episodes ? `${drama.episodes} episode` : ''}{drama.rating ? ` • ★ ${drama.rating}` : ''}
        </p>
      </div>
    </Link>
  );
}
