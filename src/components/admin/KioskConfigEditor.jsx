'use client';

import React, { useState, useEffect } from 'react';
import {
  Monitor,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Zap,
  Clock,
  Camera,
  Layers,
  Sliders,
  FileText,
  CreditCard,
  Radio,
  Users,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export default function KioskConfigEditor({ kiosk, onBack, onSaveSuccess }) {
  const [activeTab, setActiveTab] = useState('general');

  // Form State initialized from kiosk data
  const [formData, setFormData] = useState({
    name: kiosk?.name || '',
    license_key: kiosk?.license_key || '',
    pin: kiosk?.pin || '1111',
    is_testing_mode: kiosk?.is_testing_mode ?? false,
    is_active: kiosk?.is_active ?? true,

    // Consent
    consent_enabled: kiosk?.consent_enabled ?? true,
    consent_text: kiosk?.consent_text || 'Apakah anda berkenan foto anda kami unggah di media sosial kami?',
    consent_text_yes: kiosk?.consent_text_yes || 'Baik/Mengerti',
    consent_text_no: kiosk?.consent_text_no || 'Tidak',

    // Timer
    countdown_timer: kiosk?.countdown_timer ?? 10,
    qr_timer: kiosk?.qr_timer ?? 90,

    // Photo Session
    session_duration: kiosk?.session_duration ?? 300,
    live_photo: kiosk?.live_photo ?? true,
    max_photo: kiosk?.max_photo ?? 6,
    max_print: kiosk?.max_print ?? 5,
    no_retake_after: kiosk?.no_retake_after ?? 0,

    // Payment
    price_per_photo: kiosk?.price_per_photo ?? 30000,
    price_extra_print: kiosk?.price_extra_print ?? 10000,
    price_discount: kiosk?.price_discount ?? 0,
    midtrans_server_key: kiosk?.midtrans_server_key || '',
    midtrans_client_key: kiosk?.midtrans_client_key || '',
    midtrans_merchant_id: kiosk?.midtrans_merchant_id || '',
    midtrans_is_production: kiosk?.midtrans_is_production ?? false,

    // Event & Queue
    is_event_mode: kiosk?.is_event_mode ?? false,
    event_name: kiosk?.event_name || '',
    watermark_text: kiosk?.watermark_text || '',
    is_queue_enabled: kiosk?.is_queue_enabled ?? false,
    queue_timeout_minutes: kiosk?.queue_timeout_minutes ?? 3,

    // Device
    os_hostname: kiosk?.os_hostname || 'DESKTOP-T2QQPN3',
    os_platform: kiosk?.os_platform || 'darwin',
    device_id: kiosk?.device_id || null,

    // Paper
    paper_stock: kiosk?.paper_stock ?? 500,
    paper_low_threshold: kiosk?.paper_low_threshold ?? 30,

    // OTA
    software_version: kiosk?.software_version || 'v1.2.0',
    auto_ota_update: kiosk?.auto_ota_update ?? true,
    release_channel: kiosk?.release_channel || 'stable',

    // Custom Filters
    allowed_filters: kiosk?.allowed_filters || ['bw', 'bw_high', 'soft_glam', 'sepia', 'vintage', 'film_grain', 'none'],
  });

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Live API Status check state
  const [checkingApi, setCheckingApi] = useState(false);
  const [liveApiStatus, setLiveApiStatus] = useState({
    active: true,
    message: 'Kiosk Aktif & Siap',
    checkedAt: new Date().toLocaleTimeString('id-ID'),
  });

  // Template Categories for Tab 9
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatOrder, setNewCatOrder] = useState(1);

  // Update field and mark form as dirty
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Check Live API Handshake
  const handleCheckLiveApi = async () => {
    setCheckingApi(true);
    try {
      const res = await fetch(`/api/kiosk/${formData.license_key}?device_id=${formData.device_id || ''}`);
      const data = await res.json();
      if (data?.active) {
        setLiveApiStatus({
          active: true,
          message: 'Kiosk Aktif & Siap',
          checkedAt: new Date().toLocaleTimeString('id-ID'),
        });
      } else {
        setLiveApiStatus({
          active: false,
          message: data?.message || 'Kiosk Tidak Aktif atau Terkunci',
          checkedAt: new Date().toLocaleTimeString('id-ID'),
        });
      }
    } catch (err) {
      setLiveApiStatus({
        active: false,
        message: 'Gagal menghubungi endpoint: ' + err.message,
        checkedAt: new Date().toLocaleTimeString('id-ID'),
      });
    } finally {
      setCheckingApi(false);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    setLoadingCats(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data?.success) {
        setCategories(data.categories || []);
      }
    } catch (_) {
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchCategories();
    }
  }, [activeTab]);

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    setToastMsg(null);

    try {
      const isNew = !kiosk?.id;
      const res = await fetch('/api/admin/kiosks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isNew
            ? {
                action: 'create_kiosk',
                kioskData: formData,
              }
            : {
                action: 'update_kiosk',
                license_key: kiosk.license_key,
                updates: formData,
              }
        ),
      });

      const data = await res.json();
      if (data.success) {
        setIsDirty(false);
        setToastMsg({ type: 'success', text: 'Konfigurasi kiosk berhasil disimpan ke server!' });
        if (onSaveSuccess) onSaveSuccess(data.kiosk || formData);
      } else {
        setToastMsg({ type: 'error', text: data.error || 'Gagal menyimpan perubahan.' });
      }
    } catch (err) {
      setToastMsg({ type: 'error', text: 'Kesalahan jaringan: ' + err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Device actions
  const handleDeactivateDevice = async () => {
    const newStatus = !formData.is_active;
    handleChange('is_active', newStatus);
    alert(newStatus ? 'Akses perangkat diaktifkan kembali.' : 'Akses perangkat dinonaktifkan sementara.');
  };

  const handleResetDevice = async () => {
    if (confirm('Apakah Anda yakin ingin mereset ikatan perangkat (Unbind) pada kiosk ini? License Key akan dapat dihubungkan ke komputer operator baru.')) {
      try {
        const res = await fetch('/api/admin/kiosks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'unbind_device',
            license_key: kiosk.license_key,
          }),
        });
        const data = await res.json();
        if (data.success) {
          handleChange('device_id', null);
          alert('Device Lock berhasil direset! Kiosk kini bebas untuk dihubungkan ke perangkat baru.');
        } else {
          alert(data.error || 'Gagal mereset perangkat.');
        }
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Category Actions
  const handleToggleCatActive = async (cat) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_active',
          id: cat.id,
          is_active: !cat.is_active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      }
    } catch (_) {}
  };

  const handleDeleteCategory = async (cat) => {
    if (confirm(`Hapus kategori "${cat.name}"?`)) {
      try {
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_category', id: cat.id }),
        });
        fetchCategories();
      } catch (_) {}
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      if (editingCat) {
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_category',
            id: editingCat.id,
            updates: { name: newCatName.trim(), order: Number(newCatOrder) || 1 },
          }),
        });
      } else {
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_category',
            name: newCatName.trim(),
            order: Number(newCatOrder) || categories.length + 1,
            is_active: true,
          }),
        });
      }
      setShowAddCatModal(false);
      setEditingCat(null);
      setNewCatName('');
      fetchCategories();
    } catch (_) {}
  };

  const TABS = [
    { id: 'general', label: 'General' },
    { id: 'ota', label: 'OTA Update' },
    { id: 'event', label: 'Event' },
    { id: 'queue', label: 'Antrean' },
    { id: 'device', label: 'Device' },
    { id: 'payment', label: 'Payment' },
    { id: 'timer', label: 'Timer' },
    { id: 'session', label: 'Photo Session' },
    { id: 'templates', label: 'Template Category' },
    { id: 'filters', label: 'Custom Filter' },
    { id: 'paper', label: 'Paper Management' },
  ];

  return (
    <div className="space-y-6 font-sans text-zinc-900 pb-12">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-sm transition-all cursor-pointer mb-2"
          >
            <span>&larr;</span>
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
              {formData.name || 'Kiosk Configuration'}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                formData.is_active
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
            >
              {formData.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Update the kiosk configuration below.</p>
        </div>

        {/* Top Save button shortcut */}
        <div className="flex items-center gap-2">
          {toastMsg && (
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-lg ${
                toastMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {toastMsg.text}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#5C8271] hover:bg-[#4d705f] active:scale-95 text-white font-semibold text-xs transition-all shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Card Title & Subtitle */}
        <div className="border-b border-zinc-100 pb-4">
          <h2 className="text-lg font-bold text-zinc-900">Kiosk Information</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Update kiosk configuration</p>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="border-b border-zinc-200 overflow-x-auto scrollbar-none flex items-center gap-6 text-xs whitespace-nowrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 font-semibold transition-all cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-emerald-700 border-emerald-500'
                    : 'text-zinc-500 hover:text-zinc-900 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Areas */}
        <div className="pt-2 min-h-[360px]">
          {/* ========================================================================= */}
          {/* TAB 1: GENERAL (Matching Screenshot 5)                                    */}
          {/* ========================================================================= */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Row 1: Kiosk Name & License Key */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Kiosk Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Contoh: Tegoersapa X NoLima"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 transition shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    License Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.license_key}
                    onChange={(e) => handleChange('license_key', e.target.value.toUpperCase())}
                    placeholder="Contoh: A77-LNU-30N"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900 uppercase focus:outline-none focus:border-emerald-500 transition shadow-sm"
                  />
                  <p className="text-[11px] text-zinc-400">
                    License Key rahasia untuk otorisasi mesin client/operator photobooth.
                  </p>
                </div>
              </div>

              {/* Row 2: Security PIN & Mode Testing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">Security PIN</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="password"
                      maxLength={8}
                      value={formData.pin}
                      onChange={(e) => handleChange('pin', e.target.value)}
                      placeholder="••••"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 transition shadow-sm font-mono tracking-wider"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Mode Testing (Kiosk Pengujian)
                  </label>
                  <select
                    value={formData.is_testing_mode ? 'testing' : 'production'}
                    onChange={(e) => handleChange('is_testing_mode', e.target.value === 'testing')}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 transition shadow-sm"
                  >
                    <option value="production">Produksi / Normal (Transaksi &amp; statistik dicatat)</option>
                    <option value="testing">Mode Testing (Hanya pengujian, tidak mencemari laporan)</option>
                  </select>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Aktifkan jika kiosk ini digunakan untuk testing internal. Data transaksi dari kiosk ini tidak akan mengotori laporan pendapatan dan grafik statistik. Ditandai dengan badge Testing di Live Monitor.
                  </p>
                </div>
              </div>

              {/* Sub-Section: Consent Settings (Screenshot 5) */}
              <div className="pt-6 border-t border-zinc-100 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Consent Settings</h3>
                  <p className="text-xs text-zinc-400">Enable and customize the photo upload consent option for users.</p>
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <label className="block text-xs font-semibold text-zinc-700">Consent Feature</label>
                  <select
                    value={formData.consent_enabled ? 'enabled' : 'disabled'}
                    onChange={(e) => handleChange('consent_enabled', e.target.value === 'enabled')}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 transition shadow-sm"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Consent Text (Question) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.consent_text}
                    onChange={(e) => handleChange('consent_text', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 transition shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      Consent Text Yes (Agree Button Label) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.consent_text_yes}
                      onChange={(e) => handleChange('consent_text_yes', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 transition shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      Consent Text No (Decline Button Label) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.consent_text_no}
                      onChange={(e) => handleChange('consent_text_no', e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 transition shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: DEVICE (Matching Screenshot 1)                                     */}
          {/* ========================================================================= */}
          {activeTab === 'device' && (
            <div className="space-y-6">
              {/* Blue Alert Box */}
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3.5">
                <div className="p-2 bg-sky-100 text-sky-700 rounded-xl shrink-0 mt-0.5">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-sky-950">Mekanisme Otorisasi Perangkat (Device ID)</h4>
                  <p className="text-sky-800 leading-relaxed">
                    Hanya perangkat (SW Booth Client) terdaftar yang dapat menggunakan License Key untuk mengakses aplikasi ini. Perangkat terikat secara otomatis ketika License Key diaktifkan pertama kali dari komputer operator.
                  </p>
                </div>
              </div>

              {/* 2-Column Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Card: Informasi Perangkat */}
                <div className="p-5 bg-white border border-zinc-200 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <Sliders className="w-4 h-4 text-sky-600" />
                    <h4 className="text-xs font-bold text-zinc-900">Informasi Perangkat</h4>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-zinc-100">
                      <span className="text-zinc-500">OS Hostname</span>
                      <span className="font-mono font-bold text-zinc-800">{formData.os_hostname}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-100">
                      <span className="text-zinc-500">Device ID</span>
                      <span className="font-mono text-[11px] text-zinc-700 max-w-[180px] truncate">
                        {formData.device_id || 'Belum terikat'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-100">
                      <span className="text-zinc-500">Status Lisensi Perangkat</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                        {formData.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-100">
                      <span className="text-zinc-500">Koneksi Real-time (Live)</span>
                      <span className="text-zinc-500 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-400" />
                        <span>Offline (Mati / Idle)</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-500">Ping Terakhir</span>
                      <span className="text-zinc-700 font-mono text-[11px]">
                        {kiosk?.last_ping_at
                          ? new Date(kiosk.last_ping_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                          : 'Belum pernah ping'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Kontrol & Tindakan Perangkat */}
                <div className="p-5 bg-white border border-zinc-200 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-zinc-900">Kontrol &amp; Tindakan Perangkat</h4>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Deactivate */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-zinc-800">Nonaktifkan Perangkat (Deactivate)</h5>
                      <p className="text-zinc-500 text-[11px] leading-relaxed">
                        Mengunci sementara akses License Key pada perangkat ini. Perangkat terdaftar tidak dapat menggunakan aplikasi SW Booth sampai status diaktifkan kembali atau perangkat direset.
                      </p>
                      <button
                        type="button"
                        onClick={handleDeactivateDevice}
                        className="px-4 py-2 border border-amber-500 text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        {formData.is_active ? 'Nonaktifkan Perangkat' : 'Aktifkan Perangkat'}
                      </button>
                    </div>

                    <hr className="border-zinc-100" />

                    {/* Reset Device */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-zinc-800">Reset Perangkat Terdaftar (Ganti Device)</h5>
                      <p className="text-zinc-500 text-[11px] leading-relaxed">
                        Menghapus data pengikatan perangkat (Device ID &amp; Hostname) saat ini dari kiosk. Gunakan tombol ini apabila Anda ingin memindahkan License Key ke komputer/device operator yang baru.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetDevice}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
                      >
                        Reset Perangkat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: TIMER (Matching Screenshot 2)                                      */}
          {/* ========================================================================= */}
          {activeTab === 'timer' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Countdown Timer (detik) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.countdown_timer}
                    onChange={(e) => handleChange('countdown_timer', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 transition shadow-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    QR Code Timer (detik) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.qr_timer}
                    onChange={(e) => handleChange('qr_timer', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 transition shadow-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: PHOTO SESSION (Matching Screenshot 3)                              */}
          {/* ========================================================================= */}
          {activeTab === 'session' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Session Duration (detik) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.session_duration}
                    onChange={(e) => handleChange('session_duration', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 transition shadow-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">Live Photo</label>
                  <select
                    value={formData.live_photo ? 'enabled' : 'disabled'}
                    onChange={(e) => handleChange('live_photo', e.target.value === 'enabled')}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 transition shadow-sm"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">Maksimal Foto Diambil</label>
                  <input
                    type="number"
                    value={formData.max_photo}
                    onChange={(e) => handleChange('max_photo', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-mono text-center"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">Maksimal Lembar Cetak</label>
                  <input
                    type="number"
                    value={formData.max_print}
                    onChange={(e) => handleChange('max_print', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-mono text-center"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">No Retake After (0 = Bebas)</label>
                  <input
                    type="number"
                    value={formData.no_retake_after}
                    onChange={(e) => handleChange('no_retake_after', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-mono text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 9: TEMPLATE CATEGORY (Matching Screenshot 4)                          */}
          {/* ========================================================================= */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Template Category dikelola di bawah.</h3>
                  <p className="text-xs text-zinc-500">Kelola kategori template khusus untuk kiosk ini.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCat(null);
                    setNewCatName('');
                    setNewCatOrder(categories.length + 1);
                    setShowAddCatModal(true);
                  }}
                  className="px-4 py-2 bg-[#0D3B26] hover:bg-[#08281a] text-white rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kategori</span>
                </button>
              </div>

              {/* Table */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-16">Urutan</th>
                      <th className="py-3 px-4">Nama Category</th>
                      <th className="py-3 px-4 w-28">Templates</th>
                      <th className="py-3 px-4 w-24">Status</th>
                      <th className="py-3 px-4 w-24">Aktif</th>
                      <th className="py-3 px-4 w-24 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-800">
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-400 italic">
                          {loadingCats ? 'Memuat kategori...' : 'Belum ada kategori template.'}
                        </td>
                      </tr>
                    ) : (
                      categories.map((cat, idx) => (
                        <tr key={cat.id} className="hover:bg-zinc-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-zinc-500">{cat.order || idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-zinc-900">{cat.name}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 font-mono text-zinc-600">
                              <Layers className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{cat.templates_count ?? 0}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                cat.is_active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-zinc-100 text-zinc-600'
                              }`}
                            >
                              {cat.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleCatActive(cat)}
                              className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition ${
                                cat.is_active ? 'bg-emerald-500 justify-end' : 'bg-zinc-300 justify-start'
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-white shadow" />
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCat(cat);
                                  setNewCatName(cat.name);
                                  setNewCatOrder(cat.order || 1);
                                  setShowAddCatModal(true);
                                }}
                                className="p-1 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 rounded cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1 hover:bg-rose-100 text-rose-500 hover:text-rose-700 rounded cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: PAYMENT                                                            */}
          {/* ========================================================================= */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Tarif Per Sesi Foto (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={formData.price_per_photo}
                    onChange={(e) => handleChange('price_per_photo', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Tarif Tambah Cetak / Extra Print (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={formData.price_extra_print}
                    onChange={(e) => handleChange('price_extra_print', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">Diskon Promosi (Rp)</label>
                  <input
                    type="number"
                    step={1000}
                    value={formData.price_discount}
                    onChange={(e) => handleChange('price_discount', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-mono"
                  />
                </div>
              </div>

              {/* Midtrans Section */}
              <div className="pt-5 border-t border-zinc-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Midtrans Payment Gateway (QRIS)</h3>
                    <p className="text-xs text-zinc-400">Konfigurasi API credentials payment gateway Midtrans untuk kiosk ini.</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      formData.midtrans_is_production
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {formData.midtrans_is_production ? 'Production (Live)' : 'Sandbox (Uji Coba)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">Midtrans Server Key</label>
                    <input
                      type="text"
                      value={formData.midtrans_server_key}
                      onChange={(e) => handleChange('midtrans_server_key', e.target.value)}
                      placeholder="Mid-server-..."
                      className="w-full px-3.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">Midtrans Client Key</label>
                    <input
                      type="text"
                      value={formData.midtrans_client_key}
                      onChange={(e) => handleChange('midtrans_client_key', e.target.value)}
                      placeholder="Mid-client-..."
                      className="w-full px-3.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">Midtrans Merchant ID</label>
                    <input
                      type="text"
                      value={formData.midtrans_merchant_id}
                      onChange={(e) => handleChange('midtrans_merchant_id', e.target.value)}
                      placeholder="M1990..."
                      className="w-full px-3.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">Mode Lingkungan (Environment)</label>
                    <select
                      value={formData.midtrans_is_production ? 'production' : 'sandbox'}
                      onChange={(e) => handleChange('midtrans_is_production', e.target.value === 'production')}
                      className="w-full px-3.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900"
                    >
                      <option value="sandbox">Sandbox (Testing / Uji Coba)</option>
                      <option value="production">Production (Live Asli Pembayaran)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: EVENT                                                              */}
          {/* ========================================================================= */}
          {activeTab === 'event' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">Mode Event (Gratis / Bayar)</label>
                  <select
                    value={formData.is_event_mode ? 'enabled' : 'disabled'}
                    onChange={(e) => handleChange('is_event_mode', e.target.value === 'enabled')}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900"
                  >
                    <option value="disabled">Disabled (Komersial Paywall QRIS)</option>
                    <option value="enabled">Enabled (Event Mode - Gratis / Tanpa Pembayaran)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">Nama Event / Judul Sesi</label>
                  <input
                    type="text"
                    value={formData.event_name}
                    onChange={(e) => handleChange('event_name', e.target.value)}
                    placeholder="Contoh: Wedding Sarah &amp; Kevin"
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700">Custom Watermark / Sponsor Text</label>
                <input
                  type="text"
                  value={formData.watermark_text}
                  onChange={(e) => handleChange('watermark_text', e.target.value)}
                  placeholder="Contoh: Presented by Nadhisan Photobooth"
                  className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ANTREAN                                                            */}
          {/* ========================================================================= */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">Fitur Antrean (Queue System)</label>
                  <select
                    value={formData.is_queue_enabled ? 'enabled' : 'disabled'}
                    onChange={(e) => handleChange('is_queue_enabled', e.target.value === 'enabled')}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900"
                  >
                    <option value="disabled">Disabled (Langsung Foto)</option>
                    <option value="enabled">Enabled (Antrean Tiket / QR)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">Timeout Antrean (Menit)</label>
                  <input
                    type="number"
                    value={formData.queue_timeout_minutes}
                    onChange={(e) => handleChange('queue_timeout_minutes', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: OTA UPDATE                                                         */}
          {/* ========================================================================= */}
          {activeTab === 'ota' && (
            <div className="space-y-6">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">Versi Software Kiosk</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Versi Saat Ini: <strong className="font-mono">{formData.software_version}</strong> (Production Build)</p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Memeriksa pembaruan dari server cloud... Kiosk sudah menggunakan versi terbaru!')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer self-start"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Periksa Pembaruan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">Otomatis Unduh Pembaruan (Auto-OTA)</label>
                  <select
                    value={formData.auto_ota_update ? 'enabled' : 'disabled'}
                    onChange={(e) => handleChange('auto_ota_update', e.target.value === 'enabled')}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900"
                  >
                    <option value="enabled">Enabled (Otomatis)</option>
                    <option value="disabled">Disabled (Manual)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">Saluran Rilis (Release Channel)</label>
                  <select
                    value={formData.release_channel}
                    onChange={(e) => handleChange('release_channel', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900"
                  >
                    <option value="stable">Stable Production (Direkomendasikan)</option>
                    <option value="beta">Beta Testing (Fitur Eksperimental)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 10: CUSTOM FILTER                                                     */}
          {/* ========================================================================= */}
          {activeTab === 'filters' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Custom Filter Kiosk</h3>
                <p className="text-xs text-zinc-400">Pilih efek filter yang diizinkan untuk digunakan oleh pelanggan pada unit kiosk ini.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: 'bw', name: 'Monochrome Classic (Standard B&W)' },
                  { id: 'bw_high', name: 'High Contrast HD B&W' },
                  { id: 'soft_glam', name: 'Soft Glam Studio (Beauty)' },
                  { id: 'sepia', name: 'Vintage Classic (Warm Sepia)' },
                  { id: 'vintage', name: 'Warm Soft Studio (Editorial)' },
                  { id: 'film_grain', name: 'Dark Film Indie (Moody)' },
                  { id: 'none', name: 'Warna Asli Kamera (Natural)' },
                ].map((flt) => {
                  const isChecked = formData.allowed_filters.includes(flt.id);
                  return (
                    <div
                      key={flt.id}
                      onClick={() => {
                        const next = isChecked
                          ? formData.allowed_filters.filter((f) => f !== flt.id)
                          : [...formData.allowed_filters, flt.id];
                        handleChange('allowed_filters', next);
                      }}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
                          : 'border-zinc-200 bg-white text-zinc-600'
                      }`}
                    >
                      <span className="text-xs">{flt.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 11: PAPER MANAGEMENT                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'paper' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Stok Kertas Fisik (Lembar) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.paper_stock}
                    onChange={(e) => handleChange('paper_stock', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700">Ambang Peringatan Kertas Menipis</label>
                  <input
                    type="number"
                    value={formData.paper_low_threshold}
                    onChange={(e) => handleChange('paper_low_threshold', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 font-mono"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-zinc-700 uppercase block">Aksi Cepat Refill Kertas:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange('paper_stock', formData.paper_stock + 100)}
                    className="px-3.5 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-800 transition cursor-pointer"
                  >
                    + Refill 100 Lembar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('paper_stock', formData.paper_stock + 500)}
                    className="px-3.5 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-800 transition cursor-pointer"
                  >
                    + Refill 500 Lembar (Roll Baru)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('paper_stock', 700)}
                    className="px-3.5 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-800 transition cursor-pointer"
                  >
                    Reset Standar 700 Lembar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM SECTION: LIVE API STATUS (Screenshots 2, 3, 4)                       */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t border-zinc-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-600" />
              <div>
                <h4 className="text-xs font-bold text-zinc-900">Live API Status</h4>
                <p className="text-[11px] text-zinc-400">
                  Status real-time dari endpoint <code>/api/kiosk/{formData.license_key}</code>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCheckLiveApi}
              disabled={checkingApi}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingApi ? 'animate-spin' : ''}`} />
              <span>Cek Ulang</span>
            </button>
          </div>

          {/* Live Status Bar */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
              liveApiStatus.active
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {liveApiStatus.active ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-bold">{liveApiStatus.message}</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              Terakhir diperiksa: {liveApiStatus.checkedAt}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER SAVE BAR (Screenshots 1, 2, 3, 5)                                   */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-zinc-400 font-medium">
            {isDirty ? 'Ada perubahan konfigurasi yang belum disimpan.' : 'Tidak ada perubahan.'}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2.5 rounded-xl text-white font-semibold text-xs transition-all shadow flex items-center gap-2 cursor-pointer ${
              isDirty
                ? 'bg-[#5C8271] hover:bg-[#4d705f] active:scale-95'
                : 'bg-zinc-400 hover:bg-zinc-500'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* Modal Add/Edit Template Category */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full p-6 shadow-2xl space-y-4 text-zinc-900">
            <h4 className="text-sm font-bold text-zinc-900">
              {editingCat ? 'Edit Kategori Template' : 'Tambah Kategori Template Baru'}
            </h4>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Nama Kategori *</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: NoLima / Event Strip"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Nomor Urutan</label>
                <input
                  type="number"
                  value={newCatOrder}
                  onChange={(e) => setNewCatOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0D3B26] hover:bg-[#072518] text-white rounded-lg font-semibold"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
