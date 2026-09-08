'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RotateCw,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  GripVertical,
  Sliders,
  Code,
  Check,
  Layout,
  RefreshCw,
  X,
  AlertCircle,
  Settings
} from 'lucide-react';

export const TEMPLATE_CATEGORIES = [
  {
    id: 'regular',
    name: 'Photobooth Reguler',
    description: 'Format foto standar 2R & 4R untuk Kiosk Normal & Event',
    icon: '📸',
    allowedSizes: ['2R', '4R'],
  },
  {
    id: 'receipt',
    name: 'Receipt Photobooth',
    description: 'Format kertas thermal receipt khusus 58mm & 80mm',
    icon: '🧾',
    allowedSizes: ['58mm', '80mm'],
  },
];

export const SIZE_PRESETS = {
  // ── Photobooth Reguler (2R & 4R Saja) ───────────
  // Ukuran kanvas sama-sama 1200 × 1800 px portrait.
  // 2R: dipotong/cut menjadi 2 strip 2×6" saat dicetak.
  // 4R: utuh/tanpa cut 1 lembar postcard 4×6" saat dicetak.
  '2R': {
    label: '2R (1200 × 1800 px) - Strip (Auto-Cut Bagi 2)',
    categoryType: 'regular',
    category: '2R',
    paperSize: '2r',
    width: 1200,
    height: 1800,
    defaultSlots: [],
  },
  '4R': {
    label: '4R (1200 × 1800 px) - Postcard Full (Tanpa Cut)',
    categoryType: 'regular',
    category: '4R',
    paperSize: '4r',
    width: 1200,
    height: 1800,
    defaultSlots: [],
  },

  // ── Receipt Photobooth (58mm & 80mm Saja) ───────
  '58mm': {
    label: '58mm Thermal (384 × 1200 px)',
    categoryType: 'receipt',
    category: 'Receipt',
    paperSize: 'thermal_58mm',
    width: 384,
    height: 1200,
    defaultSlots: [],
  },
  '80mm': {
    label: '80mm Thermal (576 × 1600 px)',
    categoryType: 'receipt',
    category: 'Receipt',
    paperSize: 'thermal_80mm',
    width: 576,
    height: 1600,
    defaultSlots: [],
  },
};

