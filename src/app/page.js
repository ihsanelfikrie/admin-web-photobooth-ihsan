'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [sessionIdInput, setSessionIdInput] = useState('');

  const handleLookup = (e) => {
    e.preventDefault();
    if (sessionIdInput.trim()) {
      router.push(`/softfile/${sessionIdInput.trim()}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#070A12] text-white flex flex-col justify-between items-center p-6 md:p-12 font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-4xl flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>NADHISAN STUDIO PORTAL</span>
        </div>

        <Link
          href="/admin"
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/25 hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          PANEL ADMIN
        </Link>
      </header>

      {/* Main Card */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 text-white rounded-3xl p-8 md:p-10 shadow-2xl my-auto text-center flex flex-col items-center gap-6 relative z-10 backdrop-blur-xl">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
          <span>CLOUD SOFTFILE HUB</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            Nadhisan Studio
          </h1>
          <h2 className="text-sm md:text-base font-bold text-slate-300 uppercase tracking-wider">
            Galeri Softfile Digital &amp; Video Reel
          </h2>
          <p className="text-xs text-slate-400 pt-1">
            Unduh Foto 4R / 2R HD &amp; Video MP4 Animasi Resmi dari Kiosk Photobooth
          </p>
        </div>

        {/* Search / Lookup Session ID */}
        <form onSubmit={handleLookup} className="w-full space-y-3 pt-2">
          <div className="text-xs font-bold uppercase text-slate-300 text-left pl-1">
            Cari Sesi Foto via ID Sesi:
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              placeholder="Contoh: mono_1787146834652"
              className="flex-1 px-4 py-3.5 rounded-2xl border border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-2xl transition-all uppercase tracking-wider shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Buka
            </button>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Atau pindai (scan) QR Code yang tercetak pada lembar foto Anda menggunakan kamera smartphone.
          </p>
        </form>

        {/* Feature Highlights */}
        <div className="w-full grid grid-cols-3 gap-2.5 pt-2 text-[10px] font-bold uppercase text-slate-300">
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col items-center gap-1">
            <span className="text-xs text-indigo-400 font-black">HD PHOTO</span>
            <span>Cetak Jernih</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col items-center gap-1">
            <span className="text-xs text-purple-400 font-black">VIDEO REEL</span>
            <span>Motion MP4</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col items-center gap-1">
            <span className="text-xs text-cyan-400 font-black">CLOUD SAFE</span>
            <span>24 Jam Aktif</span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl border-t border-slate-800/80 pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-400 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-bold text-slate-200">NADHISAN STUDIO</span>
          <span className="text-slate-500">• Cloud Photobooth OS</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] md:text-xs">
          <span>Instagram: <strong className="text-slate-200">@Ihsanelfikrie_</strong></span>
          <span className="text-slate-600">•</span>
          <span>Email: <strong className="text-slate-200">ihsanelfikrie134@gmail.com</strong></span>
          <span className="text-slate-600">•</span>
          <span>WhatsApp: <strong className="text-slate-200">+62 858-2271-3356</strong></span>
        </div>
      </footer>

    </main>
  );
}
