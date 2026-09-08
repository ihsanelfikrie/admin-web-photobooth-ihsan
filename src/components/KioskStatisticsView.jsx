'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Layers,
  Calendar,
  Clock,
  Store,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon,
  GitCompare,
  Activity,
  Award,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

const KIOSK_COLORS = [
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
];

function formatRupiah(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Rp 0';
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

export default function KioskStatisticsView({
  sessions = [],
  transactions = [],
  kiosks = [],
  templates = [],
}) {
  // ── Global & Per-Card Filters ─────────────────────────────────────────────
  const [revenueRange, setRevenueRange] = useState('monthly'); // 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Template ranking filter
  const [templateKioskFilter, setTemplateKioskFilter] = useState('all');
  const [templateRange, setTemplateRange] = useState('monthly');

  // Comparison filter
  const [comparisonRange, setComparisonRange] = useState('monthly');
  const [selectedComparisonKiosks, setSelectedComparisonKiosks] = useState(() => {
    return kiosks.slice(0, 2).map((k) => k.id);
  });

  // Detail per kiosk filter
  const [detailKioskId, setDetailKioskId] = useState(() => {
    return kiosks.length > 0 ? kiosks[0].id : null;
  });
  const [detailRange, setDetailRange] = useState('monthly');

  // Ranking & Proportion range
  const [rankRange, setRankRange] = useState('monthly');
  const [proportionRange, setProportionRange] = useState('monthly');

  // Heatmap filter
  const [heatmapKioskFilter, setHeatmapKioskFilter] = useState('all');
  const [heatmapHourMode, setHeatmapHourMode] = useState('1h'); // '1h' | '4h'
  const [heatmapRange, setHeatmapRange] = useState('monthly');

  // Ensure selectedComparisonKiosks is populated when kiosks load
  React.useEffect(() => {
    if (selectedComparisonKiosks.length === 0 && kiosks.length > 0) {
      setSelectedComparisonKiosks(kiosks.slice(0, Math.min(2, kiosks.length)).map((k) => k.id));
    }
    if (!detailKioskId && kiosks.length > 0) {
      setDetailKioskId(kiosks[0].id);
    }
  }, [kiosks]);

  // ── Robust Date Parser & Filter Helper ────────────────────────────────────
  const parseTimestamp = (val) => {
    if (!val) return null;
    if (typeof val === 'number') return new Date(val);
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!isNaN(Number(trimmed)) && trimmed.length >= 10) {
        return new Date(Number(trimmed));
      }
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    }
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    return null;
  };

  const isDateInRange = (timestamp, rangeType) => {
    const d = parseTimestamp(timestamp);
    if (!d) return false;
    const now = new Date();

    if (rangeType === 'daily') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (rangeType === 'weekly') {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return d.getTime() >= sevenDaysAgo;
    }
    if (rangeType === 'monthly') {
      const [year, month] = selectedMonth.split('-').map(Number);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    }
    if (rangeType === 'yearly') {
      const [year] = selectedMonth.split('-').map(Number);
      return d.getFullYear() === year;
    }
    return true;
  };

  // ── 1. PENDAPATAN KESELURUHAN (OVERALL REVENUE) ────────────────────────────
  const overallData = useMemo(() => {
    const inRangeSessions = sessions.filter((s) => isDateInRange(s.createdAt, revenueRange));
    const inRangeTx = transactions.filter((t) => isDateInRange(t.createdAt, revenueRange));

    // Calculate total revenue from transactions or sessions
    let totalRevenue = 0;
    if (inRangeTx.length > 0) {
      totalRevenue = inRangeTx.reduce((acc, t) => {
        const st = (t.status || '').toLowerCase();
        if (st === 'success' || st === 'settlement' || st === 'capture' || st === 'paid' || !t.status) {
          return acc + (Number(t.amount) || Number(t.gross_amount) || Number(t.price) || 0);
        }
        return acc;
      }, 0);
    } else {
      totalRevenue = inRangeSessions.reduce((acc, s) => {
        return acc + (Number(s.price) || Number(s.amount) || Number(s.sessionPrice) || 0);
      }, 0);
    }

    const totalSessionsCount = inRangeSessions.length;

    // Build timeline points for chart
    // If monthly: days of the month
    const [selYear, selMonth] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthLabel = MONTH_NAMES[(selMonth || 1) - 1] || 'Bln';
    const dayPoints = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      label: `${i + 1} ${monthLabel}`,
      revenue: 0,
      sessions: 0,
    }));

    // Aggregate by day
    inRangeSessions.forEach((s) => {
      const d = parseTimestamp(s.createdAt) || new Date();
      if (d.getMonth() + 1 === selMonth && d.getFullYear() === selYear) {
        const dayIdx = d.getDate() - 1;
        if (dayPoints[dayIdx]) {
          const price = Number(s.price || s.amount || s.sessionPrice || 0);
          dayPoints[dayIdx].revenue += price;
          dayPoints[dayIdx].sessions += 1;
        }
      }
    });

    // Also factor transactions if available
    inRangeTx.forEach((t) => {
      const d = parseTimestamp(t.createdAt) || new Date();
      if (d.getMonth() + 1 === selMonth && d.getFullYear() === selYear) {
        const dayIdx = d.getDate() - 1;
        if (dayPoints[dayIdx] && dayPoints[dayIdx].revenue === 0) {
          const price = Number(t.amount || t.gross_amount || t.price || 0);
          dayPoints[dayIdx].revenue += price;
        }
      }
    });

    const maxRev = Math.max(...dayPoints.map((p) => p.revenue), 100000);

    return {
      totalRevenue,
      totalSessionsCount,
      dayPoints,
      maxRev,
      monthLabel,
      daysInMonth,
    };
  }, [sessions, transactions, revenueRange, selectedMonth]);

  // ── 2. RANKING TEMPLATE FAVORIT ───────────────────────────────────────────
  const templateRankings = useMemo(() => {
    const filtered = sessions.filter((s) => {
      if (!isDateInRange(s.createdAt, templateRange)) return false;
      if (templateKioskFilter !== 'all') {
        const k = kiosks.find((x) => String(x.id) === String(templateKioskFilter));
        const match =
          (s.kioskId && String(s.kioskId) === String(templateKioskFilter)) ||
          (k && s.licenseKey && s.licenseKey.toUpperCase() === (k.licenseKey || k.license_key || '').toUpperCase()) ||
          (k && s.kioskName && s.kioskName.toLowerCase() === (k.name || '').toLowerCase());
        if (!match) return false;
      }
      return true;
    });

    const counts = {};
    let totalTemplateSessions = 0;
    let totalTemplateRevenue = 0;

    filtered.forEach((s) => {
      const tplName = (s.frameName || s.frameId || 'nolima 5').trim();
      if (!counts[tplName]) {
        // Find matching template in catalogue
        const matchedTpl = templates.find(
          (t) =>
            t.name?.toLowerCase() === tplName.toLowerCase() ||
            t.id === tplName ||
            t.frameId === tplName
        );
        counts[tplName] = {
          name: tplName,
          size: matchedTpl?.size || s.size || (tplName.includes('2R') ? '2R' : '4R'),
          previewUrl: matchedTpl?.previewUrl || s.compositeUrl || null,
          sessions: 0,
          revenue: 0,
        };
      }
      const price = Number(s.price || s.amount || s.sessionPrice || 0) || 30000;
      counts[tplName].sessions += 1;
      counts[tplName].revenue += price;
      totalTemplateSessions += 1;
      totalTemplateRevenue += price;
    });

    // If no sessions yet, include default catalog templates with 0
    if (Object.keys(counts).length === 0 && templates.length > 0) {
      templates.slice(0, 8).forEach((t) => {
        counts[t.name] = {
          name: t.name,
          size: t.size || '4R',
          previewUrl: t.previewUrl,
          sessions: 0,
          revenue: 0,
        };
      });
    }

    const list = Object.values(counts).sort((a, b) => b.sessions - a.sessions || b.revenue - a.revenue);
    const maxSessions = list[0]?.sessions || 1;

    return {
      list,
      totalTemplateSessions,
      totalTemplateRevenue,
      templatesCount: list.length,
      maxSessions,
    };
  }, [sessions, templateRange, templateKioskFilter, templates, selectedMonth]);

  // ── 3. PERBANDINGAN KIOSK ─────────────────────────────────────────────────
  const comparisonData = useMemo(() => {
    const [selYear, selMonth] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();

    const kioskDatasets = selectedComparisonKiosks.map((kId, idx) => {
      const k = kiosks.find((x) => x.id === kId) || { name: `Kiosk #${kId}` };
      const color = KIOSK_COLORS[idx % KIOSK_COLORS.length];

      const points = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        revenue: 0,
      }));

      sessions.forEach((s) => {
        if (!isDateInRange(s.createdAt, comparisonRange)) return false;
        const match =
          (s.kioskId && String(s.kioskId) === String(kId)) ||
          (k.licenseKey && s.licenseKey?.toUpperCase() === (k.licenseKey || k.license_key || '').toUpperCase()) ||
          (k.name && s.kioskName?.toLowerCase() === k.name.toLowerCase());
        if (match) {
          const d = new Date(s.createdAt || Date.now());
          const dayIdx = d.getDate() - 1;
          if (points[dayIdx]) {
            points[dayIdx].revenue += Number(s.price || s.amount || s.sessionPrice || 0) || 30000;
          }
        }
      });

      return {
        id: kId,
        name: k.name,
        color,
        points,
        totalRevenue: points.reduce((acc, p) => acc + p.revenue, 0),
      };
    });

    const maxRev = Math.max(
      ...kioskDatasets.flatMap((kd) => kd.points.map((p) => p.revenue)),
      100000
    );

    return {
      kioskDatasets,
      maxRev,
      daysCount: daysInMonth,
    };
  }, [sessions, kiosks, selectedComparisonKiosks, comparisonRange, selectedMonth]);

  // ── 4. DETAIL PER KIOSK ───────────────────────────────────────────────────
  const detailKioskData = useMemo(() => {
    const k = kiosks.find((x) => x.id === detailKioskId) || kiosks[0];
    if (!k) return null;

    const kioskSessions = sessions.filter((s) => {
      if (!isDateInRange(s.createdAt, detailRange)) return false;
      return (
        (s.kioskId && String(s.kioskId) === String(k.id)) ||
        (k.licenseKey && s.licenseKey?.toUpperCase() === (k.licenseKey || k.license_key || '').toUpperCase()) ||
        (k.name && s.kioskName?.toLowerCase() === k.name.toLowerCase()) ||
        (kiosks.length === 1)
      );
    });

    const totalRevenue = kioskSessions.reduce((acc, s) => {
      return acc + (Number(s.price || s.amount || s.sessionPrice || 0) || 30000);
    }, 0);

    const totalSesi = kioskSessions.length;
    const extraPrintCount = kioskSessions.reduce((acc, s) => {
      return acc + (Number(s.extraPrint || s.extra_print || 0) > 0 ? 1 : 0);
    }, 0);

    const [selYear, selMonth] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    const points = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      revenue: 0,
    }));

    kioskSessions.forEach((s) => {
      const d = new Date(s.createdAt || Date.now());
      const dayIdx = d.getDate() - 1;
      if (points[dayIdx]) {
        points[dayIdx].revenue += Number(s.price || s.amount || s.sessionPrice || 0) || 30000;
      }
    });

    const maxRev = Math.max(...points.map((p) => p.revenue), 100000);

    return {
      kiosk: k,
      totalRevenue,
      totalSesi,
      extraPrintCount,
      points,
      maxRev,
    };
  }, [sessions, kiosks, detailKioskId, detailRange, selectedMonth]);

  // ── 5. RANKING KIOSK & PROPORSI PENDAPATAN ────────────────────────────────
  const kioskRankings = useMemo(() => {
    const data = kiosks.map((k) => {
      const kSessions = sessions.filter((s) => {
        if (!isDateInRange(s.createdAt, rankRange)) return false;
        return (
          (s.kioskId && String(s.kioskId) === String(k.id)) ||
          (k.licenseKey && s.licenseKey?.toUpperCase() === (k.licenseKey || k.license_key || '').toUpperCase()) ||
          (k.name && s.kioskName?.toLowerCase() === k.name.toLowerCase()) ||
          (kiosks.length === 1)
        );
      });

      const revenue = kSessions.reduce((acc, s) => {
        return acc + (Number(s.price || s.amount || s.sessionPrice || 0) || 30000);
      }, 0);

      const voucherCount = kSessions.filter((s) => s.voucherCode || s.isCashVoucher).length;
      const extraPrint = kSessions.reduce((acc, s) => acc + (Number(s.extraPrint || 0) || 0), 0);

      return {
        id: k.id,
        name: k.name,
        sessionsCount: kSessions.length,
        revenue,
        voucherCount,
        extraPrint,
      };
    });

    // Sort descending by revenue, then sessions
    data.sort((a, b) => b.revenue - a.revenue || b.sessionsCount - a.sessionsCount);

    const totalRevenueAll = data.reduce((acc, k) => acc + k.revenue, 0) || 1;
    const maxRev = Math.max(...data.map((k) => k.revenue), 100000);

    const withPercentage = data.map((k, idx) => ({
      ...k,
      percentage: Math.round((k.revenue / totalRevenueAll) * 100) || 0,
      color: KIOSK_COLORS[idx % KIOSK_COLORS.length],
    }));

    return {
      ranked: withPercentage,
      totalRevenueAll,
      maxRev,
    };
  }, [sessions, kiosks, rankRange, selectedMonth]);

  // ── 6. JAM & HARI PALING RAMAI (HEATMAP) ──────────────────────────────────
  const heatmapData = useMemo(() => {
    // 7 days of week: 0 = Sen, 1 = Sel, ..., 6 = Min
    // We map JavaScript getDay(): 0 is Sunday, 1 is Monday...
    // Let index 0 = Monday (Sen), 1 = Tuesday (Sel), ..., 6 = Sunday (Min)
    const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun

    const rowsCount = heatmapHourMode === '4h' ? 6 : 24;
    const matrix = Array.from({ length: rowsCount }, () => Array(7).fill(0));

    sessions.forEach((s) => {
      if (!isDateInRange(s.createdAt, heatmapRange)) return;
      if (heatmapKioskFilter !== 'all') {
        const k = kiosks.find((x) => String(x.id) === String(heatmapKioskFilter));
        const match =
          (s.kioskId && String(s.kioskId) === String(heatmapKioskFilter)) ||
          (k && s.licenseKey?.toUpperCase() === (k.licenseKey || k.license_key || '').toUpperCase()) ||
          (k && s.kioskName?.toLowerCase() === k.name.toLowerCase());
        if (!match) return;
      }

      const d = new Date(s.createdAt || Date.now());
      const jsDay = d.getDay(); // 0 is Sun, 1 is Mon
      const colIdx = dayIndices.indexOf(jsDay);
      const hour = d.getHours();

      const rowIdx = heatmapHourMode === '4h' ? Math.floor(hour / 4) : hour;
      if (matrix[rowIdx] && matrix[rowIdx][colIdx] !== undefined) {
        matrix[rowIdx][colIdx] += 1;
      }
    });

    let maxCellCount = 0;
    matrix.forEach((row) => {
      row.forEach((count) => {
        if (count > maxCellCount) maxCellCount = count;
      });
    });

    return {
      matrix,
      maxCellCount: Math.max(maxCellCount, 1),
    };
  }, [sessions, kiosks, heatmapKioskFilter, heatmapHourMode, heatmapRange, selectedMonth]);

  // ── SVG Path Generator Helper ─────────────────────────────────────────────
  const makeSvgAreaPath = (points, width, height, maxVal) => {
    if (!points || points.length === 0) return { linePath: '', areaPath: '' };
    const step = width / (points.length - 1 || 1);
    const coords = points.map((p, i) => {
      const x = i * step;
      const y = height - (p.revenue / (maxVal || 1)) * (height * 0.8) - 10;
      return { x, y: isNaN(y) ? height - 10 : y };
    });

    // Build smooth or straight polyline
    const linePath = coords.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

    return { linePath, areaPath };
  };

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Statistik
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Analisis performa kiosk secara menyeluruh
          </p>
        </div>
      </div>

      {/* ── CARD 1: PENDAPATAN KESELURUHAN ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Pendapatan Keseluruhan
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Semua kiosk gabungan
            </p>
          </div>

          {/* Time Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setRevenueRange('daily')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                revenueRange === 'daily'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setRevenueRange('weekly')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                revenueRange === 'weekly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Minggu Lalu
            </button>
            <button
              onClick={() => setRevenueRange('monthly')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                revenueRange === 'monthly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setRevenueRange('yearly')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                revenueRange === 'yearly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Tahunan
            </button>

            {/* Month Picker */}
            <div className="relative">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer focus:outline-none focus:border-[#04442A]"
              />
            </div>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-800 uppercase block">
              Total Pendapatan
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#04442A] mt-1 block">
              {formatRupiah(overallData.totalRevenue)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
            <span className="text-[11px] font-bold text-blue-800 uppercase block">
              Total Sesi
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-700 mt-1 block">
              {overallData.totalSessionsCount}
            </span>
          </div>
        </div>

        {/* SVG Area Line Chart */}
        <div className="pt-2">
          <div className="relative w-full h-56">
            {(() => {
              const width = 800;
              const height = 200;
              const { linePath, areaPath } = makeSvgAreaPath(
                overallData.dayPoints,
                width,
                height,
                overallData.maxRev
              );

              return (
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
                    <line
                      key={ratio}
                      x1="0"
                      y1={height * ratio}
                      x2={width}
                      y2={height * ratio}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Area fill */}
                  <path d={areaPath} fill="url(#greenGradient)" />

                  {/* Main Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              );
            })()}
          </div>

          {/* X-Axis Labels */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-3 border-t border-slate-100">
            <span>1 {overallData.monthLabel}</span>
            <span>{Math.round(overallData.daysInMonth * 0.25)} {overallData.monthLabel}</span>
            <span>{Math.round(overallData.daysInMonth * 0.5)} {overallData.monthLabel}</span>
            <span>{Math.round(overallData.daysInMonth * 0.75)} {overallData.monthLabel}</span>
            <span>{overallData.daysInMonth} {overallData.monthLabel}</span>
          </div>
        </div>
      </div>

      {/* ── CARD 2: RANKING TEMPLATE FAVORIT ───────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Ranking Template Favorit
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Analisis template yang paling sering digunakan pelanggan
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={templateKioskFilter}
              onChange={(e) => setTemplateKioskFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer focus:outline-none focus:border-[#04442A]"
            >
              <option value="all">Semua Kiosk</option>
              {kiosks.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setTemplateRange('daily')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  templateRange === 'daily'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Harian
              </button>
              <button
                onClick={() => setTemplateRange('weekly')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  templateRange === 'weekly'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Minggu Lalu
              </button>
              <button
                onClick={() => setTemplateRange('monthly')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  templateRange === 'monthly'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Bulanan
              </button>
            </div>
          </div>
        </div>

        {/* Summary Info Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Total Sesi Template
            </span>
            <span className="text-base font-black text-slate-900 mt-0.5 block">
              {templateRankings.totalTemplateSessions} sesi
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Total Pendapatan
            </span>
            <span className="text-base font-black text-slate-900 mt-0.5 block">
              {formatRupiah(templateRankings.totalTemplateRevenue)}
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Template Digunakan
            </span>
            <span className="text-base font-black text-indigo-700 mt-0.5 block">
              {templateRankings.templatesCount} template
            </span>
          </div>
        </div>

        {/* Template Ranking Rows */}
        <div className="space-y-3 pt-2">
          {templateRankings.list.map((tpl, idx) => {
            const rank = idx + 1;
            const pct =
              templateRankings.totalTemplateSessions > 0
                ? ((tpl.sessions / templateRankings.totalTemplateSessions) * 100).toFixed(1)
                : '0.0';

            const barPct =
              templateRankings.maxSessions > 0
                ? Math.min(100, Math.max(5, (tpl.sessions / templateRankings.maxSessions) * 100))
                : 5;

            // Bar color scheme based on rank
            const barColor =
              rank === 1
                ? 'bg-amber-400'
                : rank === 2
                ? 'bg-blue-500'
                : rank === 3
                ? 'bg-orange-500'
                : 'bg-emerald-500';

            return (
              <div
                key={tpl.name + idx}
                className="p-3 bg-slate-50/60 hover:bg-slate-50 rounded-2xl border border-slate-200/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-[220px]">
                  {/* Rank Medal / Badge */}
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </div>

                  {/* Frame Thumbnail */}
                  <div className="w-10 h-14 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {tpl.previewUrl ? (
                      <img
                        src={tpl.previewUrl}
                        alt={tpl.name}
                        className="max-h-full max-w-full object-contain p-0.5"
                      />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-slate-300" />
                    )}
                  </div>

                  {/* Name & Size */}
                  <div className="truncate">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{tpl.name}</h4>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/80 text-slate-700">
                      {tpl.size}
                    </span>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="flex-1 px-2">
                  <div className="w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>

                {/* Right Metrics */}
                <div className="text-right shrink-0 font-mono text-xs">
                  <span className="font-black text-slate-900">
                    {tpl.sessions} sesi{' '}
                    <span className="text-slate-400 font-normal">({pct}%)</span>
                  </span>
                  <span className="text-slate-500 font-bold block text-[11px] mt-0.5">
                    {formatRupiah(tpl.revenue)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CARD 3: PERBANDINGAN KIOSK ─────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Perbandingan Kiosk
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Bandingkan performa antar kiosk
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setComparisonRange('daily')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                comparisonRange === 'daily'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setComparisonRange('weekly')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                comparisonRange === 'weekly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Minggu Lalu
            </button>
            <button
              onClick={() => setComparisonRange('monthly')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                comparisonRange === 'monthly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setComparisonRange('yearly')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                comparisonRange === 'yearly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Tahunan
            </button>
          </div>
        </div>

        {/* Multi-Select Kiosk Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pilih Kiosk (Maks 5):
          </span>
          <div className="flex flex-wrap gap-2">
            {kiosks.map((k) => {
              const isSelected = selectedComparisonKiosks.includes(k.id);
              const colorIdx = selectedComparisonKiosks.indexOf(k.id);
              const chipColor =
                colorIdx !== -1
                  ? KIOSK_COLORS[colorIdx % KIOSK_COLORS.length]
                  : '#94A3B8';

              return (
                <button
                  key={k.id}
                  onClick={() => {
                    if (isSelected) {
                      if (selectedComparisonKiosks.length > 1) {
                        setSelectedComparisonKiosks(
                          selectedComparisonKiosks.filter((id) => id !== k.id)
                        );
                      }
                    } else {
                      if (selectedComparisonKiosks.length < 5) {
                        setSelectedComparisonKiosks([...selectedComparisonKiosks, k.id]);
                      }
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-50 border-slate-300 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: chipColor }}
                  />
                  <span>{k.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-line Comparison SVG Chart */}
        <div className="pt-4">
          <div className="relative w-full h-56">
            {(() => {
              const width = 800;
              const height = 200;

              return (
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  {/* Horizontal Grid lines */}
                  {[0.25, 0.5, 0.75].map((ratio) => (
                    <line
                      key={ratio}
                      x1="0"
                      y1={height * ratio}
                      x2={width}
                      y2={height * ratio}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Render Lines for each Kiosk */}
                  {comparisonData.kioskDatasets.map((kd) => {
                    const { linePath, areaPath } = makeSvgAreaPath(
                      kd.points,
                      width,
                      height,
                      comparisonData.maxRev
                    );

                    return (
                      <g key={kd.id}>
                        <path
                          d={linePath}
                          fill="none"
                          stroke={kd.color}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>

          {/* X-Axis */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-3 border-t border-slate-100">
            <span>1</span>
            <span>8</span>
            <span>15</span>
            <span>22</span>
            <span>29</span>
            <span>30</span>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            {comparisonData.kioskDatasets.map((kd) => (
              <div key={kd.id} className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: kd.color }}
                />
                <span>{kd.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CARD 4: DETAIL PER KIOSK ───────────────────────────────────────── */}
      {detailKioskData && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Detail Per Kiosk
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Analisis mendalam per kiosk
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={detailKioskId}
                onChange={(e) => setDetailKioskId(Number(e.target.value) || e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer focus:outline-none focus:border-[#04442A]"
              >
                {kiosks.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setDetailRange('daily')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    detailRange === 'daily'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Harian
                </button>
                <button
                  onClick={() => setDetailRange('weekly')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    detailRange === 'weekly'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Minggu Lalu
                </button>
                <button
                  onClick={() => setDetailRange('monthly')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    detailRange === 'monthly'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Bulanan
                </button>
                <button
                  onClick={() => setDetailRange('yearly')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    detailRange === 'yearly'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Tahunan
                </button>
              </div>
            </div>
          </div>

          {/* Metric Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
              <span className="text-[11px] font-bold text-blue-800 uppercase block">
                Pendapatan
              </span>
              <span className="text-xl font-black text-blue-900 mt-0.5 block">
                {formatRupiah(detailKioskData.totalRevenue)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
              <span className="text-[11px] font-bold text-blue-800 uppercase block">
                Total Sesi
              </span>
              <span className="text-xl font-black text-blue-900 mt-0.5 block">
                {detailKioskData.totalSesi}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
              <span className="text-[11px] font-bold text-purple-800 uppercase block">
                Extra Print
              </span>
              <span className="text-xl font-black text-purple-900 mt-0.5 block">
                {detailKioskData.extraPrintCount}
              </span>
            </div>
          </div>

          {/* Single Kiosk Area Chart */}
          <div className="pt-2">
            <div className="relative w-full h-52">
              {(() => {
                const width = 800;
                const height = 180;
                const { linePath, areaPath } = makeSvgAreaPath(
                  detailKioskData.points,
                  width,
                  height,
                  detailKioskData.maxRev
                );

                return (
                  <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {[0.25, 0.5, 0.75].map((ratio) => (
                      <line
                        key={ratio}
                        x1="0"
                        y1={height * ratio}
                        x2={width}
                        y2={height * ratio}
                        stroke="#E2E8F0"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                    ))}

                    <path d={areaPath} fill="url(#blueGradient)" />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                );
              })()}
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-3 border-t border-slate-100">
              <span>1 {overallData.monthLabel}</span>
              <span>{Math.round(overallData.daysInMonth * 0.25)} {overallData.monthLabel}</span>
              <span>{Math.round(overallData.daysInMonth * 0.5)} {overallData.monthLabel}</span>
              <span>{Math.round(overallData.daysInMonth * 0.75)} {overallData.monthLabel}</span>
              <span>{overallData.daysInMonth} {overallData.monthLabel}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CARD 5 & CARD 6: SIDE-BY-SIDE (RANKING KIOSK & PROPORSI PENDAPATAN) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 5: RANKING KIOSK */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Ranking Kiosk
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Kiosk paling menguntungkan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setRankRange('monthly')}
                className="px-3 py-1 bg-slate-900 text-white rounded-xl font-bold"
              >
                Bulanan
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {kioskRankings.ranked.map((k, idx) => {
              const rank = idx + 1;
              const barPct =
                kioskRankings.maxRev > 0
                  ? Math.min(100, Math.max(5, (k.revenue / kioskRankings.maxRev) * 100))
                  : 5;

              const barColor =
                rank === 1
                  ? 'bg-amber-400'
                  : rank === 2
                  ? 'bg-blue-500'
                  : rank === 3
                  ? 'bg-orange-500'
                  : 'bg-emerald-500';

              return (
                <div key={k.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center font-black text-[11px]">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </span>
                      <span className="font-bold text-slate-900">{k.name}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-slate-400 font-bold mr-2">{k.sessionsCount} sesi</span>
                      <span className="font-black text-slate-900">{formatRupiah(k.revenue)}</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARD 6: PROPORSI PENDAPATAN */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <PieIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Proporsi Pendapatan
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Kontribusi per kiosk
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setProportionRange('monthly')}
                className="px-3 py-1 bg-slate-900 text-white rounded-xl font-bold"
              >
                Bulanan
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut Chart */}
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F5F9" strokeWidth="18" />
                {(() => {
                  let accumulatedPercent = 0;
                  return kioskRankings.ranked.map((k) => {
                    const strokeDasharray = `${k.percentage} ${100 - k.percentage}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += k.percentage;

                    return (
                      <circle
                        key={k.id}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={k.color}
                        strokeWidth="18"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        pathLength="100"
                      />
                    );
                  });
                })()}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                <span className="text-sm font-black text-slate-800">
                  {kiosks.length} Kiosk
                </span>
              </div>
            </div>

            {/* Legend & Breakdown */}
            <div className="flex-1 space-y-3 text-xs w-full">
              {kioskRankings.ranked.slice(0, 4).map((k) => (
                <div
                  key={k.id}
                  className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: k.color }}
                      />
                      <span className="font-bold text-slate-900">{k.name}</span>
                    </div>
                    <span className="font-black text-slate-900">{k.percentage}%</span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium pl-4 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Pendapatan</span>
                      <span className="font-bold text-slate-800">{formatRupiah(k.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Sesi</span>
                      <span>{k.sessionsCount}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Penggunaan Voucher</span>
                      <span>{k.voucherCount}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Extra Print</span>
                      <span>{k.extraPrint}x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD 7: JAM & HARI PALING RAMAI (HEATMAP) ───────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Jam &amp; Hari Paling Ramai
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Heatmap jumlah sesi berhasil
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={heatmapKioskFilter}
              onChange={(e) => setHeatmapKioskFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer focus:outline-none focus:border-[#04442A]"
            >
              <option value="all">Semua Kiosk</option>
              {kiosks.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setHeatmapHourMode('1h')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  heatmapHourMode === '1h'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Per 1 Jam
              </button>
              <button
                onClick={() => setHeatmapHourMode('4h')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  heatmapHourMode === '4h'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Per 4 Jam
              </button>
            </div>
          </div>
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span>Sepi</span>
          <span className="w-4 h-4 rounded bg-slate-100 border border-slate-200 inline-block" />
          <span className="w-4 h-4 rounded bg-emerald-100 inline-block" />
          <span className="w-4 h-4 rounded bg-emerald-300 inline-block" />
          <span className="w-4 h-4 rounded bg-emerald-500 inline-block" />
          <span className="w-4 h-4 rounded bg-emerald-700 inline-block" />
          <span>Ramai</span>
        </div>

        {/* Heatmap Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 text-left w-20 font-bold">Jam</th>
                <th className="py-2.5 px-3 font-bold">Sen</th>
                <th className="py-2.5 px-3 font-bold">Sel</th>
                <th className="py-2.5 px-3 font-bold">Rab</th>
                <th className="py-2.5 px-3 font-bold">Kam</th>
                <th className="py-2.5 px-3 font-bold">Jum</th>
                <th className="py-2.5 px-3 font-bold">Sab</th>
                <th className="py-2.5 px-3 font-bold">Min</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {heatmapData.matrix.map((row, rowIdx) => {
                const hourLabel =
                  heatmapHourMode === '4h'
                    ? `${String(rowIdx * 4).padStart(2, '0')}.00 - ${String(
                        (rowIdx + 1) * 4
                      ).padStart(2, '0')}.00`
                    : `${String(rowIdx).padStart(2, '0')}.00`;

                return (
                  <tr key={rowIdx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-left font-bold text-slate-400 font-sans text-[11px]">
                      {hourLabel}
                    </td>
                    {row.map((count, colIdx) => {
                      // Compute color intensity based on count
                      let cellBg = 'bg-white';
                      let textColor = 'text-transparent';

                      if (count > 0) {
                        const intensity = count / heatmapData.maxCellCount;
                        textColor = 'text-slate-800 font-black';
                        if (intensity > 0.75) {
                          cellBg = 'bg-emerald-600 text-white';
                          textColor = 'text-white font-black';
                        } else if (intensity > 0.5) {
                          cellBg = 'bg-emerald-400 text-slate-900';
                        } else if (intensity > 0.25) {
                          cellBg = 'bg-emerald-200 text-slate-900';
                        } else {
                          cellBg = 'bg-emerald-100 text-emerald-900';
                        }
                      }

                      return (
                        <td key={colIdx} className="p-1">
                          <div
                            className={`h-7 rounded-lg flex items-center justify-center text-[11px] transition-colors ${cellBg} ${textColor}`}
                            title={`${count} sesi`}
                          >
                            {count > 0 ? count : ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
