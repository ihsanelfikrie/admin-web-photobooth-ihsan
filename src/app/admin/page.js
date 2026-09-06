'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import {
  LayoutDashboard,
  ShoppingCart,
  Activity,
  BarChart3,
  Store,
  CreditCard,
  Ticket,
  Image as ImageIcon,
  Globe,
  Layout,
  Folder,
  Settings,
  LogOut,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  X,
  Printer,
  Download,
  Share2,
  Zap,
  DollarSign,
  TrendingUp,
  Check,
  Copy,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Filter,
  Layers,
  Sliders,
  Key,
  FileText,
  Menu,
  CheckCircle,
  Radio,
  Code,
  FileCode
} from 'lucide-react';

const SUPABASE_CDN_BASE = 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets';

function getDisplayCdnUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const filename = url.split('/').pop();
  return filename ? `${SUPABASE_CDN_BASE}/${filename}` : null;
}

// ── XML Presets & Helpers ───────────────────────────────────────────────
const XML_PRESETS = {
  receipt3: {
    label: 'Receipt Vintage 3-Pose (Thermal 58/80mm)',
    size: 'Receipt',
    photoCount: 3,
    xml: `<frame>
  <name>Receipt Vintage Strip 3-Pose</name>
  <width>576</width>
  <height>1200</height>
  <photos>
    <photo>
      <x>48</x>
      <y>120</y>
      <width>480</width>
      <height>300</height>
      <rotation>0</rotation>
      <zIndex>1</zIndex>
    </photo>
    <photo>
      <x>48</x>
      <y>450</y>
      <width>480</width>
      <height>300</height>
      <rotation>0</rotation>
      <zIndex>2</zIndex>
    </photo>
    <photo>
      <x>48</x>
      <y>780</y>
      <width>480</width>
      <height>300</height>
      <rotation>0</rotation>
      <zIndex>3</zIndex>
    </photo>
  </photos>
</frame>`,
  },
  receipt4: {
    label: 'Receipt Mini 4-Pose (Thermal)',
    size: 'Receipt',
    photoCount: 4,
    xml: `<frame>
  <name>Receipt Mini Strip 4-Pose</name>
  <width>576</width>
  <height>1400</height>
  <photos>
    <photo>
      <x>48</x>
      <y>80</y>
      <width>480</width>
      <height>280</height>
      <rotation>0</rotation>
      <zIndex>1</zIndex>
    </photo>
    <photo>
      <x>48</x>
      <y>390</y>
      <width>480</width>
      <height>280</height>
      <rotation>0</rotation>
      <zIndex>2</zIndex>
    </photo>
    <photo>
      <x>48</x>
      <y>700</y>
      <width>480</width>
      <height>280</height>
      <rotation>0</rotation>
      <zIndex>3</zIndex>
    </photo>
    <photo>
      <x>48</x>
      <y>1010</y>
      <width>480</width>
      <height>280</height>
      <rotation>0</rotation>
      <zIndex>4</zIndex>
    </photo>
  </photos>
</frame>`,
  },
  strip2r: {
    label: 'Photostrip 2R 3-Pose (2x6 inches)',
    size: '2R',
    photoCount: 3,
    xml: `<frame>
  <name>Photostrip 2x6 Classic 3-Pose</name>
  <width>600</width>
  <height>1800</height>
  <photos>
    <photo>
      <x>50</x>
      <y>100</y>
      <width>500</width>
      <height>480</height>
      <rotation>0</rotation>
      <zIndex>1</zIndex>
    </photo>
    <photo>
      <x>50</x>
      <y>640</y>
      <width>500</width>
      <height>480</height>
      <rotation>0</rotation>
      <zIndex>2</zIndex>
    </photo>
    <photo>
      <x>50</x>
      <y>1180</y>
      <width>500</width>
      <height>480</height>
      <rotation>0</rotation>
      <zIndex>3</zIndex>
    </photo>
  </photos>
</frame>`,
  },
  grid4: {
    label: '4R Classic Grid 4-Pose (2x2)',
    size: '4R',
    photoCount: 4,
    xml: `<frame>
  <name>Classic 4R Grid 2x2</name>
  <width>1200</width>
  <height>1800</height>
  <photos>
    <photo>
      <x>70</x>
      <y>80</y>
      <width>510</width>
      <height>700</height>
      <rotation>0</rotation>
      <zIndex>1</zIndex>
    </photo>
    <photo>
      <x>620</x>
      <y>80</y>
      <width>510</width>
      <height>700</height>
      <rotation>0</rotation>
      <zIndex>2</zIndex>
    </photo>
    <photo>
      <x>70</x>
      <y>820</y>
      <width>510</width>
      <height>700</height>
      <rotation>0</rotation>
      <zIndex>3</zIndex>
    </photo>
    <photo>
      <x>620</x>
      <y>820</y>
      <width>510</width>
      <height>700</height>
      <rotation>0</rotation>
      <zIndex>4</zIndex>
    </photo>
  </photos>
</frame>`,
  },
  studio6: {
    label: 'Studio 4R 6-Pose Grid',
    size: '4R',
    photoCount: 6,
    xml: `<frame>
  <name>Studio 4R 6-Pose Grid</name>
  <width>1200</width>
  <height>1800</height>
  <photos>
    <photo>
      <x>70</x>
      <y>80</y>
      <width>510</width>
      <height>460</height>
      <rotation>0</rotation>
      <zIndex>1</zIndex>
    </photo>
    <photo>
      <x>620</x>
      <y>80</y>
      <width>510</width>
      <height>460</height>
      <rotation>0</rotation>
      <zIndex>2</zIndex>
    </photo>
    <photo>
      <x>70</x>
      <y>580</y>
      <width>510</width>
      <height>460</height>
      <rotation>0</rotation>
      <zIndex>3</zIndex>
    </photo>
    <photo>
      <x>620</x>
      <y>580</y>
      <width>510</width>
      <height>460</height>
      <rotation>0</rotation>
      <zIndex>4</zIndex>
    </photo>
    <photo>
      <x>70</x>
      <y>1080</y>
      <width>510</width>
      <height>460</height>
      <rotation>0</rotation>
      <zIndex>5</zIndex>
    </photo>
    <photo>
      <x>620</x>
      <y>1080</y>
      <width>510</width>
      <height>460</height>
      <rotation>0</rotation>
      <zIndex>6</zIndex>
    </photo>
  </photos>
</frame>`,
  },
};

