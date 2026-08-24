'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function OnlineAdminPage() {
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'sessions' | 'vouchers' | 'cleanup' | 'settings'

  // Data States
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'expired'

  // Selected session for preview modal
  const [selectedSession, setSelectedSession] = useState(null);

  // Voucher Form State
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherType, setVoucherType] = useState('free'); // 'free' | 'percent' | 'nominal'
  const [voucherValue, setVoucherValue] = useState('100');
  const [voucherMaxUses, setVoucherMaxUses] = useState('100');
  const [voucherDesc, setVoucherDesc] = useState('');
  const [voucherMsg, setVoucherMsg] = useState(null);

  // Cleanup action state
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);

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
      const res = await fetch(`/api/sessions?pin=${pin}`);
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
      const res = await fetch(`/api/sessions?pin=${currentPin}`);
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
      const res = await fetch(`/api/vouchers?pin=${pin}`);
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
      const res = await fetch(`/api/sessions?sessionId=${sessionId}&pin=${currentPin}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        alert(`Sesi ${sessionId} dan file-file di Supabase berhasil dihapus!`);
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
            description: voucherDesc || 'Voucher Spesial Photobooth',
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
      const res = await fetch(`/api/cron/cleanup?pin=${currentPin}`, {
        method: 'POST',
      });
      const json = await res.json();
      setCleanupResult(json);
      // Reload sessions
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
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 select-none font-sans">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md p-8 bg-black/90 border-2 border-slate-700 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6"
        >
          <div className="px-4 py-1.5 bg-slate-800 rounded-full border border-slate-600 text-xs font-black uppercase tracking-widest text-emerald-400">
            ONLINE ADMIN ACCESS
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
              PANEL ADMIN CLOUD
            </h1>
            <p className="text-xs text-slate-400">
              Photobooth JobFair UPKK UIN Antasari 2026
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
              className="w-full text-center tracking-widest text-2xl font-mono py-4 bg-slate-800/80 border-2 border-slate-600 rounded-2xl text-white focus:outline-none focus:border-white transition-colors"
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-rose-400 font-bold text-center">PIN Salah! Silakan coba lagi.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white hover:bg-slate-200 text-black font-black rounded-full uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Memverifikasi...' : 'MASUK PANEL ADMIN'}
          </button>

          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors font-semibold">
            &larr; Kembali ke Beranda
          </Link>
        </form>
      </div>
    );
  }

  // ── Main Authenticated Admin Dashboard ──────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col selection:bg-black selection:text-white">
      
      {/* Top Header Navigation */}
      <header className="bg-white border-b-2 border-slate-300 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 transition-all text-xs font-bold"
          >
            &larr; Beranda
          </Link>
          <span className="h-5 w-px bg-slate-300" />
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight">
              PANEL ADMIN — PHOTOBOOTH JOBFAIR UPKK UIN ANTASARI
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Manajemen Softfile 24 Jam, Supabase Storage, &amp; Cloud Vouchers
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Logout */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-full border border-slate-300 text-xs font-bold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-black text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              📊 Ringkasan
            </button>
            <button
              onClick={() => { setActiveTab('sessions'); loadSessions(); }}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === 'sessions' ? 'bg-black text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              📸 Sesi ({sessions.length})
            </button>
            <button
              onClick={() => { setActiveTab('vouchers'); loadVouchers(); }}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === 'vouchers' ? 'bg-black text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              🎟️ Voucher ({vouchers.length})
            </button>
            <button
              onClick={() => setActiveTab('cleanup')}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === 'cleanup' ? 'bg-black text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              🧹 Auto-Cleanup 24h
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeTab === 'settings' ? 'bg-black text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              ⚙️ Integrasi Kiosk
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        
        {/* ── TAB 1: DASHBOARD ─────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-xs flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Sesi Foto</span>
                <span className="text-3xl font-black text-slate-900 font-mono">{stats.total}</span>
                <span className="text-[11px] text-slate-500">Tercatat di Supabase Storage</span>
              </div>

              <div className="bg-white border-2 border-emerald-400 rounded-3xl p-5 shadow-xs flex flex-col gap-1">
                <span className="text-xs font-bold text-emerald-700 uppercase">Sesi Aktif (&lt; 24 Jam)</span>
                <span className="text-3xl font-black text-emerald-600 font-mono">{stats.activeCount}</span>
                <span className="text-[11px] text-emerald-700 font-medium">Bisa diunduh via QR Code</span>
              </div>

              <div className="bg-white border-2 border-amber-400 rounded-3xl p-5 shadow-xs flex flex-col gap-1">
                <span className="text-xs font-bold text-amber-700 uppercase">Sesi Kadaluarsa (&gt; 24 Jam)</span>
                <span className="text-3xl font-black text-amber-600 font-mono">{stats.expiredCount}</span>
                <span className="text-[11px] text-amber-700 font-medium">Siap dibersihkan otomatis</span>
              </div>

              <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-xs flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Voucher Cloud</span>
                <span className="text-3xl font-black text-slate-900 font-mono">{vouchers.length}</span>
                <span className="text-[11px] text-slate-500">Voucher aktif &amp; diskon</span>
              </div>
            </div>

            {/* Quick Actions & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Storage Garbage Collector Widget */}
              <div className="bg-white border-2 border-black rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between gap-4 receipt-paper">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold">
                    <span>⏱️ Auto-Cleanup 24 Jam</span>
                  </div>
                  <h2 className="text-xl font-black uppercase text-slate-900">
                    Pembersihan Kuota Supabase
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Sistem secara otomatis menghapus file foto 4R, video MP4, dan pose satuan dari Supabase Storage setelah melewati 24 jam agar kuota storage Anda tetap hemat dan aman.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleRunCleanup}
                    disabled={cleanupRunning}
                    className="px-6 py-3 bg-black hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {cleanupRunning ? 'Memproses...' : '🧹 Bersihkan File > 24 Jam Sekarang'}
                  </button>
                  <button
                    onClick={() => setActiveTab('cleanup')}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-bold transition-all"
                  >
                    Detail Log &rarr;
                  </button>
                </div>
              </div>

              {/* Event Info Card */}
              <div className="bg-white border-2 border-slate-300 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-full text-xs font-bold">
                    <span>📍 Event Profile</span>
                  </div>
                  <h2 className="text-xl font-black uppercase text-slate-900">
                    Photobooth JobFair UPKK UIN Antasari
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Pelaksanaan: <strong>26 - 27 Agustus 2026</strong><br />
                    Lokasi Kiosk: UIN Antasari Banjarmasin<br />
                    Storage Provider: Supabase Cloud Storage (Bucket: <code>pbak-assets</code>)
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Domain Cloud Softfile:</span>
                  <span className="font-mono text-black font-extrabold">{typeof window !== 'undefined' ? window.location.origin : 'https://...'}</span>
                </div>
              </div>

            </div>

            {/* Recent Sessions Preview */}
            <div className="bg-white border-2 border-slate-300 rounded-[2.5rem] p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h3 className="text-base font-black uppercase text-slate-900">📸 Sesi Pemotretan Terbaru</h3>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="text-xs font-bold text-black hover:underline"
                >
                  Lihat Semua ({sessions.length}) &rarr;
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-semibold">
                  Belum ada sesi pemotretan yang diunggah ke Supabase.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {sessions.slice(0, 4).map(session => (
                    <div
                      key={session.sessionId}
                      onClick={() => setSelectedSession(session)}
                      className="bg-slate-50 border border-slate-300 rounded-2xl p-3 flex flex-col gap-2 hover:border-black cursor-pointer transition-all shadow-xs"
                    >
                      <div className="w-full aspect-3/4 bg-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                        {session.cdnCompositeUrl || session.compositeUrl ? (
                          <img
                            src={session.cdnCompositeUrl || session.compositeUrl}
                            alt="Foto Cetak"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-slate-400 font-bold">No Image</span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-mono font-bold text-slate-900 truncate">
                          {session.sessionId}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(session.createdAt || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── TAB 2: SESSIONS & SOFTFILES ──────────────────────────────── */}
        {activeTab === 'sessions' && (
          <div className="bg-white border-2 border-slate-300 rounded-[2.5rem] p-6 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black uppercase text-slate-900">
                  Daftar Sesi &amp; Softfile Photobooth
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Semua sesi foto yang tersimpan di Supabase Storage
                </p>
              </div>

              <button
                onClick={loadSessions}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🔄 Segarkan Data</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Session ID (contoh: sess_123)..."
                className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-slate-300 text-xs font-mono focus:outline-none focus:border-black transition-colors"
              />

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl border-2 border-slate-300 text-xs font-bold bg-white focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif (&lt; 24 Jam)</option>
                  <option value="expired">Kadaluarsa (&gt; 24 Jam)</option>
                </select>
              </div>
            </div>

            {/* Sessions Table / List */}
            {filteredSessions.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm font-semibold">
                Tidak ada sesi foto yang cocok dengan pencarian.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-500 uppercase font-black tracking-wider">
                      <th className="py-3 px-3">Preview</th>
                      <th className="py-3 px-3">Session ID</th>
                      <th className="py-3 px-3">Waktu Pemotretan</th>
                      <th className="py-3 px-3">Usia &amp; Status</th>
                      <th className="py-3 px-3">Aset Foto/Video</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSessions.map(session => {
                      const ageMs = now - (session.createdAt || 0);
                      const isExpired = ageMs > TWENTY_FOUR_HOURS_MS;
                      const ageHours = (ageMs / (1000 * 3600)).toFixed(1);

                      return (
                        <tr key={session.sessionId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            <div
                              onClick={() => setSelectedSession(session)}
                              className="w-12 h-16 bg-slate-100 border border-slate-300 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center hover:scale-105 transition-all shadow-xs"
                            >
                              {session.cdnCompositeUrl || session.compositeUrl ? (
                                <img
                                  src={session.cdnCompositeUrl || session.compositeUrl}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px] text-slate-400">N/A</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {session.sessionId}
                          </td>

                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {new Date(session.createdAt || Date.now()).toLocaleString('id-ID')}
                          </td>

                          <td className="py-3 px-3">
                            {isExpired ? (
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[11px] font-bold">
                                Kadaluarsa ({ageHours} Jam)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">
                                Aktif ({ageHours} Jam)
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-slate-600">
                            <div className="flex items-center gap-1.5">
                              {session.cdnCompositeUrl && <span title="Foto 4R">🖼️ 4R</span>}
                              {session.cdnVideoUrl && <span title="Video MP4">🎬 Video</span>}
                              {session.cdnGifUrl && <span title="GIF">🎞️ GIF</span>}
                              {session.cdnSinglePhotos?.length > 0 && <span>📸 ({session.cdnSinglePhotos.length})</span>}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/softfile/${session.sessionId}`}
                                target="_blank"
                                className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white rounded-full text-[11px] font-bold uppercase transition-all shadow-xs"
                              >
                                🌐 Galeri
                              </Link>
                              <button
                                onClick={() => handleDeleteSession(session.sessionId)}
                                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-full text-[11px] font-bold uppercase transition-all cursor-pointer"
                              >
                                🗑️ Hapus
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
        )}

        {/* ── TAB 3: VOUCHERS MANAGEMENT ───────────────────────────────── */}
        {activeTab === 'vouchers' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Create Voucher Form */}
            <div className="lg:col-span-5 bg-white border-2 border-slate-300 rounded-[2.5rem] p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-black uppercase text-slate-900">
                ➕ Tambah / Edit Voucher Cloud
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Voucher tersimpan di Supabase Storage dan dapat digunakan langsung di Kiosk Photobooth.
              </p>

              {voucherMsg && (
                <div className={`p-3 rounded-2xl text-xs font-bold ${voucherMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {voucherMsg.text}
                </div>
              )}

              <form onSubmit={handleSaveVoucher} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kode Voucher:</label>
                  <input
                    type="text"
                    required
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: JOBFAIRFREE"
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-300 text-xs font-mono font-bold uppercase focus:outline-none focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Tipe Diskon:</label>
                    <select
                      value={voucherType}
                      onChange={(e) => setVoucherType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl border-2 border-slate-300 text-xs font-bold focus:outline-none focus:border-black bg-white"
                    >
                      <option value="free">Gratis 100% (Free Pass)</option>
                      <option value="percent">Persentase (%)</option>
                      <option value="nominal">Potongan Rupiah (Rp)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Nilai:</label>
                    <input
                      type="number"
                      value={voucherValue}
                      onChange={(e) => setVoucherValue(e.target.value)}
                      placeholder="100"
                      className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-300 text-xs font-bold focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Maks Penggunaan (Quota):</label>
                  <input
                    type="number"
                    value={voucherMaxUses}
                    onChange={(e) => setVoucherMaxUses(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-300 text-xs font-bold focus:outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Deskripsi / Catatan:</label>
                  <input
                    type="text"
                    value={voucherDesc}
                    onChange={(e) => setVoucherDesc(e.target.value)}
                    placeholder="Contoh: Voucher Khusus Peserta JobFair"
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-300 text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-black hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                >
                  SIMPAN VOUCHER KE CLOUD
                </button>
              </form>
            </div>

            {/* Right: Voucher List */}
            <div className="lg:col-span-7 bg-white border-2 border-slate-300 rounded-[2.5rem] p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h3 className="text-lg font-black uppercase text-slate-900">
                  Daftar Voucher Aktif ({vouchers.length})
                </h3>
                <button
                  onClick={() => loadVouchers()}
                  className="text-xs font-bold text-slate-600 hover:text-black"
                >
                  🔄 Refresh
                </button>
              </div>

              {vouchers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  Belum ada voucher yang terdaftar.
                </div>
              ) : (
                <div className="space-y-3">
                  {vouchers.map(v => (
                    <div
                      key={v.code}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        v.active ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-slate-100 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm bg-white px-3 py-1 rounded-xl border border-slate-300 text-black">
                            {v.code}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            v.type === 'free' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {v.type === 'free' ? 'Gratis 100%' : `${v.value}${v.type === 'percent' ? '%' : ' IDR'}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          {v.description || 'Kode Voucher Photobooth'}
                        </p>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Terpakai: {v.usedCount || 0} / {v.maxUses || 100} kali
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleToggleVoucher(v)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            v.active ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          {v.active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() => handleDeleteVoucher(v.code)}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-full text-xs font-bold transition-all cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── TAB 4: AUTO-CLEANUP 24H ───────────────────────────────────── */}
        {activeTab === 'cleanup' && (
          <div className="bg-white border-2 border-slate-300 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
            
            <div className="border-b border-slate-200 pb-4 space-y-1">
              <h2 className="text-xl font-black uppercase text-slate-900">
                🧹 24-Hour Supabase Storage Auto-Cleanup
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Pembersihan otomatis berkala untuk menjaga kuota Supabase Storage tetap aman dan hemat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* How it works */}
              <div className="space-y-3 bg-slate-50 border border-slate-300 rounded-3xl p-5 text-xs text-slate-700 leading-relaxed font-medium">
                <h4 className="font-extrabold text-black uppercase">ℹ️ Cara Kerja Pembersihan:</h4>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Setiap sesi foto diberi masa berlaku aktif selama <strong>24 jam</strong> setelah pemotretan.</li>
                  <li>Pengunjung dapat mengunduh foto &amp; video mereka sepuasnya selama masa aktif 24 jam melalui QR code.</li>
                  <li><strong>Vercel Cron Job</strong> dijalankan otomatis di background setiap 1 jam untuk memindai file yang &gt; 24 jam.</li>
                  <li>Saat kadaluarsa, seluruh file JPG 4R, Video MP4, dan GIF terkait langsung dihapus dari bucket Supabase (<code>pbak-assets</code>).</li>
                </ul>
              </div>

              {/* Manual Trigger */}
              <div className="flex flex-col justify-between gap-4 bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-5">
                <div className="space-y-2">
                  <h4 className="font-extrabold text-amber-950 uppercase text-sm">
                    🚀 Jalankan Pembersihan Manual Sekarang
                  </h4>
                  <p className="text-xs text-amber-900 font-medium">
                    Klik tombol di bawah untuk memicu pembersihan langsung terhadap semua sesi yang telah melewati batas 24 jam.
                  </p>
                </div>

                <button
                  onClick={handleRunCleanup}
                  disabled={cleanupRunning}
                  className="w-full py-4 bg-black hover:bg-slate-800 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                >
                  {cleanupRunning ? 'Sedang Memindai & Menghapus...' : '🧹 JALANKAN AUTO-CLEANUP SEKARANG'}
                </button>
              </div>

            </div>

            {/* Cleanup Result Log */}
            {cleanupResult && (
              <div className="p-5 bg-slate-900 text-emerald-400 rounded-3xl font-mono text-xs space-y-2 border border-slate-700">
                <div className="flex items-center gap-2 font-bold text-white border-b border-slate-700 pb-2">
                  <span>✓ Laporan Pembersihan Storage Terakhir</span>
                  <span className="text-slate-400 text-[10px]">({cleanupResult.timestamp})</span>
                </div>
                <div>Sesi yang dipindai: <span className="text-white font-bold">{cleanupResult.scannedCount}</span></div>
                <div>Sesi kadaluarsa yang dihapus: <span className="text-white font-bold">{cleanupResult.deletedSessionsCount}</span></div>
                <div>Total file Supabase yang dibersihkan: <span className="text-white font-bold">{cleanupResult.deletedFilesCount}</span> file</div>
                {cleanupResult.deletedSessionIds?.length > 0 && (
                  <div className="text-[11px] text-slate-300 pt-1">
                    ID Sesi terhapus: {cleanupResult.deletedSessionIds.join(', ')}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ── TAB 5: KIOSK SETTINGS & INTEGRATION ───────────────────────── */}
        {activeTab === 'settings' && (
          <div className="bg-white border-2 border-slate-300 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
            
            <div className="border-b border-slate-200 pb-4 space-y-1">
              <h2 className="text-xl font-black uppercase text-slate-900">
                ⚙️ Integrasi Kiosk &amp; Konfigurasi Vercel
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Panduan menghubungkan Laptop Photobooth Kiosk Anda ke Web App yang dideploy di Vercel.
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-medium">
              
              <div className="p-5 bg-slate-50 border-2 border-slate-300 rounded-3xl space-y-3">
                <h4 className="font-black text-sm uppercase text-black">
                  1. Deploy Web Admin ini ke Vercel
                </h4>
                <p>
                  Deploy folder <code>admin-web</code> ke Vercel (bisa melalui GitHub repo atau Vercel CLI).<br />
                  Pastikan Anda mengisi Environment Variables berikut di Vercel Project Settings:
                </p>
                <div className="bg-slate-900 text-white p-3.5 rounded-2xl font-mono text-[11px] space-y-1">
                  <div>SUPABASE_URL=https://rifcawifuojzercjauhy.supabase.co</div>
                  <div>SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...</div>
                  <div>SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...</div>
                  <div>SUPABASE_BUCKET=pbak-assets</div>
                  <div>ADMIN_PIN=1234</div>
                  <div>RETENTION_HOURS=24</div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-2 border-slate-300 rounded-3xl space-y-3">
                <h4 className="font-black text-sm uppercase text-black">
                  2. Hubungkan Laptop Photobooth Kiosk
                </h4>
                <p>
                  Di laptop Photobooth (Kiosk), buka file <code>.env.local</code> atau isi di Panel Admin Kiosk lokal:
                </p>
                <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-2xl font-mono text-[11px]">
                  PUBLIC_GALLERY_DOMAIN=https://domain-anda.vercel.app
                </div>
                <p className="text-slate-500">
                  Dengan begitu, setiap kali pemotretan selesai, QR Code di layar Kiosk akan otomatis mengarahkan pengunjung ke web Vercel Anda di atas, dan foto dapat langsung dibuka dari HP dengan koneksi internet mana saja tanpa harus satu Wi-Fi!
                </p>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ── SESSION PREVIEW MODAL ────────────────────────────────────── */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedSession(null)}
              className="absolute top-6 right-6 w-9 h-9 bg-slate-100 hover:bg-black hover:text-white rounded-full font-black text-sm flex items-center justify-center transition-all cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-bold px-3 py-1 bg-slate-100 rounded-full font-mono">
                {selectedSession.sessionId}
              </span>
              <h3 className="text-xl font-black uppercase text-slate-900">
                Detail Sesi Photobooth
              </h3>
              <p className="text-xs text-slate-500">
                Waktu: {new Date(selectedSession.createdAt || Date.now()).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Image Preview */}
            <div className="flex flex-col items-center gap-4">
              {selectedSession.cdnCompositeUrl || selectedSession.compositeUrl ? (
                <img
                  src={selectedSession.cdnCompositeUrl || selectedSession.compositeUrl}
                  alt="Foto Cetak 4R"
                  className="max-h-[50vh] w-auto object-contain rounded-2xl border-2 border-slate-300 shadow-sm"
                />
              ) : (
                <div className="p-8 text-slate-400 text-xs font-semibold">Tidak ada foto cetak</div>
              )}

              {selectedSession.cdnVideoUrl && (
                <video
                  src={selectedSession.cdnVideoUrl}
                  controls
                  className="w-full aspect-video rounded-2xl border-2 border-slate-300"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <Link
                href={`/softfile/${selectedSession.sessionId}`}
                target="_blank"
                className="px-6 py-3 bg-black hover:bg-slate-800 text-white rounded-full text-xs font-bold uppercase transition-all shadow-sm"
              >
                🌐 Buka Galeri Web Softfile
              </Link>
              <button
                onClick={() => handleDeleteSession(selectedSession.sessionId)}
                className="px-6 py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-full text-xs font-bold uppercase transition-all cursor-pointer"
              >
                🗑️ Hapus Sesi Dari Supabase
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
