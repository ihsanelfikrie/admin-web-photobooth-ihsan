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
    <main className="min-h-screen bg-[#120CD6] text-white flex flex-col justify-between items-center p-6 md:p-12 font-sans selection:bg-[#E5FD5F] selection:text-[#111111]">
      
      {/* Top Header */}
      <header className="w-full max-w-4xl flex justify-between items-center">
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#E5FD5F] text-[#111111] text-xs font-black uppercase tracking-wider shadow-md">
          <span className="h-2 w-2 rounded-full bg-[#120CD6] animate-ping" />
          <span>TARASABOOTH CLOUD PORTAL</span>
        </div>

        <Link
          href="/admin"
          className="px-5 py-2.5 rounded-full bg-white text-[#120CD6] hover:bg-[#E5FD5F] hover:text-[#111111] transition-all text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          PANEL ADMIN
        </Link>
      </header>

      {/* Main Card */}
      <div className="w-full max-w-xl bg-white text-[#111111] rounded-3xl p-8 md:p-10 shadow-2xl my-auto text-center flex flex-col items-center gap-6 border-4 border-white">
        
        <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-[#120CD6] text-[#E5FD5F]">
          <span>TARASABOOTH STUDIO PORTAL</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-[#120CD6] uppercase tracking-tight">
            TarasaBooth
          </h1>
          <h2 className="text-sm md:text-base font-bold text-slate-600 uppercase tracking-wider">
            Galeri Softfile Digital &amp; Video Reel
          </h2>
          <p className="text-xs font-semibold text-slate-500 pt-1">
            Unduh Foto 4R HD &amp; Animasi MP4 Resmi dari Kiosk Photobooth
          </p>
        </div>

        {/* Search / Lookup Session ID */}
        <form onSubmit={handleLookup} className="w-full space-y-3 pt-2">
          <div className="text-xs font-black uppercase text-slate-700 text-left pl-1">
            Cari Sesi Foto via ID Sesi:
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              placeholder="Contoh: mono_1787146834652"
              className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-slate-300 bg-slate-50 text-slate-900 text-sm font-mono focus:outline-none focus:border-[#120CD6] transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3.5 bg-[#E5FD5F] hover:bg-[#d6f046] active:bg-[#F908E0] active:text-white text-[#111111] font-black text-xs rounded-2xl transition-all uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 border-2 border-[#120CD6] cursor-pointer"
            >
              Buka
            </button>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Atau pindai (scan) QR Code yang tercetak pada foto Anda menggunakan kamera smartphone.
          </p>
        </form>

        {/* Feature Highlights */}
        <div className="w-full grid grid-cols-3 gap-2 pt-2 text-[10px] font-black uppercase text-slate-700">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
            <span className="text-xs text-[#120CD6] font-black">4R HD</span>
            <span>Cetak Jernih</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
            <span className="text-xs text-[#F908E0] font-black">VIDEO MP4</span>
            <span>Reels &amp; Story</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
            <span className="text-xs text-[#120CD6] font-black">24 JAM</span>
            <span>Cloud Safe</span>
          </div>
        </div>

      </div>

      {/* SANS Creative Signature Footer (Section 11.3) */}
      <footer className="w-full max-w-4xl border-t border-white/20 pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-white/90">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E5FD5F]" />
          <span className="font-bold text-white">SANS Creative</span>
          <span className="text-white/70">• TarasaBooth Studio</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] md:text-xs">
          <span>Instagram: <strong className="text-white">@Ihsanelfikrie_</strong></span>
          <span className="text-white/40">•</span>
          <span>Email: <strong className="text-white">ihsanelfikrie134@gmail.com</strong></span>
          <span className="text-white/40">•</span>
          <span>WhatsApp: <strong className="text-white">+62 858-2271-3356</strong></span>
        </div>
      </footer>

    </main>
  );
}
