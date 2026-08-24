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
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between items-center p-6 md:p-12 font-sans selection:bg-black selection:text-white">
      
      {/* Top Header */}
      <header className="w-full max-w-4xl flex justify-between items-center">
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border-2 border-slate-300 bg-white text-slate-900 text-xs font-black uppercase tracking-wider shadow-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>PORTAL CLOUD SOFTFILE &amp; ADMIN</span>
        </div>

        <Link
          href="/admin"
          className="px-5 py-2.5 rounded-full bg-black hover:bg-slate-800 text-white transition-all text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          PANEL ADMIN
        </Link>
      </header>

      {/* Main Card */}
      <div className="w-full max-w-xl bg-white border-2 border-black rounded-[2.5rem] p-8 md:p-10 shadow-xl my-auto text-center flex flex-col items-center gap-6 receipt-paper">
        
        <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-extrabold tracking-widest uppercase bg-slate-900 text-white border border-black">
          <span>🧾 JOBFAIR UPKK UIN ANTASARI 🧾</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">
            PHOTOBOOTH GALLERY
          </h1>
          <h2 className="text-lg md:text-xl font-bold text-slate-600 uppercase tracking-wider">
            UPKK UIN Antasari Banjarmasin
          </h2>
          <p className="text-xs md:text-sm font-semibold text-slate-500 pt-1">
            26 - 27 Agustus 2026 • 24h Cloud Softfile Download
          </p>
        </div>

        {/* Search / Lookup Session ID */}
        <form onSubmit={handleLookup} className="w-full space-y-3 pt-2">
          <div className="text-xs font-bold text-slate-700 text-left pl-1">
            🔍 Cari Sesi Foto via Session ID:
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              placeholder="Contoh: sess_1787146834652_1234"
              className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-slate-300 bg-slate-50 text-slate-900 text-sm font-mono focus:outline-none focus:border-black transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3.5 bg-black hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition-all uppercase tracking-wider shadow-md hover:scale-105 active:scale-95"
            >
              Buka
            </button>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            Atau cukup pindai (scan) QR Code yang tampil di layar Kiosk Photobooth dengan kamera HP Anda.
          </p>
        </form>

        {/* Feature Highlights */}
        <div className="w-full grid grid-cols-3 gap-2 pt-2 text-[11px] font-bold text-slate-700">
          <div className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center gap-1">
            <span className="text-lg">🖼️</span>
            <span>Foto 4R HD</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center gap-1">
            <span className="text-lg">🎬</span>
            <span>Video 16:9</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center gap-1">
            <span className="text-lg">⏱️</span>
            <span>Aktif 24 Jam</span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="text-xs text-slate-500 text-center font-medium">
        © 2026 Photobooth JobFair UPKK UIN Antasari • Powered by Supabase Storage &amp; Vercel
      </footer>

    </main>
  );
}
