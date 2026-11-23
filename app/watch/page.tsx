'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';

function findStreamUrl(data: any): string {
  if (!data) return '';
  if (typeof data === 'string' && data.includes('.m3u8')) return data;
  if (typeof data !== 'object') return '';
  // Bentuk baru dari /api/play: { src, video720, video1080, episode: { video: { video_720 } } }
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
  const ep = sp.get('ep') || '1';
  const [state, setState] = useState<{ loading: boolean; src: string; raw: any; error: string }>({ loading: true, src: '', raw: null, error: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/play?provider=${provider}&id=${id}&ep=${ep}`);
        const json = await res.json();
        setState({ loading: false, src: findStreamUrl(json.data ?? json), raw: json, error: res.ok ? '' : (json.data?.message || json.error || `Upstream ${json.status}`) });
      } catch (e: any) {
        setState({ loading: false, src: '', raw: null, error: e.message });
      }
    })();
  }, [provider, id, ep]);

  if (state.loading) return <p>Memuat stream episode {ep}…</p>;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold">Nonton — Episode {ep}</h1>
      <p className="mt-1 text-sm text-zinc-400">{provider} • id {id} • Sub Indo kalau tersedia di upstream (lang=id)</p>
      <div className="mt-4"><VideoPlayer src={state.src} /></div>
      {!state.src && (
        <div className="mt-4 rounded-2xl bg-zinc-900 p-4 text-sm">
          <p className="font-bold text-amber-300">Stream belum ketemu untuk endpoint ini</p>
          <p className="mt-1 text-zinc-300">{state.error || 'Upstream tidak mengembalikan URL .m3u8.'}</p>
          <p className="mt-2 text-zinc-400">Play ShortMax sudah terverifikasi lewat endpoint alleps — URL HLS ada di tiap episode (video_720 / video_1080, signed ~8 jam). Kalau episode ini gagal, kemungkinan episode itu terkunci di upstream atau kuota Free sudah habis. Respons mentahnya ada di bawah ini.</p>
          <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-black p-3 text-xs text-zinc-300">{JSON.stringify(state.raw, null, 2)?.slice(0, 3000)}</pre>
        </div>
      )}
      {state.src && <p className="mt-3 break-all text-xs text-zinc-500">{state.src}</p>}
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<p>Memuat player…</p>}>
      <WatchInner />
    </Suspense>
  );
}