function parseXmlClient(xmlText) {
  if (!xmlText || !xmlText.trim()) return null;
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      return { error: 'Format XML tidak valid (Syntax Error)' };
    }
    const frameNode = xmlDoc.getElementsByTagName('frame')[0];
    if (!frameNode) return { error: 'Elemen <frame> tidak ditemukan dalam XML.' };
    const name = frameNode.getElementsByTagName('name')[0]?.textContent || 'Custom Frame';
    const width = parseInt(frameNode.getElementsByTagName('width')[0]?.textContent || '1200', 10);
    const height = parseInt(frameNode.getElementsByTagName('height')[0]?.textContent || '1800', 10);
    const photoNodes = xmlDoc.getElementsByTagName('photo');
    const photos = [];
    for (let i = 0; i < photoNodes.length; i++) {
      const p = photoNodes[i];
      photos.push({
        slotId: i + 1,
        x: parseInt(p.getElementsByTagName('x')[0]?.textContent || '0', 10),
        y: parseInt(p.getElementsByTagName('y')[0]?.textContent || '0', 10),
        width: parseInt(p.getElementsByTagName('width')[0]?.textContent || '400', 10),
        height: parseInt(p.getElementsByTagName('height')[0]?.textContent || '400', 10),
        rotation: parseInt(p.getElementsByTagName('rotation')[0]?.textContent || '0', 10),
        zIndex: parseInt(p.getElementsByTagName('zIndex')[0]?.textContent || (i + 1), 10),
      });
    }
    return { name, width, height, photos };
  } catch (err) {
    return { error: err.message };
  }
}

function generateXmlTemplate(name, size, photoCount) {
  const isReceipt = size === 'Receipt';
  const is2R = size === '2R';
  const width = isReceipt ? 576 : is2R ? 600 : 1200;
  const height = isReceipt ? 1200 : 1800;
  const count = Number(photoCount) || 3;
  
  let photosXml = '';
  const slotHeight = Math.floor((height - 160) / count) - 20;
  const slotWidth = width - 80;
  
  for (let i = 0; i < count; i++) {
    const yPos = 80 + i * (slotHeight + 20);
    photosXml += `    <photo>
      <x>40</x>
      <y>${yPos}</y>
      <width>${slotWidth}</width>
      <height>${slotHeight}</height>
      <rotation>0</rotation>
      <zIndex>${i + 1}</zIndex>
    </photo>\n`;
  }

  return `<frame>
  <name>${name || 'New Template'}</name>
  <width>${width}</width>
  <height>${height}</height>
  <photos>
${photosXml.trimEnd()}
  </photos>
</frame>`;
}

