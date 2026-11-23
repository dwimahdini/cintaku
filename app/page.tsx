import Link from 'next/link';
import DramaCard from '@/components/DramaCard';
import { getPopular, PROVIDERS } from '@/lib/apishort';

export const revalidate = 3600; // cache 1 jam — hemat kuota Free

export default async function Home({ searchParams }: { searchParams: { provider?: string; q?: string } }) {
  const provider = searchParams.provider || 'shortmax';
  const q = searchParams.q || '';
  let items: any[] = [];
  let error = '';
  try {
    if (q) {
      const { searchDramas } = await import('@/lib/apishort');
      items = await searchDramas(provider, q);
    } else {
      items = await getPopular(provider, 1);
    }
  } catch (e: any) {
    error = e.message;
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">{q ? `Hasil untuk “${q}”` : 'Populer hari ini'}</h1>
      <p className="mt-1 text-sm text-zinc-400">Provider: {provider} • Bahasa: Indonesia (lang=id) • Data di-cache 1 jam supaya kuota gratis tidak cepat habis.</p>

      <form action="/" className="mt-4 flex gap-2">
        <input name="provider" defaultValue={provider} className="w-36 rounded-xl bg-zinc-900 px-3 py-2 text-sm ring-1 ring-zinc-700" list="providers" />
        <datalist id="providers">{PROVIDERS.map((p) => <option key={p} value={p} />)}</datalist>
        <input name="q" defaultValue={q} placeholder="Cari drama, mis. cinta…" className="flex-1 rounded-xl bg-zinc-900 px-3 py-2 text-sm ring-1 ring-zinc-700" />
        <button className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black">Cari</button>
      </form>

      {error && (
        <div className="mt-6 rounded-2xl bg-red-950/60 p-4 text-sm text-red-200">
          <p className="font-bold">API belum bisa diakses</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-zinc-300">1) Copy <code>.env.example</code> jadi <code>.env.local</code>, isi <code>APISHORT_API_KEY</code> dari dashboard APIShort kamu. 2) Restart <code>npm run dev</code>. 3) Cek kuota di dashboard — Free 100/hari, Used Today harusnya masih 0 kalau belum dipakai.</p>
        </div>
      )}

      {!error && items.length === 0 && <p className="mt-8 text-zinc-400">Tidak ada hasil. Coba kata kunci lain atau ganti provider ke dramabox / reelshort.</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((d) => <DramaCard key={`${d.id}`} drama={d} provider={provider} />)}
      </div>

      <p className="mt-8 text-xs text-zinc-500">
        Contoh yang sudah terverifikasi jalan: ShortMax “Kesempatan Kedua” (57 episode, dubbing Indo), search “cinta” → Sewa Cinta, Bumbu Cinta, Jatuh Cinta.
        Kalau halaman ini kosong di lokal, itu hampir pasti API key belum diisi — bukan salah kodenya.
      </p>
      <p className="mt-2 text-xs"><Link href="/drama?provider=shortmax&id=12961" className="text-amber-400 underline">Coba langsung buka detail contoh →</Link></p>
    </div>
  );
}
