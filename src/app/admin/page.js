'use client';

import KioskConfigEditor from "@/components/admin/KioskConfigEditor";

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
  FileCode,
  Mail,
  Lock,
  EyeOff,
  Monitor
} from 'lucide-react';
import TemplateEditorStudio from '@/components/TemplateEditorStudio';
import KioskGalleryView from '@/components/KioskGalleryView';
import KioskPaymentGatewayEditor from '@/components/KioskPaymentGatewayEditor';
import KioskStatisticsView from '@/components/KioskStatisticsView';

const SUPABASE_CDN_BASE = 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets';

function getDisplayCdnUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const filename = url.split('/').pop();
  return filename ? `${SUPABASE_CDN_BASE}/${filename}` : null;
}

// ── SANS XML Presets & Helpers ───────────────────────────────────────────────
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
  const [loginMethod, setLoginMethod]         = useState('credentials'); // 'credentials' | 'pin'
  const [emailInput, setEmailInput]           = useState('admin@nadhisan.com');
  const [passwordInput, setPasswordInput]     = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [currentUser, setCurrentUser]         = useState({ email: 'admin@nadhisan.com', name: 'Admin Nadhisan Booth' });
  const [pinInput, setPinInput]               = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError]             = useState('');

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
  const [transactionKioskFilter, setTransactionKioskFilter] = useState('all');
  const [statsKioskFilter, setStatsKioskFilter] = useState('all');
  const [voucherKioskTarget, setVoucherKioskTarget] = useState('all');

  // Kiosk Modal & Management State
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [activeKioskForConfig, setActiveKioskForConfig] = useState(null);
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

  // Template Visual Studio & Modal State
  const [isStudioOpen, setIsStudioOpen]               = useState(false);
  const [studioTemplate, setStudioTemplate]           = useState(null);
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

  // Pricing configuration with localStorage persistence
  const [pricingConfig, setPricingConfig] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nadhisan_admin_pricing");
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return {
      price_session: 15000,
      price_extra_photo: 500,
      price_extra_print: 2000,
      min_photos: 6,
      max_photos: 12,
      print_count: 1,
      inactivity_timeout: 90,
    };
  });

  // Kiosks state synchronized directly with Cloud (Supabase)
  const [kiosks, setKiosks] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sans_admin_kiosks");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Filter out any legacy dummy testing2
            const filtered = parsed.filter(k => k.name !== "TESTING2" && k.licenseKey !== "88Q-TUR-W2G");
            return filtered;
          }
        }
      } catch (_) {}
    }
    return [];
  });

  const fetchKiosksCloud = async () => {
    try {
      const res = await fetch(`/api/admin/kiosks?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.kiosks)) {
        const formatted = data.kiosks.map(k => {
          const mode = k.kiosk_mode || (k.is_event_mode ? "event" : "regular");
          const isEvent = mode === "event" || Boolean(k.is_event_mode);
          return {
            ...k,
            id: k.id,
            name: k.name,
            licenseKey: k.license_key || k.licenseKey || "NDHS-001",
            license_key: k.license_key || k.licenseKey || "NDHS-001",
            deviceType: k.os_platform ? `PC/Laptop (${k.os_platform})` : "Kiosk Photobooth",
            kiosk_mode: mode,
            is_event_mode: isEvent,
            gateway: isEvent ? "Free Pass (Event)" : "Midtrans QRIS",
            price: isEvent ? 0 : Number(k.price_per_photo || k.price || 30000),
            status: k.is_active !== false ? "Active" : "Inactive",
            created: k.created_at ? k.created_at.substring(0, 10) : "2026-09-08"
          };
        });
        setKiosks(formatted);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("sans_admin_kiosks", JSON.stringify(formatted));
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn("Could not fetch kiosks from cloud:", err);
    }
  };

  useEffect(() => {
    fetchKiosksCloud();
  }, []);

  useEffect(() => {
    if (activeTab === "kiosks") {
      fetchKiosksCloud();
    }
  }, [activeTab]);

  const [announcementInput, setAnnouncementInput] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [voucherCode, setVoucherCode]         = useState('');
  const [voucherCategory, setVoucherCategory] = useState('cash'); // 'cash' | 'promo'
  const [voucherType, setVoucherType]         = useState('cash');
  const [voucherValue, setVoucherValue]       = useState('15000');
  const [voucherMaxUses, setVoucherMaxUses]   = useState('1');
  const [voucherDesc, setVoucherDesc]         = useState('');
  const [voucherMsg, setVoucherMsg]           = useState(null);
  const [voucherFilterTab, setVoucherFilterTab] = useState('all'); // 'all' | 'cash' | 'promo'
  const [kioskModeFilter, setKioskModeFilter] = useState('all'); // 'all' | 'regular' | 'receipt' | 'event'
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('all'); // 'all' | 'regular' | 'receipt'
  const [voucherSearchQuery, setVoucherSearchQuery] = useState('');
  const [showBulkModal, setShowBulkModal]     = useState(false);
  const [bulkCount, setBulkCount]             = useState(100);
  const [bulkPrefix, setBulkPrefix]           = useState('CSH');
  const [bulkValue, setBulkValue]             = useState(15000);
  const [bulkKioskTarget, setBulkKioskTarget] = useState('all');
  const [bulkDescription, setBulkDescription] = useState('');
  const [bulkIsGenerating, setBulkIsGenerating] = useState(false);
  const [bulkResult, setBulkResult]           = useState(null);
  const [bulkCopied, setBulkCopied]           = useState(false);
  const [cleanupRunning, setCleanupRunning]   = useState(false);
  const [cleanupResult, setCleanupResult]     = useState(null);
  const [actionLoading, setActionLoading]     = useState(false);

  // Toast Helper
  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check stored auth session
  useEffect(() => {
    const savedPin = sessionStorage.getItem('admin_pin');
    const savedEmail = sessionStorage.getItem('admin_user_email');
    if (savedEmail) {
      setCurrentUser(prev => ({ ...prev, email: savedEmail }));
    }
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
        if (!sessionStorage.getItem('admin_user_email')) {
          sessionStorage.setItem('admin_user_email', 'admin@nadhisan.com');
        }
        setSessions(json.sessions || []);
        loadVouchers(pin);
        loadTelemetry();
        loadQueue();
        loadFrames();
        loadFinance(financeRange, pin);
      } else {
        setAuthError('PIN salah! Masukkan PIN yang benar (1234).');
      }
    } catch (_) {
      setAuthError('Gagal memverifikasi PIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          password: passwordInput,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsAuthenticated(true);
        const pin = json.pin || '1234';
        sessionStorage.setItem('admin_pin', pin);
        sessionStorage.setItem('admin_user_email', json.user?.email || emailInput.trim());
        setCurrentUser(json.user || { email: emailInput.trim(), name: 'Admin Nadhisan Booth' });

        const sessRes = await fetch(`/api/sessions?pin=${pin}`);
        const sessJson = await sessRes.json();
        if (sessRes.ok && sessJson.success) {
          setSessions(sessJson.sessions || []);
        }
        loadVouchers(pin);
        loadTelemetry();
        loadQueue();
        loadFrames();
        loadFinance(financeRange, pin);
      } else {
        setAuthError(json.error || 'Email atau kata sandi salah. Silakan coba lagi.');
      }
    } catch (err) {
      setAuthError('Terjadi gangguan jaringan saat login.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    verifyPin(pinInput);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pin');
    sessionStorage.removeItem('admin_user_email');
    setIsAuthenticated(false);
    setPinInput('');
    setPasswordInput('');
    setAuthError('');
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
        setKiosks(prev => prev.map(k => ({ ...k, paperRoll: Math.min(k.paperMax, k.paperRoll + qtyToAdd) })));
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
    link.setAttribute('download', `nadhisanbooth-laporan-keuangan-${financeRange}-${Date.now()}.csv`);
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
      const folder = zip.folder(`nadhisanbooth-${session.sessionId}`);

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
      link.download = `nadhisanbooth-paket-lengkap-${session.sessionId}.zip`;
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
            category: voucherCategory,
            type: voucherCategory === 'cash' ? 'cash' : voucherType,
            value: voucherCategory === 'cash' ? (Number(voucherValue) || 15000) : voucherValue,
            maxUses: voucherCategory === 'cash' ? 1 : voucherMaxUses,
            description: voucherDesc || (voucherCategory === 'cash' ? 'Voucher Bayar Cash Barista Cafe' : 'Voucher Promo Photobooth'),
            kiosk_id: voucherKioskTarget === 'all' ? null : voucherKioskTarget,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setVouchers(json.vouchers || []);
        setVoucherCode('');
        setVoucherDesc('');
        showToast(`Voucher ${voucherCode.toUpperCase()} (${voucherCategory === 'cash' ? 'Bayar Cash' : 'Promo'}) berhasil disimpan!`);
      } else {
        setVoucherMsg({ type: 'error', text: json.error || 'Gagal menyimpan voucher' });
      }
    } catch (err) {
      setVoucherMsg({ type: 'error', text: 'Kesalahan jaringan saat menyimpan voucher' });
    }
  };

  const handleGenerateBulkCashVouchers = async () => {
    setBulkIsGenerating(true);
    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_bulk',
          pin: currentPin,
          count: Number(bulkCount) || 100,
          prefix: bulkPrefix || 'CSH',
          category: 'cash',
          value: Number(bulkValue) || 15000,
          kiosk_id: bulkKioskTarget === 'all' ? null : bulkKioskTarget,
          description: bulkDescription || `Batch ${bulkCount || 100} Voucher Cash Barista Cafe - ${new Date().toLocaleDateString('id-ID')}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBulkResult(json.generatedCodes || []);
        setVouchers(json.vouchers || []);
        showToast(`⚡ Sukses men-generate ${json.count} voucher cash!`);
      } else {
        showToast(json.error || 'Gagal men-generate bulk voucher', 'error');
      }
    } catch (err) {
      showToast('Kesalahan jaringan saat generate bulk voucher', 'error');
    } finally {
      setBulkIsGenerating(false);
    }
  };

  const handleCopyAllBulkCodes = () => {
    if (!bulkResult || bulkResult.length === 0) return;
    const text = bulkResult.join('\n');
    navigator.clipboard.writeText(text);
    setBulkCopied(true);
    showToast(`📋 ${bulkResult.length} Kode Voucher disalin ke clipboard!`);
    setTimeout(() => setBulkCopied(false), 2000);
  };

  const handleDownloadBulkTxt = () => {
    if (!bulkResult || bulkResult.length === 0) return;
    const header = [
      '=====================================================',
      '       DAFTAR VOUCHER BAYAR CASH BARISTA CAFE        ',
      '=====================================================',
      `Tanggal Dibuat : ${new Date().toLocaleString('id-ID')}`,
      `Total Voucher  : ${bulkResult.length} Kode`,
      `Nominal Sesi   : Rp ${(Number(bulkValue) || 15000).toLocaleString('id-ID')}`,
      'Aturan Pakai   : 1x Pakai per Struk Pembayaran Barista',
      '=====================================================',
      '',
      'Berikan SATU kode voucher unik ini ke pelanggan setelah',
      'mereka membayar tunai di kasir barista cafe. Pelanggan',
      'cukup memasukkan kode ini di layar pembayaran booth.',
      '',
      'DAFTAR KODE VOUCHER:',
      '-----------------------------------------------------',
    ];
    const lines = bulkResult.map((c, i) => `${(i + 1).toString().padStart(3, ' ')}. [ ${c} ]`);
    const textData = [...header, ...lines, '', '====================================================='].join('\n');
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VOUCHER_CASH_BARISTA_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBulkCsv = () => {
    if (!bulkResult || bulkResult.length === 0) return;
    const rows = [
      ['No', 'Kode Voucher', 'Kategori', 'Nominal (Rp)', 'Maks Penggunaan', 'Status', 'Catatan Kasir'],
      ...bulkResult.map((c, i) => [
        i + 1,
        c,
        'Bayar Cash (Barista)',
        bulkValue || 15000,
        '1x Pakai',
        'Aktif',
        'Diserahkan saat pelanggan bayar tunai ke barista'
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(x => `"${x}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = `VOUCHER_CASH_BARISTA_${Date.now()}.csv`;
    a.click();
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
  const handleDeleteKiosk = async (kioskId) => {
    const target = kiosks.find(k => k.id === kioskId);
    if (!confirm(`Hapus kiosk "${target?.name || "ini"}" secara permanen dari Cloud?`)) return;
    
    // Remove immediately from UI
    setKiosks(prev => prev.filter(k => k.id !== kioskId));
    showToast("Menghapus kiosk dari Cloud...");

    try {
      const res = await fetch("/api/admin/kiosks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          kioskId: kioskId,
          license_key: target?.licenseKey || target?.license_key
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Kiosk berhasil dihapus dari Cloud.");
      } else {
        showToast("Gagal menghapus di cloud: " + (data.error || ""));
      }
    } catch (err) {
      showToast("Gagal menghubungi server: " + err.message);
    } finally {
      fetchKiosksCloud();
    }
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
      if (activeGalleryKiosk) {
        const targetLicense = (activeGalleryKiosk.licenseKey || activeGalleryKiosk.license_key || "").trim().toUpperCase();
        const sessLicense = (s.licenseKey || s.license_key || "").trim().toUpperCase();
        const matchesKiosk = (targetLicense && sessLicense === targetLicense) ||
          (s.kioskId && String(s.kioskId) === String(activeGalleryKiosk.id)) ||
          (s.kioskName && s.kioskName.toLowerCase() === (activeGalleryKiosk.name || "").toLowerCase()) ||
          (kiosks.length === 1);
        if (!matchesKiosk) return false;
      }
      const matchesSearch = searchQuery === "" ||
        s.sessionId?.toLowerCase().includes(searchQuery.toLowerCase());
      const isExpired = (now - (s.createdAt || 0)) > TWENTY_FOUR_HOURS_MS;
      const matchesStatus =
        statusFilter === "all" ? true :
        statusFilter === "active" ? !isExpired : isExpired;

      return matchesSearch && matchesStatus;
    });
  }, [sessions, activeGalleryKiosk, kiosks.length, searchQuery, statusFilter, now]);

  const displayedTransactions = useMemo(() => {
    if (!finance?.transactions) return [];
    return finance.transactions.filter(t => {
      if (transactionKioskFilter !== "all") {
        const matchKiosk = String(t.kioskId) === String(transactionKioskFilter) ||
          (t.licenseKey && t.licenseKey.trim().toUpperCase() === transactionKioskFilter.trim().toUpperCase()) ||
          (t.kioskName && t.kioskName.toLowerCase() === transactionKioskFilter.toLowerCase());
        if (!matchKiosk) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (t.orderId && t.orderId.toLowerCase().includes(q)) ||
          (t.sessionId && t.sessionId.toLowerCase().includes(q));
      }
      return true;
    });
  }, [finance?.transactions, transactionKioskFilter, searchQuery]);

  // Combined Templates Catalog for Display
  const allTemplates = useMemo(() => {
    const defaults = [
      {
        no: 1,
        id: 'img_0834',
        name: 'Classic Studio 4R Grid',
        size: '4R',
        templateType: 'regular',
        totalCapturedPhoto: 6,
        totalPhotos: 6,
        userCaptured: 142,
        source: 'System Default',
        active: true,
        previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/img_0834.png',
        xml: XML_PRESETS.studio6.xml,
      },
      {
        no: 2,
        id: 'receipt_vintage_3',
        name: 'Receipt Vintage Strip 3-Pose',
        size: '80mm',
        templateType: 'receipt',
        totalCapturedPhoto: 3,
        totalPhotos: 3,
        userCaptured: 320,
        source: 'System Default',
        active: true,
        previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/strip_mono.png',
        xml: XML_PRESETS.receipt3.xml,
      },
      {
        no: 3,
        id: 'strip_2r_mono',
        name: 'Photostrip 2x6 Classic B&W',
        size: '2R',
        templateType: 'regular',
        totalCapturedPhoto: 3,
        totalPhotos: 3,
        userCaptured: 98,
        source: 'System Default',
        active: true,
        previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/strip_mono.png',
        xml: XML_PRESETS.strip2r.xml,
      },
      {
        no: 4,
        id: 'polaroid_retro',
        name: 'Retro Polaroid 4R Frame',
        size: '4R',
        templateType: 'regular',
        totalCapturedPhoto: 4,
        totalPhotos: 4,
        userCaptured: 76,
        source: 'System Default',
        active: true,
        previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/polaroid.png',
        xml: XML_PRESETS.grid4.xml,
      }
    ];

    if (!frames || frames.length === 0) return defaults;

    return frames.map((f, idx) => {
      const rawSize = f.size || (f.name?.toLowerCase().includes('receipt') ? '80mm' : f.photoCount <= 3 ? '2R' : '4R');
      const isReceipt = ['58mm', '80mm', 'Receipt'].includes(rawSize) ||
        (f.paperSize && String(f.paperSize).startsWith('thermal')) ||
        (f.category && f.category.toLowerCase().includes('receipt')) ||
        (f.name && f.name.toLowerCase().includes('receipt')) ||
        f.templateType === 'receipt';
      const templateType = f.templateType || (isReceipt ? 'receipt' : 'regular');
      const size = isReceipt ? (rawSize === '58mm' ? '58mm' : '80mm') : (rawSize === '2R' ? '2R' : '4R');
      const photoCount = f.photoCount || 3;
      const xml = f.xml || generateXmlTemplate(f.name, size, photoCount);
      return {
        no: idx + 1,
        id: f.id,
        name: f.name || `Template ${idx + 1}`,
        size,
        templateType,
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

  // ── SANS Signature Login Screen (Electric Blue #120CD6) ──────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#120CD6] text-white flex items-center justify-center p-4 select-none font-sans">
        <div className="w-full max-w-md p-8 md:p-10 bg-white text-[#111111] rounded-3xl shadow-2xl flex flex-col items-center gap-6 border-4 border-white">
          {/* SANS Brand Tag */}
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#E5FD5F] text-[#111111] rounded-full text-xs font-black uppercase tracking-wider border border-[#120CD6]">
            <span className="w-2 h-2 rounded-full bg-[#120CD6]" />
            NADHISAN BOOTH MANAGEMENT
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-[#120CD6] uppercase tracking-tight">
              Nadhisan Booth
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Pusat Kendali Photobooth Studio
            </p>
          </div>

          {/* Login Method Toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl w-full border border-slate-200">
            <button
              type="button"
              onClick={() => { setLoginMethod('credentials'); setAuthError(''); }}
              className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                loginMethod === 'credentials'
                  ? 'bg-[#120CD6] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#111111]'
              }`}
            >
              Email &amp; Sandi
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('pin'); setAuthError(''); }}
              className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                loginMethod === 'pin'
                  ? 'bg-[#120CD6] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#111111]'
              }`}
            >
              PIN Kiosk
            </button>
          </div>

          {authError && (
            <div className="w-full p-3.5 bg-rose-50 border-2 border-rose-500 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{authError}</span>
            </div>
          )}

          {loginMethod === 'credentials' ? (
            <form onSubmit={handleCredentialLogin} className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                  Email Akun Admin
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="admin@nadhisan.com"
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#120CD6] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#120CD6] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#E5FD5F] hover:bg-[#d8f244] active:bg-[#F908E0] active:text-white text-[#111111] font-black rounded-xl text-xs uppercase tracking-wider transition-all border-2 border-[#120CD6] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Panel Admin</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePinLogin} className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block text-center">
                  Masukkan PIN Akses (4-8 Digit)
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="••••"
                  className="w-full text-center tracking-widest text-3xl font-mono py-3.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-[#111111] focus:outline-none focus:border-[#120CD6] transition-colors placeholder:text-slate-300"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#E5FD5F] hover:bg-[#d8f244] active:bg-[#F908E0] active:text-white text-[#111111] font-black rounded-xl text-xs uppercase tracking-wider transition-all border-2 border-[#120CD6] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi PIN...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk dengan PIN</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-[11px] text-slate-400 text-center font-medium">
            SANS Design System • 100% Flat &amp; High Contrast
          </p>
        </div>
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

  // ── Main Authenticated Layout (SANS Palette: Electric Blue #120CD6, Lime #E5FD5F, White #FFFFFF) ───────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#111111] font-sans flex flex-col md:flex-row antialiased selection:bg-[#E5FD5F] selection:text-[#111111]">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border-2 transition-all ${
          toastMessage.type === 'error'
            ? 'bg-rose-600 text-white border-white'
            : 'bg-[#120CD6] text-white border-[#E5FD5F]'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-[#E5FD5F]" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Left Sidebar (Electric Blue: #120CD6) ────────────────── */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#120CD6] text-white flex flex-col z-50 transition-transform duration-200 shrink-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Brand Header */}
        <div className="p-5 border-b border-white/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E5FD5F] text-[#111111] border-2 border-white flex items-center justify-center font-black text-sm shadow-xs">
              TB
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight uppercase leading-tight">
                Nadhisan Booth
              </h2>
              <p className="text-[10px] text-[#E5FD5F] font-bold uppercase tracking-wider">
                Booth Management
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-white/80 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {menuGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-black tracking-widest text-[#E5FD5F] uppercase select-none">
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#E5FD5F] text-[#111111] font-black border border-[#120CD6]'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#111111]' : 'text-white/70'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3.5 border-t border-white/15 bg-[#0D099E] shrink-0">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E5FD5F] text-[#111111] flex items-center justify-center text-xs font-black shrink-0 border border-white">
              TB
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-black text-white truncate" title={currentUser?.email || 'admin@nadhisan.com'}>
                {currentUser?.email || 'admin@nadhisan.com'}
              </p>
              <span className="text-[10px] text-[#E5FD5F] font-semibold block">
                Nadhisan Administrator
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-rose-500/20 hover:bg-rose-500 transition-colors cursor-pointer uppercase"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Workspace Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b-2 border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg md:text-xl font-black text-[#120CD6] tracking-tight uppercase">
              Booth Management
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-[#111111]">
            <span className="px-3.5 py-1.5 bg-[#F5F5F5] rounded-full border border-slate-200">
              {currentDateIndo}
            </span>
          </div>
        </header>

        {/* Dynamic Content View Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          
          {/* ══════════════════════════════════════════════════════════════
              VIEW 1: DASHBOARD
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* 3 Metric Cards (SANS Signature Accents) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Metric 1: Total Kiosk */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Kiosk</p>
                    <p className="text-3xl font-black text-[#111111]">{kiosks.length}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-semibold">kiosk aktif</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#120CD6] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Zap className="w-6 h-6 fill-white" />
                  </div>
                </div>

                {/* Metric 2: Revenue Bulan Ini */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Revenue Bulan Ini</p>
                    <p className="text-3xl font-black text-[#120CD6]">
                      Rp {(finance?.monthRevenue ?? finance?.totalRevenue ?? finance?.totalGross ?? 0).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-semibold">Bulan ini</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#F908E0] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                {/* Metric 3: Total Revenue */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-3xl font-black text-[#111111]">
                      Rp {(finance?.totalRevenue ?? finance?.totalGross ?? 0).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-semibold">Semua waktu</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#E5FD5F] text-[#111111] border-2 border-[#120CD6] flex items-center justify-center shrink-0 shadow-xs">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* 2-Column Section: Active Kiosks & Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Active Kiosks */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-black text-[#111111] uppercase tracking-tight">Active Kiosks</h2>
                      <p className="text-xs text-slate-400">Daftar photobooth yang sedang beroperasi</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('live_monitor')}
                      className="text-xs font-black text-[#120CD6] hover:underline flex items-center gap-1 cursor-pointer uppercase"
                    >
                      <span>Lihat Live Monitor</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {kiosks.map((k) => {
                      const isOnline = k.last_ping_at && (Date.now() - new Date(k.last_ping_at).getTime() < 120000);
                      const paperVal = Number(k.paper_stock ?? (k.paperRoll ?? 700));
                      const maxVal = 700;
                      const pct = Math.min(100, Math.max(0, Math.round((paperVal / maxVal) * 100)));
                      const diffSec = k.last_ping_at ? Math.round((Date.now() - new Date(k.last_ping_at).getTime()) / 1000) : null;
                      const pingLabel = diffSec !== null ? (diffSec < 60 ? `${diffSec}d lalu` : `${Math.round(diffSec / 60)}m lalu`) : "Belum terhubung";

                      return (
                        <div
                          key={k.id}
                          className="p-4 rounded-xl border border-slate-200 bg-[#F5F5F5] hover:bg-slate-100 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#120CD6] flex items-center justify-center text-[#120CD6] shrink-0 font-black">
                              <Store className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-[#111111]">{k.name}</h3>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  isOnline
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : "bg-slate-200 text-slate-600"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                                  {isOnline ? "Online" : "Offline"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{k.deviceType} • {k.location || "Outlet Utama"}</p>
                              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 mt-2 font-bold">
                                <span>Kertas: <strong className="text-slate-900">{paperVal} lbr ({pct}%)</strong></span>
                                <span>•</span>
                                <span>Koneksi: <strong className="text-[#120CD6]">{pingLabel}</strong></span>
                                <span>•</span>
                                <span>Tarif: <strong className="text-slate-900">Rp {k.price.toLocaleString("id-ID")}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setActiveKioskForConfig(k);
                                setActiveTab("kiosks");
                              }}
                              className="px-4 py-2 bg-[#120CD6] hover:bg-blue-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer uppercase shadow-xs flex items-center gap-1.5"
                              title="Buka Konfigurasi Lengkap Kiosk Ini"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Kelola</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Activity Feed */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-black text-[#111111] uppercase tracking-tight">Activity Feed</h2>
                      <p className="text-xs text-slate-400">Aktivitas sistem terkini</p>
                    </div>
                    <button
                      onClick={loadSessions}
                      className="text-xs text-slate-500 hover:text-[#120CD6] p-1 cursor-pointer"
                      title="Refresh Aktivitas"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {sessions && sessions.length > 0 ? (
                      sessions.slice(0, 4).map((s, idx) => (
                        <div key={s.sessionId || idx} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E5FD5F] text-[#111111] border border-[#120CD6] flex items-center justify-center shrink-0 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-[#111111]">Sesi Foto Selesai</p>
                            <p className="text-[11px] text-slate-500 truncate">{s.sessionId}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {s.createdAt ? new Date(s.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Hari ini'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <Activity className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-500">Belum ada aktivitas transaksi</p>
                        <p className="text-[11px] text-slate-400">Aktivitas photobooth akan muncul otomatis saat sesi berjalan</p>
                      </div>
                    )}
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
                  <h2 className="text-xl font-black text-[#111111] uppercase tracking-tight">Daftar Transaksi</h2>
                  <p className="text-xs text-slate-500">Riwayat transaksi pembayaran pelanggan di setiap kiosk</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-white border-2 border-slate-200 rounded-xl p-1 flex items-center text-xs font-bold">
                    {['all', 'today', 'week', 'month'].map((range) => (
                      <button
                        key={range}
                        onClick={() => { setFinanceRange(range); loadFinance(range); }}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer uppercase ${
                          financeRange === range ? 'bg-[#120CD6] text-white font-black' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {range === 'all' ? 'Semua' : range === 'today' ? 'Hari Ini' : range === 'week' ? '7 Hari' : 'Bulan Ini'}
                      </button>
                    ))}
                  </div>

                  {/* Kiosk Filter Dropdown */}
                  <select
                    value={transactionKioskFilter}
                    onChange={(e) => setTransactionKioskFilter(e.target.value)}
                    className="px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-[#120CD6] cursor-pointer uppercase"
                  >
                    <option value="all">Semua Kiosk</option>
                    {kiosks.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleExportCsv}
                    className="px-4 py-2 bg-[#E5FD5F] hover:bg-[#d8f244] border-2 border-[#120CD6] rounded-xl text-xs font-black text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer uppercase"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Transactions Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari order ID atau ID sesi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#120CD6]"
                    />
                  </div>

                  <div className="text-xs text-slate-500 font-bold">
                    Total: <span className="font-black text-[#120CD6]">{displayedTransactions.length}</span> transaksi {transactionKioskFilter !== "all" ? "(Kiosk Terfilter)" : ""}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F5F5] text-[#111111] font-black border-b border-slate-200 uppercase tracking-wider">
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
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(displayedTransactions && displayedTransactions.length > 0) ? (
                        displayedTransactions.map((t, idx) => (
                          <tr key={t.orderId || idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{t.orderId}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">{t.sessionId}</td>
                            <td className="py-3.5 px-4 text-slate-500">{new Date(t.createdAt).toLocaleString('id-ID')}</td>
                            <td className="py-3.5 px-4 text-slate-800 font-bold">{t.kioskName || (kiosks.find(k => k.id === t.kioskId)?.name) || (kiosks[0]?.name || "Photobooth")}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                                {t.paymentMethod || 'QRIS Midtrans'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-black text-slate-900">
                              Rp {Number(t.amount || 25000).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#E5FD5F] text-[#111111] border border-[#120CD6]">
                                <Check className="w-3 h-3" />
                                Settlement
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ShoppingCart className="w-8 h-8 text-slate-300" />
                              <p className="text-xs font-bold text-slate-500">Belum ada data transaksi</p>
                              <p className="text-[11px] text-slate-400">Transaksi pembayaran pelanggan akan tercatat otomatis di sini</p>
                            </div>
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
              VIEW 3: LIVE MONITOR
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'live_monitor' && (
            <div className="space-y-6">
              
              {/* Header with WebSocket Live Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#111111] uppercase tracking-tight">Live Monitor</h2>
                  <p className="text-xs text-slate-500">Pantau kesehatan dan performa booth secara real-time</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5FD5F] border-2 border-[#120CD6] text-[#111111] text-xs font-black">
                    <span className="w-2 h-2 rounded-full bg-[#120CD6]" />
                    <span>WebSocket Live</span>
                  </div>

                  <button
                    onClick={() => { loadTelemetry(); loadQueue(); }}
                    className="p-2 rounded-xl bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    title="Refresh Status"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Kesehatan Kiosk Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Kesehatan Kiosk</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {kiosks.map((k) => (
                    <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                      
                      {/* Card Top */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#120CD6] flex items-center justify-center font-bold">
                            <Radio className="w-5 h-5 text-[#120CD6]" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-[#111111]">{k.name}</h4>
                            <p className="text-xs text-slate-400">{k.deviceType}</p>
                          </div>
                        </div>

                        {(() => {
                          const isOnline = k.last_ping_at && (Date.now() - new Date(k.last_ping_at).getTime() < 120000);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                              isOnline
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                              {isOnline ? "Online (Tersambung)" : "Offline (Idle / Mati)"}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Specs Grid */}
                      {(() => {
                        const paperVal = Number(k.paper_stock ?? (k.paperRoll ?? 700));
                        const maxVal = 700;
                        const pct = Math.min(100, Math.max(0, Math.round((paperVal / maxVal) * 100)));
                        const diffSec = k.last_ping_at ? Math.round((Date.now() - new Date(k.last_ping_at).getTime()) / 1000) : null;
                        const pingLabel = diffSec !== null ? (diffSec < 60 ? `${diffSec}d lalu` : `${Math.round(diffSec / 60)}m lalu`) : "Belum ping";

                        return (
                          <>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                              <div className="p-3 bg-[#F5F5F5] rounded-xl border border-slate-200">
                                <p className="text-[11px] text-slate-500 font-bold uppercase">Koneksi Mesin</p>
                                <p className="text-xs font-black text-[#120CD6] mt-0.5">{pingLabel}</p>
                              </div>

                              <div className="p-3 bg-[#F5F5F5] rounded-xl border border-slate-200">
                                <p className="text-[11px] text-slate-500 font-bold uppercase">Mode Sesi</p>
                                <p className="text-xs font-black text-[#111111] mt-0.5">
                                  {k.is_event_mode ? "EVENT GRATIS" : "KOMERSIAL QRIS"}
                                </p>
                              </div>
                            </div>

                            {/* Sisa Kertas Meter */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-600">Sisa Kertas Thermal ({pct}%)</span>
                                <span className="text-[#111111] font-black">{paperVal} / {maxVal} Lembar</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${pct < 20 ? "bg-rose-500" : "bg-[#120CD6]"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>

                            {/* Quick Operation Controls */}
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => handlePaperRefill(k.id, 100)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#111111] text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer uppercase"
                                title="Tambah 100 lembar kertas ke kiosk ini"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>+100 Kertas</span>
                              </button>

                              <button
                                onClick={() => handlePaperRefill(k.id, 700)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer uppercase border border-emerald-200"
                                title="Isi penuh 700 lembar kertas roll baru"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Full Roll 700</span>
                              </button>

                              <button
                                onClick={() => handleToggleEventMode(k.id)}
                                disabled={actionLoading}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer uppercase ${
                                  k.is_event_mode
                                    ? "bg-[#F908E0] text-white"
                                    : "bg-[#E5FD5F] text-[#111111] border border-[#120CD6]"
                                }`}
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>{k.is_event_mode ? "Event (Gratis)" : "Jadikan Event"}</span>
                              </button>

                              <button
                                onClick={() => { setActiveKioskForConfig(k); setActiveTab('kiosks'); }}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#120CD6] text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer uppercase border border-blue-200"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Edit 11-Tab</span>
                              </button>
                            </div>
                          </>
                        );
                      })()}
                      {/* Mini Queue Controller */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#120CD6] uppercase">Antrian Terkini</span>
                          <span className="text-[11px] font-bold text-slate-500">
                            Menunggu: {queue?.waiting_count || 0}
                          </span>
                        </div>
                        {queue?.current_queue_code && queue?.current_queue_status !== 'idle' && queue?.current_queue_status !== 'expired' ? (
                          <div className="flex items-center justify-between text-xs">
                            <div className="font-mono">
                              <span className="text-slate-500">Kode: </span>
                              <span className="font-black text-[#111111]">{queue.current_queue_code}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={handlePromoteQueue}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-[#120CD6] text-white rounded-lg text-xs font-black hover:bg-blue-800 cursor-pointer uppercase"
                              >
                                Panggil
                              </button>
                              <button
                                onClick={handleReleaseQueue}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-200 cursor-pointer uppercase"
                              >
                                Lepas
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-slate-400 font-medium italic">Tidak ada antrian aktif</span>
                            <span className="text-[10px] font-black px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md uppercase">Kosong</span>
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Performa Hari Ini Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-black text-[#111111] uppercase tracking-tight">Performa Hari Ini</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F5F5] text-[#111111] font-black border-b border-slate-200 uppercase tracking-wider">
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
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {kiosks.map((k) => {
                        const kioskSessions = sessions.filter(s => s.kioskId === k.id || s.kioskName === k.name);
                        const sessionCount = kioskSessions.length;
                        const kioskRevenue = kioskSessions.reduce((sum, s) => sum + Number(s.price || k.price || 0), 0);
                        return (
                          <tr key={k.id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 font-black text-slate-900">{k.name}</td>
                            <td className="py-3.5 px-4 font-bold text-[#111111]">{sessionCount}</td>
                            <td className="py-3.5 px-4 font-black text-[#120CD6]">{sessionCount}</td>
                            <td className="py-3.5 px-4 text-slate-400">0</td>
                            <td className="py-3.5 px-4 text-slate-700 font-bold">{sessionCount} lembar</td>
                            <td className="py-3.5 px-4 font-black text-[#111111]">
                              Rp {kioskRevenue.toLocaleString('id-ID')}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-medium">
                              {sessionCount > 0 ? 'Aktif' : 'Standby'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 4: STATISTICS (Full Reference Design & Real Analytics)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'statistics' && (
            <KioskStatisticsView
              sessions={sessions}
              transactions={finance?.transactions || []}
              kiosks={kiosks}
              templates={allTemplates}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 5: KIOSK
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'kiosks' && activeKioskForConfig !== null ? (
            <div className="space-y-4">
              <KioskConfigEditor
                kiosk={activeKioskForConfig === 'new' ? null : activeKioskForConfig}
                onBack={() => {
                  setActiveKioskForConfig(null);
                  fetchKiosksCloud();
                }}
                onSaveSuccess={(savedKiosk) => {
                  setActiveKioskForConfig(null);
                  if (savedKiosk) {
                    setKiosks(prev => {
                      const formatted = {
                        ...savedKiosk,
                        id: savedKiosk.id || Date.now(),
                        name: savedKiosk.name,
                        licenseKey: savedKiosk.license_key || savedKiosk.licenseKey,
                        deviceType: savedKiosk.os_platform ? `PC/Laptop (${savedKiosk.os_platform})` : "Kiosk Photobooth",
                        gateway: "Midtrans QRIS",
                        price: Number(savedKiosk.price_per_photo || savedKiosk.price || 30000),
                        status: savedKiosk.is_active !== false ? "Active" : "Inactive",
                        created: (savedKiosk.created_at || new Date().toISOString()).substring(0, 10)
                      };
                      const existingIdx = prev.findIndex(p => String(p.id) === String(savedKiosk.id) || p.licenseKey === formatted.licenseKey);
                      if (existingIdx >= 0) {
                        const copy = [...prev];
                        copy[existingIdx] = { ...copy[existingIdx], ...formatted };
                        return copy;
                      }
                      return [formatted, ...prev];
                    });
                  }
                  fetchKiosksCloud();
                  showToast("Konfigurasi Kiosk berhasil disimpan ke Cloud!");
                }}
              />
            </div>
          ) : activeTab === 'kiosks' && (
            <div className="space-y-6">
              
              {/* Header + Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#111111] uppercase tracking-tight">Kiosk Management</h2>
                  <p className="text-xs text-slate-500">Kelola seluruh bilik photobooth dan receipt booth yang terdaftar</p>
                </div>

                <button
                  onClick={() => {
                    setActiveKioskForConfig('new');
                  }}
                  className="px-4 py-2.5 bg-[#120CD6] hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer uppercase"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Kiosk</span>
                </button>
              </div>

              {/* Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setKioskModeFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        kioskModeFilter === 'all'
                          ? 'bg-[#120CD6] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua ({kiosks.length})
                    </button>
                    <button
                      onClick={() => setKioskModeFilter('regular')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        kioskModeFilter === 'regular'
                          ? 'bg-[#120CD6] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>📸 Reguler (2R/4R)</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${kioskModeFilter === 'regular' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {kiosks.filter(k => (k.kiosk_mode || 'regular') === 'regular' && !k.is_event_mode).length}
                      </span>
                    </button>
                    <button
                      onClick={() => setKioskModeFilter('receipt')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        kioskModeFilter === 'receipt'
                          ? 'bg-[#120CD6] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🧾 Receipt (58/80mm)</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${kioskModeFilter === 'receipt' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {kiosks.filter(k => k.kiosk_mode === 'receipt').length}
                      </span>
                    </button>
                    <button
                      onClick={() => setKioskModeFilter('event')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        kioskModeFilter === 'event'
                          ? 'bg-[#120CD6] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🎉 Mode Event (Free)</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${kioskModeFilter === 'event' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {kiosks.filter(k => k.kiosk_mode === 'event' || k.is_event_mode).length}
                      </span>
                    </button>
                  </div>

                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search kiosk..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#120CD6]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F5F5] text-[#111111] font-black border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Name</th>
                        <th className="py-3.5 px-4">Mode Kiosk</th>
                        <th className="py-3.5 px-4">Payment Gateway</th>
                        <th className="py-3.5 px-4">Price/Session</th>
                        <th className="py-3.5 px-4">License Key</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Created</th>
                        <th className="py-3.5 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {kiosks
                        .filter(k => {
                          const mode = k.kiosk_mode || (k.is_event_mode ? 'event' : 'regular');
                          if (kioskModeFilter === 'all') return true;
                          if (kioskModeFilter === 'event') return mode === 'event' || k.is_event_mode;
                          if (kioskModeFilter === 'receipt') return mode === 'receipt';
                          if (kioskModeFilter === 'regular') return mode === 'regular' && !k.is_event_mode;
                          return true;
                        })
                        .filter(k => searchQuery === '' || (k.name || "").toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Monitor className="w-8 h-8 text-slate-300" />
                              <p className="text-xs font-bold text-slate-700">
                                {kioskModeFilter === 'all'
                                  ? 'Belum ada unit kiosk terdaftar'
                                  : `Belum ada unit kiosk dalam kategori ${
                                      kioskModeFilter === 'receipt'
                                        ? 'Receipt Photobooth (58/80mm)'
                                        : kioskModeFilter === 'event'
                                        ? 'Mode Event (Free Pass)'
                                        : 'Reguler (2R/4R)'
                                    }`}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {kiosks?.length > 0 && kioskModeFilter !== 'all'
                                  ? `Anda dapat langsung mengubah mode unit "${kiosks[0]?.name || "Kiosk"}" ke ${
                                      kioskModeFilter === 'receipt'
                                        ? 'Receipt (58/80mm)'
                                        : kioskModeFilter === 'event'
                                        ? 'Mode Event'
                                        : 'Reguler (2R/4R)'
                                    } atau menambah kiosk baru.`
                                  : 'Klik tombol "+ Add Kiosk" di atas untuk mendaftarkan unit kiosk baru.'}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {kiosks.length > 0 && kioskModeFilter !== 'all' && (
                                  <button
                                    onClick={async () => {
                                      const targetK = kiosks[0];
                                      const targetLicense = targetK.licenseKey || targetK.license_key;
                                      const newMode = kioskModeFilter;
                                      const isEvent = newMode === 'event';

                                      setKiosks(prev => prev.map(item => {
                                        if ((item.licenseKey || item.license_key) === targetLicense) {
                                          return {
                                            ...item,
                                            kiosk_mode: newMode,
                                            is_event_mode: isEvent,
                                            gateway: isEvent ? "Free Pass (Event)" : "Midtrans QRIS",
                                            price: isEvent ? 0 : (item.price || 30000),
                                          };
                                        }
                                        return item;
                                      }));

                                      try {
                                        await fetch('/api/admin/kiosks', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            action: 'update_kiosk',
                                            license_key: targetLicense,
                                            updates: { kiosk_mode: newMode, is_event_mode: isEvent }
                                          })
                                        });
                                        showToast(`✅ ${targetK.name} kini beralih ke Mode ${newMode === 'receipt' ? 'Receipt (58/80mm)' : newMode === 'event' ? 'Event (Free)' : 'Reguler (2R/4R)'}!`);
                                      } catch (err) {
                                        showToast('Gagal: ' + err.message, 'error');
                                      }
                                    }}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition shadow"
                                  >
                                    ⚡ Ubah "${kiosks[0]?.name || 'Kiosk'}" ke Mode ${kioskModeFilter === 'receipt' ? 'Receipt (58/80mm)' : kioskModeFilter === 'event' ? 'Event (Free)' : 'Reguler (2R/4R)'}
                                  </button>
                                )}
                                <button
                                  onClick={() => setActiveKioskForConfig('new')}
                                  className="px-4 py-2 bg-[#120CD6] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-800 transition shadow"
                                >
                                  + Tambah Kiosk Baru
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        kiosks
                          .filter(k => {
                            const mode = k.kiosk_mode || (k.is_event_mode ? 'event' : 'regular');
                            if (kioskModeFilter === 'all') return true;
                            if (kioskModeFilter === 'event') return mode === 'event' || k.is_event_mode;
                            if (kioskModeFilter === 'receipt') return mode === 'receipt';
                            if (kioskModeFilter === 'regular') return mode === 'regular' && !k.is_event_mode;
                            return true;
                          })
                          .filter(k => searchQuery === '' || (k.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((k) => (
                          <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-black text-[#111111]">{k.name}</div>
                              <div className="text-[11px] text-slate-400">{k.deviceType}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={k.kiosk_mode || (k.is_event_mode ? 'event' : 'regular')}
                                onChange={async (e) => {
                                  const newMode = e.target.value;
                                  const isEvent = newMode === 'event';
                                  const targetLicense = k.licenseKey || k.license_key;

                                  // Optimistic UI update
                                  setKiosks(prev => prev.map(item => {
                                    if ((item.licenseKey || item.license_key) === targetLicense) {
                                      return {
                                        ...item,
                                        kiosk_mode: newMode,
                                        is_event_mode: isEvent,
                                        gateway: isEvent ? "Free Pass (Event)" : "Midtrans QRIS",
                                        price: isEvent ? 0 : (item.price || 30000),
                                      };
                                    }
                                    return item;
                                  }));

                                  try {
                                    const res = await fetch('/api/admin/kiosks', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        action: 'update_kiosk',
                                        license_key: targetLicense,
                                        updates: {
                                          kiosk_mode: newMode,
                                          is_event_mode: isEvent,
                                        }
                                      })
                                    });
                                    const json = await res.json();
                                    if (json.success) {
                                      showToast(`✅ Mode ${k.name} berhasil diubah ke: ${newMode === 'receipt' ? 'Receipt Photobooth (58/80mm)' : newMode === 'event' ? 'Mode Event (Free Pass)' : 'Photobooth Reguler (2R/4R)'}`);
                                    } else {
                                      showToast(`Gagal: ${json.error || 'Gagal mengubah mode'}`, 'error');
                                      fetchKiosksCloud();
                                    }
                                  } catch (err) {
                                    showToast(`Gagal koneksi: ${err.message}`, 'error');
                                    fetchKiosksCloud();
                                  }
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-black cursor-pointer border shadow-xs transition-all focus:outline-none ${
                                  (k.kiosk_mode || (k.is_event_mode ? 'event' : 'regular')) === 'receipt'
                                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                    : (k.kiosk_mode || (k.is_event_mode ? 'event' : 'regular')) === 'event'
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-blue-50 text-[#120CD6] border-blue-300 hover:bg-blue-100'
                                }`}
                              >
                                <option value="regular">📸 REGULER (2R/4R)</option>
                                <option value="receipt">🧾 RECEIPT (58/80MM)</option>
                                <option value="event">🎉 EVENT (FREE PASS)</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-lg font-bold ${
                                k.is_event_mode || k.kiosk_mode === 'event'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {k.gateway}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-black text-[#111111]">
                              {k.is_event_mode || k.kiosk_mode === 'event' ? (
                                <span className="text-emerald-600 font-black">GRATIS</span>
                              ) : (
                                `Rp ${k.price.toLocaleString('id-ID')}`
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 w-fit font-bold">
                                <span>{k.licenseKey}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(k.licenseKey);
                                    showToast('License Key disalin ke clipboard');
                                  }}
                                  className="text-slate-400 hover:text-[#120CD6]"
                                  title="Salin Key"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#E5FD5F] text-[#111111] border border-[#120CD6]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#120CD6]" />
                                {k.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-bold">{k.created}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setActiveKioskForConfig(k);
                                  }}
                                  className="px-2.5 py-1.5 bg-[#120CD6]/10 text-[#120CD6] hover:bg-[#120CD6] hover:text-white rounded-lg transition-colors cursor-pointer text-[11px] font-black flex items-center gap-1"
                                  title="Konfigurasi Lengkap Kiosk"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                  <span>Konfigurasi</span>
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 6: PAYMENT GATEWAY (Per-Kiosk Midtrans API Keys & Tarif)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'payment_gateway' && (
            <KioskPaymentGatewayEditor
              kiosks={kiosks}
              onSaveKiosk={async (licenseKey, updates) => {
                const res = await fetch('/api/admin/kiosks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'update_kiosk',
                    license_key: licenseKey,
                    updates,
                  }),
                });
                const json = await res.json();
                if (!json.success) throw new Error(json.error || 'Gagal menyimpan');
                setKiosks((prev) =>
                  prev.map((k) =>
                    (k.licenseKey === licenseKey || k.license_key === licenseKey)
                      ? { ...k, ...updates }
                      : k
                  )
                );
              }}
              showToast={showToast}
              currentPin={currentPin}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 7: VOUCHER (PROMO & BAYAR CASH BARISTA CAFE)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'vouchers' && (() => {
            const cashCount = vouchers.filter(v => (v.category === 'cash' || v.type === 'cash')).length;
            const promoCount = vouchers.filter(v => !(v.category === 'cash' || v.type === 'cash')).length;

            const displayedVouchers = vouchers.filter(v => {
              const isCash = (v.category === 'cash' || v.type === 'cash');
              if (voucherFilterTab === 'cash' && !isCash) return false;
              if (voucherFilterTab === 'promo' && isCash) return false;
              if (voucherSearchQuery.trim()) {
                const q = voucherSearchQuery.toLowerCase();
                const matchCode = (v.code || '').toLowerCase().includes(q);
                const matchDesc = (v.description || '').toLowerCase().includes(q);
                if (!matchCode && !matchDesc) return false;
              }
              return true;
            });

            return (
              <div className="space-y-6">
                {/* Header & Bulk Generate Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-[#111111] uppercase tracking-tight">Voucher &amp; Cash Payment Management</h2>
                    <p className="text-xs text-slate-500">Kelola kupon promo dan sistem voucher bayar tunai (cash) kasir barista cafe</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBulkResult(null);
                        setBulkCopied(false);
                        setShowBulkModal(true);
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer uppercase tracking-tight"
                    >
                      <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
                      <span>⚡ Generate 100 Voucher Cash Sekaligus</span>
                    </button>
                  </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                      onClick={() => setVoucherFilterTab('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer uppercase ${
                        voucherFilterTab === 'all' ? 'bg-[#120CD6] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua ({vouchers.length})
                    </button>
                    <button
                      onClick={() => setVoucherFilterTab('cash')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer uppercase ${
                        voucherFilterTab === 'cash' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      <span>💵 Voucher Bayar Cash ({cashCount})</span>
                    </button>
                    <button
                      onClick={() => setVoucherFilterTab('promo')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer uppercase ${
                        voucherFilterTab === 'promo' ? 'bg-[#F908E0] text-white' : 'bg-blue-50 text-[#120CD6] hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      <span>🎟️ Voucher Promo ({promoCount})</span>
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari kode / event voucher..."
                      value={voucherSearchQuery}
                      onChange={(e) => setVoucherSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#120CD6]"
                    />
                  </div>
                </div>

                {/* Form Tambah Voucher Satuan */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-black text-[#111111] uppercase tracking-tight">Buat Voucher Baru (Satuan)</h3>
                      <p className="text-[11px] text-slate-400">Pilih kategori untuk membedakan voucher cash kasir dengan kupon promo diskon</p>
                    </div>

                    {/* Kategori Switcher */}
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setVoucherCategory('cash');
                          setVoucherType('cash');
                          setVoucherValue('15000');
                          setVoucherMaxUses('1');
                          setVoucherDesc('Voucher Bayar Cash Barista Cafe');
                        }}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          voucherCategory === 'cash' ? 'bg-emerald-600 text-white font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        💵 Bayar Cash (Barista)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVoucherCategory('promo');
                          setVoucherType('free');
                          setVoucherValue('100');
                          setVoucherMaxUses('100');
                          setVoucherDesc('Promo Diskon Khusus');
                        }}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          voucherCategory === 'promo' ? 'bg-[#120CD6] text-white font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🎟️ Promo / Diskon
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSaveVoucher} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase">Kode Voucher</label>
                      <input
                        type="text"
                        placeholder={voucherCategory === 'cash' ? 'e.g. CSH-88A72K' : 'e.g. DISKON50'}
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-black text-[#120CD6]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase">Tipe Voucher</label>
                      {voucherCategory === 'cash' ? (
                        <input
                          type="text"
                          disabled
                          value="Bayar Tunai (Cash)"
                          className="w-full p-2 bg-emerald-50 border border-emerald-200 rounded-xl font-black text-emerald-800 cursor-not-allowed"
                        />
                      ) : (
                        <select
                          value={voucherType}
                          onChange={(e) => setVoucherType(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                        >
                          <option value="free">Gratis 100% (Free Pass)</option>
                          <option value="percent">Persentase (%)</option>
                          <option value="nominal">Nominal Tunai (Rp)</option>
                        </select>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase">
                        {voucherCategory === 'cash' ? 'Nilai Cash (Rp)' : 'Nilai Diskon'}
                      </label>
                      <input
                        type="number"
                        value={voucherValue}
                        onChange={(e) => setVoucherValue(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase">Maks Pakai</label>
                      <input
                        type="number"
                        value={voucherMaxUses}
                        onChange={(e) => setVoucherMaxUses(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase">Berlaku Di</label>
                      <select
                        value={voucherKioskTarget}
                        onChange={(e) => setVoucherKioskTarget(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="all">🌐 Semua Kiosk</option>
                        {kiosks.map(k => (
                          <option key={k.id} value={k.id}>🖥️ {k.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label className="font-bold text-slate-700 uppercase">Keterangan / Catatan Kasir</label>
                      <input
                        type="text"
                        placeholder={voucherCategory === 'cash' ? 'e.g. Voucher Pembayaran Tunai Kasir Barista Cafe' : 'e.g. Promo Grand Opening'}
                        value={voucherDesc}
                        onChange={(e) => setVoucherDesc(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 bg-[#120CD6] hover:bg-blue-800 text-white font-black rounded-xl text-xs transition-colors cursor-pointer uppercase"
                      >
                        + Simpan
                      </button>
                    </div>
                  </form>
                </div>

                {/* Tabel Voucher */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F5F5F5] text-[#111111] font-black border-b border-slate-200 uppercase tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Kode Voucher</th>
                          <th className="py-3.5 px-4">Kategori</th>
                          <th className="py-3.5 px-4">Tipe / Nominal</th>
                          <th className="py-3.5 px-4">Status Penggunaan</th>
                          <th className="py-3.5 px-4">Keterangan</th>
                          <th className="py-3.5 px-4">Berlaku Di</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {displayedVouchers.length > 0 ? (
                          displayedVouchers.map((v) => {
                            const isCash = (v.category === 'cash' || v.type === 'cash');
                            const isUsed = v.usedCount >= v.maxUses;
                            return (
                              <tr key={v.code} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-black text-[#120CD6] flex items-center gap-1.5">
                                  <span>{v.code}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(v.code);
                                      showToast(`Kode ${v.code} disalin!`);
                                    }}
                                    className="text-slate-400 hover:text-slate-700 p-0.5"
                                    title="Salin Kode"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </td>
                                <td className="py-3.5 px-4">
                                  {isCash ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      💵 BAYAR CASH (BARISTA)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#120CD6] border border-blue-200">
                                      🎟️ PROMO DISKON
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 font-black text-slate-900">
                                  {isCash ? (
                                    <span className="text-emerald-700 font-black">
                                      Rp {Number(v.value || 15000).toLocaleString('id-ID')}
                                    </span>
                                  ) : v.type === 'free' ? (
                                    '100% Free'
                                  ) : v.type === 'percent' ? (
                                    `${v.value}%`
                                  ) : (
                                    `Rp ${Number(v.value).toLocaleString('id-ID')}`
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  {isCash ? (
                                    isUsed ? (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">
                                        Sudah Terpakai (1/1)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        ✓ Belum Dipakai (0/1)
                                      </span>
                                    )
                                  ) : (
                                    <span className="font-bold text-slate-700">
                                      {v.usedCount || 0} / {v.maxUses || '∞'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-slate-500">{v.description || '-'}</td>
                                <td className="py-3.5 px-4">
                                  {(() => {
                                    const targetKiosk = v.kiosk_id ? kiosks.find(k => String(k.id) === String(v.kiosk_id)) : null;
                                    return targetKiosk ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        🖥️ {targetKiosk.name}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#120CD6] border border-blue-200">
                                        🌐 Semua Kiosk
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="py-3.5 px-4">
                                  <button
                                    onClick={() => handleToggleVoucher(v)}
                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black cursor-pointer transition-colors ${
                                      v.active !== false ? 'bg-[#E5FD5F] text-[#111111] border border-[#120CD6]' : 'bg-slate-100 text-slate-500'
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
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                              Tidak ada voucher yang sesuai dengan filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MODAL BULK GENERATOR 100 VOUCHER CASH */}
                {showBulkModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                      {/* Modal Header */}
                      <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-yellow-300">
                            <Zap className="w-6 h-6 fill-yellow-300" />
                          </div>
                          <div>
                            <h3 className="text-base font-black uppercase tracking-tight">
                              {bulkResult ? '100 Voucher Cash Berhasil Dibuat!' : 'Generate 100 Voucher Bayar Cash Sekaligus'}
                            </h3>
                            <p className="text-xs text-emerald-100">
                              {bulkResult
                                ? `Sebanyak ${bulkResult.length} kode voucher siap diserahkan barista kepada pelanggan`
                                : 'Sistem voucher tunai cafe: Pelanggan bayar tunai ke barista &amp; dapat kode sesi booth'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowBulkModal(false)}
                          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
                        {!bulkResult ? (
                          <>
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-1">
                              <p className="font-bold">💡 Bagaimana cara kerjanya?</p>
                              <p className="text-[11px] text-emerald-800 leading-relaxed">
                                Fitur ini akan membuat 100 kode voucher acak unik (misal: <strong>CSH-88A72K</strong>). Barista cafe mencatat atau mencetak daftar kode ini. Saat pelanggan membayar cash ke barista, barista memberikan 1 kode voucher unik. Pelanggan memasukkan kode ini di layar photobooth untuk langsung mulai foto, dan omzetnya otomatis masuk ke <strong>Pendapatan Cash / Tunai</strong>.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="font-bold text-slate-700 uppercase">Jumlah Voucher</label>
                                <select
                                  value={bulkCount}
                                  onChange={(e) => setBulkCount(Number(e.target.value))}
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 text-sm"
                                >
                                  <option value="50">50 Voucher</option>
                                  <option value="100">100 Voucher (Standar)</option>
                                  <option value="200">200 Voucher</option>
                                  <option value="300">300 Voucher</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="font-bold text-slate-700 uppercase">Prefix Huruf Kode</label>
                                <input
                                  type="text"
                                  value={bulkPrefix}
                                  onChange={(e) => setBulkPrefix(e.target.value.toUpperCase().slice(0, 4))}
                                  placeholder="CSH"
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-[#120CD6] text-sm uppercase"
                                />
                                <p className="text-[10px] text-slate-400">Contoh format hasil: <strong>{bulkPrefix || 'CSH'}-7K9X2B</strong></p>
                              </div>

                              <div className="space-y-1">
                                <label className="font-bold text-slate-700 uppercase">Nominal Tunai per Sesi (Rp)</label>
                                <input
                                  type="number"
                                  value={bulkValue}
                                  onChange={(e) => setBulkValue(Number(e.target.value))}
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 text-sm"
                                />
                                <p className="text-[10px] text-slate-400">Tercatat di pembukuan cash kasir per voucher</p>
                              </div>

                              <div className="space-y-1">
                                <label className="font-bold text-slate-700 uppercase">Berlaku di Kiosk</label>
                                <select
                                  value={bulkKioskTarget}
                                  onChange={(e) => setBulkKioskTarget(e.target.value)}
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                                >
                                  <option value="all">🌐 Berlaku di Semua Kiosk</option>
                                  {kiosks.map(k => (
                                    <option key={k.id} value={k.id}>🖥️ {k.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="sm:col-span-2 space-y-1">
                                <label className="font-bold text-slate-700 uppercase">Catatan / Keterangan Batch</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Batch 100 Voucher Cash Barista Cafe"
                                  value={bulkDescription}
                                  onChange={(e) => setBulkDescription(e.target.value)}
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Hasil Sukses Bulk Generate */}
                            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <p className="font-black text-emerald-900 text-sm">🎉 Berhasil Men-generate {bulkResult.length} Voucher Cash!</p>
                                <p className="text-[11px] text-emerald-700">Nominal: Rp {Number(bulkValue || 15000).toLocaleString('id-ID')} • 1x pakai • Kategori Bayar Cash</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleCopyAllBulkCodes}
                                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  {bulkCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                                  <span>{bulkCopied ? 'Tersalin!' : 'Salin Semua'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleDownloadBulkTxt}
                                  className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Unduh format teks struk cetak"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Unduh TXT</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleDownloadBulkCsv}
                                  className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Unduh format spreadsheet CSV"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>CSV</span>
                                </button>
                              </div>
                            </div>

                            {/* Daftar 100 Kode dalam Scroll Box */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-slate-500 font-bold">
                                <span>Preview 100 Kode Voucher:</span>
                                <span className="text-[10px] text-slate-400">Klik salah satu kode untuk menyalinnya</span>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-64 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {bulkResult.map((c, idx) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(c);
                                      showToast(`Kode ${c} disalin!`);
                                    }}
                                    className="p-2 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 font-mono font-black text-[11px] text-center transition-all cursor-pointer flex items-center justify-between group"
                                  >
                                    <span className="text-[9px] text-slate-400 font-sans font-bold">{(idx + 1).toString().padStart(2, '0')}</span>
                                    <span>{c}</span>
                                    <Copy className="w-3 h-3 text-slate-300 group-hover:text-emerald-600" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Modal Footer */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                        {!bulkResult ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowBulkModal(false)}
                              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold rounded-xl text-xs cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              disabled={bulkIsGenerating}
                              onClick={handleGenerateBulkCashVouchers}
                              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer uppercase disabled:opacity-50"
                            >
                              {bulkIsGenerating ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Sedang Meng-generate...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                                  <span>⚡ Generate {bulkCount} Voucher Sekarang</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setShowBulkModal(false);
                              setVoucherFilterTab('cash');
                            }}
                            className="px-5 py-2 bg-[#120CD6] hover:bg-blue-800 text-white font-black rounded-xl text-xs transition-colors cursor-pointer uppercase"
                          >
                            ✓ Selesai &amp; Lihat di Tabel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 8: GALLERY (Kiosk Gallery, Filters & Real Consent Badges)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'gallery' && (
            <KioskGalleryView
              sessions={sessions}
              kiosks={kiosks}
              activeGalleryKiosk={activeGalleryKiosk}
              setActiveGalleryKiosk={setActiveGalleryKiosk}
              onRefresh={loadSessions}
              refreshing={loading}
              onOpenQrModal={openQrModal}
              onDownloadZip={handleDownloadZip}
              onCopyLink={copySoftfileLink}
              onDeleteSession={handleDeleteSession}
              showToast={showToast}
              templates={allTemplates}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 9: PUBLIC GALLERY
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'public_gallery' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#111111] uppercase tracking-tight">Public Gallery &amp; Guest Portal</h2>
                <p className="text-xs text-slate-500">Konfigurasi portal unduh softfile tamu &amp; kebijakan privasi otomatis</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-[#111111] uppercase tracking-tight">Portal Unduh Softfile Tamu</h3>
                    <p className="text-xs text-slate-400">Halaman mandiri bagi tamu memindai QR dan mengunduh foto &amp; video</p>
                  </div>
                  <Link
                    href="/"
                    target="_blank"
                    className="px-4 py-2 bg-[#120CD6] hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer uppercase"
                  >
                    <span>Buka Portal Tamu</span>
                    <Globe className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-[#F5F5F5] rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#111111] uppercase">Kebijakan Retensi Supabase (24 Jam)</span>
                      <span className="text-[#111111] font-black bg-[#E5FD5F] px-2.5 py-0.5 rounded-full border border-[#120CD6]">
                        Auto-Cleanup Active
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      Sesi foto dan video akan otomatis dibersihkan dari penyimpanan cloud setelah 24 jam untuk menjaga kuota storage dan privasi tamu.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={handleRunCleanup}
                        disabled={cleanupRunning}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5 uppercase"
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
              VIEW 10: TEMPLATES (Visual Editor Studio & SANS Table)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'templates' && (
            isStudioOpen ? (
              <TemplateEditorStudio
                initialTemplate={studioTemplate}
                adminPin={currentPin}
                showToast={showToast}
                onCancel={() => {
                  setIsStudioOpen(false);
                  setStudioTemplate(null);
                }}
                onSave={(updatedFrames) => {
                  setIsStudioOpen(false);
                  setStudioTemplate(null);
                  if (updatedFrames) setFrames(updatedFrames);
                  loadFrames();
                }}
              />
            ) : (
            <div className="space-y-6">
              
              {/* Header + Add Template Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#111111] uppercase tracking-tight">Template Management</h2>
                  <p className="text-xs text-slate-500">Kelola bingkai photobooth untuk format Receipt, 2R, dan 4R</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStudioTemplate(null);
                      setIsStudioOpen(true);
                    }}
                    className="px-4 py-2.5 bg-[#120CD6] hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer uppercase shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create New Template</span>
                  </button>
                  <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Import Preset XML Cepat"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setTemplateCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        templateCategoryFilter === 'all'
                          ? 'bg-[#120CD6] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua Template ({allTemplates.length})
                    </button>
                    <button
                      onClick={() => setTemplateCategoryFilter('regular')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        templateCategoryFilter === 'regular'
                          ? 'bg-[#120CD6] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>📸 Photobooth Reguler (2R & 4R)</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${templateCategoryFilter === 'regular' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {allTemplates.filter(t => t.templateType === 'regular').length}
                      </span>
                    </button>
                    <button
                      onClick={() => setTemplateCategoryFilter('receipt')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        templateCategoryFilter === 'receipt'
                          ? 'bg-[#120CD6] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🧾 Receipt Photobooth (58mm & 80mm)</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${templateCategoryFilter === 'receipt' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {allTemplates.filter(t => t.templateType === 'receipt').length}
                      </span>
                    </button>
                  </div>

                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search template..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#120CD6]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F5F5] text-[#111111] font-black border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">No</th>
                        <th className="py-3.5 px-4">Template Name</th>
                        <th className="py-3.5 px-4">Kategori</th>
                        <th className="py-3.5 px-4">Size</th>
                        <th className="py-3.5 px-4">Total Captured Photo</th>
                        <th className="py-3.5 px-4">Total Photos</th>
                        <th className="py-3.5 px-4">User Captured</th>
                        <th className="py-3.5 px-4">Source</th>
                        <th className="py-3.5 px-4 text-center">Preview &amp; XML</th>
                        <th className="py-3.5 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {allTemplates
                        .filter(t => {
                          if (templateCategoryFilter === 'all') return true;
                          return t.templateType === templateCategoryFilter;
                        })
                        .filter(t => searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((tmpl, idx) => (
                          <tr key={tmpl.id || idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-black text-slate-500">{tmpl.no || idx + 1}</td>
                            <td className="py-3.5 px-4 font-black text-slate-900">{tmpl.name}</td>
                            <td className="py-3.5 px-4">
                              {tmpl.templateType === 'receipt' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  🧾 Receipt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#120CD6] border border-blue-300">
                                  📸 Reguler
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                                tmpl.size === '58mm' || tmpl.size === '80mm' || tmpl.size === 'Receipt'
                                  ? 'bg-[#E5FD5F] text-[#111111] border border-[#120CD6]'
                                  : tmpl.size === '2R'
                                  ? 'bg-blue-100 text-[#120CD6] border border-blue-300'
                                  : 'bg-purple-100 text-[#F908E0] border border-purple-300'
                              }`}>
                                {tmpl.size}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 font-bold">{tmpl.totalCapturedPhoto}</td>
                            <td className="py-3.5 px-4 text-slate-700 font-bold">{tmpl.totalPhotos}</td>
                            <td className="py-3.5 px-4 text-slate-700 font-bold">{tmpl.userCaptured}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                                {tmpl.source}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setPreviewModalImg(tmpl.previewUrl)}
                                  className="p-1.5 text-slate-600 hover:text-[#120CD6] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Lihat Pratinjau Gambar"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setViewingXmlTemplate(tmpl)}
                                  className="p-1.5 text-slate-600 hover:text-[#120CD6] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
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
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-colors ${
                                    tmpl.active ? 'bg-[#E5FD5F] text-[#111111] border border-[#120CD6]' : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {tmpl.active ? 'Active' : 'Off'}
                                </button>
                                <button
                                  onClick={() => {
                                    setStudioTemplate(tmpl);
                                    setIsStudioOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-[#120CD6] rounded transition-colors cursor-pointer"
                                  title="Edit Template Visual"
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
            )
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 11: TEMPLATE CATEGORIES
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'template_categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#111111] uppercase tracking-tight">Template Categories</h2>
                  <p className="text-xs text-slate-500">Kategori format rasio bingkai untuk photobooth</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#120CD6] flex items-center justify-center font-bold">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[#111111] uppercase">Receipt Strip (Thermal)</h3>
                  <p className="text-xs text-slate-500 font-medium">Kertas thermal roll 58mm / 80mm monokrom vintage.</p>
                  {(() => {
                    const count = allTemplates.filter(t => t.size === "Receipt" || (t.category || "").includes("Receipt")).length;
                    return <p className="text-xs font-black text-[#120CD6]">{count} Template Aktif</p>;
                  })()}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#120CD6] flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[#111111] uppercase">Photostrip 2R</h3>
                  <p className="text-xs text-slate-500 font-medium">Ukuran 2x6 strip vertikal dengan 3 atau 4 slot foto.</p>
                  {(() => {
                    const count = allTemplates.filter(t => t.size === "2R" || (t.category || "").includes("2R")).length;
                    return <p className="text-xs font-black text-[#120CD6]">{count} Template Aktif</p>;
                  })()}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#F908E0] flex items-center justify-center font-bold">
                    <Layout className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[#111111] uppercase">Classic 4R Studio</h3>
                  <p className="text-xs text-slate-500 font-medium">Format cetak penuh 4x6 grid 4 atau 6 slot pose.</p>
                  {(() => {
                    const count = allTemplates.filter(t => t.size === "4R" || (t.category || "").includes("4R")).length;
                    return <p className="text-xs font-black text-[#F908E0]">{count} Template Aktif</p>;
                  })()}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Folder className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[#111111] uppercase">Event &amp; Wedding</h3>
                  <p className="text-xs text-slate-500 font-medium">Desain custom khusus pernikahan dan pameran brand.</p>
                  {(() => {
                    const count = allTemplates.filter(t => (t.category || "").includes("Event") || (t.category || "").includes("Wedding")).length;
                    return <p className="text-xs font-black text-amber-700">{count} Template Aktif</p>;
                  })()}
                </div>
              </div>
            </div>
          )}

        </main>

        {/* SANS Creative Signature Footer (agent nya sans design.md Section 11.3) */}
        <footer className="mt-auto border-t-2 border-slate-200 bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#120CD6]" />
            <span className="font-bold text-[#111111] uppercase tracking-wide">SANS Creative</span>
            <span className="text-slate-400">• Booth Management System</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] md:text-xs">
            <a 
              href="https://instagram.com/Ihsanelfikrie_" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-[#120CD6] transition-colors"
            >
              Instagram: <strong className="text-[#111111]">@Ihsanelfikrie_</strong>
            </a>
            <span className="text-slate-300">•</span>
            <a 
              href="mailto:ihsanelfikrie134@gmail.com" 
              className="hover:text-[#120CD6] transition-colors"
            >
              Email: <strong className="text-[#111111]">ihsanelfikrie134@gmail.com</strong>
            </a>
            <span className="text-slate-300">•</span>
            <a 
              href="https://wa.me/6285822713356" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-[#120CD6] transition-colors"
            >
              WhatsApp: <strong className="text-[#111111]">+62 858-2271-3356</strong>
            </a>
          </div>
        </footer>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────── */}
      
      {/* 1. Fullscreen Preview Image Modal */}
      {previewModalImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-xl max-h-[90vh] bg-white rounded-2xl p-2 shadow-2xl border-4 border-[#120CD6]" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#120CD6] text-white flex items-center justify-center hover:bg-blue-800 cursor-pointer shadow-lg font-black"
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
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setQrModalSession(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border-2 border-[#120CD6]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-[#120CD6] uppercase tracking-wider">QR Softfile Tamu</span>
              <button 
                onClick={() => setQrModalSession(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F5F5F5] rounded-2xl border-2 border-[#120CD6] inline-block mx-auto">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 mx-auto rounded-xl" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400 font-bold">
                  Membuat QR...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="font-mono font-black text-sm text-[#111111]">{qrModalSession.sessionId}</p>
              <p className="text-xs text-slate-500 font-medium">Scan menggunakan kamera HP untuk mengunduh foto &amp; video</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => copySoftfileLink(qrModalSession.sessionId)}
                className="w-full py-2.5 bg-[#120CD6] hover:bg-blue-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer uppercase"
              >
                Salin Link Softfile
              </button>
            </div>
          </div>
        </div>
      )}

      


      {/* 4. Add Template Modal with XML Editor & Presets */}
      {isTemplateModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setIsTemplateModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl border-2 border-[#120CD6] max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#120CD6] flex items-center justify-center font-bold">
                  <Layout className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#120CD6] uppercase tracking-tight">Tambah Template Frame</h3>
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
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl shrink-0 text-xs font-black uppercase">
              <button
                type="button"
                onClick={() => setTemplateTabMode('xml')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  templateTabMode === 'xml' ? 'bg-[#120CD6] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Editor XML Langsung</span>
              </button>
              <button
                type="button"
                onClick={() => setTemplateTabMode('form')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  templateTabMode === 'form' ? 'bg-[#120CD6] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Form Parameter Visual</span>
              </button>
            </div>

            {/* Presets Quick Selector */}
            <div className="space-y-1.5 shrink-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
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
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-[#E5FD5F] hover:text-[#111111] border border-slate-200 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
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
                    <label className="font-black text-slate-700 uppercase">Kode Konfigurasi Frame XML:</label>
                    <span className="text-[11px] text-[#111111] font-black bg-[#E5FD5F] px-2.5 py-0.5 rounded-full border border-[#120CD6]">
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
                    className="w-full p-3 font-mono text-[11px] bg-[#111111] text-[#E5FD5F] rounded-xl border-2 border-slate-700 focus:border-[#120CD6] focus:outline-none leading-relaxed font-bold"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    💡 Anda bisa langsung salin (copy) kode XML dari panel admin offline dan tempelkan di sini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-700 uppercase">Nama Template</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Receipt Vintage 3-Pose"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase">Ukuran Frame (Size)</label>
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                    >
                      <option value="Receipt">Receipt (Thermal 58mm / 80mm)</option>
                      <option value="2R">2R (2x6 inches Photostrip)</option>
                      <option value="4R">4R (4x6 inches Studio Classic)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase">Jumlah Slot Foto</label>
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-black"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-700 uppercase">URL Gambar Bingkai (PNG Transparan)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={templateForm.previewUrl}
                  onChange={(e) => setTemplateForm({ ...templateForm, previewUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium"
                />
              </div>

              <div className="pt-3 flex gap-2 shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-[#120CD6] hover:bg-blue-800 text-white font-black rounded-xl cursor-pointer disabled:opacity-50 uppercase"
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
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setViewingXmlTemplate(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl border-2 border-[#120CD6]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-[#120CD6] uppercase tracking-tight">{viewingXmlTemplate.name}</h3>
                <p className="text-[11px] text-slate-400 font-semibold">Kode XML Slot &amp; Layout Template</p>
              </div>
              <button 
                onClick={() => setViewingXmlTemplate(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#111111] rounded-2xl p-4 overflow-x-auto max-h-80 border-2 border-slate-700">
              <pre className="font-mono text-xs text-[#E5FD5F] whitespace-pre leading-relaxed font-bold">
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
                className="flex-1 py-2.5 bg-[#E5FD5F] hover:bg-[#d8f244] text-[#111111] border-2 border-[#120CD6] font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Kode XML</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingXmlTemplate(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer uppercase"
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