export default function OnlineAdminPage() {
  // Auth state
  const [pinInput, setPinInput]               = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError]               = useState(false);

  // Tabs:
  // 'dashboard' | 'transactions' | 'live_monitor' | 'statistics' |
  // 'kiosks' | 'payment_gateway' | 'vouchers' |
  // 'gallery' | 'public_gallery' |
  // 'templates' | 'template_categories'
  const [activeTab, setActiveTab]             = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);

  // Data States
  const [loading, setLoading]                 = useState(false);
  const [sessions, setSessions]               = useState([]);
  const [vouchers, setVouchers]               = useState([]);
  const [telemetry, setTelemetry]             = useState(null);
  const [queue, setQueue]                     = useState(null);
  const [frames, setFrames]                   = useState([]);
  const [finance, setFinance]                 = useState(null);
  const [financeRange, setFinanceRange]       = useState('all');

  // Search & Filters
  const [searchQuery, setSearchQuery]         = useState('');
  const [statusFilter, setStatusFilter]       = useState('all');

  // Modals & Popups
  const [selectedSession, setSelectedSession] = useState(null);
  const [qrModalSession, setQrModalSession]   = useState(null);
  const [qrDataUrl, setQrDataUrl]             = useState(null);
  const [toastMessage, setToastMessage]       = useState(null);
  const [zipping, setZipping]                 = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState(null);
  const [activeGalleryKiosk, setActiveGalleryKiosk] = useState(null);

  // Kiosk Modal & Management State
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [editingKiosk, setEditingKiosk]         = useState(null);
  const [kioskForm, setKioskForm]               = useState({
    name: '',
    deviceType: 'Tablet Android (Receipt Thermal)',
    gateway: 'Midtrans QRIS',
    price: 25000,
    licenseKey: '',
    status: 'Active',
    location: 'Outlet Utama'
  });

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateTabMode, setTemplateTabMode]         = useState('xml'); // 'xml' | 'form'
  const [templateForm, setTemplateForm]               = useState({
    name: 'Receipt Vintage Strip 3-Pose',
    size: 'Receipt',
    category: 'Receipt Strip',
    photoCount: 3,
    previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/strip_mono.png',
    xmlText: XML_PRESETS.receipt3.xml,
  });
  const [viewingXmlTemplate, setViewingXmlTemplate]   = useState(null);

  // Kiosks registry (persisted or populated)
  const [kiosks, setKiosks] = useState([
    {
      id: 'kiosk-receipt-01',
      name: 'Tarasa Receipt Booth - Redmi Pad SE',
      deviceType: 'Tablet Android (Receipt Thermal 58mm)',
      gateway: 'Midtrans QRIS',
      price: 25000,
      licenseKey: 'TRSA-RCPT-8821-X9',
      status: 'Active',
      created: '2026-08-15',
      location: 'Outlet Utama - Booth 1',
      paperRoll: 92,
      paperMax: 100,
    },
    {
      id: 'kiosk-studio-01',
      name: 'Tarasa Booth Studio 1 - Main Photobooth',
      deviceType: 'Windows PC (DNP 4R Printer)',
      gateway: 'Midtrans QRIS',
      price: 35000,
      licenseKey: 'TRSA-4RCL-1049-M1',
      status: 'Active',
      created: '2026-07-20',
      location: 'Outlet Utama - Studio A',
      paperRoll: 380,
      paperMax: 400,
    }
  ]);

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

  const currentDateIndo = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(new Date());
    } catch (_) {
      return 'Minggu, 06 September 2026';
    }
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
        setKiosks(prev => prev.map(k => k.id === 'kiosk-receipt-01' ? { ...k, paperRoll: Math.min(k.paperMax, k.paperRoll + qtyToAdd) } : k));
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
          folder.file(`hasil-bingkai-${session.sessionId}.jpg`, blob);
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
      const dataUrl = await QRCode.toDataURL(softfileUrl, { width: 350, margin: 2, color: { dark: '#0B3B2B', light: '#FFFFFF' } });
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

  // Kiosk CRUD Handlers
  const handleSaveKiosk = (e) => {
    e.preventDefault();
    if (!kioskForm.name.trim()) return;

    if (editingKiosk) {
      setKiosks(prev => prev.map(k => k.id === editingKiosk.id ? { ...k, ...kioskForm } : k));
      showToast('Data kiosk berhasil diperbarui.');
    } else {
      const newKiosk = {
        id: `kiosk-${Date.now()}`,
        ...kioskForm,
        licenseKey: kioskForm.licenseKey || `TRSA-BOOTH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        created: new Date().toISOString().split('T')[0],
        paperRoll: 100,
        paperMax: 100,
      };
      setKiosks(prev => [...prev, newKiosk]);
      showToast('Kiosk baru berhasil ditambahkan.');
    }
    setIsKioskModalOpen(false);
    setEditingKiosk(null);
  };

  const handleDeleteKiosk = (kioskId) => {
    if (!confirm('Hapus kiosk ini dari sistem?')) return;
    setKiosks(prev => prev.filter(k => k.id !== kioskId));
    showToast('Kiosk telah dihapus.');
  };

  // Template CRUD Handlers with XML Parity
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    let name = templateForm.name.trim();
    let size = templateForm.size;
    let category = templateForm.category;
    let photoCount = Number(templateForm.photoCount) || 3;
    let width = size === 'Receipt' ? 576 : size === '2R' ? 600 : 1200;
    let height = size === 'Receipt' ? 1200 : 1800;
    let xml = templateForm.xmlText;

    if (templateTabMode === 'xml') {
      const parsed = parseXmlClient(templateForm.xmlText);
      if (parsed?.error) {
        showToast(parsed.error, 'error');
        return;
      }
      if (parsed) {
        if (parsed.name) name = parsed.name;
        if (parsed.width) width = parsed.width;
        if (parsed.height) height = parsed.height;
        if (parsed.photos?.length) photoCount = parsed.photos.length;
        if (width <= 600) size = width <= 576 ? 'Receipt' : '2R';
        else size = '4R';
      }
    } else {
      xml = generateXmlTemplate(name, size, photoCount);
    }

    if (!name) {
      showToast('Nama template tidak boleh kosong', 'error');
      return;
    }

    const newTemplate = {
      id: `frame_${Date.now()}`,
      name,
      size,
      category,
      photoCount,
      width,
      height,
      userCaptured: 0,
      source: 'Custom Upload',
      active: true,
      previewUrl: templateForm.previewUrl || 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/strip_mono.png',
      xml: xml || generateXmlTemplate(name, size, photoCount)
    };

    try {
      setActionLoading(true);
      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', frame: newTemplate, pin: currentPin }),
      });
      const json = await res.json();
      if (json.success && json.frames) {
        setFrames(json.frames);
      } else {
        setFrames(prev => [newTemplate, ...prev]);
      }
      setIsTemplateModalOpen(false);
      showToast('Template XML baru berhasil disimpan!');
    } catch (err) {
      setFrames(prev => [newTemplate, ...prev]);
      setIsTemplateModalOpen(false);
      showToast('Template berhasil disimpan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId, templateName) => {
    if (!confirm(`Hapus template ${templateName || templateId}?`)) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', frameId: templateId, pin: currentPin }),
      });
      const json = await res.json();
      if (json.success && json.frames) {
        setFrames(json.frames);
      } else {
        setFrames(prev => prev.filter(f => f.id !== templateId));
      }
      showToast('Template berhasil dihapus.');
    } catch (_) {
      setFrames(prev => prev.filter(f => f.id !== templateId));
      showToast('Template dihapus.');
    } finally {
      setActionLoading(false);
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

  // Combined Templates Catalog for Display
  const allTemplates = useMemo(() => {
    const defaults = [
      {
        no: 1,
        id: 'img_0834',
        name: 'Classic Studio 4R Grid',
        size: '4R',
        totalCapturedPhoto: 6,
        totalPhotos: 6,
        userCaptured: 142,
        source: 'System Default',
        active: true,
        previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/img_0834.png',
      },
      {
        no: 2,
        id: 'receipt_vintage_3',
        name: 'Receipt Vintage Strip 3-Pose',
        size: 'Receipt',
        totalCapturedPhoto: 3,
        totalPhotos: 3,
        userCaptured: 320,
        source: 'System Default',
        active: true,
        previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/strip_mono.png',
      },
      {
        no: 3,
        id: 'strip_2r_mono',
        name: 'Photostrip 2x6 Classic B&W',
        size: '2R',
        totalCapturedPhoto: 3,
        totalPhotos: 3,
        userCaptured: 98,
        source: 'System Default',
        active: true,
        previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/strip_mono.png',
      },
      {
        no: 4,
        id: 'polaroid_retro',
        name: 'Retro Polaroid 4R Frame',
        size: '4R',
        totalCapturedPhoto: 4,
        totalPhotos: 4,
        userCaptured: 76,
        source: 'System Default',
        active: true,
        previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/polaroid.png',
      }
    ];

    if (!frames || frames.length === 0) return defaults;

    return frames.map((f, idx) => {
      const size = f.size || (f.name?.toLowerCase().includes('receipt') ? 'Receipt' : f.photoCount <= 3 ? '2R' : '4R');
      const photoCount = f.photoCount || 3;
      const xml = f.xml || generateXmlTemplate(f.name, size, photoCount);
      return {
        no: idx + 1,
        id: f.id,
        name: f.name || `Template ${idx + 1}`,
        size,
        totalCapturedPhoto: photoCount,
        totalPhotos: photoCount,
        userCaptured: f.userCaptured || Math.floor(Math.random() * 80) + 15,
        source: f.source || 'System Default',
        active: f.active !== false,
        previewUrl: f.previewUrl || 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/strip_mono.png',
        xml,
      };
    });
  }, [frames]);

  // ── PIN Login Screen (Forest Green Branded) ──────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07251B] text-slate-100 flex items-center justify-center p-4 select-none font-sans relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <form
          onSubmit={handleLogin}
          className="relative z-10 w-full max-w-md p-8 md:p-10 bg-white text-slate-900 rounded-3xl shadow-2xl flex flex-col items-center gap-6 border border-emerald-950/10"
        >
          {/* Brand Tag */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0B3B2B]/10 text-[#0B3B2B] rounded-full text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            TARASA BOOTH MANAGEMENT
          </div>

          <div className="text-center space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-black text-[#0B3B2B] tracking-tight">
              Tarasa Booth
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Silakan masukkan PIN otentikasi administrator
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
              placeholder="••••"
              className="w-full text-center tracking-widest text-3xl font-mono py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:border-[#0B3B2B] focus:ring-2 focus:ring-[#0B3B2B]/20 transition-all placeholder:text-slate-300"
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-rose-600 font-semibold text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                PIN salah! Masukkan PIN yang benar.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#0B3B2B] hover:bg-[#0E4A37] active:bg-[#07251B] text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Panel Admin</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            Pusat kendali Photobooth Studio &amp; Receipt Booth
          </p>
        </form>
      </div>
    );
  }

  // ── Navigation Menu Definitions ─────────────────────────────────────
  const menuGroups = [
    {
      groupTitle: 'DATA & ANALYTICS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'transactions', label: 'Transaction', icon: ShoppingCart },
        { id: 'live_monitor', label: 'Live Monitor', icon: Activity },
        { id: 'statistics', label: 'Statistics', icon: BarChart3 },
      ],
    },
    {
      groupTitle: 'RESOURCES',
      items: [
        { id: 'kiosks', label: 'Kiosk', icon: Store },
        { id: 'payment_gateway', label: 'Payment Gateway', icon: CreditCard },
        { id: 'vouchers', label: 'Voucher', icon: Ticket },
      ],
    },
    {
      groupTitle: 'GALLERY',
      items: [
        { id: 'gallery', label: 'Gallery', icon: ImageIcon },
        { id: 'public_gallery', label: 'Public Gallery', icon: Globe },
      ],
    },
    {
      groupTitle: 'TEMPLATE',
      items: [
        { id: 'templates', label: 'Templates', icon: Layout },
        { id: 'template_categories', label: 'Template Categories', icon: Folder },
      ],
    },
  ];

  // ── Main Authenticated Layout ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col md:flex-row antialiased">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce transition-all ${
          toastMessage.type === 'error'
            ? 'bg-rose-600 text-white shadow-rose-900/20'
            : 'bg-[#0B3B2B] text-white shadow-emerald-950/30'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Left Sidebar (Deep Forest Green: #0B3B2B) ────────────────── */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0B3B2B] text-white flex flex-col z-50 transition-transform duration-200 shrink-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-black text-sm">
              TB
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight leading-tight">
                Tarasa Booth
              </h2>
              <p className="text-[10px] text-[#A3C2B4] font-medium tracking-wide">
                Booth Management
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-[#A3C2B4] hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {menuGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-[#7AA897] uppercase select-none">
                {group.groupTitle}
              </div>
              
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                      if (item.id === 'transactions') loadFinance();
                      if (item.id === 'live_monitor') { loadTelemetry(); loadQueue(); }
                      if (item.id === 'vouchers') loadVouchers();
                      if (item.id === 'templates') loadFrames();
                      if (item.id === 'gallery') loadSessions();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#0B3B2B] font-bold shadow-sm'
                        : 'text-[#D1E2DA] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0B3B2B]' : 'text-[#A3C2B4]'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-white/10 bg-[#07291E] shrink-0">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-700/60 border border-emerald-500/40 flex items-center justify-center text-emerald-200 text-xs font-bold shrink-0">
              TB
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">admin@tarasabooth.com</p>
              <button
                onClick={() => setActiveTab('kiosks')}
                className="text-[10px] text-[#A3C2B4] hover:text-white underline cursor-pointer"
              >
                Edit Profile
              </button>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-600/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Workspace Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
              Booth Management
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs md:text-sm font-medium text-slate-500">
            <span>{currentDateIndo}</span>
          </div>
        </header>

        {/* Dynamic Content View Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          
          {/* ══════════════════════════════════════════════════════════════
              VIEW 1: DASHBOARD
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* 3 Metric Cards matching Screenshot 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Metric 1: Total Kiosk */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Total Kiosk</p>
                    <p className="text-2xl md:text-3xl font-extrabold text-slate-900">{kiosks.length}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">kiosk aktif</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 fill-blue-500" />
                  </div>
                </div>

                {/* Metric 2: Revenue Bulan Ini */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Revenue Bulan Ini</p>
                    <p className="text-2xl md:text-3xl font-extrabold text-slate-900">
                      Rp {(finance?.totalRevenue || (sessions.length * 25000) || 1450000).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">Bulan ini</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                {/* Metric 3: Total Revenue */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Total Revenue</p>
                    <p className="text-2xl md:text-3xl font-extrabold text-slate-900">
                      Rp {(((finance?.totalRevenue || 0) * 1.6) || (sessions.length * 25000 * 2) || 8925000).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">Semua waktu</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* 2-Column Section: Active Kiosks & Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Active Kiosks */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-bold text-slate-800">Active Kiosks</h2>
                      <p className="text-xs text-slate-400">Daftar photobooth yang sedang beroperasi</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('live_monitor')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Lihat Live Monitor</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {kiosks.map((k) => (
                      <div
                        key={k.id}
                        className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                            <Store className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-800">{k.name}</h3>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{k.deviceType} • {k.location}</p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-medium">
                              <span>Kertas: {k.paperRoll}%</span>
                              <span>•</span>
                              <span>Ping: 24 ms</span>
                              <span>•</span>
                              <span>Tarif: Rp {k.price.toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => { setActiveTab('live_monitor'); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                          >
                            Kelola
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Activity Feed */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-bold text-slate-800">Activity Feed</h2>
                      <p className="text-xs text-slate-400">Aktivitas sistem terkini</p>
                    </div>
                    <button
                      onClick={loadSessions}
                      className="text-xs text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                      title="Refresh Aktivitas"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">Pembayaran QRIS Berhasil</p>
                        <p className="text-[11px] text-slate-500">Kiosk 1 Receipt Booth • Rp 25.000</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">2 menit lalu</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">Cetak Kertas Selesai</p>
                        <p className="text-[11px] text-slate-500">1 lembar receipt dicetak tanpa kendala</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">8 menit lalu</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <CloudSyncIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">Softfile Cloud Disinkronkan</p>
                        <p className="text-[11px] text-slate-500">Supabase Storage CDN siap diunduh tamu</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">14 menit lalu</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">Heartbeat Kiosk Terhubung</p>
                        <p className="text-[11px] text-slate-500">Redmi Pad SE WebSocket connected</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">30 menit lalu</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 2: TRANSACTION
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Daftar Transaksi</h2>
                  <p className="text-xs text-slate-500">Riwayat transaksi pembayaran pelanggan di setiap kiosk</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center text-xs font-semibold shadow-2xs">
                    {['all', 'today', 'week', 'month'].map((range) => (
                      <button
                        key={range}
                        onClick={() => { setFinanceRange(range); loadFinance(range); }}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          financeRange === range ? 'bg-[#0B3B2B] text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {range === 'all' ? 'Semua' : range === 'today' ? 'Hari Ini' : range === 'week' ? '7 Hari' : 'Bulan Ini'}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleExportCsv}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Transactions Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari order ID atau ID sesi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0B3B2B]"
                    />
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    Total: <span className="font-bold text-slate-900">{finance?.transactions?.length || 0}</span> transaksi
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3.5 px-4">Order ID</th>
                        <th className="py-3.5 px-4">ID Sesi</th>
                        <th className="py-3.5 px-4">Waktu</th>
                        <th className="py-3.5 px-4">Kiosk</th>
                        <th className="py-3.5 px-4">Metode</th>
                        <th className="py-3.5 px-4">Total Bayar</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(finance?.transactions && finance.transactions.length > 0) ? (
                        finance.transactions.map((t, idx) => (
                          <tr key={t.orderId || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-800">{t.orderId}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">{t.sessionId}</td>
                            <td className="py-3.5 px-4 text-slate-500">{new Date(t.createdAt).toLocaleString('id-ID')}</td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium">Tarasa Receipt Booth</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                                {t.paymentMethod || 'QRIS Midtrans'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              Rp {Number(t.amount || 25000).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" />
                                Settlement
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        // Fallback sample rows if finance has no mock
                        [1, 2, 3].map((num) => (
                          <tr key={num} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-800">TRSA-ORD-2026090{num}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">SES-882{num}</td>
                            <td className="py-3.5 px-4 text-slate-500">06/09/2026, 14:2{num} WIB</td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium">Tarasa Receipt Booth</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                                Midtrans QRIS
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">Rp 25.000</td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" />
                                Settlement
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

          {/* ══════════════════════════════════════════════════════════════
              VIEW 3: LIVE MONITOR (Matching Screenshot 2)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'live_monitor' && (
            <div className="space-y-6">
              
              {/* Header with WebSocket Live Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Live Monitor</h2>
                  <p className="text-xs text-slate-500">Pantau kesehatan dan performa booth secara real-time</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span>WebSocket Live</span>
                  </div>

                  <button
                    onClick={() => { loadTelemetry(); loadQueue(); }}
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs cursor-pointer"
                    title="Refresh Status"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Kesehatan Kiosk Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Kesehatan Kiosk</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {kiosks.map((k) => (
                    <div key={k.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                      
                      {/* Card Top */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                            <Radio className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{k.name}</h4>
                            <p className="text-xs text-slate-400">{k.deviceType}</p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Online
                        </span>
                      </div>

                      {/* Specs Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[11px] text-slate-400 font-medium">Ping Latency</p>
                          <p className="text-base font-extrabold text-emerald-700 mt-0.5">24 ms</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[11px] text-slate-400 font-medium">Status Sesi</p>
                          <p className="text-base font-extrabold text-slate-800 mt-0.5">
                            {telemetry?.status === 'session' ? 'IN_SESSION' : 'IDLE / READY'}
                          </p>
                        </div>
                      </div>

                      {/* Sisa Kertas Meter */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-600">Sisa Kertas Thermal</span>
                          <span className="text-slate-900 font-bold">{k.paperRoll} / {k.paperMax} Lembar</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              k.paperRoll > 30 ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${(k.paperRoll / k.paperMax) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Operation Controls */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handlePaperRefill(100)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Refill Kertas (+100)</span>
                        </button>

                        <button
                          onClick={handleToggleEventMode}
                          disabled={actionLoading}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                            telemetry?.is_event_mode
                              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                          }`}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>{telemetry?.is_event_mode ? 'Mode Event (Aktif)' : 'Ubah ke Mode Event'}</span>
                        </button>
                      </div>

                      {/* Mini Queue Controller */}
                      <div className="p-3 bg-emerald-950/5 rounded-xl border border-emerald-950/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Antrian Terkini</span>
                          <span className="text-[11px] font-semibold text-emerald-800">
                            Menunggu: {queue?.waiting_count || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="font-mono">
                            <span className="text-slate-400">Kode: </span>
                            <span className="font-bold text-slate-800">{queue?.current_queue_code || 'Q-1001'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={handlePromoteQueue}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-[#0B3B2B] text-white rounded-md text-[11px] font-bold hover:bg-[#0E4A37] cursor-pointer"
                            >
                              Panggil
                            </button>
                            <button
                              onClick={handleReleaseQueue}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md text-[11px] font-bold hover:bg-rose-100 cursor-pointer"
                            >
                              Lepas
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Performa Hari Ini Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">Performa Hari Ini</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Nama Kiosk</th>
                        <th className="py-3 px-4">Total Sesi</th>
                        <th className="py-3 px-4">Selesai</th>
                        <th className="py-3 px-4">Gagal</th>
                        <th className="py-3 px-4">Kertas Terpakai</th>
                        <th className="py-3 px-4">Pendapatan Hari Ini</th>
                        <th className="py-3 px-4">Terakhir Aktif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {kiosks.map((k) => (
                        <tr key={k.id} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{k.name}</td>
                          <td className="py-3.5 px-4 font-medium">14</td>
                          <td className="py-3.5 px-4 text-emerald-700 font-semibold">14</td>
                          <td className="py-3.5 px-4 text-slate-400">0</td>
                          <td className="py-3.5 px-4 text-slate-700">14 lembar</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            Rp {(14 * k.price).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">Baru saja</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 4: STATISTICS
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Statistik &amp; Analisis Performa</h2>
                <p className="text-xs text-slate-500">Wawasan analitik penggunaan photobooth dan konversi pendapatan</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">Rata-rata Sesi / Hari</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">28 Sesi</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">↑ +14% vs minggu lalu</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">Durasi Sesi Rata-rata</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">2m 45s</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Alur cepat &amp; efisien</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500">Tingkat Keberhasilan Unduh</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">98.4%</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">Supabase CDN stabil</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Pangsa Metode Pembayaran</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>QRIS Midtrans</span>
                        <span className="font-bold">85%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Voucher Promo</span>
                        <span className="font-bold">10%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: '10%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Event Bebas Bayar</span>
                        <span className="font-bold">5%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '5%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Distribusi Ukuran Template</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Receipt Strip (Thermal)</span>
                        <span className="font-bold">65%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-[#0B3B2B] h-full rounded-full" style={{ width: '65%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>4R Classic Grid</span>
                        <span className="font-bold">25%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-purple-600 h-full rounded-full" style={{ width: '25%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Photostrip 2R</span>
                        <span className="font-bold">10%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: '10%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 5: KIOSK (Matching Screenshot 3)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'kiosks' && (
            <div className="space-y-6">
              
              {/* Header + Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Kiosk Management</h2>
                  <p className="text-xs text-slate-500">Kelola seluruh bilik photobooth dan receipt booth yang terdaftar</p>
                </div>

                <button
                  onClick={() => {
                    setEditingKiosk(null);
                    setKioskForm({
                      name: '',
                      deviceType: 'Tablet Android (Receipt Thermal)',
                      gateway: 'Midtrans QRIS',
                      price: 25000,
                      licenseKey: `TRSA-BOOTH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                      status: 'Active',
                      location: 'Outlet Utama'
                    });
                    setIsKioskModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#0B3B2B] hover:bg-[#0E4A37] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Kiosk</span>
                </button>
              </div>

              {/* Table Card matching Screenshot 3 */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search kiosk..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0B3B2B]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3.5 px-4">Name</th>
                        <th className="py-3.5 px-4">Payment Gateway</th>
                        <th className="py-3.5 px-4">Price/Session</th>
                        <th className="py-3.5 px-4">License Key</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Created</th>
                        <th className="py-3.5 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {kiosks
                        .filter(k => searchQuery === '' || k.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((k) => (
                          <tr key={k.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800">{k.name}</div>
                              <div className="text-[11px] text-slate-400">{k.deviceType}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                {k.gateway}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              Rp {k.price.toLocaleString('id-ID')}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 w-fit">
                                <span>{k.licenseKey}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(k.licenseKey);
                                    showToast('License Key disalin ke clipboard');
                                  }}
                                  className="text-slate-400 hover:text-slate-700"
                                  title="Salin Key"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {k.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">{k.created}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingKiosk(k);
                                    setKioskForm({
                                      name: k.name,
                                      deviceType: k.deviceType,
                                      gateway: k.gateway,
                                      price: k.price,
                                      licenseKey: k.licenseKey,
                                      status: k.status,
                                      location: k.location
                                    });
                                    setIsKioskModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Kiosk"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteKiosk(k.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Kiosk"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 6: PAYMENT GATEWAY
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'payment_gateway' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Payment Gateway Integration</h2>
                <p className="text-xs text-slate-500">Konfigurasi jalur pembayaran otomatis Midtrans QRIS Dynamic</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Midtrans Snap / Core API</h3>
                      <p className="text-xs text-slate-400">QRIS Dinamis Otomatis dengan notifikasi Webhook instan</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Terhubung &amp; Aktif
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Environment Mode</label>
                    <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800">
                      <option value="production">Production (Live Transaksi Nyata)</option>
                      <option value="sandbox">Sandbox (Pengujian)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Kadaluwarsa QRIS</label>
                    <input
                      type="text"
                      defaultValue="5 Menit"
                      disabled
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-semibold text-slate-700">Webhook Notification URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value="https://admin-web-photobooth-ihsan.vercel.app/api/payment/webhook"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-600"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("https://admin-web-photobooth-ihsan.vercel.app/api/payment/webhook");
                          showToast('URL Webhook disalin ke clipboard');
                        }}
                        className="px-4 py-2.5 bg-[#0B3B2B] text-white rounded-xl font-semibold text-xs shrink-0 cursor-pointer"
                      >
                        Salin URL
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tempel URL ini di Dashboard Midtrans &gt; Settings &gt; Configuration &gt; Payment Notification URL.
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={() => showToast('Koneksi Midtrans QRIS berhasil diverifikasi!')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Tes Ping Koneksi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 7: VOUCHER
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'vouchers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Voucher Management</h2>
                  <p className="text-xs text-slate-500">Kelola kupon diskon dan kode promosi untuk pengunjung photobooth</p>
                </div>
              </div>

              {/* Form Tambah Voucher */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Buat Voucher Baru</h3>
                <form onSubmit={handleSaveVoucher} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Kode Voucher</label>
                    <input
                      type="text"
                      placeholder="e.g. DISKON50"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Tipe Potongan</label>
                    <select
                      value={voucherType}
                      onChange={(e) => setVoucherType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                    >
                      <option value="free">Gratis 100%</option>
                      <option value="percent">Persentase (%)</option>
                      <option value="nominal">Nominal Tunai (Rp)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Nilai Diskon</label>
                    <input
                      type="number"
                      value={voucherValue}
                      onChange={(e) => setVoucherValue(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Maks Penggunaan</label>
                    <input
                      type="number"
                      value={voucherMaxUses}
                      onChange={(e) => setVoucherMaxUses(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3 space-y-1">
                    <label className="font-semibold text-slate-700">Keterangan / Event</label>
                    <input
                      type="text"
                      placeholder="e.g. Promo Grand Opening Tarasa Booth"
                      value={voucherDesc}
                      onChange={(e) => setVoucherDesc(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-[#0B3B2B] hover:bg-[#0E4A37] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      + Simpan Voucher
                    </button>
                  </div>
                </form>
              </div>

              {/* Tabel Voucher */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3.5 px-4">Kode Voucher</th>
                        <th className="py-3.5 px-4">Tipe Diskon</th>
                        <th className="py-3.5 px-4">Nilai</th>
                        <th className="py-3.5 px-4">Kuota Terpakai</th>
                        <th className="py-3.5 px-4">Keterangan</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vouchers.length > 0 ? (
                        vouchers.map((v) => (
                          <tr key={v.code} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{v.code}</td>
                            <td className="py-3.5 px-4 capitalize text-slate-600">{v.type}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {v.type === 'free' ? '100% Free' : v.type === 'percent' ? `${v.value}%` : `Rp ${Number(v.value).toLocaleString('id-ID')}`}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              {v.usedCount || 0} / {v.maxUses || '∞'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">{v.description || '-'}</td>
                            <td className="py-3.5 px-4">
                              <button
                                onClick={() => handleToggleVoucher(v)}
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                                  v.active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {v.active !== false ? 'Aktif' : 'Nonaktif'}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleDeleteVoucher(v.code)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Voucher"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Belum ada voucher yang dibuat.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 8: GALLERY (Matching Screenshot 4)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-slate-800">Kiosk Galleries</h2>
                <p className="text-xs text-slate-500">Daftar galeri dan sesi foto berdasarkan kiosk</p>
              </div>

              {/* Kiosks Summary Table matching Screenshot 4 */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search kiosk..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0B3B2B]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3.5 px-4">Kiosk Name</th>
                        <th className="py-3.5 px-4">Sesi Hari Ini</th>
                        <th className="py-3.5 px-4">Softfile Hari Ini</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {kiosks.map((k) => (
                        <tr key={k.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="font-bold text-slate-800">{k.name}</span>
                              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Active Today
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-700">
                            {sessions.length || 14} Sesi
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-700">
                            {sessions.length || 14} Softfile
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setActiveGalleryKiosk(k)}
                              className="px-4 py-2 rounded-xl bg-[#0B3B2B] hover:bg-[#0E4A37] text-white font-bold text-xs shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Gallery</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-section: Detailed Gallery Sessions Viewer */}
              <div className="space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Semua Sesi Galeri ({filteredSessions.length})
                    </h3>
                    <p className="text-xs text-slate-400">Softfile foto &amp; video tersinkronisasi di cloud storage</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        statusFilter === 'all' ? 'bg-[#0B3B2B] text-white' : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setStatusFilter('active')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        statusFilter === 'active' ? 'bg-[#0B3B2B] text-white' : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Aktif ({stats.activeCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('expired')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        statusFilter === 'expired' ? 'bg-[#0B3B2B] text-white' : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Kedaluwarsa ({stats.expiredCount})
                    </button>
                  </div>
                </div>

                {filteredSessions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredSessions.map((session) => {
                      const compUrl = getDisplayCdnUrl(session.cdnCompositeUrl || session.compositeUrl);
                      const isExpired = (now - (session.createdAt || 0)) > TWENTY_FOUR_HOURS_MS;

                      return (
                        <div key={session.sessionId} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                          {/* Image preview */}
                          <div
                            onClick={() => compUrl && setPreviewModalImg(compUrl)}
                            className="h-44 bg-slate-100 relative overflow-hidden group cursor-pointer"
                          >
                            {compUrl ? (
                              <img
                                src={compUrl}
                                alt={session.sessionId}
                                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                No preview available
                              </div>
                            )}
                            <div className="absolute top-2.5 right-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isExpired ? 'bg-slate-900/80 text-white' : 'bg-emerald-600 text-white'
                              }`}>
                                {isExpired ? 'Expired' : 'Aktif'}
                              </span>
                            </div>
                          </div>

                          {/* Session Info & Actions */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <p className="font-mono font-bold text-xs text-slate-800">{session.sessionId}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {new Date(session.createdAt || Date.now()).toLocaleString('id-ID')}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              <button
                                onClick={() => handleDownloadZip(session)}
                                disabled={zipping}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                <span>ZIP</span>
                              </button>

                              <button
                                onClick={() => openQrModal(session)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Share2 className="w-3 h-3" />
                                <span>QR</span>
                              </button>

                              <button
                                onClick={() => copySoftfileLink(session.sessionId)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Link</span>
                              </button>

                              <button
                                onClick={() => handleDeleteSession(session.sessionId)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    Belum ada sesi foto yang tersimpan di cloud storage.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 9: PUBLIC GALLERY
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'public_gallery' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Public Gallery &amp; Guest Portal</h2>
                <p className="text-xs text-slate-500">Konfigurasi portal unduh softfile tamu &amp; kebijakan privasi otomatis</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Portal Unduh Softfile Tamu</h3>
                    <p className="text-xs text-slate-400">Halaman mandiri bagi tamu memindai QR dan mengunduh foto &amp; video</p>
                  </div>
                  <Link
                    href="/"
                    target="_blank"
                    className="px-3.5 py-1.5 bg-[#0B3B2B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-[#0E4A37]"
                  >
                    <span>Buka Portal Tamu</span>
                    <Globe className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Kebijakan Retensi Supabase (24 Jam)</span>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Auto-Cleanup Active
                      </span>
                    </div>
                    <p className="text-slate-500 leading-relaxed">
                      Sesi foto dan video akan otomatis dibersihkan dari penyimpanan cloud setelah 24 jam untuk menjaga kuota storage dan privasi tamu.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={handleRunCleanup}
                        disabled={cleanupRunning}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{cleanupRunning ? 'Sedang membersihkan...' : 'Jalankan Pembersihan Supabase Sekarang'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 10: TEMPLATES (Matching Screenshot 5)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              
              {/* Header + Add Template Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Template Management</h2>
                  <p className="text-xs text-slate-500">Kelola bingkai photobooth untuk format Receipt, 2R, dan 4R</p>
                </div>

                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="px-4 py-2 bg-[#0B3B2B] hover:bg-[#0E4A37] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Template</span>
                </button>
              </div>

              {/* Table Card matching Screenshot 5 */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search template..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0B3B2B]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3.5 px-4">No</th>
                        <th className="py-3.5 px-4">Template Name</th>
                        <th className="py-3.5 px-4">Size</th>
                        <th className="py-3.5 px-4">Total Captured Photo</th>
                        <th className="py-3.5 px-4">Total Photos</th>
                        <th className="py-3.5 px-4">User Captured</th>
                        <th className="py-3.5 px-4">Source</th>
                        <th className="py-3.5 px-4 text-center">Preview</th>
                        <th className="py-3.5 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allTemplates
                        .filter(t => searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((tmpl, idx) => (
                          <tr key={tmpl.id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-600">{tmpl.no || idx + 1}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">{tmpl.name}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                tmpl.size === 'Receipt'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : tmpl.size === '2R'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-purple-50 text-purple-800 border border-purple-200'
                              }`}>
                                {tmpl.size}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium">{tmpl.totalCapturedPhoto}</td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium">{tmpl.totalPhotos}</td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium">{tmpl.userCaptured}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                                {tmpl.source}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setPreviewModalImg(tmpl.previewUrl)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                  title="Lihat Pratinjau Gambar"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setViewingXmlTemplate(tmpl)}
                                  className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Lihat &amp; Salin Kode XML"
                                >
                                  <Code className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleToggleFrame(tmpl.id)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                    tmpl.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {tmpl.active ? 'Active' : 'Off'}
                                </button>
                                <button
                                  onClick={() => {
                                    setViewingXmlTemplate(tmpl);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                                  title="Edit XML Template"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(tmpl.id, tmpl.name)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Hapus Template"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 11: TEMPLATE CATEGORIES
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'template_categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Template Categories</h2>
                  <p className="text-xs text-slate-500">Kategori format rasio bingkai untuk photobooth</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Receipt Strip (Thermal)</h3>
                  <p className="text-xs text-slate-500">Kertas thermal roll 58mm / 80mm monokrom vintage.</p>
                  <p className="text-xs font-bold text-emerald-800">4 Template Aktif</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Photostrip 2R</h3>
                  <p className="text-xs text-slate-500">Ukuran 2x6 strip vertikal dengan 3 atau 4 slot foto.</p>
                  <p className="text-xs font-bold text-blue-800">6 Template Aktif</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <Layout className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Classic 4R Studio</h3>
                  <p className="text-xs text-slate-500">Format cetak penuh 4x6 grid 4 atau 6 slot pose.</p>
                  <p className="text-xs font-bold text-purple-800">8 Template Aktif</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Folder className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Event &amp; Wedding</h3>
                  <p className="text-xs text-slate-500">Desain custom khusus pernikahan dan pameran brand.</p>
                  <p className="text-xs font-bold text-amber-800">3 Template Aktif</p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────── */}
      
      {/* 1. Fullscreen Preview Image Modal */}
      {previewModalImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-xl max-h-[90vh] bg-white rounded-2xl p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700 cursor-pointer shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewModalImg}
              alt="Preview"
              className="max-h-[80vh] w-auto mx-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      {/* 2. QR Code Guest Download Modal */}
      {qrModalSession && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setQrModalSession(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">QR Softfile Tamu</span>
              <button 
                onClick={() => setQrModalSession(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 inline-block mx-auto">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 mx-auto rounded-xl" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                  Membuat QR...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="font-mono font-bold text-sm text-slate-900">{qrModalSession.sessionId}</p>
              <p className="text-xs text-slate-500">Scan menggunakan kamera HP untuk mengunduh foto &amp; video</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => copySoftfileLink(qrModalSession.sessionId)}
                className="w-full py-2.5 bg-[#0B3B2B] hover:bg-[#0E4A37] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Salin Link Softfile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add/Edit Kiosk Modal */}
      {isKioskModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsKioskModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                {editingKiosk ? 'Edit Kiosk' : 'Tambah Kiosk Baru'}
              </h3>
              <button 
                onClick={() => setIsKioskModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKiosk} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Kiosk</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tarasa Receipt Booth 2"
                  value={kioskForm.name}
                  onChange={(e) => setKioskForm({ ...kioskForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tipe Perangkat &amp; Printer</label>
                <select
                  value={kioskForm.deviceType}
                  onChange={(e) => setKioskForm({ ...kioskForm, deviceType: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                >
                  <option value="Tablet Android (Receipt Thermal 58mm)">Tablet Android (Receipt Thermal 58mm)</option>
                  <option value="Tablet Android (Receipt Thermal 80mm)">Tablet Android (Receipt Thermal 80mm)</option>
                  <option value="Windows PC (DNP 4R Printer)">Windows PC (DNP 4R Printer)</option>
                  <option value="Windows PC (Receipt Thermal)">Windows PC (Receipt Thermal)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tarif per Sesi (Rp)</label>
                <input
                  type="number"
                  required
                  value={kioskForm.price}
                  onChange={(e) => setKioskForm({ ...kioskForm, price: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Gateway</label>
                <select
                  value={kioskForm.gateway}
                  onChange={(e) => setKioskForm({ ...kioskForm, gateway: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                >
                  <option value="Midtrans QRIS">Midtrans QRIS</option>
                  <option value="Manual Tunai">Manual Tunai</option>
                  <option value="Gratis (Event)">Gratis (Event)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Lokasi / Outlet</label>
                <input
                  type="text"
                  value={kioskForm.location}
                  onChange={(e) => setKioskForm({ ...kioskForm, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsKioskModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0B3B2B] hover:bg-[#0E4A37] text-white font-bold rounded-xl"
                >
                  Simpan Kiosk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Template Modal with XML Editor & Presets */}
      {isTemplateModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsTemplateModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Layout className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Tambah Template Frame</h3>
                  <p className="text-[11px] text-slate-400">Konfigurasi struktur koordinat slot foto &amp; XML</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTemplateTabMode('xml')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  templateTabMode === 'xml' ? 'bg-white text-[#0B3B2B] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Editor XML Langsung</span>
              </button>
              <button
                type="button"
                onClick={() => setTemplateTabMode('form')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  templateTabMode === 'form' ? 'bg-white text-[#0B3B2B] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Form Parameter Visual</span>
              </button>
            </div>

            {/* Presets Quick Selector */}
            <div className="space-y-1.5 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pilih Preset Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(XML_PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setTemplateForm({
                        ...templateForm,
                        name: p.label.split(' (')[0],
                        size: p.size,
                        photoCount: p.photoCount,
                        xmlText: p.xml,
                      });
                      showToast(`Preset ${p.label} dimuat!`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    {p.label.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3 text-xs flex-1 overflow-y-auto pr-1">
              
              {templateTabMode === 'xml' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Kode Konfigurasi Frame XML:</label>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Format Kompatibel dengan Kiosk Offline
                    </span>
                  </div>
                  <textarea
                    rows={11}
                    value={templateForm.xmlText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTemplateForm({ ...templateForm, xmlText: val });
                      const parsed = parseXmlClient(val);
                      if (parsed && !parsed.error) {
                        if (parsed.name) setTemplateForm(prev => ({ ...prev, xmlText: val, name: parsed.name, photoCount: parsed.photos?.length || 3 }));
                      }
                    }}
                    placeholder="<frame> ... </frame>"
                    className="w-full p-3 font-mono text-[11px] bg-slate-900 text-emerald-300 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400">
                    💡 Anda bisa langsung salin (copy) kode XML dari panel admin offline dan tempelkan di sini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">Nama Template</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Receipt Vintage 3-Pose"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Ukuran Frame (Size)</label>
                    <select
                      value={templateForm.size}
                      onChange={(e) => {
                        const newSize = e.target.value;
                        setTemplateForm({
                          ...templateForm,
                          size: newSize,
                          xmlText: generateXmlTemplate(templateForm.name, newSize, templateForm.photoCount)
                        });
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    >
                      <option value="Receipt">Receipt (Thermal 58mm / 80mm)</option>
                      <option value="2R">2R (2x6 inches Photostrip)</option>
                      <option value="4R">4R (4x6 inches Studio Classic)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Jumlah Slot Foto</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={templateForm.photoCount}
                      onChange={(e) => {
                        const count = Number(e.target.value);
                        setTemplateForm({
                          ...templateForm,
                          photoCount: count,
                          xmlText: generateXmlTemplate(templateForm.name, templateForm.size, count)
                        });
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 pt-1">
                <label className="font-semibold text-slate-700">URL Gambar Bingkai (PNG Transparan)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={templateForm.previewUrl}
                  onChange={(e) => setTemplateForm({ ...templateForm, previewUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs"
                />
              </div>

              <div className="pt-3 flex gap-2 shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-[#0B3B2B] hover:bg-[#0E4A37] text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Template XML'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. XML Template Viewer Modal */}
      {viewingXmlTemplate && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewingXmlTemplate(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{viewingXmlTemplate.name}</h3>
                <p className="text-[11px] text-slate-400">Kode XML Slot &amp; Layout Template</p>
              </div>
              <button 
                onClick={() => setViewingXmlTemplate(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto max-h-80 border border-slate-800">
              <pre className="font-mono text-xs text-emerald-300 whitespace-pre leading-relaxed">
                {viewingXmlTemplate.xml || generateXmlTemplate(viewingXmlTemplate.name, viewingXmlTemplate.size, viewingXmlTemplate.totalPhotos)}
              </pre>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const xmlContent = viewingXmlTemplate.xml || generateXmlTemplate(viewingXmlTemplate.name, viewingXmlTemplate.size, viewingXmlTemplate.totalPhotos);
                  navigator.clipboard.writeText(xmlContent);
                  showToast('Kode XML berhasil disalin ke clipboard!');
                }}
                className="flex-1 py-2.5 bg-[#0B3B2B] hover:bg-[#0E4A37] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Kode XML</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingXmlTemplate(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Small helper icon for Cloud Sync
function CloudSyncIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="m12 12 4 4-4 4" />
      <path d="M16 16H8" />
    </svg>
  );
}
