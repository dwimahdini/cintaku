'use client';
import { useEffect, useRef } from 'react';
import Script from 'next/script';

// Kode iklan Adsterra milik pengguna (akun Adsterra-nya sendiri).
// Native Banner: script loader disisipkan lewat DOM, mengisi div container.
// Banner 300x250: memakai next/script agar urutan atOptions -> invoke terjaga.
// Native Banner diletakkan di bawah hero/pencarian, Banner 300x250 di bawah
// daftar drama — tidak menutupi video dan tidak mengganggu tombol.

function loadScript(attrs: Record<string, string>, parent: HTMLElement) {
  const s = document.createElement('script');
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'async') { s.async = true; continue; }
    s.setAttribute(k, v);
  }
  parent.appendChild(s);
  return s;
}

export function NativeBanner() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.querySelector('script')) return;
    loadScript({ async: 'true', fetchpriority: 'high', 'data-cfasync': 'false', src: 'https://bancadeltempoidea.org/21/4770621785bc7eb90d7cf92ec5e693f6' }, el);
  }, []);
  return (
    <div className="my-8 flex justify-center">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
        <div ref={ref} id="container-4770621785bc7eb90d7cf92ec5e693f6" />
      </div>
    </div>
  );
}

export function Banner300() {
  return (
    <div className="my-8 flex justify-center">
      <div className="overflow-hidden rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
        <Script id="adsterra-atoptions" strategy="afterInteractive">
          {`atOptions = { 'key' : 'dcbd17b3ddf06407e85fc50b95c8ff32', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };`}
        </Script>
        <Script strategy="afterInteractive" src="https://bancadeltempoidea.org/22/dcbd17b3ddf06407e85fc50b95c8ff32" />
      </div>
    </div>
  );
}
