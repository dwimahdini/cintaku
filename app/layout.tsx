import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata = { title: 'Dracin — Nonton Drama China Sub Indo', description: 'Starter Next.js + APIShort (Free 100 req/day). Katalog, search, detail, dan player HLS.' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-amber-400">🎬 Dracin</Link>
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">Next.js + APIShort • Free 100/hari • Sub Indo (lang=id)</span>
          </div>
        </header>
        <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">{children}</main>
        <footer className="border-t border-zinc-800 px-4 py-6 text-center text-xs text-zinc-500">
          Starter belajar. Konten berasal dari provider upstream via APIShort. Hormati hak cipta — jangan publikasikan ulang video tanpa lisensi.
        </footer>
      </body>
    </html>
  );
}
