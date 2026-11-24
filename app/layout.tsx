import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata = {
  metadataBase: new URL('https://cintaku-gules.vercel.app'),
  title: 'Cintaku — Nonton Drama China Sub Indo',
  description: 'Nonton drama China pendek sub Indo. Romansa, CEO, balas dendam, dan kisah cinta lainnya — gratis, langsung di browser.',
  openGraph: {
    title: 'Cintaku — Nonton Drama China Sub Indo',
    description: 'Nonton drama China pendek sub Indo. Romansa, CEO, balas dendam, dan kisah cinta lainnya — gratis, langsung di browser.',
    url: 'https://cintaku-gules.vercel.app',
    siteName: 'Cintaku',
    type: 'website',
    locale: 'id_ID',
  },
  twitter: { card: 'summary_large_image', title: 'Cintaku — Nonton Drama China Sub Indo', description: 'Nonton drama China pendek sub Indo, gratis langsung di browser.' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0b10]/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-lg shadow-lg shadow-rose-500/30">♥</span>
              <span>Cintaku</span>
              <span className="hidden rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-rose-200 sm:inline">Drama China</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium text-zinc-300">
              <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-white/10 hover:text-white">Beranda</Link>
              <Link href="/#trending" className="rounded-full px-3 py-1.5 hover:bg-white/10 hover:text-white">Trending</Link>
              <Link href="/#cari" className="rounded-full bg-rose-500 px-4 py-1.5 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600">Cari Drama</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-screen max-w-7xl px-4 pb-16">{children}</main>
        <footer className="border-t border-white/10 px-4 py-10">
          <div className="mx-auto max-w-7xl">
            <p className="flex items-center gap-2 text-lg font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 text-base">♥</span> Cintaku</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
              Nonton drama China pendek dengan subtitle Indonesia, langsung di browser — tanpa aplikasi, tanpa ribet.
              Semua judul ditayangkan dari platform penyedia kontennya.
            </p>
            <p className="mt-4 text-xs text-zinc-500">© 2026 Cintaku. Semua judul dan poster adalah milik pembuatnya masing-masing.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
