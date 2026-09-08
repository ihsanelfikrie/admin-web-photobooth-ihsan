'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  RotateCw,
  Search,
  Eye,
  Download,
  Share2,
  Copy,
  Trash2,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Store,
  Filter,
  Film,
  Camera,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

const SUPABASE_CDN_BASE = 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets';

function getDisplayCdnUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const filename = url.split('/').pop();
  return filename ? `${SUPABASE_CDN_BASE}/${filename}` : null;
}

/**
 * Format timestamp into screenshot style: "8 Sep 2026, 19:11"
 */
export function formatGalleryCardDate(timestamp) {
  if (!timestamp) return '-';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return String(timestamp);
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[d.getMonth()] || 'Sep';
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Determine user consent status ("yes" or "no") from real session data
 */
export function checkSessionConsent(session) {
  if (!session) return false;
  const c = session.userConsent ?? session.consent ?? session.user_consent;
  if (c === true || c === 'yes' || c === 'true' || c === 'Ya, Setuju' || c === 'Baik/Mengerti' || c === 'setuju') {
    return true;
  }
  if (c === false || c === 'no' || c === 'false' || c === 'Tidak' || c === 'tidak_setuju') {
    return false;
  }
  return false;
}

export default function KioskGalleryView({
  sessions = [],
  kiosks = [],
  activeGalleryKiosk = null,
  setActiveGalleryKiosk,
  onRefresh,
  refreshing = false,
  onOpenQrModal,
  onDownloadZip,
  onCopyLink,
  onDeleteSession,
  showToast,
  templates = [],
}) {
  const [gallerySubTab, setGallerySubTab] = useState('photos'); // 'photos' | 'templates'
  const [timeRange, setTimeRange] = useState('today'); // 'today' | '7days' | '30days' | 'all'
  const [specificDate, setSpecificDate] = useState(''); // YYYY-MM-DD
  const [searchFilter, setSearchFilter] = useState('');
  const [consentFilter, setConsentFilter] = useState('all'); // 'all' | 'yes' | 'no'
  const [selectedSessionModal, setSelectedSessionModal] = useState(null);
  const [kioskSearchQuery, setKioskSearchQuery] = useState('');

  // SESSIONS FILTERING LOGIC
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // 1. Filter by Kiosk
      if (activeGalleryKiosk && activeGalleryKiosk.id !== 'all') {
        const targetLicense = (activeGalleryKiosk.licenseKey || activeGalleryKiosk.license_key || '').trim().toUpperCase();
        const sessLicense = (s.licenseKey || s.license_key || '').trim().toUpperCase();
        const matchesKiosk =
          (targetLicense && sessLicense === targetLicense) ||
          (s.kioskId && String(s.kioskId) === String(activeGalleryKiosk.id)) ||
          (s.kioskName && s.kioskName.toLowerCase() === (activeGalleryKiosk.name || '').toLowerCase()) ||
          (kiosks.length === 1);
        if (!matchesKiosk) return false;
      }

      // 2. Filter by Search Query
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchSearch =
          s.sessionId?.toLowerCase().includes(q) ||
          s.frameName?.toLowerCase().includes(q) ||
          s.kioskName?.toLowerCase().includes(q) ||
          s.orderId?.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      // 3. Filter by Consent
      if (consentFilter !== 'all') {
        const isYes = checkSessionConsent(s);
        if (consentFilter === 'yes' && !isYes) return false;
        if (consentFilter === 'no' && isYes) return false;
      }

      // 4. Filter by Specific Picked Date
      const sessDate = new Date(s.createdAt || Date.now());
      if (specificDate) {
        const year = sessDate.getFullYear();
        const month = String(sessDate.getMonth() + 1).padStart(2, '0');
        const day = String(sessDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return dateStr === specificDate;
      }

      // 5. Filter by Time Range
      const now = Date.now();
      if (timeRange === 'today') {
        const today = new Date();
        return (
          sessDate.getFullYear() === today.getFullYear() &&
          sessDate.getMonth() === today.getMonth() &&
          sessDate.getDate() === today.getDate()
        );
      } else if (timeRange === '7days') {
        return (s.createdAt || 0) >= now - 7 * 24 * 60 * 60 * 1000;
      } else if (timeRange === '30days') {
        return (s.createdAt || 0) >= now - 30 * 24 * 60 * 60 * 1000;
      }

      return true; // 'all'
    });
  }, [sessions, activeGalleryKiosk, kiosks.length, searchFilter, consentFilter, specificDate, timeRange]);

  // Today count helper
  const todayCount = useMemo(() => {
    const today = new Date();
    return sessions.filter((s) => {
      if (activeGalleryKiosk && activeGalleryKiosk.id !== 'all') {
        const targetLicense = (activeGalleryKiosk.licenseKey || activeGalleryKiosk.license_key || '').trim().toUpperCase();
        const sessLicense = (s.licenseKey || s.license_key || '').trim().toUpperCase();
        const matches =
          (targetLicense && sessLicense === targetLicense) ||
          (s.kioskId && String(s.kioskId) === String(activeGalleryKiosk.id)) ||
          (s.kioskName && s.kioskName.toLowerCase() === (activeGalleryKiosk.name || '').toLowerCase()) ||
          (kiosks.length === 1);
        if (!matches) return false;
      }
      const d = new Date(s.createdAt || Date.now());
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    }).length;
  }, [sessions, activeGalleryKiosk, kiosks.length]);

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 1: KIOSK HUB SELECTOR (If activeGalleryKiosk is null)
  // ──────────────────────────────────────────────────────────────────────────
  if (!activeGalleryKiosk) {
    const filteredKiosksList = kiosks.filter((k) => {
      if (!kioskSearchQuery.trim()) return true;
      const q = kioskSearchQuery.toLowerCase();
      return (
        k.name?.toLowerCase().includes(q) ||
        k.licenseKey?.toLowerCase().includes(q) ||
        k.license_key?.toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-6">
        {/* Hub Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              Kiosk Galleries
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Pilih unit kiosk untuk meninjau arsip galeri foto, template softfile, dan status persetujuan (consent) pengguna.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kiosk..."
                value={kioskSearchQuery}
                onChange={(e) => setKioskSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs"
              />
            </div>

            <button
              onClick={() => setActiveGalleryKiosk({ id: 'all', name: 'Semua Kiosk', licenseKey: 'ALL' })}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            >
              Semua Kiosk ({sessions.length})
            </button>
          </div>
        </div>

        {/* Kiosks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredKiosksList.map((k) => {
            const kioskSessions = sessions.filter((s) => {
              const targetKey = (k.licenseKey || k.license_key || '').trim().toUpperCase();
              const sessKey = (s.licenseKey || s.license_key || '').trim().toUpperCase();
              return (
                (targetKey && sessKey === targetKey) ||
                (s.kioskId && String(s.kioskId) === String(k.id)) ||
                (s.kioskName && s.kioskName.toLowerCase() === (k.name || '').toLowerCase()) ||
                (kiosks.length === 1)
              );
            });

            const todayKioskCount = kioskSessions.filter((s) => {
              const d = new Date(s.createdAt || Date.now());
              const t = new Date();
              return (
                d.getFullYear() === t.getFullYear() &&
                d.getMonth() === t.getMonth() &&
                d.getDate() === t.getDate()
              );
            }).length;

            const latestSession = kioskSessions[0];
            const latestPreviewUrl = latestSession
              ? getDisplayCdnUrl(latestSession.cdnCompositeUrl || latestSession.compositeUrl)
              : null;

            const mode = k.kiosk_mode || (k.is_event_mode ? 'event' : 'regular');

            return (
              <div
                key={k.id}
                onClick={() => setActiveGalleryKiosk(k)}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-400 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {k.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {k.licenseKey || k.license_key || 'NDH-XXXX'}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 ${
                        mode === 'receipt'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : mode === 'event'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {mode === 'receipt'
                        ? '🧾 RECEIPT'
                        : mode === 'event'
                        ? '🎉 EVENT'
                        : '📸 REGULER'}
                    </span>
                  </div>

                  {/* Thumbnail Preview Area */}
                  <div className="aspect-[16/9] bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center relative mb-4">
                    {latestPreviewUrl ? (
                      <img
                        src={latestPreviewUrl}
                        alt={k.name}
                        className="max-h-full max-w-full object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 gap-1">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span className="text-[10px] font-bold">Belum ada foto</span>
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {kioskSessions.length} Total Foto
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs py-2 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl p-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Hari Ini</span>
                      <span className="text-sm font-black text-slate-900">{todayKioskCount} Sesi</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Softfile</span>
                      <span className="text-sm font-black text-slate-800">{kioskSessions.length} Berkas</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:underline">
                  <span>Buka Gallery Kiosk</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 2: KIOSK SPECIFIC GALLERY (Exact match with reference screenshot!)
  // ──────────────────────────────────────────────────────────────────────────
  const kioskTitle = activeGalleryKiosk.name || 'Galeri Kiosk';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title Section */}
      <div className="space-y-3">
        <button
          onClick={() => setActiveGalleryKiosk(null)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Gallery</span>
        </button>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {kioskTitle} — Gallery
        </h2>
      </div>

      {/* Subtabs: Gallery Foto vs Template Softfile */}
      <div className="flex items-center gap-8 border-b border-slate-200">
        <button
          onClick={() => setGallerySubTab('photos')}
          className={`pb-3 text-sm font-bold transition-all cursor-pointer relative ${
            gallerySubTab === 'photos'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Gallery Foto
        </button>
        <button
          onClick={() => setGallerySubTab('templates')}
          className={`pb-3 text-sm font-bold transition-all cursor-pointer relative ${
            gallerySubTab === 'templates'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Template Softfile
        </button>
      </div>

      {/* ── SUBTAB 1: GALLERY FOTO ────────────────────────────────────────── */}
      {gallerySubTab === 'photos' && (
        <div className="space-y-6">
          {/* White Filter Card (Exact match with screenshot) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Row 1: Time Range Pill Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTimeRange('today');
                  setSpecificDate('');
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === 'today' && !specificDate
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeRange('7days');
                  setSpecificDate('');
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === '7days' && !specificDate
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeRange('30days');
                  setSpecificDate('');
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === '30days' && !specificDate
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                30 Hari
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeRange('all');
                  setSpecificDate('');
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === 'all' && !specificDate
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Semua
              </button>

              {/* Optional Consent Filter Pill */}
              <div className="ml-auto hidden md:flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-[11px]">
                <span className="text-slate-400 px-2 font-bold">Consent:</span>
                <button
                  type="button"
                  onClick={() => setConsentFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    consentFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setConsentFilter('yes')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    consentFilter === 'yes' ? 'bg-[#DEF7EC] text-[#03543F] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <span>Yes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConsentFilter('no')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    consentFilter === 'no' ? 'bg-[#FDE8E8] text-[#9B1C1C] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <span>No</span>
                </button>
              </div>
            </div>

            {/* Row 2: Date Picker & Refresh Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 shrink-0">
                  Pilih Tanggal:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    placeholder="dd/mm/yyyy"
                    className="pl-3 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900 shadow-xs font-medium cursor-pointer"
                  />
                </div>
                {specificDate && (
                  <button
                    type="button"
                    onClick={() => setSpecificDate('')}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-600 underline cursor-pointer"
                  >
                    Reset Tanggal
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (onRefresh) onRefresh();
                  }}
                  disabled={refreshing}
                  className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Segarkan Foto Galeri"
                >
                  <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-slate-900' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Photo Strip Grid (4 columns on desktop, exact match with screenshot) */}
          {filteredSessions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredSessions.map((session) => {
                const compUrl = getDisplayCdnUrl(session.cdnCompositeUrl || session.compositeUrl);
                const isConsentYes = checkSessionConsent(session);
                const frameTitle = session.frameName || 'Photo Composite';

                return (
                  <div
                    key={session.sessionId}
                    className="bg-white rounded-3xl border border-slate-200 p-3 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
                  >
                    {/* Photostrip preview */}
                    <div
                      onClick={() => setSelectedSessionModal(session)}
                      className="relative aspect-[2/3] w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center p-1.5 cursor-pointer mb-2.5 group-hover:border-blue-600 transition-colors"
                    >
                      {compUrl ? (
                        <img
                          src={compUrl}
                          alt={session.sessionId}
                          className="max-h-full max-w-full object-contain rounded-xl group-hover:scale-[1.03] transition-transform duration-200"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 gap-1">
                          <ImageIcon className="w-8 h-8 opacity-40" />
                          <span className="text-[10px] font-bold">NO PREVIEW</span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                        <span className="px-3 py-1 bg-white/95 text-slate-900 text-[10px] font-black rounded-lg shadow-sm">
                          Buka Detail
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Title & Consent Badge + Formatted Date */}
                    <div className="space-y-1 px-1 pb-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className="font-bold text-xs text-slate-900 truncate max-w-[130px]"
                          title={session.frameName || session.sessionId}
                        >
                          {frameTitle}
                        </span>

                        {/* Real User Consent Badge (Yes / No) */}
                        {isConsentYes ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DEF7EC] text-[#03543F] border border-[#BCF0DA] shrink-0">
                            Yes
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FDE8E8] text-[#9B1C1C] border border-[#FBD5D5] shrink-0">
                            No
                          </span>
                        )}
                      </div>

                      {/* Timestamp formatted: "8 Sep 2026, 19:11" */}
                      <p className="text-[11px] text-slate-400 font-medium">
                        {formatGalleryCardDate(session.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">
                Tidak ada foto untuk filter yang dipilih
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {specificDate
                  ? `Tidak ada sesi foto pada tanggal ${specificDate}. Coba pilih tanggal lain atau reset ke "Semua".`
                  : timeRange === 'today'
                  ? 'Belum ada sesi pemotretan hari ini pada kiosk ini. Anda dapat memilih "Semua" untuk melihat arsip lengkap.'
                  : 'Belum ada data pemotretan yang tersimpan pada unit kiosk ini.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setTimeRange('all');
                  setSpecificDate('');
                  setConsentFilter('all');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Tampilkan Semua Foto
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SUBTAB 2: TEMPLATE SOFTFILE ──────────────────────────────────── */}
      {gallerySubTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-black text-slate-900 mb-1">
              Template Softfile & Bingkai Kiosk
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Daftar template aktif yang digunakan oleh {kioskTitle} untuk sesi foto & galeri softfile pelanggan.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="aspect-[2/3] bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                      {tpl.previewUrl ? (
                        <img
                          src={tpl.previewUrl}
                          alt={tpl.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 font-bold">NO PREVIEW</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 truncate">{tpl.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {tpl.size || '4R'} • {tpl.totalPhotos || tpl?.photoCount || 4} Pose Foto
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {tpl.templateType === 'receipt' ? 'Receipt 58/80mm' : 'Reguler 2R/4R'}
                    </span>
                    <span className="text-slate-500 font-bold">Aktif</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX / DETAIL MODAL ───────────────────────────────────────── */}
      {selectedSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {selectedSessionModal.frameName || 'Photo Composite'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID Sesi: {selectedSessionModal.sessionId}
                </p>
              </div>
              <button
                onClick={() => setSelectedSessionModal(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Consent Status Callout */}
            {checkSessionConsent(selectedSessionModal) ? (
              <div className="p-3 bg-[#DEF7EC] border border-[#BCF0DA] rounded-2xl flex items-center gap-2.5 text-xs text-[#03543F]">
                <ShieldCheck className="w-5 h-5 text-[#03543F] shrink-0" />
                <div>
                  <span className="font-bold block">Consent: YES (Disetujui Pelanggan)</span>
                  <span className="text-[11px] text-[#03543F]/80">
                    Pelanggan menyetujui foto ini ditampilkan atau dibagikan ke media sosial / display publik.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#FDE8E8] border border-[#FBD5D5] rounded-2xl flex items-center gap-2.5 text-xs text-[#9B1C1C]">
                <ShieldAlert className="w-5 h-5 text-[#9B1C1C] shrink-0" />
                <div>
                  <span className="font-bold block">Consent: NO (Ditolak / Privat)</span>
                  <span className="text-[11px] text-[#9B1C1C]/80">
                    Pelanggan memilih tidak menyetujui publikasi. Foto ini hanya untuk arsip pribadi pelanggan.
                  </span>
                </div>
              </div>
            )}

            {/* Main Composite Image Display */}
            <div className="max-h-[50vh] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-2">
              <img
                src={getDisplayCdnUrl(selectedSessionModal.cdnCompositeUrl || selectedSessionModal.compositeUrl)}
                alt={selectedSessionModal.sessionId}
                className="max-h-[46vh] w-auto object-contain rounded-xl shadow-sm"
              />
            </div>

            {/* Raw Single Photos Preview */}
            {selectedSessionModal.singlePhotos && selectedSessionModal.singlePhotos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Foto Pose Tunggal ({selectedSessionModal.singlePhotos.length} Foto)</span>
                </h4>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedSessionModal.singlePhotos.map((sp, idx) => (
                    <img
                      key={idx}
                      src={getDisplayCdnUrl(sp.cdnUrl || sp.publicUrl)}
                      alt={`Pose ${idx + 1}`}
                      className="w-16 h-20 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onDownloadZip && onDownloadZip(selectedSessionModal)}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh ZIP</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenQrModal && onOpenQrModal(selectedSessionModal)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => onCopyLink && onCopyLink(selectedSessionModal.sessionId)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onDeleteSession) {
                    onDeleteSession(selectedSessionModal.sessionId);
                    setSelectedSessionModal(null);
                  }
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
