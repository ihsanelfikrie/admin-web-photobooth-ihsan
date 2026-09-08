"use client";

import { useEffect, useState } from "react";

export default function AdminError({ error, reset }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("[Nadhisan Studio Admin Error]", error);
  }, [error]);

  const handleCopyError = () => {
    const report = [
      "=== NADHISAN STUDIO ADMIN ERROR REPORT ===",
      "Waktu: " + new Date().toISOString(),
      "URL: " + (typeof window !== "undefined" ? window.location.href : "SSR"),
      "Browser: " + (typeof navigator !== "undefined" ? navigator.userAgent : "Unknown"),
      "Pesan: " + (error?.message || "Unknown error"),
      "Digest: " + (error?.digest || "N/A"),
      "Stack:\n" + (error?.stack || "No stack trace available"),
      "=========================================="
    ].join("\n");

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleClearCacheAndReload = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("sans_admin_kiosks");
        sessionStorage.clear();
      } catch (_) {}
      window.location.href = "/admin";
    }
  };

  return (
    <div className="min-h-screen bg-[#120CD6] flex items-center justify-center p-4 md:p-8 font-sans selection:bg-[#E5FD5F] selection:text-[#111111]">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border-4 border-white text-[#111111]">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 text-white rounded-full text-[11px] font-black uppercase tracking-wider">
            <span>⚠</span>
            <span>SYSTEM RUNTIME EXCEPTION</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-bold">
            {error?.digest ? "Digest: " + error.digest : "Admin Error Boundary"}
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-black text-[#111111] uppercase tracking-tight mb-2">
          Panel Admin Mengalami Kendala
        </h2>
        <p className="text-xs md:text-sm text-slate-600 font-medium mb-4">
          Aplikasi menangkap kendala saat merender komponen antarmuka. Anda dapat mencoba memuat ulang atau membersihkan cache data lokal:
        </p>

        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xs font-mono mb-6">
          <p className="text-rose-700 font-bold mb-2 break-all">
            {error?.message || "Terjadi kesalahan tidak terduga pada antarmuka admin."}
          </p>
          {error?.stack && (
            <pre className="text-[11px] text-slate-500 overflow-auto max-h-48 whitespace-pre-wrap leading-relaxed">
              {error.stack}
            </pre>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-[#E5FD5F] hover:bg-[#d8f244] active:bg-[#F908E0] active:text-white text-[#111111] border-2 border-[#120CD6] font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Coba Muat Ulang
          </button>

          <button
            onClick={handleCopyError}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            {copied ? "✓ Berhasil Disalin" : "Salin Laporan Error"}
          </button>

          <button
            onClick={handleClearCacheAndReload}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer ml-auto"
            title="Hapus session storage & cache lokal lalu muat ulang"
          >
            Reset Cache &amp; Login Ulang
          </button>
        </div>
      </div>
    </div>
  );
}
