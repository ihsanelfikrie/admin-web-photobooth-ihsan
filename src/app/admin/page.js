'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import JSZip from 'jszip';

const SUPABASE_CDN_BASE = 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets';

function getDisplayCdnUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const filename = url.split('/').pop();
  return filename ? `${SUPABASE_CDN_BASE}/${filename}` : null;
}

export default function OnlineAdminPage() {
  const [pinInput, setPinInput]               = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError]               = useState(false);

  // Tabs: 'dashboard' | 'finance' | 'sessions' | 'kiosk' | 'frames' | 'queue' | 'vouchers' | 'cleanup'
  const [activeTab, setActiveTab]             = useState('dashboard');

  // Data States
  const [loading, setLoading]                 = useState(false);
  const [sessions, setSessions]               = useState([]);
  const [vouchers, setVouchers]               = useState([]);
  const [telemetry, setTelemetry]             = useState(null);
  const [queue, setQueue]                     = useState(null);
  const [frames, setFrames]                   = useState([]);
  const [finance, setFinance]                 = useState(null);
  const [financeRange, setFinanceRange]       = useState('all'); // 'all' | 'today' | 'week' | 'month'

  const [searchQuery, setSearchQuery]         = useState('');
  const [statusFilter, setStatusFilter]       = useState('all');

  // Modals & Popups
  const [selectedSession, setSelectedSession] = useState(null);
  const [qrModalSession, setQrModalSession]   = useState(null);
  const [qrDataUrl, setQrDataUrl]             = useState(null);
  const [toastMessage, setToastMessage]       = useState(null);
  const [zipping, setZipping]                 = useState(false);

  // Form States
  const [announcementInput, setAnnouncementInput] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [voucherCode, setVoucherCode]         = useState('');
  const [voucherType, setVoucherType]         = useState('free');
  const [voucherValue, setVoucherValue]       = useState('100');
  const [voucherMaxUses, setVoucherMaxUses]   = useState('100');
  const [voucherDesc, setVoucherDesc]         = useState('');
  const [voucherMsg, setVoucherMsg]           = useState(null);
  const [cleanupRunning, setCleanupRunning]   = useState(false);
  const [cleanupResult, setCleanupResult]     = useState(null);
  const [actionLoading, setActionLoading]     = useState(false);

  // Toast Helper
  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check stored PIN session
  useEffect(() => {
    const savedPin = sessionStorage.getItem('admin_pin');
    if (savedPin) {
      verifyPin(savedPin);
    }
  }, []);

  const verifyPin = async (pin) => {
    try {
      setLoading(true);
      const res  = await fetch(`/api/sessions?pin=${pin}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_pin', pin);
        setSessions(json.sessions || []);
        loadVouchers(pin);
        loadTelemetry();
        loadQueue();
        loadFrames();
        loadFinance(financeRange, pin);
      } else {
        setPinError(true);
      }
    } catch (_) {
      setPinError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setPinError(false);
    verifyPin(pinInput);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pin');
    setIsAuthenticated(false);
    setPinInput('');
  };

  const currentPin = useMemo(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin_pin') || '1234';
    }
    return '1234';
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`/api/sessions?pin=${currentPin}`);
      const json = await res.json();
      if (json.success) setSessions(json.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVouchers = async (pin = currentPin) => {
    try {
      const res  = await fetch(`/api/vouchers?pin=${pin}`);
      const json = await res.json();
      if (json.success) setVouchers(json.vouchers || []);
    } catch (err) {
      console.error('Failed to load vouchers:', err);
    }
  };

  const loadTelemetry = async () => {
    try {
      const res  = await fetch('/api/kiosk/status');
      const json = await res.json();
      if (json.success) {
        setTelemetry(json.telemetry);
        if (json.telemetry?.announcement) {
          setAnnouncementInput(json.telemetry.announcement.text || '');
          setAnnouncementActive(json.telemetry.announcement.active !== false);
        }
      }
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    }
  };

  const loadQueue = async () => {
    try {
      const res  = await fetch('/api/queue');
      const json = await res.json();
      if (json.success) setQueue(json.queue);
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  };

  const loadFrames = async () => {
    try {
      const res  = await fetch('/api/frames');
      const json = await res.json();
      if (json.success) setFrames(json.frames || []);
    } catch (err) {
      console.error('Failed to load frames:', err);
    }
  };

  const loadFinance = async (range = financeRange, pin = currentPin) => {
    try {
      const res  = await fetch(`/api/finance?range=${range}&pin=${pin}`);
      const json = await res.json();
      if (json.success) setFinance(json.finance);
    } catch (err) {
      console.error('Failed to load finance:', err);
    }
  };

  // Cloud Reprint Dispatch
  const handleCloudReprint = async (sessionId) => {
    if (!confirm(`Kirim perintah cetak ulang untuk sesi ${sessionId} ke printer bilik foto?`)) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/reprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, pin: currentPin, copies: 1 }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `Cetak ulang sesi ${sessionId} berhasil dikirim.`);
      } else {
        showToast(json.error || 'Gagal mengirim cetak ulang', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan saat mengirim cetak ulang', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Remote Paper Refill Dispatch
  const handlePaperRefill = async (qtyToAdd) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/kiosk/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refill', quantity: qtyToAdd, pin: currentPin }),
      });
      const json = await res.json();
      if (json.success) {
        setTelemetry(json.telemetry);
        showToast(`Stok kertas berhasil diisi ulang (+${qtyToAdd} lembar).`);
      } else {
        showToast(json.error || 'Gagal mengisi stok kertas', 'error');
      }
    } catch (err) {
      showToast('Gagal memproses refill kertas', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // One-Click Event Mode Switcher
  const handleToggleEventMode = async () => {
    const isEvent = telemetry?.is_event_mode;
    const confirmMsg = isEvent
      ? 'Nonaktifkan Mode Event? Photobooth akan kembali ke Mode Komersial (wajib bayar QRIS).'
      : 'Aktifkan Mode Event? Photobooth akan bebas bayar (pengunjung langsung melangkah memilih frame & foto gratis).';
    if (!confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      const res = await fetch('/api/kiosk/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_event_mode', pin: currentPin }),
      });
      const json = await res.json();
      if (json.success) {
        setTelemetry(json.telemetry);
        showToast(json.message);
      } else {
        showToast(json.error || 'Gagal mengubah mode event', 'error');
      }
    } catch (err) {
      showToast('Gagal mengubah mode event', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Live Announcement Updater
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch('/api/kiosk/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_announcement',
          announcement: {
            text: announcementInput.trim(),
            active: announcementActive,
            updated_at: Date.now(),
          },
          pin: currentPin,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTelemetry(json.telemetry);
        showToast('Pengumuman layar Kiosk berhasil diperbarui!');
      } else {
        showToast(json.error || 'Gagal memperbarui pengumuman', 'error');
      }
    } catch (err) {
      showToast('Gagal memperbarui pengumuman', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Frame Catalog Toggle
  const handleToggleFrame = async (frameId) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', frameId, pin: currentPin }),
      });
      const json = await res.json();
      if (json.success) {
        setFrames(json.frames);
        showToast('Status bingkai berhasil diperbarui.');
      } else {
        showToast(json.error || 'Gagal memperbarui bingkai', 'error');
      }
    } catch (err) {
      showToast('Gagal memproses bingkai', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Export Financial CSV
  const handleExportCsv = () => {
    if (!finance?.transactions || finance.transactions.length === 0) {
      showToast('Tidak ada data transaksi untuk diekspor', 'error');
      return;
    }

    const headers = ['Order ID', 'ID Sesi', 'Waktu Transaksi', 'Metode Pembayaran', 'Harga Asli (Rp)', 'Total Bayar (Rp)', 'Status'];
    const rows = finance.transactions.map(t => [
      `"${t.orderId}"`,
      `"${t.sessionId}"`,
      `"${new Date(t.createdAt).toLocaleString('id-ID')}"`,
      `"${t.paymentMethod}"`,
      t.originalPrice,
      t.amount,
      `"${t.status}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tarasabooth-laporan-keuangan-${financeRange}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Laporan CSV berhasil diunduh!');
  };

  // One-Click Session ZIP Downloader (JSZip)
  const handleDownloadZip = async (session) => {
    if (!session) return;
    setZipping(true);
    showToast('Sedang menyiapkan arsip ZIP softfile...');

    try {
      const zip = new JSZip();
      const folder = zip.folder(`tarasabooth-${session.sessionId}`);

      // 1. Composite Frame
      const compUrl = getDisplayCdnUrl(session.cdnCompositeUrl || session.compositeUrl);
      if (compUrl) {
        try {
          const res = await fetch(compUrl);
          const blob = await res.blob();
          folder.file(`hasil-bingkai-4r-${session.sessionId}.jpg`, blob);
        } catch (_) {}
      }

      // 2. Video Reel MP4
      const videoUrl = getDisplayCdnUrl(session.cdnVideoUrl || session.videoUrl);
      if (videoUrl) {
        try {
          const res = await fetch(videoUrl);
          const blob = await res.blob();
          folder.file(`video-reel-${session.sessionId}.mp4`, blob);
        } catch (_) {}
      }

      // 3. Single Poses
      const singles = session.singlePhotos || session.cdnSinglePhotos || [];
      for (let i = 0; i < singles.length; i++) {
        const item = singles[i];
        const sUrl = getDisplayCdnUrl(typeof item === 'string' ? item : (item.publicUrl || item.url || item.filePath));
        if (sUrl) {
          try {
            const res = await fetch(sUrl);
            const blob = await res.blob();
            folder.file(`pose-${i + 1}-${session.sessionId}.jpg`, blob);
          } catch (_) {}
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `tarasabooth-paket-lengkap-${session.sessionId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      showToast(`Paket ZIP sesi ${session.sessionId} berhasil diunduh!`);
    } catch (err) {
      console.error('ZIP error:', err);
      showToast('Gagal membuat paket ZIP', 'error');
    } finally {
      setZipping(false);
    }
  };

  // Queue Controller Actions
  const handlePromoteQueue = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'promote_next', pin: currentPin }),
      });
      const json = await res.json();
      if (json.success) {
        setQueue(json.queue);
        showToast(json.message);
      } else {
        showToast(json.error || 'Gagal memanggil antrian', 'error');
      }
    } catch (err) {
      showToast('Kesalahan memproses antrian', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseQueue = async () => {
    if (!confirm('Tandai tiket antrian aktif saat ini sebagai expired/selesai?')) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'release_current', pin: currentPin }),
      });
      const json = await res.json();
      if (json.success) {
        setQueue(json.queue);
        showToast(json.message);
      } else {
        showToast(json.error || 'Gagal melepaskan tiket', 'error');
      }
    } catch (err) {
      showToast('Kesalahan memproses antrian', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // QR Modal Opener
  const openQrModal = async (session) => {
    setQrModalSession(session);
    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://admin-web-photobooth-ihsan.vercel.app';
    const softfileUrl = `${domain}/softfile/${session.sessionId}`;
    try {
      const dataUrl = await QRCode.toDataURL(softfileUrl, { width: 350, margin: 2, color: { dark: '#120CD6', light: '#FFFFFF' } });
      setQrDataUrl(dataUrl);
    } catch (_) {
      setQrDataUrl(null);
    }
  };

  // Copy Link Helper
  const copySoftfileLink = (sessionId) => {
    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://admin-web-photobooth-ihsan.vercel.app';
    const url = `${domain}/softfile/${sessionId}`;
    navigator.clipboard.writeText(url);
    showToast(`Link softfile ${sessionId} disalin ke clipboard!`);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm(`Hapus seluruh aset softfile untuk sesi ${sessionId} dari Supabase?`)) return;

    try {
      setLoading(true);
      const res  = await fetch(`/api/sessions?sessionId=${sessionId}&pin=${currentPin}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast(`Sesi ${sessionId} berhasil dihapus.`);
        setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        if (selectedSession?.sessionId === sessionId) setSelectedSession(null);
      } else {
        showToast(json.error || 'Gagal menghapus', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat menghapus sesi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: currentPin,
          voucher: {
            code: voucherCode.trim(),
            type: voucherType,
            value: voucherValue,
            maxUses: voucherMaxUses,
            description: voucherDesc || 'Voucher Spesial TarasaBooth',
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setVouchers(json.vouchers || []);
        setVoucherCode('');
        setVoucherDesc('');
        showToast(`Voucher ${voucherCode.toUpperCase()} berhasil disimpan!`);
      } else {
        setVoucherMsg({ type: 'error', text: json.error || 'Gagal menyimpan voucher' });
      }
    } catch (err) {
      setVoucherMsg({ type: 'error', text: 'Kesalahan jaringan saat menyimpan voucher' });
    }
  };

  const handleDeleteVoucher = async (code) => {
    if (!confirm(`Hapus voucher ${code}?`)) return;
    try {
      const res = await fetch(`/api/vouchers?code=${code}&pin=${currentPin}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setVouchers(json.vouchers || []);
        showToast(`Voucher ${code} berhasil dihapus.`);
      }
    } catch (err) {
      showToast('Gagal menghapus voucher.', 'error');
    }
  };

  const handleToggleVoucher = async (voucher) => {
    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: currentPin,
          voucher: { ...voucher, active: !voucher.active },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setVouchers(json.vouchers || []);
        showToast(`Status voucher ${voucher.code} diperbarui.`);
      }
    } catch (err) {
      console.error('Failed to toggle voucher:', err);
    }
  };

  const handleRunCleanup = async () => {
    if (!confirm('Jalankan pembersihan Supabase Storage untuk semua sesi yang berusia > 24 jam?')) return;
    try {
      setCleanupRunning(true);
      setCleanupResult(null);
      const res  = await fetch(`/api/cron/cleanup?pin=${currentPin}`, { method: 'POST' });
      const json = await res.json();
      setCleanupResult(json);
      loadSessions();
      showToast('Pembersihan sesi selesai.');
    } catch (err) {
      setCleanupResult({ success: false, error: err.message });
    } finally {
      setCleanupRunning(false);
    }
  };

  // Stats calculation
  const now = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  const stats = useMemo(() => {
    const total = sessions.length;
    let activeCount = 0;
    let expiredCount = 0;

    sessions.forEach(s => {
      const age = now - (s.createdAt || 0);
      if (age <= TWENTY_FOUR_HOURS_MS) activeCount++;
      else expiredCount++;
    });

    return { total, activeCount, expiredCount };
  }, [sessions, now]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSearch = searchQuery === '' || 
        s.sessionId?.toLowerCase().includes(searchQuery.toLowerCase());
      const isExpired = (now - (s.createdAt || 0)) > TWENTY_FOUR_HOURS_MS;
      const matchesStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? !isExpired : isExpired;

      return matchesSearch && matchesStatus;
    });
  }, [sessions, searchQuery, statusFilter, now]);

  // ── PIN Login Screen ────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#120CD6] text-white flex items-center justify-center p-4 select-none font-sans">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md p-8 md:p-10 bg-white text-[#111111] rounded-3xl shadow-2xl flex flex-col items-center gap-6 border-4 border-white"
        >
          <div className="px-4 py-1.5 bg-[#E5FD5F] text-[#111111] rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
            TARASABOOTH CLOUD PANEL
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-[#120CD6] uppercase tracking-tight">
              TarasaBooth
            </h1>
            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
              Pusat Kendali Photobooth Studio
            </p>
          </div>

          <div className="w-full space-y-2">
            <input
              type="password"
              maxLength={8}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="Masukkan PIN Admin (1234)"
              className="w-full text-center tracking-widest text-2xl font-mono py-4 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#111111] focus:outline-none focus:border-[#120CD6] transition-colors"
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-rose-600 font-bold text-center">PIN Salah! Silakan coba lagi.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#E5FD5F] hover:bg-[#d6f046] active:bg-[#F908E0] active:text-white text-[#111111] font-black rounded-full uppercase tracking-wider transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 border-2 border-[#120CD6]"
          >
            {loading ? 'Memverifikasi...' : 'MASUK PANEL ADMIN →'}
          </button>
        </form>
      </div>
    );
  }

  // ── Main Authenticated Admin Dashboard ──────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111111] font-sans flex flex-col selection:bg-[#E5FD5F] selection:text-[#111111]">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border-2 text-xs font-black uppercase flex items-center gap-2 animate-bounce ${
          toastMessage.type === 'error'
            ? 'bg-rose-600 text-white border-white'
            : 'bg-[#E5FD5F] text-[#111111] border-[#120CD6]'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="bg-[#120CD6] text-white px-4 sm:px-6 py-3.5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-[#E5FD5F] text-[#111111] text-[11px] font-black uppercase tracking-wider shadow-xs">
              TARASABOOTH CLOUD
            </span>
            <span className="h-4 w-px bg-white/30" />
            <div>
              <h1 className="text-xs sm:text-sm md:text-base font-black text-white uppercase tracking-tight">
                PANEL ADMIN
              </h1>
              <p className="text-[9px] sm:text-[10px] text-white/80 font-semibold truncate max-w-[200px] sm:max-w-none">
                Self-Service Photobooth Studio
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="md:hidden px-3.5 py-1.5 bg-white text-[#120CD6] hover:bg-rose-500 hover:text-white rounded-full text-[11px] font-black transition-all cursor-pointer shadow-xs"
          >
            Keluar
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar w-full md:w-auto">
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/20 text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 text-xs ${
                activeTab === 'dashboard' ? 'bg-[#E5FD5F] text-[#111111] shadow-xs font-black' : 'text-white hover:bg-white/10'
              }`}
            >
              Ringkasan
            </button>
            <button
              onClick={() => { setActiveTab('finance'); loadFinance(financeRange); }}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 text-xs ${
                activeTab === 'finance' ? 'bg-[#E5FD5F] text-[#111111] shadow-xs font-black' : 'text-white hover:bg-white/10'
              }`}
            >
              Keuangan
            </button>
            <button
              onClick={() => { setActiveTab('sessions'); loadSessions(); }}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 text-xs ${
                activeTab === 'sessions' ? 'bg-[#E5FD5F] text-[#111111] shadow-xs font-black' : 'text-white hover:bg-white/10'
              }`}
            >
              Sesi ({sessions.length})
            </button>
            <button
              onClick={() => { setActiveTab('kiosk'); loadTelemetry(); }}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 text-xs ${
                activeTab === 'kiosk' ? 'bg-[#E5FD5F] text-[#111111] shadow-xs font-black' : 'text-white hover:bg-white/10'
              }`}
            >
              Kiosk &amp; Kertas
            </button>
            <button
              onClick={() => { setActiveTab('frames'); loadFrames(); }}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 text-xs ${
                activeTab === 'frames' ? 'bg-[#E5FD5F] text-[#111111] shadow-xs font-black' : 'text-white hover:bg-white/10'
              }`}
            >
              Frame ({frames.length})
            </button>
            <button
              onClick={() => { setActiveTab('queue'); loadQueue(); }}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 text-xs ${
                activeTab === 'queue' ? 'bg-[#E5FD5F] text-[#111111] shadow-xs font-black' : 'text-white hover:bg-white/10'
              }`}
            >
              Antrian
            </button>
            <button
              onClick={() => { setActiveTab('vouchers'); loadVouchers(); }}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 text-xs ${
                activeTab === 'vouchers' ? 'bg-[#E5FD5F] text-[#111111] shadow-xs font-black' : 'text-white hover:bg-white/10'
              }`}
            >
              Voucher
            </button>
            <button
              onClick={() => setActiveTab('cleanup')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 text-xs ${
                activeTab === 'cleanup' ? 'bg-[#E5FD5F] text-[#111111] shadow-xs font-black' : 'text-white hover:bg-white/10'
              }`}
            >
              Cleanup
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="hidden md:block px-4 py-2 bg-white text-[#120CD6] hover:bg-rose-500 hover:text-white rounded-full text-xs font-black transition-all cursor-pointer shadow-sm shrink-0"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        
        {/* ── TAB 1: DASHBOARD ─────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Total Sesi Foto</span>
                <div className="text-2xl sm:text-3xl font-black text-[#120CD6] mt-2">{stats.total}</div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold mt-1">Tersimpan di Cloud</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-emerald-200 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase">Sesi Aktif (&lt; 24 Jam)</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">{stats.activeCount}</div>
                <span className="text-[9px] sm:text-[10px] text-emerald-600/80 font-semibold mt-1">Dapat Diunduh Tamu</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-blue-200 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-[#120CD6] uppercase">Stok Kertas Tersedia</span>
                <div className="text-2xl sm:text-3xl font-black text-[#120CD6] mt-2">
                  {telemetry?.paper?.available ?? 680} <span className="text-xs font-bold text-slate-400">lembar</span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-1">
                  Kapasitas Roll: {telemetry?.paper?.raw_stock ?? 700}
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-[#F908E0]/40 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-[#F908E0] uppercase">Mode Kiosk</span>
                <div className="text-lg sm:text-xl font-black text-[#111111] mt-2 truncate">
                  {telemetry?.is_event_mode ? 'EVENT (FREE)' : 'KOMERSIAL (QRIS)'}
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-1">
                  Kamera: {telemetry?.camera?.detected ? 'Canon EOS' : 'Simulasi'}
                </span>
              </div>
            </div>

            {/* Quick Actions & Domain Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm space-y-4">
                <h3 className="font-black text-sm uppercase text-[#120CD6] tracking-wider">
                  AKSI CEPAT PUSAT KENDALI
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setActiveTab('finance'); loadFinance(); }}
                    className="p-3 bg-slate-50 hover:bg-[#E5FD5F] border border-slate-200 rounded-2xl text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-black uppercase text-[#111111]">Laporan Keuangan</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Omset &amp; ekspor CSV</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('kiosk')}
                    className="p-3 bg-slate-50 hover:bg-[#E5FD5F] border border-slate-200 rounded-2xl text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-black uppercase text-[#111111]">Mode Event &amp; Refill</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Saklar bebas bayar</div>
                  </button>
                  <button
                    onClick={() => { setActiveTab('frames'); loadFrames(); }}
                    className="p-3 bg-slate-50 hover:bg-[#E5FD5F] border border-slate-200 rounded-2xl text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-black uppercase text-[#111111]">Katalog Bingkai</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Aktifkan / matikan</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('queue')}
                    className="p-3 bg-slate-50 hover:bg-[#E5FD5F] border border-slate-200 rounded-2xl text-left transition-all cursor-pointer"
                  >
                    <div className="text-xs font-black uppercase text-[#111111]">Panggil Antrian</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Kontrol tiket masuk</div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm space-y-3">
                <h3 className="font-black text-sm uppercase text-[#120CD6] tracking-wider">
                  INFORMASI DOMAIN PUBLIK SOFTFILE
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  QR Code pada struk cetak foto di Kiosk photobooth secara otomatis mengarahkan pengunjung ke web galeri online ini:
                </p>
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl font-mono text-xs font-bold text-[#120CD6] truncate">
                  https://admin-web-photobooth-ihsan.vercel.app
                </div>
                <div className="flex gap-2 pt-1">
                  <a
                    href="https://admin-web-photobooth-ihsan.vercel.app"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-[#120CD6] text-[#E5FD5F] text-[11px] font-black rounded-xl hover:opacity-90 transition-all uppercase"
                  >
                    Buka Halaman Tamu ↗
                  </a>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: FINANCE (REKAP KEUANGAN & CSV EXPORT) ─────────────── */}
        {activeTab === 'finance' && (
          <div className="space-y-5">
            
            {/* Header & Filter Bar */}
            <div className="bg-[#120CD6] text-white p-6 rounded-3xl shadow-md border-2 border-[#120CD6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="px-3 py-1 bg-[#E5FD5F] text-[#111111] rounded-full text-[10px] font-black uppercase tracking-wider">
                  LAPORAN PEMBUKUAN
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-2 uppercase tracking-tight">
                  Rekap Keuangan &amp; Penjualan
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Ringkasan pendapatan dari QRIS, Tunai, dan penggunaan Voucher photobooth.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCsv}
                  className="px-5 py-2.5 bg-[#E5FD5F] hover:bg-[#d6f046] text-[#111111] rounded-full text-xs font-black uppercase transition cursor-pointer shadow-md flex items-center gap-2"
                >
                  <span>⬇ EKSPOR LAPORAN CSV</span>
                </button>
              </div>
            </div>

            {/* Time Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Semua Waktu' },
                { id: 'today', label: 'Hari Ini (24 Jam)' },
                { id: 'week', label: '7 Hari Terakhir' },
                { id: 'month', label: '30 Hari Terakhir' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => { setFinanceRange(f.id); loadFinance(f.id); }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                    financeRange === f.id ? 'bg-[#120CD6] text-[#E5FD5F] shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Financial Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Pendapatan Kotor (Gross)</span>
                <div className="text-2xl sm:text-3xl font-black text-[#120CD6] mt-2">
                  Rp {(finance?.totalGross || 0).toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  Dari {finance?.totalSessions || 0} total sesi foto
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase">QRIS Midtrans</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
                  Rp {(finance?.breakdown?.qris?.amount || 0).toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  {finance?.breakdown?.qris?.count || 0} transaksi non-tunai
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tunai &amp; Voucher Free Pass</span>
                <div className="text-2xl sm:text-3xl font-black text-[#F908E0] mt-2">
                  Rp {(finance?.breakdown?.cash?.amount || 0).toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  Tunai: {finance?.breakdown?.cash?.count || 0} • Free Pass: {finance?.breakdown?.voucher?.count || 0}
                </span>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-black text-xs uppercase text-[#120CD6]">
                  RINCIAN TRANSAKSI ({finance?.transactions?.length || 0})
                </h3>
              </div>

              <div className="overflow-x-auto max-h-[50vh]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 sticky top-0">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Sesi</th>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Metode</th>
                      <th className="p-3 text-right">Nominal</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!finance?.transactions || finance.transactions.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                          Belum ada transaksi pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      finance.transactions.map((t, idx) => (
                        <tr key={t.orderId || idx} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-800">{t.orderId}</td>
                          <td className="p-3 font-mono text-[#120CD6] font-semibold">{t.sessionId}</td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {new Date(t.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{t.paymentMethod}</td>
                          <td className="p-3 text-right font-black text-slate-900">
                            Rp {t.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 3: SESSIONS (WITH ONE-CLICK ZIP EXPORT) ──────────────── */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID Sesi (contoh: mono_...)"
                className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-[#120CD6] w-full sm:w-80"
              />

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase transition-all cursor-pointer ${
                    statusFilter === 'all' ? 'bg-[#120CD6] text-[#E5FD5F]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({sessions.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase transition-all cursor-pointer ${
                    statusFilter === 'active' ? 'bg-[#120CD6] text-[#E5FD5F]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Aktif ({stats.activeCount})
                </button>
                <button
                  onClick={loadSessions}
                  className="px-3 py-1.5 bg-[#E5FD5F] hover:bg-[#d6f046] text-[#111111] rounded-xl text-[11px] font-black uppercase transition-all cursor-pointer"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
              {filteredSessions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase">
                  Tidak ada sesi foto yang cocok dengan pencarian.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-xs font-black uppercase text-slate-500 tracking-wider">
                        <th className="p-3 sm:p-4">Preview</th>
                        <th className="p-3 sm:p-4">ID Sesi</th>
                        <th className="p-3 sm:p-4">Waktu</th>
                        <th className="p-3 sm:p-4">Status</th>
                        <th className="p-3 sm:p-4 text-right">Aksi Cepat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredSessions.map((session) => {
                        const age = now - (session.createdAt || 0);
                        const isExpired = age > TWENTY_FOUR_HOURS_MS;
                        const thumbUrl = getDisplayCdnUrl(session.cdnCompositeUrl || session.compositeUrl);

                        return (
                          <tr key={session.sessionId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 sm:p-4 w-16">
                              <div
                                onClick={() => setSelectedSession(session)}
                                className="w-12 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#120CD6]"
                              >
                                {thumbUrl ? (
                                  <img src={thumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-bold">FOTO</span>
                                )}
                              </div>
                            </td>

                            <td className="p-3 sm:p-4 font-mono font-bold text-[#120CD6]">
                              <button
                                onClick={() => setSelectedSession(session)}
                                className="hover:underline text-left font-black"
                              >
                                {session.sessionId}
                              </button>
                            </td>

                            <td className="p-3 sm:p-4 text-slate-600 font-medium text-[11px]">
                              {new Date(session.createdAt || now).toLocaleDateString('id-ID', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                            </td>

                            <td className="p-3 sm:p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                isExpired ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isExpired ? 'Expired' : 'Aktif'}
                              </span>
                            </td>

                            <td className="p-3 sm:p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleDownloadZip(session)}
                                  disabled={zipping}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-[#E5FD5F] text-[#111111] text-[10px] font-black rounded-lg transition-all cursor-pointer"
                                  title="Unduh Paket ZIP"
                                >
                                  ZIP
                                </button>
                                <button
                                  onClick={() => openQrModal(session)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-[#E5FD5F] text-[#111111] text-[10px] font-black rounded-lg transition-all cursor-pointer"
                                  title="Tampilkan QR Code"
                                >
                                  QR
                                </button>
                                <button
                                  onClick={() => copySoftfileLink(session.sessionId)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-[#E5FD5F] text-[#111111] text-[10px] font-black rounded-lg transition-all cursor-pointer"
                                  title="Salin Link Softfile"
                                >
                                  Salin
                                </button>
                                <button
                                  onClick={() => handleCloudReprint(session.sessionId)}
                                  className="px-2.5 py-1 bg-[#120CD6] text-[#E5FD5F] hover:bg-blue-800 text-[10px] font-black rounded-lg transition-all cursor-pointer shadow-xs"
                                  title="Kirim ke Printer Kiosk"
                                >
                                  Cetak
                                </button>
                                <button
                                  onClick={() => handleDeleteSession(session.sessionId)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-500 text-[10px] font-black rounded-lg transition-all cursor-pointer"
                                  title="Hapus"
                                >
                                  ×
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── TAB 4: KIOSK & KERTAS (EVENT MODE & MARQUEE) ─────────────── */}
        {activeTab === 'kiosk' && (
          <div className="space-y-5">
            
            {/* Header Banner */}
            <div className="bg-[#120CD6] text-white p-6 rounded-3xl shadow-md border-2 border-[#120CD6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="px-3 py-1 bg-[#E5FD5F] text-[#111111] rounded-full text-[10px] font-black uppercase tracking-wider">
                  TELEMETRI MESIN &amp; SAKLAR EVENT
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-2 uppercase tracking-tight">
                  Status Kiosk &amp; Monitor Kertas
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Sinkronisasi langsung antara mesin Kiosk photobooth fisik dengan Cloud Admin.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleEventMode}
                  disabled={actionLoading}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase transition cursor-pointer shadow-md ${
                    telemetry?.is_event_mode
                      ? 'bg-[#F908E0] text-white hover:bg-pink-600'
                      : 'bg-[#E5FD5F] text-[#111111] hover:bg-[#d6f046]'
                  }`}
                >
                  {telemetry?.is_event_mode ? '★ MODE EVENT AKTIF (BEBAS BAYAR)' : 'MODE KOMERSIAL (BAYAR QRIS)'}
                </button>
              </div>
            </div>

            {/* Paper Stock Formula Emas Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-xs font-black uppercase text-[#120CD6]">
                  FORMULA KUOTA KERTAS (GOLDEN PAPER RATIO)
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  (telemetry?.paper?.available ?? 680) < 10
                    ? 'bg-rose-100 text-rose-700 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {(telemetry?.paper?.available ?? 680) < 10 ? 'Peringatan: Kertas Menipis' : 'Stok Kertas Aman'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">1. Stok Fisik di Roll</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">
                    {telemetry?.paper?.raw_stock ?? 700} <span className="text-xs font-normal">lembar</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Total isi gulungan kertas</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">2. Sedang Dipesan Sesi</div>
                  <div className="text-2xl font-black text-amber-600 mt-1">
                    {telemetry?.paper?.booked_stock ?? 0} <span className="text-xs font-normal">lembar</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Terkunci saat sesi aktif</div>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border-2 border-[#120CD6]">
                  <div className="text-[10px] font-black text-[#120CD6] uppercase">3. Kuota Siap Cetak</div>
                  <div className="text-2xl font-black text-[#120CD6] mt-1">
                    {telemetry?.paper?.available ?? 680} <span className="text-xs font-normal">lembar</span>
                  </div>
                  <div className="text-[10px] text-[#120CD6]/80 mt-1 font-bold">Stok efektif tanpa risiko macet</div>
                </div>
              </div>

              {/* Remote Refill Tool */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-700">Isi Ulang Kertas Jarak Jauh:</h4>
                  <p className="text-[11px] text-slate-500">Klik tombol untuk menambah kuota roll baru dari smartphone:</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePaperRefill(100)}
                    disabled={actionLoading}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-[#E5FD5F] rounded-xl text-xs font-black transition cursor-pointer border border-slate-300"
                  >
                    +100
                  </button>
                  <button
                    onClick={() => handlePaperRefill(300)}
                    disabled={actionLoading}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-[#E5FD5F] rounded-xl text-xs font-black transition cursor-pointer border border-slate-300"
                  >
                    +300
                  </button>
                  <button
                    onClick={() => handlePaperRefill(700)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-[#120CD6] text-[#E5FD5F] hover:bg-blue-800 rounded-xl text-xs font-black transition cursor-pointer shadow-xs uppercase"
                  >
                    +700 (1 Roll Baru)
                  </button>
                </div>
              </div>
            </div>

            {/* Live Kiosk Announcement Banner Editor */}
            <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-xs font-black uppercase text-[#120CD6]">
                  PENGUMUMAN RUNNING TEXT DI LAYAR KIOSK (LIVE MARQUEE)
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  announcementActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {announcementActive ? 'Tayang di Kiosk' : 'Mati'}
                </span>
              </div>

              <form onSubmit={handleSaveAnnouncement} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Teks Pengumuman (Contoh: "Selamat Menempuh Hidup Baru Sarah &amp; Rian!" atau "Promo Diskon 50%!"):
                  </label>
                  <input
                    type="text"
                    value={announcementInput}
                    onChange={(e) => setAnnouncementInput(e.target.value)}
                    placeholder="Ketik teks pesan pengumuman..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold focus:outline-none focus:border-[#120CD6]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={announcementActive}
                      onChange={(e) => setAnnouncementActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#120CD6]"
                    />
                    <span>Aktifkan tampilan banner di layar booth</span>
                  </label>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-[#120CD6] text-[#E5FD5F] font-black text-xs rounded-xl uppercase hover:bg-blue-800 transition cursor-pointer shadow-xs"
                  >
                    Simpan &amp; Tayangkan
                  </button>
                </div>
              </form>
            </div>

            {/* Hardware Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-black uppercase text-[#120CD6]">Kamera Canon EOS (EDSDK)</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                    Aktif
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Model:</span>
                    <span className="font-bold">{telemetry?.camera?.model || 'Canon EOS DSLR (EDSDK)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Level Baterai:</span>
                    <span className="font-bold text-emerald-600">{telemetry?.camera?.battery_pct ?? 95}% (Normal)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Exposure Mode:</span>
                    <span className="font-bold">Auto Strobe Switching</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-black uppercase text-[#120CD6]">Konektivitas Mesin Kiosk</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                    Online
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID Mesin / License:</span>
                    <span className="font-mono font-bold text-[#120CD6]">TARASABOOTH-001</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ping Terakhir:</span>
                    <span className="font-bold">Baru saja (Real-Time)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 5: FRAMES (KATALOG BINGKAI ONLINE) ───────────────────── */}
        {activeTab === 'frames' && (
          <div className="space-y-5">
            
            {/* Header Banner */}
            <div className="bg-[#120CD6] text-white p-6 rounded-3xl shadow-md border-2 border-[#120CD6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="px-3 py-1 bg-[#E5FD5F] text-[#111111] rounded-full text-[10px] font-black uppercase tracking-wider">
                  KATALOG TEMPLATE
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-2 uppercase tracking-tight">
                  Manajemen Bingkai Foto Online
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Aktifkan atau matikan template bingkai yang tampil di layar bilik foto langsung dari HP Anda.
                </p>
              </div>

              <button
                onClick={loadFrames}
                className="px-4 py-2 bg-[#E5FD5F] text-[#111111] rounded-full text-xs font-black uppercase hover:opacity-95 transition cursor-pointer shrink-0"
              >
                Refresh Katalog
              </button>
            </div>

            {/* Frames Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {frames.map((frame) => (
                <div
                  key={frame.id}
                  className={`bg-white rounded-3xl border-2 p-4 shadow-sm flex flex-col justify-between transition-all ${
                    frame.active ? 'border-slate-200' : 'border-slate-300 opacity-60 bg-slate-50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="aspect-[2/3] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center p-2 relative">
                      {frame.previewUrl ? (
                        <img src={frame.previewUrl} alt={frame.name} className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center">
                          <span className="text-xs font-black text-[#120CD6] uppercase">{frame.id}</span>
                          <span className="text-[10px] text-slate-400 block mt-1">{frame.width}×{frame.height}px</span>
                        </div>
                      )}

                      <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase shadow-xs ${
                        frame.active ? 'bg-[#E5FD5F] text-[#111111]' : 'bg-slate-300 text-slate-700'
                      }`}>
                        {frame.active ? 'Aktif di Kiosk' : 'Disembunyikan'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-[#F908E0] uppercase tracking-wider">{frame.category || 'Umum'}</span>
                      <h4 className="font-black text-sm text-slate-900 truncate">{frame.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{frame.photoCount} Pose • {frame.description || 'Template resmi TarasaBooth'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFrame(frame.id)}
                    disabled={actionLoading}
                    className={`mt-4 w-full py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                      frame.active
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                        : 'bg-[#120CD6] text-[#E5FD5F] hover:bg-blue-800'
                    }`}
                  >
                    {frame.active ? 'Sembunyikan dari Kiosk' : 'Aktifkan di Kiosk'}
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ── TAB 6: QUEUE (KONTROL ANTRIAN PELANGGAN) ─────────────────── */}
        {activeTab === 'queue' && (
          <div className="space-y-5">
            
            {/* Header Banner */}
            <div className="bg-[#120CD6] text-white p-6 rounded-3xl shadow-md border-2 border-[#120CD6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="px-3 py-1 bg-[#E5FD5F] text-[#111111] rounded-full text-[10px] font-black uppercase tracking-wider">
                  KONTROL BILIK FOTO
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-2 uppercase tracking-tight">
                  Manajemen Antrian Pengunjung
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Atur alur pengunjung masuk ke dalam booth studio secara tertib langsung dari HP Anda.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePromoteQueue}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-[#E5FD5F] hover:bg-[#d6f046] text-[#111111] rounded-full text-xs font-black uppercase transition cursor-pointer shadow-md"
                >
                  Panggil Antrian Berikutnya →
                </button>
              </div>
            </div>

            {/* Current Active Ticket in Booth */}
            <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-xs font-black uppercase text-[#120CD6]">
                  TIKET AKTIF DI BILIK FOTO SAAT INI
                </span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase">
                  Status: {queue?.current_queue_status || 'Ready'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#120CD6] text-[#E5FD5F] rounded-2xl flex items-center justify-center font-black text-2xl shadow-md">
                    {queue?.current_queue_number || 'A-01'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{queue?.current_queue_name || 'Pengunjung Studio'}</h3>
                    <p className="text-xs font-mono text-slate-500 font-bold">Kode Tiket: {queue?.current_queue_code || 'Q-1001'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReleaseQueue}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-black uppercase transition cursor-pointer border border-rose-200"
                  >
                    Lewati / Expire Tiket
                  </button>
                </div>
              </div>
            </div>

            {/* Waiting List */}
            <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-[#120CD6] tracking-wider">
                DAFTAR TUNGGU ANTRIAN ({queue?.waiting_list?.length || 0} ORANG)
              </h3>

              {(!queue?.waiting_list || queue.waiting_list.length === 0) ? (
                <div className="p-8 text-center text-slate-400 font-bold text-xs uppercase">
                  Tidak ada antrian yang sedang menunggu. Bilik foto siap untuk sesi baru.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {queue.waiting_list.map((item, idx) => (
                    <div key={item.code || idx} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-black text-xs text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">No. {item.number} • Kode {item.code}</div>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-500 font-medium">{item.waiting_since || 'Menunggu'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── TAB 7: VOUCHERS ──────────────────────────────────────────── */}
        {activeTab === 'vouchers' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-5 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-[#120CD6] tracking-wider">
                TAMBAH VOUCHER BARU
              </h3>

              {voucherMsg && (
                <div className={`p-3 rounded-2xl text-xs font-bold ${
                  voucherMsg.type === 'error' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {voucherMsg.text}
                </div>
              )}

              <form onSubmit={handleSaveVoucher} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Kode Voucher</label>
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Contoh: TARASA100"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#120CD6] uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Tipe Diskon</label>
                    <select
                      value={voucherType}
                      onChange={(e) => setVoucherType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="free">100% Free Pass</option>
                      <option value="percent">Persentase (%)</option>
                      <option value="nominal">Nominal (Rp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Nilai</label>
                    <input
                      type="number"
                      value={voucherValue}
                      onChange={(e) => setVoucherValue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Batas Pemakaian (Kuota)</label>
                  <input
                    type="number"
                    value={voucherMaxUses}
                    onChange={(e) => setVoucherMaxUses(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Deskripsi Singkat</label>
                  <input
                    type="text"
                    value={voucherDesc}
                    onChange={(e) => setVoucherDesc(e.target.value)}
                    placeholder="Voucher Spesial Tamu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#E5FD5F] hover:bg-[#d6f046] active:bg-[#F908E0] active:text-white text-[#111111] font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-sm border border-[#120CD6]"
                >
                  SIMPAN VOUCHER KE CLOUD
                </button>
              </form>
            </div>

            <div className="md:col-span-7 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-[#120CD6] tracking-wider">
                DAFTAR VOUCHER AKTIF ({vouchers.length})
              </h3>

              <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                {vouchers.map((v) => (
                  <div key={v.code} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[#120CD6]">{v.code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          v.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {v.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {v.type === 'free' ? 'Bebas Bayar (100%)' : `${v.value}${v.type === 'percent' ? '%' : ' Rp'}`} • Dipakai: {v.usedCount || 0} / {v.maxUses}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleVoucher(v)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-[#E5FD5F] text-slate-800 text-[10px] font-black rounded-lg transition cursor-pointer"
                      >
                        {v.active ? 'Matikan' : 'Nyalakan'}
                      </button>
                      <button
                        onClick={() => handleDeleteVoucher(v.code)}
                        className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-[10px] font-black rounded-lg transition cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 8: CLEANUP ───────────────────────────────────────────── */}
        {activeTab === 'cleanup' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-4 max-w-2xl mx-auto">
            <h3 className="text-base font-black uppercase text-[#120CD6]">
              PEMBERSIHAN OTOMATIS SUPABASE STORAGE (24 JAM)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sesuai kebijakan privasi, file foto raw dan composite di Supabase Storage otomatis kadaluarsa setelah 24 jam. Anda dapat memicu pembersihan manual kapan saja dengan tombol di bawah.
            </p>

            <button
              onClick={handleRunCleanup}
              disabled={cleanupRunning}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {cleanupRunning ? 'SEDANG MEMBERSIHKAN FILE...' : 'JALANKAN CLEANUP SEKARANG (HAPUS SESI > 24 JAM)'}
            </button>

            {cleanupResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono space-y-1">
                <div className="font-bold text-slate-800">Hasil Pembersihan:</div>
                <div>Status: {cleanupResult.success ? 'Sukses' : 'Gagal'}</div>
                <div>Sesi Terhapus: {cleanupResult.deletedSessionsCount || 0}</div>
                <div>File Terhapus: {cleanupResult.deletedFilesCount || 0}</div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── MODAL: QR CODE POPUP ──────────────────────────────────────── */}
      {qrModalSession && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white text-[#111111] rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border-4 border-[#120CD6] flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95">
            <span className="px-3 py-1 bg-[#E5FD5F] text-[#111111] text-[10px] font-black rounded-full uppercase">
              QR CODE SOFTFILE
            </span>
            <h3 className="font-black text-sm uppercase text-[#120CD6]">
              {qrModalSession.sessionId}
            </h3>

            <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-inner">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Softfile" className="w-56 h-56 object-contain" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs font-bold text-slate-400">
                  Membuat QR...
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              Arahkan kamera smartphone pengunjung ke layar ini untuk langsung membuka galeri digital.
            </p>

            <div className="flex gap-2 w-full pt-2">
              <button
                onClick={() => copySoftfileLink(qrModalSession.sessionId)}
                className="flex-1 py-2.5 bg-[#E5FD5F] text-[#111111] text-xs font-black rounded-xl uppercase hover:opacity-90 transition cursor-pointer"
              >
                Salin Link
              </button>
              <button
                onClick={() => setQrModalSession(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl uppercase transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DETAIL SESI (WITH ZIP EXPORT) ───────────────────────── */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white text-[#111111] rounded-3xl p-6 max-w-lg w-full shadow-2xl border-2 border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#120CD6]">Detail Sesi Foto</span>
                <h3 className="font-mono font-black text-sm">{selectedSession.sessionId}</h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Media Image */}
            <div className="relative bg-slate-100 rounded-2xl overflow-hidden aspect-[2/3] max-h-80 mx-auto flex items-center justify-center border border-slate-300">
              {getDisplayCdnUrl(selectedSession.cdnCompositeUrl || selectedSession.compositeUrl) ? (
                <img
                  src={getDisplayCdnUrl(selectedSession.cdnCompositeUrl || selectedSession.compositeUrl)}
                  alt="Composite"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400 font-bold">Tidak ada preview</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleDownloadZip(selectedSession)}
                disabled={zipping}
                className="py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase transition cursor-pointer"
              >
                {zipping ? 'Menyiapkan...' : '⬇ Unduh ZIP'}
              </button>
              <button
                onClick={() => {
                  handleCloudReprint(selectedSession.sessionId);
                  setSelectedSession(null);
                }}
                className="py-3 bg-[#120CD6] text-[#E5FD5F] rounded-xl text-xs font-black uppercase hover:bg-blue-800 transition cursor-pointer"
              >
                Cetak Ulang
              </button>
              <button
                onClick={() => {
                  openQrModal(selectedSession);
                  setSelectedSession(null);
                }}
                className="py-3 bg-[#E5FD5F] text-[#111111] rounded-xl text-xs font-black uppercase hover:opacity-90 transition cursor-pointer"
              >
                Lihat QR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
