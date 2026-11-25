'use client';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import FeedVideo from '@/components/FeedVideo';

// Mode scroll ala TikTok untuk Cintaku (/feed).
// - Route alternatif: halaman detail (/drama) dan nonton biasa (/watch) tetap ada.
// - Satu drama, episode urut: scroll ke bawah = episode berikutnya.
// - Autoplay tanpa suara (muted); sekali ketuk speaker, suara nyala untuk
//   semua episode berikut. Ketuk 2x / tombol hati = suka (localStorage).
// - TANPA iklan di dalam feed. Tombol Saweria melayang di sisi kanan.
// - Kuota: /api/episodes mengambil semua episode + URL video dalam 1 request
//   APIShort per drama per jam (cache 1 jam); scroll 57 episode tidak makan
//   kuota lagi. URL video signed, berlaku ~8 jam.
const SAWERIA_URL = 'https://saweria.co/berbagiKebaikan12';

type FeedEpisode = {
  episode: number;
  id: string | number;
  duration?: number;
  cover?: string;
  src?: string;
};

function FeedInner() {
  const sp = useSearchParams();
  const provider = sp.get('provider') || 'shortmax';
  const id = sp.get('id') || '';
  const startEp = Math.max(1, parseInt(sp.get('ep') || '1', 10) || 1);

  const [title, setTitle] = useState('');
  const [episodes, setEpisodes] = useState<FeedEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(startEp - 1);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const closingRef = useRef<HTMLDivElement>(null);
  const scrolledToStart = useRef(false);

  // Suka tersimpan di localStorage per drama (tanpa login).
  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(`cintaku-likes:${provider}:${id}`);
      if (raw) {
        const arr: number[] = JSON.parse(raw);
        const map: Record<number, boolean> = {};
        arr.forEach((n) => { map[n] = true; });
        setLiked(map);
      }
    } catch { /* abaikan */ }
  }, [provider, id]);

  const saveLikes = useCallback((next: Record<number, boolean>) => {
    try {
      const arr = Object.keys(next).filter((k) => next[Number(k)]).map(Number);
      localStorage.setItem(`cintaku-likes:${provider}:${id}`, JSON.stringify(arr));
    } catch { /* abaikan */ }
  }, [provider, id]);

  const setLike = useCallback((epNum: number, value: boolean) => {
    setLiked((prev) => {
      if (prev[epNum] === value) return prev;
      const next = { ...prev, [epNum]: value };
      saveLikes(next);
      return next;
    });
  }, [saveLikes]);

  const toggleLike = useCallback((epNum: number) => {
    setLiked((prev) => {
      const next = { ...prev, [epNum]: !prev[epNum] };
      saveLikes(next);
      return next;
    });
  }, [saveLikes]);

  // Muat judul + semua episode sekaligus.
  useEffect(() => {
    if (!id) { setLoading(false); setError('Drama tidak ditemukan.'); return; }
    let cancelled = false;
    (async () => {
      try {
        const [detailRes, epsRes] = await Promise.all([
          fetch(`/api/detail?provider=${provider}&id=${id}`).catch(() => null),
          fetch(`/api/episodes?provider=${provider}&id=${id}`).catch(() => null),
        ]);
        if (detailRes) {
          try {
            const detailJson = await detailRes.json();
            if (detailJson.drama?.title) setTitle(detailJson.drama.title);
          } catch { /* judul tetap kosong, feed tetap jalan */ }
        }
        if (!epsRes) {
          if (!cancelled) setError('Episode belum bisa dimuat. Periksa koneksi internetmu, lalu coba lagi.');
        } else {
          const epsJson = await epsRes.json();
          const list: FeedEpisode[] = Array.isArray(epsJson.episodes) ? epsJson.episodes : [];
          if (cancelled) return;
          if (!list.length) setError(epsJson.error || 'Episode belum bisa dimuat.');
          else setEpisodes(list);
        }
      } catch {
        if (!cancelled) setError('Episode belum bisa dimuat. Periksa koneksi internetmu, lalu coba lagi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [provider, id]);

  // Amati item mana yang sedang terlihat (threshold 0,6) -> jadi episode aktif.
  // Kartu penutup juga diamati: saat terlihat, activeIndex = jumlah episode
  // (sentinel "tidak ada video aktif") supaya video terakhir ikut pause.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || episodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index || 0);
            setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.6 }
    );
    itemRefs.current.forEach((el) => { if (el) observer.observe(el); });
    if (closingRef.current) observer.observe(closingRef.current);
    return () => observer.disconnect();
  }, [episodes.length]);

  // Lompat ke episode awal (?ep=5) begitu daftar termuat.
  useEffect(() => {
    if (episodes.length === 0 || scrolledToStart.current) return;
    scrolledToStart.current = true;
    const idx = Math.min(Math.max(startEp - 1, 0), episodes.length - 1);
    setActiveIndex(idx);
    itemRefs.current[idx]?.scrollIntoView();
  }, [episodes, startEp]);

  const scrollToIndex = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, episodes.length));
    if (clamped < episodes.length) {
      itemRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth' });
    } else {
      closingRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [episodes.length]);

  // Episode habis -> otomatis lanjut ke episode berikut (atau kartu penutup
  // kalau itu episode terakhir).
  const goNext = useCallback(() => {
    scrollToIndex(activeIndex + 1);
  }, [activeIndex, scrollToIndex]);

  // Desktop: tombol panah atas/bawah juga jalan.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); scrollToIndex(activeIndex + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); scrollToIndex(activeIndex - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, scrollToIndex]);

  const total = episodes.length;
  const displayTitle = title || 'Cintaku';

  return (
    <div ref={containerRef} className="feed-scroll fixed inset-0 z-30 overflow-y-scroll bg-black">
      {/* Bar atas: kembali + judul */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-3">
        <Link href={`/drama?provider=${provider}&id=${id}`} className="pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/50 text-lg text-white ring-1 ring-white/20">←</Link>
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-white drop-shadow">{displayTitle}</p>
        <Link href={`/drama?provider=${provider}&id=${id}`} className="pointer-events-auto shrink-0 rounded-full bg-black/50 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/20">Semua Episode</Link>
      </div>

      {loading && (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-zinc-400">Memuat episode…</p>
        </div>
      )}

      {!loading && error && episodes.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="text-3xl">😔</p>
          <p className="font-bold text-white">Episode belum bisa dimuat</p>
          <p className="text-sm text-zinc-400">{error}</p>
          <Link href={`/drama?provider=${provider}&id=${id}`} className="rounded-full bg-rose-500 px-6 py-2.5 text-sm font-bold text-white">Kembali ke Daftar Episode</Link>
        </div>
      )}

      {episodes.map((ep, i) => {
        const isNear = Math.abs(i - activeIndex) <= 1;
        const isLiked = !!liked[ep.episode];
        return (
          <div key={ep.episode} data-index={i} ref={(el) => { itemRefs.current[i] = el; }} className="relative h-dvh w-full snap-start snap-always">
            {isNear ? (
              <FeedVideo
                src={ep.src || ''}
                poster={ep.cover}
                active={i === activeIndex}
                muted={muted}
                onEnded={goNext}
                onDoubleTapLike={() => setLike(ep.episode, true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center overflow-hidden bg-black">
                {ep.cover
                  ? <img src={ep.cover} alt="" className="h-full w-full object-cover opacity-40" />
                  : <p className="text-sm text-zinc-500">Episode {ep.episode}</p>}
              </div>
            )}

            {/* Info melayang: judul + Episode N dari total */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-5 pt-10">
              <p className="truncate text-sm font-bold text-white drop-shadow">{displayTitle}</p>
              <p className="mt-0.5 text-xs text-zinc-300">Episode {ep.episode} dari {total}</p>
            </div>

            {/* Tombol samping ala TikTok: suka, Saweria, suara */}
            <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-5">
              <button
                onClick={() => toggleLike(ep.episode)}
                aria-label="Suka"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-xl ring-1 ring-white/20 transition active:scale-90"
              >
                <span className={isLiked ? 'text-rose-500' : 'text-white'}>♥</span>
              </button>
              <a href={SAWERIA_URL} target="_blank" rel="noopener noreferrer" aria-label="Dukung lewat Saweria" className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-black shadow-lg transition active:scale-90">☕</a>
              <button
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Nyalakan suara' : 'Bisukan'}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-lg text-white ring-1 ring-white/20 transition active:scale-90"
              >
                {muted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>
        );
      })}

      {/* Kartu penutup setelah episode terakhir */}
      {episodes.length > 0 && (
        <div data-index={episodes.length} ref={closingRef} className="relative flex h-dvh w-full snap-start snap-always flex-col items-center justify-center gap-4 bg-black px-8 text-center">
          <p className="text-4xl">🎉</p>
          <p className="text-xl font-extrabold text-white">Drama selesai</p>
          <p className="text-sm text-zinc-400">Kamu sudah menonton semua {total} episode{title ? ` ${title}` : ''}.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button onClick={() => scrollToIndex(0)} className="rounded-full bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-rose-500/30 transition hover:bg-rose-600">↺ Tonton Ulang</button>
            <Link href={`/drama?provider=${provider}&id=${id}`} className="rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20">← Kembali ke Daftar Episode</Link>
          </div>
          <div className="mt-4 rounded-2xl bg-amber-400/10 p-4 ring-1 ring-amber-400/30">
            <p className="text-sm text-amber-100">Suka nonton di Cintaku? Dukung kami supaya situs ini tetap gratis. ☕</p>
            <a href={SAWERIA_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-black transition hover:bg-amber-300">Dukung lewat Saweria</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-30 flex items-center justify-center bg-black"><p className="text-sm text-zinc-400">Memuat feed…</p></div>}>
      <FeedInner />
    </Suspense>
  );
}
