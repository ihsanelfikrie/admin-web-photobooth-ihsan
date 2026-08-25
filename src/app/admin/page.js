'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

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

  // Tabs
  const [activeTab, setActiveTab]             = useState('dashboard'); // 'dashboard' | 'sessions' | 'vouchers' | 'cleanup' | 'settings'

  // Data States
  const [loading, setLoading]                 = useState(false);
  const [sessions, setSessions]               = useState([]);
  const [vouchers, setVouchers]               = useState([]);
  const [searchQuery, setSearchQuery]         = useState('');
  const [statusFilter, setStatusFilter]       = useState('all'); // 'all' | 'active' | 'expired'

  // Selected session for preview modal
  const [selectedSession, setSelectedSession] = useState(null);

  // Voucher Form State
  const [voucherCode, setVoucherCode]         = useState('');
  const [voucherType, setVoucherType]         = useState('free'); // 'free' | 'percent' | 'nominal'
  const [voucherValue, setVoucherValue]       = useState('100');
  const [voucherMaxUses, setVoucherMaxUses]   = useState('100');
  const [voucherDesc, setVoucherDesc]         = useState('');
  const [voucherMsg, setVoucherMsg]           = useState(null);

  // Cleanup action state
  const [cleanupRunning, setCleanupRunning]   = useState(false);
  const [cleanupResult, setCleanupResult]     = useState(null);

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
      if (json.success) {
        setSessions(json.sessions || []);
      }
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
      if (json.success) {
        setVouchers(json.vouchers || []);
      }
    } catch (err) {
      console.error('Failed to load vouchers:', err);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm(`Hapus seluruh aset softfile untuk sesi ${sessionId} dari Supabase?`)) return;

    try {
      setLoading(true);
      const res  = await fetch(`/api/sessions?sessionId=${sessionId}&pin=${currentPin}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        alert(`Sesi ${sessionId} berhasil dihapus dari Cloud!`);
        setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        if (selectedSession?.sessionId === sessionId) setSelectedSession(null);
      } else {
        alert('Gagal menghapus: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus sesi.');
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
            description: voucherDesc || 'Voucher Spesial KomvigI BOOTH',
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setVouchers(json.vouchers || []);
        setVoucherCode('');
        setVoucherDesc('');
        setVoucherMsg({ type: 'success', text: `Voucher ${voucherCode.toUpperCase()} berhasil disimpan ke Cloud!` });
        setTimeout(() => setVoucherMsg(null), 4000);
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
      const res = await fetch(`/api/vouchers?code=${code}&pin=${currentPin}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setVouchers(json.vouchers || []);
      }
    } catch (err) {
      alert('Gagal menghapus voucher.');
    }
  };

  const handleToggleVoucher = async (voucher) => {
    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: currentPin,
          voucher: {
            ...voucher,
            active: !voucher.active,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setVouchers(json.vouchers || []);
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
      const res  = await fetch(`/api/cron/cleanup?pin=${currentPin}`, {
        method: 'POST',
      });
      const json = await res.json();
      setCleanupResult(json);
      loadSessions();
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
      if (age <= TWENTY_FOUR_HOURS_MS) {
        activeCount++;
      } else {
        expiredCount++;
      }
    });

    return { total, activeCount, expiredCount };
  }, [sessions, now]);

  // Filtered sessions
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
            ✳ PANEL ADMIN CLOUD
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-[#120CD6] uppercase tracking-tight">
              KomvigI BOOTH
            </h1>
            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
              Kementerian Komunikasi Visual Digital
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
      
      {/* Top Header Navigation */}
      <header className="bg-[#120CD6] text-white px-4 sm:px-6 py-3.5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-[#E5FD5F] text-[#111111] text-[11px] font-black uppercase tracking-wider shadow-xs">
              ✳ KOMVIGI CLOUD
            </span>
            <span className="h-4 w-px bg-white/30" />
            <div>
              <h1 className="text-xs sm:text-sm md:text-base font-black text-white uppercase tracking-tight">
                PANEL ADMIN
              </h1>
              <p className="text-[9px] sm:text-[10px] text-white/80 font-semibold truncate max-w-[200px] sm:max-w-none">
                DEMA UIN Antasari 2026-2027
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

        {/* Navigation Tabs (Smooth Horizontal Swipe on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-full border border-white/20 text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 text-xs ${
                activeTab === 'dashboard' ? 'bg-[#E5FD5F] text-[#111111] shadow-xs font-black' : 'text-white hover:bg-white/10'
              }`}
            >
              Ringkasan
            </button>
            <button
              onClick={() => { setActiveTab('sessions'); loadSessions(); }}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 text-xs ${
                activeTab === 'sessions' ? 'bg-[#E5FD5F] text-[#111111] shadow-xs font-black' : 'text-white hover:bg-white/10'
              }`}
            >
              Sesi Foto ({sessions.length})
            </button>
            <button
              onClick={() => { setActiveTab('vouchers'); loadVouchers(); }}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 text-xs ${
                activeTab === 'vouchers' ? 'bg-[#E5FD5F] text-[#111111] shadow-xs font-black' : 'text-white hover:bg-white/10'
              }`}
            >
              Voucher ({vouchers.length})
            </button>
            <button
              onClick={() => setActiveTab('cleanup')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 text-xs ${
                activeTab === 'cleanup' ? 'bg-[#E5FD5F] text-[#111111] shadow-xs font-black' : 'text-white hover:bg-white/10'
              }`}
            >
              Auto-Cleanup
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
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col gap-0.5 sm:gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Total Sesi Foto</span>
                <span className="text-2xl sm:text-3xl font-black text-[#120CD6] font-mono">{stats.total}</span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">Di Cloud Supabase</span>
              </div>

              <div className="bg-white border-2 border-emerald-300 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col gap-0.5 sm:gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase">Sesi Aktif</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{stats.activeCount}</span>
                <span className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold truncate">&lt; 24 Jam</span>
              </div>

              <div className="bg-white border-2 border-amber-300 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col gap-0.5 sm:gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase">Sesi Kadaluarsa</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">{stats.expiredCount}</span>
                <span className="text-[10px] sm:text-[11px] text-amber-700 font-semibold truncate">&gt; 24 Jam</span>
              </div>

              <div className="bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col gap-0.5 sm:gap-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Voucher Cloud</span>
                <span className="text-2xl sm:text-3xl font-black text-[#120CD6] font-mono">{vouchers.length}</span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate">Voucher aktif</span>
              </div>
            </div>

            {/* Quick Actions & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Storage Garbage Collector Widget */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-[11px] font-black uppercase">
                    <span>⏱️ Auto-Cleanup 24 Jam</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black uppercase text-[#120CD6]">
                    Pembersihan Kuota Supabase Cloud
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Sistem otomatis menghapus file foto 4R dan video MP4 dari Supabase Storage setelah melewati 24 jam agar kuota storage Anda tetap hemat dan aman.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleRunCleanup}
                    disabled={cleanupRunning}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#120CD6] hover:bg-blue-800 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {cleanupRunning ? 'Memproses...' : '🧹 Bersihkan File > 24 Jam Sekarang'}
                  </button>
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#120CD6] border border-blue-200 rounded-full text-[11px] font-black uppercase">
                    <span>🌐 Informasi Domain Publik</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black uppercase text-[#120CD6]">
                    QR Code Softfile Pengunjung
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    QR Code yang dihasilkan oleh Photobooth Laptop Kiosk mengarahkan pengunjung ke web galeri online ini untuk mengunduh softfile 4R &amp; Video MP4.
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 block truncate">
                    https://admin-web-photobooth-ihsan.vercel.app
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── TAB 2: SESSIONS ──────────────────────────────────────────── */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            
            {/* Filter Bar */}
            <div className="bg-white border-2 border-slate-200 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 shadow-xs">
              <input
                type="text"
                placeholder="Cari Session ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="p-2.5 px-4 rounded-xl border-2 border-slate-200 text-xs font-bold text-[#111111] focus:outline-none focus:border-[#120CD6] w-full sm:w-72"
              />

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 sm:flex-none p-2.5 px-3 rounded-xl border-2 border-slate-200 text-xs font-bold text-[#111111] focus:outline-none focus:border-[#120CD6]"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Hanya Aktif (&lt; 24 Jam)</option>
                  <option value="expired">Hanya Kadaluarsa (&gt; 24 Jam)</option>
                </select>

                <button
                  onClick={loadSessions}
                  disabled={loading}
                  className="px-4 py-2.5 bg-[#120CD6] text-white rounded-xl text-xs font-black uppercase cursor-pointer hover:bg-blue-800 shrink-0"
                >
                  {loading ? '...' : '🔄 Refresh'}
                </button>
              </div>
            </div>

            {/* ── MOBILE VIEW: Touch-Optimized Cards (md:hidden) ── */}
            <div className="block md:hidden space-y-3">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((s, sIdx) => {
                  const age = now - (s.createdAt || 0);
                  const isExpired = age > TWENTY_FOUR_HOURS_MS;
                  const photoUrl = getDisplayCdnUrl(s.cdnCompositeUrl || s.compositeUrl);

                  return (
                    <div
                      key={s.sessionId ? `${s.sessionId}_${sIdx}` : `sess_${sIdx}`}
                      className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col gap-3"
                    >
                      <div className="flex gap-3 items-center">
                        {/* Left Thumbnail */}
                        {photoUrl ? (
                          <div
                            onClick={() => setSelectedSession(s)}
                            className="w-16 h-24 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0 cursor-pointer hover:border-[#120CD6] transition-all flex items-center justify-center p-0.5 shadow-xs"
                          >
                            <img src={photoUrl} alt="Frame" className="w-full h-full object-contain rounded-lg" />
                          </div>
                        ) : (
                          <div className="w-16 h-24 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-[9px] font-bold text-slate-400">
                            NO IMG
                          </div>
                        )}

                        {/* Right Meta Info */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                isExpired ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                              }`}>
                                {isExpired ? 'Kadaluarsa' : 'Aktif'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {s.createdAt ? new Date(s.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                            </div>
                            <h3 className="font-mono font-black text-xs text-[#120CD6] truncate">
                              {s.sessionId}
                            </h3>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {s.createdAt ? new Date(s.createdAt).toLocaleDateString('id-ID') : '-'}
                            </p>
                          </div>

                          {/* Detail & Delete Buttons */}
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              onClick={() => setSelectedSession(s)}
                              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer text-center"
                            >
                              🔍 Detail
                            </button>
                            <button
                              onClick={() => handleDeleteSession(s.sessionId)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold border border-rose-200 transition-all cursor-pointer"
                              title="Hapus"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Full-width Big Softfile Button */}
                      <a
                        href={`/softfile/${s.sessionId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 bg-[#E5FD5F] hover:bg-[#d6f046] active:bg-[#F908E0] active:text-white text-[#111111] font-black text-xs rounded-xl uppercase tracking-wider text-center transition-all shadow-xs border border-[#120CD6] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>📱 BUKA GALERI SOFTFILE</span>
                        <span>↗</span>
                      </a>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 text-center text-slate-400 font-bold text-xs">
                  Tidak ada sesi foto yang ditemukan.
                </div>
              )}
            </div>

            {/* ── DESKTOP VIEW: Data Table (hidden md:block) ── */}
            <div className="hidden md:block bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-black">
                    <tr>
                      <th className="p-3.5 w-20">Preview Frame</th>
                      <th className="p-3.5">Session ID</th>
                      <th className="p-3.5">Waktu Sesi</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Softfile Pengunjung</th>
                      <th className="p-3.5">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredSessions.length > 0 ? (
                      filteredSessions.map((s, sIdx) => {
                        const age = now - (s.createdAt || 0);
                        const isExpired = age > TWENTY_FOUR_HOURS_MS;
                        const photoUrl = getDisplayCdnUrl(s.cdnCompositeUrl || s.compositeUrl);

                        return (
                          <tr key={s.sessionId ? `${s.sessionId}_${sIdx}` : `sess_${sIdx}`} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3.5">
                              {photoUrl ? (
                                <div
                                  onClick={() => setSelectedSession(s)}
                                  className="w-14 h-20 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-xs cursor-pointer hover:scale-105 hover:border-[#120CD6] transition-all flex items-center justify-center p-0.5"
                                  title="Klik untuk perbesar"
                                >
                                  <img
                                    src={photoUrl}
                                    alt={`Preview ${s.sessionId}`}
                                    className="w-full h-full object-contain rounded-lg"
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-400 text-center p-1">
                                  NO PHOTO
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 font-mono font-bold text-[#120CD6]">
                              {s.sessionId}
                            </td>
                            <td className="p-3.5 text-slate-600">
                              {s.createdAt ? new Date(s.createdAt).toLocaleString('id-ID') : '-'}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isExpired ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                              }`}>
                                {isExpired ? 'Kadaluarsa' : 'Aktif'}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <a
                                href={`/softfile/${s.sessionId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-[#120CD6] hover:bg-[#120CD6] hover:text-white rounded-xl font-black text-xs transition-all border border-blue-200 shadow-xs"
                              >
                                <span>📱 Buka Softfile</span>
                                <span>↗</span>
                              </a>
                            </td>
                            <td className="p-3.5 flex items-center gap-2 pt-6">
                              <button
                                onClick={() => setSelectedSession(s)}
                                className="px-3.5 py-2 bg-[#120CD6] text-white rounded-xl text-xs font-black uppercase hover:bg-blue-800 transition-all cursor-pointer shadow-xs"
                              >
                                Detail
                              </button>
                              <button
                                onClick={() => handleDeleteSession(s.sessionId)}
                                className="px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-black uppercase hover:bg-rose-100 transition-all cursor-pointer"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                          Tidak ada sesi foto yang sesuai kriteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 3: VOUCHERS ──────────────────────────────────────────── */}
        {activeTab === 'vouchers' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Form Create Voucher */}
            <form onSubmit={handleSaveVoucher} className="bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-xs space-y-4 md:col-span-1">
              <div className="text-xs font-black text-[#120CD6] uppercase border-b border-slate-200 pb-2">
                ➕ Buat Voucher Promo Cloud Baru
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Kode Voucher</label>
                <input
                  type="text"
                  placeholder="Contoh: KOMVIGI2026"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 text-xs font-bold uppercase focus:border-[#120CD6] focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Tipe Diskon</label>
                <select
                  value={voucherType}
                  onChange={(e) => setVoucherType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 text-xs font-bold focus:border-[#120CD6] focus:outline-none"
                >
                  <option value="free">100% Gratis (Free Pass)</option>
                  <option value="percent">Persentase (%)</option>
                  <option value="nominal">Nominal Rupiah (Rp)</option>
                </select>
              </div>

              {voucherType !== 'free' && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Nilai Diskon</label>
                  <input
                    type="number"
                    value={voucherValue}
                    onChange={(e) => setVoucherValue(e.target.value)}
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 text-xs font-bold focus:border-[#120CD6] focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Keterangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Promo JobFair Mahasiswa"
                  value={voucherDesc}
                  onChange={(e) => setVoucherDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 text-xs font-medium focus:border-[#120CD6] focus:outline-none"
                />
              </div>

              {voucherMsg && (
                <div className={`p-2.5 rounded-xl text-xs font-bold text-center ${
                  voucherMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                }`}>
                  {voucherMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#120CD6] hover:bg-blue-800 text-white font-black text-xs uppercase rounded-xl transition-all shadow-md"
              >
                SIMPAN VOUCHER KE CLOUD
              </button>
            </form>

            {/* Voucher List */}
            <div className="md:col-span-2 bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="text-xs font-black text-[#120CD6] uppercase border-b border-slate-200 pb-2">
                🎟️ Daftar Voucher Aktif ({vouchers.length})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vouchers.map((v) => (
                  <div
                    key={v.code}
                    className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-black text-base text-[#120CD6]">{v.code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          v.active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {v.active ? 'Aktif' : 'Mati'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1">
                        {v.type === 'free' ? '100% Gratis' : v.type === 'percent' ? `${v.value}% Diskon` : `Rp ${Number(v.value).toLocaleString('id-ID')}`}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{v.description}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => handleToggleVoucher(v)}
                        className="flex-1 py-1.5 bg-white border border-slate-300 text-[11px] font-bold rounded-lg hover:bg-slate-100"
                      >
                        {v.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => handleDeleteVoucher(v.code)}
                        className="py-1.5 px-3 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold rounded-lg hover:bg-rose-100"
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

        {/* ── TAB 4: CLEANUP ───────────────────────────────────────────── */}
        {activeTab === 'cleanup' && (
          <div className="max-w-2xl mx-auto bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
            <div className="space-y-1">
              <span className="px-3.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-black uppercase">
                ⚙️ Supabase Storage Lifecycle
              </span>
              <h2 className="text-2xl font-black text-[#120CD6] uppercase tracking-tight">
                Pembersihan Otomatis Cloud 24 Jam
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Untuk menjaga kuota gratis Supabase tetap hemat dan mematuhi privasi pengunjung, seluruh file softfile yang berusia lebih dari 24 jam dapat dibersihkan secara otomatis.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-600">Total Sesi Terdeteksi:</span>
                <span className="text-[#120CD6] font-mono font-black">{stats.total} Sesi</span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-amber-700">Sesi Kadaluarsa (&gt; 24 Jam):</span>
                <span className="text-amber-700 font-mono font-black">{stats.expiredCount} Sesi</span>
              </div>
            </div>

            <button
              onClick={handleRunCleanup}
              disabled={cleanupRunning}
              className="w-full py-4 bg-[#E5FD5F] hover:bg-[#d6f046] active:bg-[#F908E0] active:text-white text-[#111111] font-black text-sm uppercase rounded-full transition-all shadow-md cursor-pointer disabled:opacity-50 border-2 border-[#120CD6]"
            >
              {cleanupRunning ? 'Memproses Pembersihan...' : '🧹 JALANKAN PEMBERSIHAN CLOUD SEKARANG'}
            </button>

            {cleanupResult && (
              <div className={`p-4 rounded-2xl text-xs font-bold ${
                cleanupResult.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                {cleanupResult.success
                  ? `✓ Pembersihan berhasil! ${cleanupResult.cleanedSessions || 0} sesi lama berhasil dihapus dari Supabase Storage.`
                  : `Gagal: ${cleanupResult.error || 'Terjadi kesalahan'}`}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Session Preview Modal */}
      {selectedSession && (() => {
        const photoUrl = getDisplayCdnUrl(selectedSession.cdnCompositeUrl || selectedSession.compositeUrl);
        const videoUrl = getDisplayCdnUrl(selectedSession.cdnVideoUrl || selectedSession.videoUrl);
        const gifUrl   = getDisplayCdnUrl(selectedSession.cdnGifUrl || selectedSession.gifUrl);

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border-4 border-white shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <span className="font-mono font-black text-xs text-[#120CD6] block">{selectedSession.sessionId}</span>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {selectedSession.createdAt ? new Date(selectedSession.createdAt).toLocaleString('id-ID') : '-'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* 4R Photo Preview */}
              {photoUrl && (
                <div className="w-full aspect-[2/3] max-h-[50vh] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center p-1">
                  <img src={photoUrl} alt="Foto Sesi 4R" className="w-full h-full object-contain rounded-xl" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`/softfile/${selectedSession.sessionId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-3 bg-[#E5FD5F] hover:bg-[#d6f046] active:bg-[#F908E0] active:text-white text-[#111111] font-black text-xs rounded-xl uppercase text-center transition-all shadow-sm border border-[#120CD6]"
                  >
                    📱 Galeri Softfile ↗
                  </a>
                  {photoUrl && (
                    <a
                      href={photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-3 bg-[#120CD6] hover:bg-blue-800 text-white font-black text-xs rounded-xl uppercase text-center transition-all shadow-sm"
                    >
                      🖼️ Buka Foto HD ↗
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteSession(selectedSession.sessionId)}
                  className="w-full py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
                >
                  🗑️ Hapus Sesi Dari Cloud
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
