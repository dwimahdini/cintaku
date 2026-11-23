'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';

function findStreamUrl(data: any): string {
  if (!data) return '';
  if (typeof data === 'string' && data.includes('.m3u8')) return data;
  if (typeof data !== 'object') return '';
  for (const k of ['src', 'video720', 'video1080', 'videoUrl', 'url', 'playUrl', 'streamUrl']) {
    if (typeof data[k] === 'string' && data[k].includes('.m3u8')) return data[k];
  }
  if (data.episode) return findStreamUrl(data.episode);
  if (data.video) {
    const v = data.video;
    if (typeof v === 'string') return v;
    return v.video_720 || v.video_1080 || v.video_480 || '';
  }
  if (Array.isArray(data.episodes)) {
    const ep = data.episodes[0];
    if (ep) return findStreamUrl(ep);
  }
  if (data.data) return findStreamUrl(data.data);
  return '';
}

function WatchInner() {
  const sp = useSearchParams();
  const provider = sp.get('provider') || 'shortmax';
  const id = sp.get('id') || '';
  const ep = parseInt(sp.get('ep') || '1', 10) || 1;
  const [state, setState] = useState<{ loading: boolean; src: string; error: string }>({ loading: true, src: '', error: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/play?provider=${provider}&id=${id}&ep=${ep}`);
        const json = await res.json();
        setState({ loading: false, src: findStreamUrl(json.data ?? json), error: res.ok ? '' : 'Episode ini belum bisa diputar.' });
      } catch {
        setState({ loading: false, src: '', error: 'Episode ini belum bisa diputar. Periksa koneksi internetmu, lalu coba lagi.' });
      }
    })();
  }, [provider, id, ep]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/drama?provider=${provider}&id=${id}`} className="text-sm font-medium text-zinc-400 transition hover:text-white">← Semua Episode</Link>
      <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">Episode {ep}</h1>
      <p className="mt-1 text-sm text-zinc-400">Subtitle Indonesia • Tonton langsung di browser</p>

      {state.loading ? (
        <div className="mt-6 flex aspect-[9/16] max-h-[75vh] items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 sm:aspect-video sm:max-h-none">
          <p className="text-sm text-zinc-400">Memuat episode {ep}…</p>
        </div>
      ) : (
        <div className="mt-6"><VideoPlayer src={state.src} /></div>
      )}

      {!state.loading && !state.src && (
        <div className="mt-6 rounded-3xl bg-white/5 p-6 text-center ring-1 ring-white/10">
          <p className="text-3xl">😔</p>
          <p className="mt-3 font-bold">Episode ini belum bisa diputar</p>
          <p className="mt-1 text-sm text-zinc-400">{state.error || 'Coba episode lain, atau kembali lagi nanti.'}</p>
          <Link href={`/drama?provider=${provider}&id=${id}`} className="mt-5 inline-block rounded-full bg-rose-500 px-6 py-2.5 text-sm font-bold text-white">Pilih Episode Lain</Link>
        </div>
      )}

      {state.src && (
        <div className="mt-6 flex items-center justify-between gap-3">
          {ep > 1 ? (
            <Link href={`/watch?provider=${provider}&id=${id}&ep=${ep - 1}`} className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold ring-1 ring-white/15 transition hover:bg-white/20">← Episode {ep - 1}</Link>
          ) : <span />}
          <Link href={`/watch?provider=${provider}&id=${id}&ep=${ep + 1}`} className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600">Episode {ep + 1} →</Link>
        </div>
      )}
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<p className="mt-10 text-center text-zinc-400">Memuat player…</p>}>
      <WatchInner />
    </Suspense>
  );
}
