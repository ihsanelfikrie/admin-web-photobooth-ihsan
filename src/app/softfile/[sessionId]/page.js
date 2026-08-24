'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function SoftfileGalleryPage() {
  const { sessionId } = useParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [expired, setExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    if (!sessionId) return;

    async function fetchSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/softfile/${sessionId}`);
        const json = await res.json();

        if (json.success) {
          setData(json);
          setRemainingSec(json.remainingSeconds || 0);

          // Confetti celebration
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
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
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours} Jam ${String(minutes).padStart(2, '0')} Menit ${String(seconds).padStart(2, '0')} Detik`;
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-4 md:p-8 flex flex-col items-center font-sans selection:bg-black selection:text-white">
      
      {/* Top Banner Header */}
      <header className="w-full max-w-2xl flex flex-col items-center text-center py-5 border-b-2 border-slate-300 mb-6">
        <span className="px-4 py-1 bg-black text-white text-xs font-black rounded-full uppercase tracking-wider mb-2 shadow-xs">
          PHOTOBOOTH JOBFAIR UPKK UIN ANTASARI • OFFICIAL GALLERY
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
          SOFTFILE GALERI FOTO
        </h1>
        <p className="text-xs text-slate-600 font-semibold mt-1">
          26 - 27 Agustus 2026 • Session ID: <span className="font-mono text-black font-bold">{sessionId}</span>
        </p>

        {/* 24-Hour Expiry Alert */}
        {!loading && !expired && remainingSec > 0 && (
          <div className="mt-4 w-full px-5 py-3 bg-amber-50 border-2 border-amber-400 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-amber-950 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl animate-bounce">⏱️</span>
              <span>Foto otomatis terhapus dalam:</span>
            </div>
            <span className="font-mono text-sm font-black bg-amber-200/80 px-3 py-1 rounded-xl text-amber-950 border border-amber-400">
              {formatRemainingTime(remainingSec)}
            </span>
          </div>
        )}
      </header>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center my-auto py-24 gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-800 font-bold text-sm">Menyiapkan galeri foto HD kamu dari Cloud CDN...</p>
        </div>
      )}

      {/* Expired / Error state */}
      {!loading && (expired || errorMessage) && (
        <div className="my-auto max-w-md w-full p-8 bg-white border-2 border-slate-400 rounded-[2.5rem] text-center space-y-4 shadow-lg">
          <div className="text-6xl">⏱️</div>
          <h2 className="text-2xl font-black text-rose-600">Softfile Kadaluarsa</h2>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {errorMessage || 'Foto sesi ini telah melewati batas simpan 24 jam dan telah dihapus otomatis dari server Supabase untuk menjaga privasi.'}
          </p>
          <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 font-bold">
            Photobooth JobFair UPKK UIN Antasari 26-27 Agustus 2026
          </div>
        </div>
      )}

      {/* Gallery content */}
      {!loading && !expired && data && (
        <div className="w-full max-w-2xl space-y-8 pb-16">
          
          {/* 1. Main 4R Print Composite */}
          <section className="bg-white border-2 border-black rounded-[2.5rem] p-6 flex flex-col items-center gap-4 shadow-md receipt-paper">
            <div className="w-full flex justify-between items-center border-b-2 border-slate-200 pb-3">
              <div>
                <h2 className="font-black text-base md:text-lg text-slate-900 uppercase">🖼️ FOTO CETAK STRUK 4R (HD)</h2>
                <p className="text-xs text-slate-500 font-medium">Format 4R Resolusi Tinggi Siap Cetak</p>
              </div>
              <span className="text-xs px-3 py-1 bg-slate-100 border border-slate-300 font-mono font-bold rounded-full">
                HD Quality
              </span>
            </div>

            {data.compositeUrl ? (
              <>
                <img
                  src={data.compositeUrl}
                  alt="Hasil Foto Cetak 4R"
                  className="max-h-[65vh] w-auto object-contain rounded-2xl border-2 border-slate-300 shadow-sm bg-white"
                />
                <a
                  href={data.compositeUrl}
                  download={`jobfair_photobooth_4r_${sessionId}.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-4 bg-black text-white hover:bg-slate-800 font-black text-center text-base rounded-full block uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-95 transition-all"
                >
                  ⬇️ UNDUH FOTO 4R (HD)
                </a>
              </>
            ) : (
              <div className="py-10 text-slate-400 text-sm font-semibold">Foto cetak tidak tersedia</div>
            )}
          </section>

          {/* 2. Animated Video MP4 or GIF */}
          {(data.videoUrl || data.gifUrl) && (
            <section className="bg-white border-2 border-black rounded-[2.5rem] p-6 flex flex-col items-center gap-4 shadow-md">
              <div className="w-full flex justify-between items-center border-b-2 border-slate-200 pb-3">
                <div>
                  <h2 className="font-black text-base md:text-lg text-slate-900 uppercase">🎬 VIDEO ANIMASI (16:9 HD)</h2>
                  <p className="text-xs text-slate-500 font-medium">Kompilasi Gerak Sesi Pemotretan</p>
                </div>
                <span className="text-xs px-3 py-1 bg-slate-100 border border-slate-300 font-mono font-bold rounded-full">
                  1080x720
                </span>
              </div>

              {data.videoUrl ? (
                <>
                  <video
                    src={data.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full aspect-video object-cover rounded-2xl border-2 border-black shadow-sm bg-black"
                  />
                  <a
                    href={data.videoUrl}
                    download={`jobfair_photobooth_video_${sessionId}.mp4`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 bg-black text-white hover:bg-slate-800 font-black text-center text-base rounded-full block uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    ⬇️ UNDUH VIDEO ANIMASI MP4
                  </a>
                </>
              ) : data.gifUrl ? (
                <>
                  <img
                    src={data.gifUrl}
                    alt="Animasi GIF Photobooth"
                    className="w-full aspect-video object-cover rounded-2xl border-2 border-black shadow-sm bg-black"
                  />
                  <a
                    href={data.gifUrl}
                    download={`jobfair_photobooth_gif_${sessionId}.gif`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 bg-black text-white hover:bg-slate-800 font-black text-center text-base rounded-full block uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    ⬇️ UNDUH ANIMASI GIF
                  </a>
                </>
              ) : null}
            </section>
          )}

          {/* 3. Individual Photo Shots */}
          {Array.isArray(data.singlePhotos) && data.singlePhotos.length > 0 && (
            <section className="bg-white border-2 border-black rounded-[2.5rem] p-6 flex flex-col gap-4 shadow-md">
              <div className="border-b-2 border-slate-200 pb-3">
                <h2 className="font-black text-base md:text-lg text-slate-900 uppercase">📸 FOTO SATUAN (INDIVIDUAL SHOTS)</h2>
                <p className="text-xs text-slate-500 font-medium">Unduh setiap foto pose asli secara terpisah ({data.singlePhotos.length} Foto)</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.singlePhotos.map((photo, idx) => (
                  <div key={idx} className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-3 flex flex-col items-center gap-3">
                    <img
                      src={photo.publicUrl}
                      alt={`Foto Pose ${idx + 1}`}
                      className="w-full aspect-video object-cover rounded-xl border border-slate-300 bg-slate-200"
                    />
                    <a
                      href={photo.publicUrl}
                      download={`jobfair_shot_${idx + 1}_${sessionId}.jpg`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold text-center rounded-full transition-all block uppercase shadow-xs hover:scale-[1.02] active:scale-95"
                    >
                      ⬇️ Unduh Foto Pose #{idx + 1}
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer Copyright */}
          <footer className="text-center text-xs text-slate-500 py-4 font-semibold">
            © 2026 Photobooth JobFair UPKK UIN Antasari • Supabase Storage Auto-Delete 24h
          </footer>

        </div>
      )}

    </main>
  );
}
