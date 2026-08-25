'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function SoftfileGalleryPage() {
  const { sessionId } = useParams();

  const [loading, setLoading]           = useState(true);
  const [data, setData]                 = useState(null);
  const [expired, setExpired]           = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    if (!sessionId) return;

    async function fetchSession() {
      try {
        setLoading(true);
        const res  = await fetch(`/api/softfile/${sessionId}`);
        const json = await res.json();

        if (json.success) {
          setData(json);
          setRemainingSec(json.remainingSeconds || 0);

          // Confetti celebration on load
          try {
            confetti({
              particleCount: 45,
              spread: 65,
              origin: { y: 0.55 },
              colors: ['#120CD6', '#E5FD5F', '#F908E0', '#111111'],
            });
          } catch (_) {}
        } else {
          setExpired(json.expired || false);
          setErrorMessage(json.message || 'Gagal memuat galeri foto.');
        }
      } catch (err) {
        setErrorMessage('Terjadi kesalahan jaringan saat mengambil foto.');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  // Countdown timer effect
  useEffect(() => {
    if (remainingSec <= 0 || expired) return;

    const timer = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSec, expired]);

  const formatRemainingTime = (totalSeconds) => {
    const hours   = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours} Jam ${String(minutes).padStart(2, '0')} Menit ${String(seconds).padStart(2, '0')} Detik`;
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'komvigi-photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  // Helper extracting all media URLs safely
  const mainPhotoUrl = data?.compositeUrl || data?.printUrl || data?.publicUrl || null;
  const videoMediaUrl = data?.videoUrl || data?.gifUrl || null;
  const rawPhotos = data?.singlePhotos || data?.individualPhotos || [];
  const singlePhotosList = Array.isArray(rawPhotos) ? rawPhotos : [];

  return (
    <main className="min-h-screen bg-[#120CD6] text-white p-4 md:p-8 flex flex-col items-center font-sans selection:bg-[#E5FD5F] selection:text-[#111111]">
      
      {/* Top Banner Header */}
      <header className="w-full max-w-3xl flex flex-col items-center text-center py-6 border-b border-white/20 mb-6">
        <span className="px-4 py-1.5 bg-[#E5FD5F] text-[#111111] text-xs font-black rounded-full uppercase tracking-wider mb-3 shadow-md">
          ✳ KEMENTERIAN KOMUNIKASI VISUAL DIGITAL • DEMA UIN ANTASARI
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
          KomvigI BOOTH
        </h1>
        <p className="text-xs md:text-sm text-white/80 font-bold mt-1 uppercase tracking-wider">
          GALERI RESMI PENGUNDUHAN SOFTFILE DIGITAL
        </p>

        {/* 24-Hour Expiry Alert */}
        {!loading && !expired && remainingSec > 0 && (
          <div className="mt-4 w-full max-w-xl px-5 py-3 bg-white text-[#111111] border-2 border-[#E5FD5F] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#120CD6] animate-pulse" />
              <span className="text-slate-700 font-bold">Masa Aktif Softfile Cloud:</span>
            </div>
            <span className="font-mono text-xs font-black bg-[#120CD6] text-[#E5FD5F] px-3.5 py-1 rounded-xl">
              ⏱️ {formatRemainingTime(remainingSec)}
            </span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="w-full max-w-3xl flex flex-col items-center gap-8 mb-12">
        
        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#E5FD5F] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-white uppercase tracking-wider">MENYIAPKAN FOTO DIGITAL KAMU...</p>
          </div>
        )}

        {/* Expired State */}
        {expired && (
          <div className="w-full p-8 bg-white text-[#111111] border-2 border-rose-500 rounded-3xl text-center space-y-3 shadow-xl max-w-lg">
            <div className="text-3xl font-black text-rose-600">MASA AKTIF BERAKHIR</div>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              Sesuai kebijakan privasi kampus, file foto digital di server cloud otomatis dibersihkan setelah 24 jam.
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && !expired && errorMessage && (
          <div className="w-full p-8 bg-white text-[#111111] border-2 border-rose-500 rounded-3xl text-center space-y-3 shadow-xl max-w-lg">
            <div className="text-xl font-black text-rose-600">FOTO TIDAK DITEMUKAN</div>
            <p className="text-xs font-medium text-slate-600">{errorMessage}</p>
          </div>
        )}

        {/* Success State — Clean Cards */}
        {!loading && !expired && data && (
          <>
            {/* 1. Composed Final Frame Card */}
            {mainPhotoUrl && (
              <section className="w-full bg-white text-[#111111] rounded-3xl p-6 md:p-8 shadow-2xl border-4 border-white flex flex-col items-center gap-5">
                <div className="w-full flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-xs font-black text-[#120CD6] uppercase tracking-wider">
                    ① HASIL FOTO BINGKAI UTAMA (4R HD)
                  </span>
                  <span className="px-3 py-1 bg-[#E5FD5F] text-[#111111] text-[10px] font-black rounded-full uppercase">
                    SIAP CETAK &amp; SHARE
                  </span>
                </div>

                <div className="relative max-w-md w-full bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm p-1">
                  <img
                    src={mainPhotoUrl}
                    alt="Hasil Foto KomvigI BOOTH"
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </div>

                <button
                  onClick={() => handleDownload(mainPhotoUrl, `komvigi-booth-${sessionId}.jpg`)}
                  className="w-full max-w-md py-4 bg-[#E5FD5F] hover:bg-[#d6f046] active:bg-[#F908E0] active:text-white text-[#111111] font-black rounded-full transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] text-sm uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#120CD6]"
                >
                  <span>⬇ UNDUH FOTO BINGKAI UTAMA HD</span>
                </button>
              </section>
            )}

            {/* 2. Video Reel MP4 Card */}
            {videoMediaUrl && (
              <section className="w-full bg-white text-[#111111] rounded-3xl p-6 md:p-8 shadow-2xl border-4 border-white flex flex-col items-center gap-5">
                <div className="w-full flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-xs font-black text-[#120CD6] uppercase tracking-wider">
                    ② VIDEO REEL ANIMASI (MP4)
                  </span>
                  <span className="px-3 py-1 bg-[#F908E0] text-white text-[10px] font-black rounded-full uppercase">
                    INSTAGRAM REELS &amp; TIKTOK
                  </span>
                </div>

                <div className="relative max-w-sm w-full bg-black rounded-2xl overflow-hidden shadow-sm aspect-[9/16] max-h-[440px] flex items-center justify-center">
                  <video
                    src={videoMediaUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>

                <button
                  onClick={() => handleDownload(videoMediaUrl, `komvigi-reel-${sessionId}.mp4`)}
                  className="w-full max-w-md py-4 bg-[#120CD6] hover:bg-blue-800 active:bg-[#F908E0] text-white font-black rounded-full transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>⬇ UNDUH VIDEO REEL MP4</span>
                </button>
              </section>
            )}

            {/* 3. Individual Poses Card */}
            {singlePhotosList.length > 0 && (
              <section className="w-full bg-white text-[#111111] rounded-3xl p-6 md:p-8 shadow-2xl border-4 border-white flex flex-col items-center gap-5">
                <div className="w-full flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-xs font-black text-[#120CD6] uppercase tracking-wider">
                    ③ {singlePhotosList.length} FOTO ASLI PER POSE
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    RESOLUSI ASLI KAMERA
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 w-full">
                  {singlePhotosList.map((item, idx) => {
                    const photoUrl = typeof item === 'string' ? item : (item.publicUrl || item.url || item.filePath);
                    return (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-2 flex flex-col items-center gap-2 shadow-xs"
                      >
                        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-200">
                          <img
                            src={photoUrl}
                            alt={`Pose #${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 bg-black/85 text-white text-[9px] font-black px-2 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDownload(photoUrl, `pose-${idx + 1}-${sessionId}.jpg`)}
                          className="w-full py-2 bg-slate-100 hover:bg-[#E5FD5F] active:bg-[#F908E0] active:text-white text-[#111111] text-[10px] font-black rounded-xl transition-all cursor-pointer border border-slate-300"
                        >
                          UNDUH #{idx + 1}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

      </div>

      {/* Footer */}
      <footer className="w-full max-w-3xl flex flex-col sm:flex-row justify-between items-center text-xs text-white/80 py-4 border-t border-white/20 gap-2 text-center">
        <div className="font-semibold text-[11px]">
          Kementerian Komunikasi Visual Digital (KomvigI) • DEMA UIN Antasari 2026-2027
        </div>
        <div className="text-[11px] font-bold text-[#E5FD5F]">
          Banjarmasin, Kalimantan Selatan
        </div>
      </footer>
    </main>
  );
}
