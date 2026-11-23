# Dracin — Starter Next.js + APIShort

Aplikasi nonton drama China pendek (dracin) — katalog, search, detail, dan player HLS.
Bahasa default Indonesia (`lang=id`).

> Dibuat untuk Dwi Mahdini, 24 Nov 2026. Akun APIShort sudah terdaftar (Free, 100 req/day, Used Today 0/100 di screenshot dashboard).

## Yang sudah terverifikasi jalan (dites langsung 24 Nov 2026)

- `GET /v1/shortmax/api/v1/popular?lang=id` → data asli, mis. `[Dubbing] Kesempatan Kedua` (57 episode)
- `GET /v1/shortmax/api/v1/search?q=cinta&lang=id` → `Sewa Cinta`, `Bumbu Cinta`, `Jatuh Cinta`
- `GET /v1/shortmax/api/v1/detail/12961?lang=id` → detail lengkap + sinopsis Indonesia

## Yang TIDAK jalan seperti di docs homepage

- `dramabos.live/dramabox/api/v1/search` dan `dracinapi.com/starshort/api/v1/search` langsung dites → **404 HTML**, bukan JSON.
- Jadi starter ini pakai **APIShort** (`https://apishort.com`) sebagai base URL — tombol "Start Free" di DramaBos juga mengarah ke sana.

## Play / nonton langsung — SUDAH terverifikasi

Tidak ada endpoint `/play` terpisah di docs APIShort untuk ShortMax/DramaBox. URL videonya ada di dalam **daftar episode**:

- `GET /v1/shortmax/api/v1/alleps/12961?lang=id`
- → `data.episodes[0].video = { video_1080, video_720, video_480 }` — URL `.m3u8` signed, `expires_in: 28799` (~8 jam)

Itu yang dipakai `/api/play` di starter ini: ambil alleps, pilih episode, putar `video_720` di player HLS. DramaBox pakai pola beda: search pakai `?query=`, detail pakai `?bookId=`, episode pakai `/allepisode?bookId=` — dan search DramaBox dengan kata Indonesia sempat mengembalikan `[]`, jadi provider default starter ini adalah **shortmax**.

## Cara pakai (5 menit)

### 1. Isi API key — JANGAN kirim key ke chat / commit ke GitHub

```bash
cp .env.example .env.local
# buka .env.local, isi:
# APISHORT_API_KEY=vbs_... (key dari https://apishort.com/dashboard, tombol Copy Key)
```

Key di screenshot kamu diawali `vbs_37a3…` dan status ACTIVE. Itu saja yang kamu butuhkan — jangan share key lengkapnya ke siapa pun.

### 2. Jalankan lokal

```bash
npm install
npm run dev
# buka http://localhost:3000
```

Coba:
- Beranda → Popular ShortMax
- Search `cinta`
- Detail contoh: http://localhost:3000/drama?provider=shortmax&id=12961

Kalau beranda menampilkan error "API belum bisa diakses", hampir pasti `.env.local` belum diisi atau server dev belum di-restart setelah isi env.

### 3. Deploy ke Vercel

```bash
# push folder ini ke GitHub (pastikan .env.local TIDAK ikut — sudah ada di .gitignore)
git init && git add . && git commit -m "dracin starter" && git push
```

Di Vercel → Import Project → pilih repo ini → **Environment Variables**:
- `APISHORT_API_KEY` = key kamu
- `DRAMA_API_BASE_URL` = `https://apishort.com`
- `DRAMA_LANG` = `id`
- `DEFAULT_PROVIDER` = `shortmax`

Lalu Deploy. Video tidak di-host di Vercel — Vercel hanya melayani web + proxy API. Stream HLS langsung dari CDN upstream.

## Hemat kuota Free (100 req/hari)

- Beranda & detail di-cache 1 jam (`revalidate = 3600`).
- `/api/play` hanya dipanggil saat user klik Play, bukan saat halaman dibuka.
- Jangan panggil API dari browser langsung — selalu lewat `/api/*` di Next.js, supaya key tidak bocor dan respons bisa di-cache.

## Struktur

```
app/
  page.tsx            Beranda: Popular + Search (server component, cached)
  drama/page.tsx      Detail: ?provider=shortmax&id=12961
  watch/page.tsx      Player HLS (client, hls.js, vertikal 9:16 di HP)
  api/
    popular/route.ts  GET /api/popular?provider=shortmax&page=1
    search/route.ts   GET /api/search?provider=shortmax&q=cinta
    detail/route.ts   GET /api/detail?provider=shortmax&id=12961
    play/route.ts     GET /api/play?provider=shortmax&id=12961&ep=1
lib/apishort.ts       Server-only fetch + normalisasi + fallback pola endpoint
components/
  DramaCard.tsx       Kartu poster
  VideoPlayer.tsx     Player hls.js
```

## Ganti provider API (kalau mau coba DracinAPI lagi)

Di `.env.local` / Vercel, ganti satu baris:
```
DRAMA_API_BASE_URL=https://dracinapi.com
```
Format responsnya sama, jadi kode tidak perlu diubah. Tes dulu 1 request — kalau masih 404, balik ke `https://apishort.com`.

## Catatan legal

Starter ini untuk belajar / MVP. Konten berasal dari provider upstream via APIShort (aggregator, bukan resmi iQIYI/DramaBox). Jangan publikasikan ulang video tanpa lisensi, dan jangan jual akses ke konten orang lain sebagai milikmu.
