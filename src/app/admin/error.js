'use client';

import { useEffect } from 'react';

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error('[AdminPage Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#120CD6] flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border-4 border-white">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-wider mb-6 w-fit">
          ⚠ RUNTIME ERROR
        </div>
        <h2 className="text-xl font-black text-[#111111] mb-2">Admin Panel Error</h2>
        <p className="text-sm text-slate-600 mb-4">
          Terjadi kesalahan saat merender halaman admin. Detail error:
        </p>
        <pre className="bg-slate-100 border-2 border-slate-200 rounded-xl p-4 text-xs text-rose-700 font-mono overflow-auto max-h-64 mb-6 whitespace-pre-wrap">
          {error?.message || 'Unknown error'}
          {'\n\n'}
          {error?.stack || ''}
        </pre>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-[#E5FD5F] hover:bg-[#d8f244] text-[#111111] border-2 border-[#120CD6] font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
