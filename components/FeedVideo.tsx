'use client';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

// Satu item video di feed scroll (/feed). Turunan VideoPlayer (hls.js,
// playsInline) dengan perilaku ala TikTok:
// - muted default, autoplay saat item terlihat; pause saat keluar layar.
// - ketuk sekali = jeda/lanjutkan, ketuk 2x = suka (animasi hati).
// - episode habis -> onEnded (feed lanjut ke episode berikut).
// - kalau stream gagal -> kartu error kecil, feed tetap jalan.
// HLS hanya dipasang saat komponen terpasang; feed hanya me-render max 3
// video aktif (sebelumnya-sekarang-berikutnya), sisanya placeholder —
// jadi saat item jauh dari layar, komponennya dilepas dan hls.destroy()
// jalan lewat cleanup effect di bawah.
type Props = {
  src: string;
  poster?: string;
  active: boolean;
  muted: boolean;
  onEnded: () => void;
  onDoubleTapLike: () => void;
};

export default function FeedVideo({ src, poster, active, muted, onEnded, onDoubleTapLike }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const tapTimer = useRef<number | null>(null);
  const userPaused = useRef(false);
  const [err, setErr] = useState('');
  const [paused, setPaused] = useState(false);
  const [heart, setHeart] = useState(false);

  // Pasang HLS saat src berubah; lepas saat komponen dilepas.
  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;
    setErr('');
    if (src.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setErr('Episode ini belum bisa diputar — scroll untuk lanjut.');
      });
      return () => hls.destroy();
    }
    video.src = src;
    return () => {
      video.removeAttribute('src');
      video.load();
    };
  }, [src]);

  // Video yang terlihat -> play (muted sesuai state global feed);
  // yang keluar layar -> pause. Jeda manual user dihormati: toggle suara
  // tidak menyalakan lagi video yang sengaja dijeda.
  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;
    video.muted = muted;
    if (active) {
      if (!userPaused.current) {
        setPaused(false);
        video.play().catch(() => { /* autoplay tertahan sampai ada interaksi */ });
      }
    } else {
      video.pause();
      userPaused.current = false;
    }
  }, [active, src, muted]);

  const togglePlay = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.play().catch(() => {});
      setPaused(false);
    } else {
      userPaused.current = true;
      video.pause();
      setPaused(true);
    }
  };

  const handleTap = () => {
    if (tapTimer.current) {
      window.clearTimeout(tapTimer.current);
      tapTimer.current = null;
      setHeart(true);
      onDoubleTapLike();
      window.setTimeout(() => setHeart(false), 800);
    } else {
      tapTimer.current = window.setTimeout(() => {
        tapTimer.current = null;
        togglePlay();
      }, 260);
    }
  };

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black px-8 text-center">
        <p className="text-sm text-zinc-400">Episode ini belum bisa diputar — scroll untuk lanjut.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black" onClick={handleTap}>
      <video
        ref={ref}
        poster={poster}
        playsInline
        loop={false}
        muted={muted}
        onEnded={onEnded}
        className="h-full w-full object-contain"
      />
      {paused && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-2xl text-white">▶</span>
        </div>
      )}
      {heart && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="feed-heart-pop text-8xl text-rose-500">♥</span>
        </div>
      )}
      {err && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-6">
          <p className="rounded-full bg-black/70 px-4 py-2 text-center text-xs text-zinc-200">{err}</p>
        </div>
      )}
    </div>
  );
}