export default function TemplateEditorStudio({
  initialTemplate = null,
  onSave,
  onCancel,
  showToast,
  adminPin = '1234',
}) {
  const isInitialReceipt =
    initialTemplate?.templateType === 'receipt' ||
    initialTemplate?.categoryType === 'receipt' ||
    initialTemplate?.category === 'Receipt' ||
    initialTemplate?.paperSize === 'thermal_80mm' ||
    initialTemplate?.paperSize === 'thermal_58mm' ||
    initialTemplate?.size === 'Receipt' ||
    initialTemplate?.size === '58mm' ||
    initialTemplate?.size === '80mm' ||
    initialTemplate?.name?.toLowerCase().includes('receipt');

  const [templateType, setTemplateType] = useState(isInitialReceipt ? 'receipt' : 'regular');

  const initialSizeKey = (() => {
    if (isInitialReceipt) {
      if (
        initialTemplate?.size === '58mm' ||
        Number(initialTemplate?.width) <= 400 ||
        initialTemplate?.paperSize === 'thermal_58mm'
      ) {
        return '58mm';
      }
      return '80mm';
    }
    if (
      initialTemplate?.size === '4R' ||
      initialTemplate?.paperSize === '4r'
    ) {
      return '4R';
    }
    return '2R';
  })();

  const [name, setName] = useState(initialTemplate?.name || '');
  const [sizePreset, setSizePreset] = useState(initialSizeKey);
  const [category, setCategory] = useState(
    initialTemplate?.category || (isInitialReceipt ? 'Receipt' : initialSizeKey)
  );
  const [width, setWidth] = useState(
    Number(initialTemplate?.width) || (isInitialReceipt ? (initialSizeKey === '58mm' ? 384 : 576) : 1200)
  );
  const [height, setHeight] = useState(
    Number(initialTemplate?.height) || (isInitialReceipt ? (initialSizeKey === '58mm' ? 1200 : 1600) : 1800)
  );
  const [rotation, setRotation] = useState(Number(initialTemplate?.rotation) || 0);
  const [paperSize, setPaperSize] = useState(
    initialTemplate?.paperSize || (isInitialReceipt ? (initialSizeKey === '58mm' ? 'thermal_58mm' : 'thermal_80mm') : (initialSizeKey === '4R' ? '4r' : '2r'))
  );

  // Slots: default kosong tanpa slot foto terlebih dahulu
  const [slots, setSlots] = useState(
    initialTemplate?.slots?.length > 0 ? initialTemplate.slots : []
  );
  const [activeSlotId, setActiveSlotId] = useState(
    initialTemplate?.slots?.[0]?.id || null
  );

  // Backgrounds & Previews
  const [bgImage, setBgImage] = useState(initialTemplate?.previewUrl || initialTemplate?.imageUrl || null);
  const [bgType, setBgType] = useState('checkerboard'); // 'checkerboard' | 'white' | 'dark'
  const [previewMode, setPreviewMode] = useState(false);
  const [viewCode, setViewCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastError, setToastError] = useState(null);
  const [toastSuccess, setToastSuccess] = useState(null);
  const [snapGuides, setSnapGuides] = useState({ x: null, y: null });
  const [isInteracting, setIsInteracting] = useState(false);

  // Canvas Refs & Dragging
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragStateRef = useRef(null);
  const pendingUpdateRef = useRef(null);
  const rafIdRef = useRef(null);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toastSuccess) {
      const t = setTimeout(() => setToastSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastSuccess]);

  useEffect(() => {
    if (toastError) {
      const t = setTimeout(() => setToastError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastError]);

  // Switch template category (Photobooth Reguler vs Receipt Photobooth)
  const handleTemplateTypeChange = (newType) => {
    if (newType === templateType) return;
    setTemplateType(newType);
    const defaultPresetKey = newType === 'receipt' ? '80mm' : '2R';
    handleSizePresetChange(defaultPresetKey, newType);
  };

  // Switch size preset - Synchronizes width, height, category, and paperSize
  const handleSizePresetChange = (presetKey, forcedType = null) => {
    setSizePreset(presetKey);
    const preset = SIZE_PRESETS[presetKey];
    if (preset) {
      const oldW = width;
      const oldH = height;
      const newW = preset.width;
      const newH = preset.height;
      const effectiveType = forcedType || preset.categoryType;

      setWidth(newW);
      setHeight(newH);
      setCategory(preset.category);
      setPaperSize(preset.paperSize);
      if (effectiveType) {
        setTemplateType(effectiveType);
      }

      if (slots.length > 0 && oldW && oldH) {
        const scaleX = newW / oldW;
        const scaleY = newH / oldH;
        setSlots((prev) =>
          prev.map((slot) => {
            const slotW = Math.max(40, Math.min(newW, Math.round(slot.width * scaleX)));
            const slotH = Math.max(40, Math.min(newH, Math.round(slot.height * scaleY)));
            const slotX = Math.max(0, Math.min(newW - slotW, Math.round(slot.x * scaleX)));
            const slotY = Math.max(0, Math.min(newH - slotH, Math.round(slot.y * scaleY)));
            return {
              ...slot,
              x: slotX,
              y: slotY,
              width: slotW,
              height: slotH,
            };
          })
        );
      } else if (preset.defaultSlots && preset.defaultSlots.length > 0) {
        setSlots(preset.defaultSlots);
        setActiveSlotId(preset.defaultSlots[0]?.id || 1);
      }

      setToastSuccess(`Ukuran kanvas disesuaikan ke ${newW} × ${newH} px (${presetKey})`);
    }
  };

  // Add new photo slot
  const handleAddSlot = () => {
    const nextId = slots.length > 0 ? Math.max(...slots.map((s) => s.id)) + 1 : 1;
    const isNarrowStrip = width <= 700 && height > width * 1.5;

    let defaultW, defaultH, nextX, nextY;

    if (isNarrowStrip) {
      defaultW = Math.round(width * 0.86);
      defaultH = Math.round(defaultW * 0.72);
      nextX = Math.round((width - defaultW) / 2);
      const lastSlot = slots[slots.length - 1];
      const gapY = Math.round(height * 0.025);
      nextY = lastSlot
        ? Math.min(height - defaultH - 20, lastSlot.y + lastSlot.height + gapY)
        : Math.round(height * 0.08);
    } else {
      defaultW = Math.round(width * 0.42);
      defaultH = Math.round(height * 0.28);
      const row = (nextId - 1) % 4;
      const col = Math.floor((nextId - 1) / 4);
      const marginX = Math.round(width * 0.08);
      const gapX = Math.round(width * 0.04);
      const marginY = Math.round(height * 0.12);
      const gapY = Math.round(height * 0.035);
      nextX = Math.round(marginX + col * (defaultW + gapX));
      nextY = Math.round(marginY + row * (defaultH + gapY));
    }

    const newSlot = {
      id: nextId,
      x: Math.min(width - defaultW, Math.max(0, nextX)),
      y: Math.min(height - defaultH, Math.max(0, nextY)),
      width: defaultW,
      height: defaultH,
      rotation: 0,
      zIndex: slots.length + 1,
    };

    setSlots((prev) => [...prev, newSlot]);
    setActiveSlotId(nextId);
    setToastSuccess(`Slot foto #${nextId} berhasil ditambahkan`);
  };

  // Remove slot
  const handleDeleteSlot = (slotId, e) => {
    if (e) e.stopPropagation();
    const updated = slots.filter((s) => s.id !== slotId);
    setSlots(updated);
    if (activeSlotId === slotId) {
      setActiveSlotId(updated[0]?.id || null);
    }
  };

  // Rotate template
  const handleRotateCanvas = (delta) => {
    const nextRot = ((rotation + delta) % 360 + 360) % 360;
    setRotation(nextRot);
  };

  // Process file upload or drag drop
  const handleProcessFile = (file) => {
    if (!file) return;
    if (!file.type.includes('png') && !file.type.includes('image')) {
      setToastError('Format file harus berupa gambar PNG/JPEG.');
      setTimeout(() => setToastError(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setBgImage(event.target.result);
      setToastSuccess('Gambar overlay bingkai berhasil dimuat!');
      setTimeout(() => setToastSuccess(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  // ── High-Performance 60/120 FPS Drag & Resize Engine (rAF + Pointer Events) ──
  const handlePointerDownSlot = (e, slot, actionType = 'move', handle = null) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveSlotId(slot.id);
    setIsInteracting(true);

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    dragStateRef.current = {
      actionType,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialSlot: { ...slot },
      scaleX: width / rect.width,
      scaleY: height / rect.height,
    };

    try {
      if (e.target && typeof e.target.setPointerCapture === 'function') {
        e.target.setPointerCapture(e.pointerId);
      }
    } catch (_) {}
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!dragStateRef.current) return;
      const { actionType, handle, startX, startY, initialSlot, scaleX, scaleY } = dragStateRef.current;

      const dx = (e.clientX - startX) * scaleX;
      const dy = (e.clientY - startY) * scaleY;

      pendingUpdateRef.current = { actionType, handle, initialSlot, dx, dy };

      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          if (!pendingUpdateRef.current) return;
          const { actionType, handle, initialSlot, dx, dy } = pendingUpdateRef.current;

          let activeGuideX = null;
          let activeGuideY = null;
          const snapThreshold = 10;

          setSlots((prevSlots) =>
            prevSlots.map((s) => {
              if (s.id !== initialSlot.id) return s;

              if (actionType === 'move') {
                let nextX = Math.max(0, Math.min(width - s.width, initialSlot.x + dx));
                let nextY = Math.max(0, Math.min(height - s.height, initialSlot.y + dy));

                // Snap to Center X
                const centerX = width / 2;
                const slotCenterX = nextX + s.width / 2;
                if (Math.abs(slotCenterX - centerX) <= snapThreshold) {
                  nextX = centerX - s.width / 2;
                  activeGuideX = centerX;
                }

                // Snap to Center Y
                const centerY = height / 2;
                const slotCenterY = nextY + s.height / 2;
                if (Math.abs(slotCenterY - centerY) <= snapThreshold) {
                  nextY = centerY - s.height / 2;
                  activeGuideY = centerY;
                }

                // Snap to edges
                if (Math.abs(nextX) <= snapThreshold) {
                  nextX = 0;
                  activeGuideX = 0;
                } else if (Math.abs(nextX + s.width - width) <= snapThreshold) {
                  nextX = width - s.width;
                  activeGuideX = width;
                }

                if (Math.abs(nextY) <= snapThreshold) {
                  nextY = 0;
                  activeGuideY = 0;
                } else if (Math.abs(nextY + s.height - height) <= snapThreshold) {
                  nextY = height - s.height;
                  activeGuideY = height;
                }

                return { ...s, x: Math.round(nextX), y: Math.round(nextY) };
              }

              if (actionType === 'resize') {
                let newX = initialSlot.x;
                let newY = initialSlot.y;
                let newW = initialSlot.width;
                let newH = initialSlot.height;
                const minSize = 40;

                if (handle.includes('e')) {
                  newW = Math.max(minSize, Math.min(width - initialSlot.x, initialSlot.width + dx));
                }
                if (handle.includes('s')) {
                  newH = Math.max(minSize, Math.min(height - initialSlot.y, initialSlot.height + dy));
                }
                if (handle.includes('w')) {
                  const possibleW = initialSlot.width - dx;
                  if (possibleW >= minSize && initialSlot.x + dx >= 0) {
                    newX = initialSlot.x + dx;
                    newW = possibleW;
                  }
                }
                if (handle.includes('n')) {
                  const possibleH = initialSlot.height - dy;
                  if (possibleH >= minSize && initialSlot.y + dy >= 0) {
                    newY = initialSlot.y + dy;
                    newH = possibleH;
                  }
                }

                return {
                  ...s,
                  x: Math.round(newX),
                  y: Math.round(newY),
                  width: Math.round(newW),
                  height: Math.round(newH),
                };
              }

              return s;
            })
          );

          setSnapGuides({ x: activeGuideX, y: activeGuideY });
        });
      }
    };

    const handlePointerUp = () => {
      if (dragStateRef.current) {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        pendingUpdateRef.current = null;
        dragStateRef.current = null;
        setIsInteracting(false);
        setSnapGuides({ x: null, y: null });
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [width, height]);

  // Generate XML
  const generatedXml = useMemo(() => {
    const finalCat = templateType === 'receipt' ? 'Receipt' : category;
    const finalPaper = paperSize || (templateType === 'receipt' ? (sizePreset === '58mm' ? 'thermal_58mm' : 'thermal_80mm') : '2r');
    return `<frame>
  <name>${name.trim()}</name>
  <templateType>${templateType}</templateType>
  <category>${finalCat}</category>
  <size>${sizePreset}</size>
  <width>${width}</width>
  <height>${height}</height>
  <rotation>${rotation}</rotation>
  <paperSize>${finalPaper}</paperSize>
  <photos>
${slots
  .map(
    (s, idx) => `    <photo>
      <x>${Math.round(s.x)}</x>
      <y>${Math.round(s.y)}</y>
      <width>${Math.round(s.width)}</width>
      <height>${Math.round(s.height)}</height>
      <rotation>${s.rotation || 0}</rotation>
      <zIndex>${s.zIndex || idx + 1}</zIndex>
    </photo>`
  )
  .join('\n')}
  </photos>
</frame>`;
  }, [name, templateType, category, sizePreset, width, height, rotation, paperSize, slots]);

  // Save template
  const handleSave = async () => {
    if (!name.trim()) {
      setToastError('Template name is required');
      setTimeout(() => setToastError(null), 4000);
      return;
    }
    if (slots.length === 0) {
      setToastError('Template harus memiliki minimal 1 slot foto');
      setTimeout(() => setToastError(null), 4000);
      return;
    }

    try {
      setSaving(true);
      const frameId = initialTemplate?.id || `frame_${name.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30)}_${Date.now()}`;

      const payload = {
        action: 'add',
        pin: adminPin,
        frame: {
          id: frameId,
          name: name.trim(),
          templateType,
          categoryType: templateType,
          size: sizePreset,
          category: templateType === 'receipt' ? 'Receipt' : category,
          paperSize: paperSize || (templateType === 'receipt' ? (sizePreset === '58mm' ? 'thermal_58mm' : 'thermal_80mm') : '2r'),
          width,
          height,
          rotation,
          photoCount: slots.length,
          slots,
          xml: generatedXml,
          pngBase64: bgImage && bgImage.startsWith('data:') ? bgImage : null,
          previewUrl: bgImage && !bgImage.startsWith('data:') ? bgImage : null,
        },
      };

      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setToastSuccess(`Template "${name}" berhasil disimpan!`);
        setTimeout(() => {
          if (onSave) onSave(json.frames);
        }, 1200);
      } else {
        setToastError(json.error || 'Gagal menyimpan template.');
        setTimeout(() => setToastError(null), 4000);
      }
    } catch (err) {
      console.error('[TemplateStudio] Save error:', err);
      setToastError('Terjadi kesalahan saat menyimpan template.');
      setTimeout(() => setToastError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const activeSlot = slots.find((s) => s.id === activeSlotId) || slots[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-50 text-[#111111] font-sans -m-4 md:-m-8">
      {/* ── Top Header Toolbar ────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-[#120CD6] rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-black uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali ke Daftar</span>
          </button>
          <span className="text-slate-300">|</span>
          <h2 className="text-sm md:text-base font-black text-[#120CD6] uppercase tracking-tight flex items-center gap-2">
            <Layout className="w-4 h-4" />
            <span>{initialTemplate ? 'Edit Template' : 'Create New Template'}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Canvas Background toggle */}
          <button
            type="button"
            onClick={() => {
              const bgTypes = ['checkerboard', 'white', 'dark'];
              setBgType(bgTypes[(bgTypes.indexOf(bgType) + 1) % bgTypes.length]);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
            title="Ubah latar canvas"
          >
            <div
              className={`w-3 h-3 rounded-full border border-slate-400 ${
                bgType === 'white' ? 'bg-white' : bgType === 'dark' ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            />
            <span className="hidden sm:inline">Canvas Bg</span>
          </button>

          {/* Preview Mode toggle */}
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
              previewMode
                ? 'bg-[#120CD6] text-white border-[#120CD6]'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            {previewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>Preview Mode</span>
          </button>

          {/* View Code / XML toggle */}
          <button
            type="button"
            onClick={() => setViewCode(!viewCode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
              viewCode
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
            title="Lihat XML"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">XML</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-1.5 bg-[#E5FD5F] hover:bg-[#d8f244] active:bg-[#F908E0] active:text-white text-[#111111] border-2 border-[#120CD6] font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Floating Error Toast Notification (from Reference Video) */}
      {toastError && (
        <div className="fixed top-5 right-5 z-[100] bg-white border border-rose-300 text-rose-700 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="text-xs font-bold">{toastError}</span>
          <button
            type="button"
            onClick={() => setToastError(null)}
            className="p-1 hover:bg-rose-50 rounded-lg text-rose-400 hover:text-rose-600 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Success Toast Notification (Auto-Dismissing Non-Blocking) */}
      {toastSuccess && (
        <div className="fixed top-5 right-5 z-[100] bg-white border border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{toastSuccess}</span>
          <button
            type="button"
            onClick={() => setToastSuccess(null)}
            className="p-1 hover:bg-emerald-50 rounded-lg text-emerald-400 hover:text-emerald-600 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Studio Split Layout ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        
        {/* ── Center Stage: Interactive Visual Canvas ────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-auto bg-[#F4F6F9] relative select-none">
          
          {/* Visual Canvas Box */}
          <div
            ref={canvasRef}
            className={`relative rounded-2xl shadow-2xl overflow-hidden border-4 border-white ${
              bgType === 'checkerboard'
                ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100'
                : bgType === 'white'
                ? 'bg-white'
                : 'bg-slate-900'
            }`}
            style={{
              maxHeight: 'min(72vh, 650px)',
              maxWidth: 'min(92%, 580px)',
              aspectRatio: `${width} / ${height}`,
              width: width > height ? 'min(560px, 92%)' : 'auto',
              height: width <= height ? 'min(70vh, 620px)' : 'auto',
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* Magnetic Snap Alignment Guides */}
            {snapGuides.x !== null && (
              <div
                className="absolute top-0 bottom-0 w-px bg-emerald-500 pointer-events-none z-50 border-r border-dashed border-emerald-400"
                style={{ left: `${(snapGuides.x / width) * 100}%` }}
              />
            )}
            {snapGuides.y !== null && (
              <div
                className="absolute left-0 right-0 h-px bg-emerald-500 pointer-events-none z-50 border-b border-dashed border-emerald-400"
                style={{ top: `${(snapGuides.y / height) * 100}%` }}
              />
            )}

            {/* Empty Canvas Dropzone (Shown when no background uploaded yet) */}
            {!bgImage && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleProcessFile(file);
                }}
                className="absolute inset-4 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-[#120CD6] hover:text-[#120CD6] transition cursor-pointer bg-white/60 z-20 select-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-700">Upload Background</span>
                <span className="text-xs text-slate-400">Click or drag and drop</span>
                <span className="text-[11px] font-mono text-slate-400">{width} × {height} px</span>
              </div>
            )}

            {/* Layer 1: Preview Sample Photo (Visible in Preview Mode) */}
            {previewMode &&
              slots.map((slot) => {
                const leftPct = (slot.x / width) * 100;
                const topPct = (slot.y / height) * 100;
                const widthPct = (slot.width / width) * 100;
                const heightPct = (slot.height / height) * 100;

                return (
                  <div
                    key={`preview-${slot.id}`}
                    className="absolute overflow-hidden bg-slate-800"
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                      transform: `rotate(${slot.rotation || 0}deg)`,
                      zIndex: slot.zIndex || 10,
                    }}
                  >
                    <div className="w-full h-full bg-gradient-to-tr from-slate-700 via-slate-500 to-slate-400 flex flex-col items-center justify-center text-white p-2">
                      <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center mb-1 text-xs font-black">
                        #{slot.id}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-center opacity-90">
                        Foto Pelanggan {slot.id}
                      </span>
                    </div>
                  </div>
                );
              })}

            {/* Layer 2: Frame PNG Background Overlay */}
            {bgImage && (
              <img
                src={bgImage}
                alt="Frame PNG Overlay"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{
                  zIndex: previewMode ? 25 : 15,
                }}
              />
            )}

            {/* Layer 3: Interactive Draggable Slots (Active in Edit Mode) */}
            {!previewMode &&
              slots.map((slot) => {
                const leftPct = (slot.x / width) * 100;
                const topPct = (slot.y / height) * 100;
                const widthPct = (slot.width / width) * 100;
                const heightPct = (slot.height / height) * 100;
                const isActive = slot.id === activeSlotId;

                return (
                  <div
                    key={`slot-${slot.id}`}
                    onPointerDown={(e) => handlePointerDownSlot(e, slot, 'move')}
                    className={`absolute flex flex-col items-center justify-between select-none ${
                      isInteracting && isActive ? 'cursor-grabbing' : 'cursor-grab'
                    } ${
                      isActive
                        ? 'border-2 border-emerald-500 bg-emerald-500/25 shadow-xl z-40 ring-2 ring-emerald-400/40'
                        : 'border border-dashed border-slate-700/80 bg-slate-900/30 hover:border-emerald-500 z-30'
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                      transform: `rotate(${slot.rotation || 0}deg)`,
                      touchAction: 'none',
                      willChange: 'left, top, width, height',
                      transition: isInteracting ? 'none' : 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
                    }}
                  >
                    {/* Top Stem & Rotation Handle (Active Slot) */}
                    {isActive && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlots((prev) =>
                            prev.map((s) => (s.id === slot.id ? { ...s, rotation: ((s.rotation || 0) + 90) % 360 } : s))
                          );
                        }}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer group z-50"
                        title="Klik untuk memutar slot foto 90°"
                      >
                        <div className="w-5 h-5 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-500 transition">
                          <RotateCw className="w-3 h-3" />
                        </div>
                        <div className="w-0.5 h-2 bg-emerald-500" />
                      </div>
                    )}

                    {/* Center Slot Number in Bold White */}
                    <div className="flex-1 flex items-center justify-center pointer-events-none">
                      <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {slot.id}
                      </span>
                    </div>

                    {/* Dimension Tag with Downward Pointer Triangle (Active Slot) */}
                    {isActive && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-40">
                        <div className="w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-slate-800" />
                        <span className="text-[9px] font-bold font-mono bg-slate-800 text-white px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                          {slot.width}×{slot.height}
                        </span>
                      </div>
                    )}

                    {/* 8 Resize Handles (When Slot is Active) */}
                    {isActive && (
                      <>
                        {/* 4 Corner Handles */}
                        <div
                          onPointerDown={(e) => handlePointerDownSlot(e, slot, 'resize', 'nw')}
                          style={{ touchAction: 'none' }}
                          className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-nwse-resize shadow-sm"
                        />
                        <div
                          onPointerDown={(e) => handlePointerDownSlot(e, slot, 'resize', 'ne')}
                          style={{ touchAction: 'none' }}
                          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-nesw-resize shadow-sm"
                        />
                        <div
                          onPointerDown={(e) => handlePointerDownSlot(e, slot, 'resize', 'se')}
                          style={{ touchAction: 'none' }}
                          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-nwse-resize shadow-sm"
                        />
                        <div
                          onPointerDown={(e) => handlePointerDownSlot(e, slot, 'resize', 'sw')}
                          style={{ touchAction: 'none' }}
                          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-nesw-resize shadow-sm"
                        />

                        {/* 4 Edge Handles */}
                        <div
                          onPointerDown={(e) => handlePointerDownSlot(e, slot, 'resize', 'n')}
                          style={{ touchAction: 'none' }}
                          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-2.5 bg-white border-2 border-emerald-600 rounded-xs cursor-ns-resize"
                        />
                        <div
                          onPointerDown={(e) => handlePointerDownSlot(e, slot, 'resize', 's')}
                          style={{ touchAction: 'none' }}
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-2.5 bg-white border-2 border-emerald-600 rounded-xs cursor-ns-resize"
                        />
                        <div
                          onPointerDown={(e) => handlePointerDownSlot(e, slot, 'resize', 'w')}
                          style={{ touchAction: 'none' }}
                          className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2.5 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-ew-resize"
                        />
                        <div
                          onPointerDown={(e) => handlePointerDownSlot(e, slot, 'resize', 'e')}
                          style={{ touchAction: 'none' }}
                          className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2.5 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-ew-resize"
                        />
                      </>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Canvas Footer Indicators */}
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 font-bold select-none">
            <span className="text-[11px] text-slate-400">Click • Drag • Resize</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 text-slate-700 shadow-2xs">
              <span className="text-slate-400 font-mono">📐</span>
              <span className="font-black text-[#120CD6]">{sizePreset}</span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-[11px]">{width}×{height}px</span>
            </div>
          </div>
        </div>

        {/* ── Right Control Sidebar ───────────────────────────────────── */}
        <aside className="w-full lg:w-96 bg-white border-l border-slate-200 p-5 flex flex-col gap-5 overflow-y-auto shrink-0 text-xs">
          
          {/* 1. Template Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#120CD6]"
            />
          </div>

          {/* 2. Kategori Template Utama (Photobooth Reguler vs Receipt Photobooth) */}
          <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                Kategori Template
              </label>
              <span className="px-2 py-0.5 bg-[#E5FD5F] text-[#111111] rounded text-[10px] font-black uppercase">
                {templateType === 'regular' ? '📸 Reguler' : '🧾 Receipt'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTemplateTypeChange('regular')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer text-center ${
                  templateType === 'regular'
                    ? 'border-[#120CD6] bg-blue-50/90 text-[#120CD6] shadow-sm font-black ring-1 ring-[#120CD6]/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 font-bold'
                }`}
              >
                <span className="text-base mb-0.5">📸</span>
                <span className="text-[11px] leading-tight">Photobooth Reguler</span>
                <span className="text-[9px] text-slate-400 mt-0.5 font-semibold">2R &amp; 4R Saja</span>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateTypeChange('receipt')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer text-center ${
                  templateType === 'receipt'
                    ? 'border-[#120CD6] bg-amber-50 text-[#111111] shadow-sm font-black ring-1 ring-[#120CD6]/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 font-bold'
                }`}
              >
                <span className="text-base mb-0.5">🧾</span>
                <span className="text-[11px] leading-tight">Receipt Photobooth</span>
                <span className="text-[9px] text-slate-400 mt-0.5 font-semibold">58mm &amp; 80mm Saja</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              {templateType === 'regular'
                ? 'Kategori Reguler hanya mendukung format cetak 2R dan 4R. Format receipt tidak valid.'
                : 'Kategori Receipt hanya mendukung format kertas thermal 58mm dan 80mm. Format 2R/4R tidak valid.'}
            </p>
          </div>

          {/* 3. Template Size Dropdown (Strictly filtered by Category) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                Ukuran Frame
              </label>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-black">
                {templateType === 'regular' ? 'Format 2R & 4R' : 'Thermal 58mm & 80mm'}
              </span>
            </div>
            <select
              value={sizePreset}
              onChange={(e) => handleSizePresetChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#120CD6] cursor-pointer"
            >
              {Object.entries(SIZE_PRESETS)
                .filter(([_, p]) => p.categoryType === templateType)
                .map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.label}
                  </option>
                ))}
            </select>
            {templateType === 'regular' ? (
              <p className="text-[10px] text-slate-500 font-medium">
                {sizePreset === '2R'
                  ? '✂️ Format 2R (1200×1800 px): Dicetak dan dipotong otomatis oleh printer menjadi 2 strip 2×6".'
                  : '🖼️ Format 4R (1200×1800 px): Dicetak 1 lembar postcard 4×6" utuh tanpa dipotong printer.'}
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 font-medium">
                {sizePreset === '58mm'
                  ? '🧾 Format Thermal 58mm (384×1200 px): Kertas struk kasir mini.'
                  : '🧾 Format Thermal 80mm (576×1600 px): Kertas struk kasir standar.'}
              </p>
            )}
          </div>

          {/* 3b. Dimensi Kanvas Aktif & Penyesuaian Manual */}
          <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                Dimensi Kanvas Aktif
              </label>
              <span className="px-2 py-0.5 bg-blue-100 text-[#120CD6] rounded text-[10px] font-black font-mono">
                {width} × {height} px
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">Lebar (W px):</span>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 100;
                    setWidth(val);
                    setSizePreset('Custom');
                  }}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-black font-mono text-slate-900 focus:outline-none focus:border-[#120CD6]"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">Tinggi (H px):</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 100;
                    setHeight(val);
                    setSizePreset('Custom');
                  }}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-black font-mono text-slate-900 focus:outline-none focus:border-[#120CD6]"
                />
              </div>
            </div>
          </div>

          {/* 4. Background Image (PNG Overlay) */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
              Background Image (Frame Overlay)
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png"
              onChange={handleImageUpload}
              className="hidden"
            />

            {bgImage ? (
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img src={bgImage} alt="Thumb" className="w-8 h-8 rounded object-cover border border-slate-300 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-700 truncate">File PNG Terpasang</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Ganti Gambar
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgImage(null)}
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 hover:border-[#120CD6] rounded-xl flex items-center justify-center gap-2 text-slate-600 font-bold transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Unggah Overlay PNG Frame</span>
              </button>
            )}
          </div>

          {/* 5. Rotation Controls */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
              Rotation
            </label>
            <div className="flex items-center justify-between p-1 bg-slate-50 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => handleRotateCanvas(-90)}
                className="p-2 hover:bg-white text-slate-600 rounded-lg transition cursor-pointer"
                title="Putar 90° Berlawanan Jarum Jam"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono font-black text-slate-800 text-xs">{rotation}°</span>
              <button
                type="button"
                onClick={() => handleRotateCanvas(90)}
                className="p-2 hover:bg-white text-slate-600 rounded-lg transition cursor-pointer"
                title="Putar 90° Searah Jarum Jam"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 6. Photo Slots Section */}
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                  Photo Slots
                </h4>
                <p className="text-[10px] text-slate-400 font-bold">
                  Photo count in Template: <span className="text-slate-800 font-black">{slots.length}</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-600" />
                  <span>Add New Photo</span>
                </button>
                <button
                  type="button"
                  className="p-1.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-xl transition cursor-pointer"
                  title="Pengaturan Slot"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Empty State or Slots List Cards (Exact match to Reference Video) */}
            {slots.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 bg-slate-50/50">
                <div className="w-10 h-10 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                  <Layout className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-600">No photo slots yet</p>
                <p className="text-[11px] text-slate-400">Click &quot;Add New Photo&quot; to create a slot</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {slots.map((s) => {
                  const isActive = s.id === activeSlotId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setActiveSlotId(s.id)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-white border-emerald-500 ring-2 ring-emerald-400/30 shadow-sm'
                          : 'bg-white hover:border-slate-300 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <GripVertical className="w-4 h-4 text-slate-300 cursor-grab shrink-0" />
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {s.id}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs leading-tight">
                            Photo {s.id}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">
                            {s.width}×{s.height} at ({s.x}, {s.y})
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSlot(s.id, e)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus slot ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7. Live XML Code Viewer (When toggled) */}
          {viewCode && (
            <div className="space-y-1.5 bg-[#111111] p-3 rounded-2xl border border-slate-700 text-[10px]">
              <div className="flex items-center justify-between text-white font-mono font-bold pb-1 border-b border-slate-800">
                <span>generated_template.xml</span>
                <span className="text-[#E5FD5F]">LIVE</span>
              </div>
              <pre className="text-[#E5FD5F] font-mono leading-relaxed overflow-x-auto max-h-40">
                {generatedXml}
              </pre>
            </div>
          )}

          {/* 8. Bottom Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-[#120CD6]" />
              <span>{previewMode ? 'Kembali ke Mode Edit' : 'Preview Mode (Foto Sampel)'}</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="w-full py-3 bg-[#120CD6] hover:bg-blue-800 active:bg-[#F908E0] text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Cloud &amp; Kiosk...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#E5FD5F]" />
                  <span>Save Template</span>
                </>
              )}
            </button>
          </div>

        </aside>
      </div>
    </div>
  );
}
