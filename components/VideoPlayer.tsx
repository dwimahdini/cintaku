'use client';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ src, poster, muted, onEnded }: { src: string; poster?: string; muted?: boolean; onEnded?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState('');
  // muted diset lewat properti (bukan atribut) supaya autoplay muted andal.
  useEffect(() => {
    const video = ref.current;
    if (video && muted !== undefined) video.muted = muted;
  }, [muted]);
  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;
    setErr('');
    if (src.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => { if (data.fatal) setErr('Gagal memutar stream ini. Coba episode lain.'); });
      return () => hls.destroy();
    }
    video.src = src;
  }, [src]);
  if (!src) return <p className="rounded-xl bg-zinc-900 p-4 text-sm text-zinc-300">Belum ada URL video untuk episode ini.</p>;
  return (
    <div>
      <video ref={ref} poster={poster} controls playsInline autoPlay muted={muted} loop={false} onEnded={onEnded} className="aspect-[9/16] max-h-[75vh] w-full rounded-2xl bg-black object-contain sm:aspect-video sm:max-h-none" />
      {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
    </div>
  );
}
