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
  X
} from 'lucide-react';

const SIZE_PRESETS = {
  Receipt: {
    label: 'Receipt (576 × 1600 px)',
    category: 'Receipt',
    paperSize: 'thermal_80mm',
    width: 576,
    height: 1600,
    defaultSlots: [
      { id: 1, x: 38, y: 220, width: 500, height: 345, rotation: 0, zIndex: 1 },
      { id: 2, x: 38, y: 595, width: 500, height: 345, rotation: 0, zIndex: 2 },
      { id: 3, x: 38, y: 970, width: 500, height: 345, rotation: 0, zIndex: 3 },
    ],
  },
  '2R': {
    label: '2R (1200 × 1800 px)',
    category: '2R',
    paperSize: '2r',
    width: 1200,
    height: 1800,
    defaultSlots: [
      { id: 1, x: 100, y: 150, width: 1000, height: 450, rotation: 0, zIndex: 1 },
      { id: 2, x: 100, y: 650, width: 1000, height: 450, rotation: 0, zIndex: 2 },
      { id: 3, x: 100, y: 1150, width: 1000, height: 450, rotation: 0, zIndex: 3 },
    ],
  },
  '4R': {
    label: '4R (1800 × 1200 px)',
    category: '4R',
    paperSize: '4r',
    width: 1800,
    height: 1200,
    defaultSlots: [
      { id: 1, x: 120, y: 120, width: 740, height: 450, rotation: 0, zIndex: 1 },
      { id: 2, x: 940, y: 120, width: 740, height: 450, rotation: 0, zIndex: 2 },
      { id: 3, x: 120, y: 630, width: 740, height: 450, rotation: 0, zIndex: 3 },
      { id: 4, x: 940, y: 630, width: 740, height: 450, rotation: 0, zIndex: 4 },
    ],
  },
  Photostrip: {
    label: 'Photostrip (600 × 1800 px)',
    category: 'Photostrip',
    paperSize: 'strip_2x6',
    width: 600,
    height: 1800,
    defaultSlots: [
      { id: 1, x: 50, y: 120, width: 500, height: 460, rotation: 0, zIndex: 1 },
      { id: 2, x: 50, y: 640, width: 500, height: 460, rotation: 0, zIndex: 2 },
      { id: 3, x: 50, y: 1160, width: 500, height: 460, rotation: 0, zIndex: 3 },
    ],
  },
  Custom: {
    label: 'Custom Size...',
    category: 'Umum',
    paperSize: 'standard',
    width: 1200,
    height: 1800,
    defaultSlots: [
      { id: 1, x: 100, y: 200, width: 1000, height: 600, rotation: 0, zIndex: 1 },
      { id: 2, x: 100, y: 880, width: 1000, height: 600, rotation: 0, zIndex: 2 },
    ],
  },
};

const KIOSK_CATEGORIES = [
  { id: 'Receipt', label: 'Receipt (Printer Kasir / Thermal 80mm)' },
  { id: 'Photostrip', label: 'Photostrip (Format 2x6 Inch)' },
  { id: '2R', label: '2R (Mini Format)' },
  { id: '4R', label: '4R (Postcard Standar)' },
  { id: 'Umum', label: 'Umum / Classic Studio' },
  { id: 'Event', label: 'Event Spesial / Custom' },
];

export default function TemplateEditorStudio({
  initialTemplate = null,
  onSave,
  onCancel,
  showToast,
  adminPin = '1234',
}) {
  const [name, setName] = useState(initialTemplate?.name || 'Template Baru Photobooth');
  const [sizePreset, setSizePreset] = useState(initialTemplate?.size || 'Receipt');
  const [category, setCategory] = useState(
    initialTemplate?.category || (initialTemplate?.size === 'Receipt' ? 'Receipt' : 'Receipt')
  );
  const [width, setWidth] = useState(Number(initialTemplate?.width) || 576);
  const [height, setHeight] = useState(Number(initialTemplate?.height) || 1600);
  const [rotation, setRotation] = useState(Number(initialTemplate?.rotation) || 0);
  const [paperSize, setPaperSize] = useState(initialTemplate?.paperSize || 'thermal_80mm');

  // Slots
  const [slots, setSlots] = useState(
    initialTemplate?.slots?.length > 0
      ? initialTemplate.slots
      : SIZE_PRESETS.Receipt.defaultSlots
  );
  const [activeSlotId, setActiveSlotId] = useState(slots[0]?.id || 1);

  // Backgrounds & Previews
  const [bgImage, setBgImage] = useState(initialTemplate?.previewUrl || initialTemplate?.imageUrl || null);
  const [bgType, setBgType] = useState('checkerboard'); // 'checkerboard' | 'white' | 'dark'
  const [previewMode, setPreviewMode] = useState(false);
  const [viewCode, setViewCode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Canvas Refs & Dragging
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragStateRef = useRef(null);

  // Switch preset
  const handleSizePresetChange = (presetKey) => {
    setSizePreset(presetKey);
    const preset = SIZE_PRESETS[presetKey];
    if (preset) {
      setWidth(preset.width);
      setHeight(preset.height);
      setCategory(preset.category);
      setPaperSize(preset.paperSize);
      if (preset.defaultSlots && (!initialTemplate || presetKey !== initialTemplate.size)) {
        setSlots(preset.defaultSlots);
        setActiveSlotId(preset.defaultSlots[0]?.id || 1);
      }
    }
  };

  // Add new photo slot
  const handleAddSlot = () => {
    const nextId = slots.length > 0 ? Math.max(...slots.map((s) => s.id)) + 1 : 1;
    const defaultW = Math.round(width * 0.8);
    const defaultH = Math.round(height * 0.22);
    const lastSlot = slots[slots.length - 1];
    const nextY = lastSlot ? Math.min(height - defaultH, lastSlot.y + lastSlot.height + 30) : 100;

    const newSlot = {
      id: nextId,
      x: Math.round((width - defaultW) / 2),
      y: nextY,
      width: defaultW,
      height: defaultH,
      rotation: 0,
      zIndex: slots.length + 1,
    };

    setSlots([...slots, newSlot]);
    setActiveSlotId(nextId);
    showToast?.(`Slot foto #${nextId} ditambahkan`);
  };

  // Remove slot
  const handleDeleteSlot = (slotId, e) => {
    if (e) e.stopPropagation();
    if (slots.length <= 1) {
      alert('Template harus memiliki minimal 1 slot foto.');
      return;
    }
    const updated = slots.filter((s) => s.id !== slotId);
    setSlots(updated);
    if (activeSlotId === slotId) {
      setActiveSlotId(updated[0]?.id || 1);
    }
    showToast?.(`Slot foto #${slotId} dihapus`);
  };

  // Rotate template
  const handleRotateCanvas = (delta) => {
    const nextRot = ((rotation + delta) % 360 + 360) % 360;
    setRotation(nextRot);
  };

  // Handle PNG upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBgImage(event.target.result);
      showToast?.('Gambar overlay bingkai berhasil dimuat!');
    };
    reader.readAsDataURL(file);
  };

  // ── Drag & Resize Engine ───────────────────────────────────────────────────
  const handleMouseDownSlot = (e, slot, actionType = 'move', handle = null) => {
    e.stopPropagation();
    setActiveSlotId(slot.id);

    dragStateRef.current = {
      actionType,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialSlot: { ...slot },
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragStateRef.current || !canvasRef.current) return;
      const { actionType, handle, startX, startY, initialSlot } = dragStateRef.current;
      const rect = canvasRef.current.getBoundingClientRect();

      const scaleX = width / rect.width;
      const scaleY = height / rect.height;

      const dx = (e.clientX - startX) * scaleX;
      const dy = (e.clientY - startY) * scaleY;

      setSlots((prevSlots) =>
        prevSlots.map((s) => {
          if (s.id !== initialSlot.id) return s;

          if (actionType === 'move') {
            const nextX = Math.round(Math.max(0, Math.min(width - s.width, initialSlot.x + dx)));
            const nextY = Math.round(Math.max(0, Math.min(height - s.height, initialSlot.y + dy)));
            return { ...s, x: nextX, y: nextY };
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
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [width, height]);

  // Generate XML
  const generatedXml = useMemo(() => {
    return `<frame>
  <name>${name.trim()}</name>
  <category>${category}</category>
  <width>${width}</width>
  <height>${height}</height>
  <rotation>${rotation}</rotation>
  <paperSize>${paperSize || (category === 'Receipt' ? 'thermal_80mm' : 'standard')}</paperSize>
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
  }, [name, category, width, height, rotation, paperSize, slots]);

  // Save template
  const handleSave = async () => {
    if (!name.trim()) {
      alert('Silakan masukkan nama template terlebih dahulu.');
      return;
    }
    if (slots.length === 0) {
      alert('Template harus memiliki minimal 1 slot foto.');
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
          size: sizePreset,
          category,
          paperSize,
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
        showToast?.(`Template "${name}" berhasil disimpan dan disinkronkan ke Kiosk!`);
        if (onSave) onSave(json.frames);
      } else {
        alert(json.error || 'Gagal menyimpan template.');
      }
    } catch (err) {
      console.error('[TemplateStudio] Save error:', err);
      alert('Terjadi kesalahan saat menyimpan template.');
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

      {/* ── Studio Split Layout ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        
        {/* ── Center Stage: Interactive Visual Canvas ────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-auto bg-[#F4F6F9] relative select-none">
          
          {/* Visual Canvas Box */}
          <div
            ref={canvasRef}
            className={`relative rounded-2xl shadow-2xl overflow-hidden transition-all border-4 border-white ${
              bgType === 'checkerboard'
                ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100'
                : bgType === 'white'
                ? 'bg-white'
                : 'bg-slate-900'
            }`}
            style={{
              width: '100%',
              maxWidth: width > height ? '560px' : '360px',
              aspectRatio: `${width} / ${height}`,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
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
                    onMouseDown={(e) => handleMouseDownSlot(e, slot, 'move')}
                    className={`absolute flex flex-col items-center justify-between cursor-move transition-all select-none ${
                      isActive
                        ? 'border-2 border-emerald-500 bg-emerald-500/20 shadow-xl z-40 ring-2 ring-emerald-400/40'
                        : 'border border-dashed border-slate-700/80 bg-slate-900/30 hover:border-emerald-500 z-30'
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                      transform: `rotate(${slot.rotation || 0}deg)`,
                    }}
                  >
                    {/* Top Center Slot Number Badge */}
                    <div className="w-full flex items-center justify-center pt-2 pointer-events-none">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-md ${
                          isActive
                            ? 'bg-emerald-500 text-white scale-110'
                            : 'bg-black/80 text-white'
                        }`}
                      >
                        {slot.id}
                      </div>
                    </div>

                    {/* Dimension Tag on Active Slot */}
                    <div className="pb-1.5 pointer-events-none">
                      <span className="text-[9px] font-black font-mono bg-white/95 text-slate-800 px-2 py-0.5 rounded shadow-sm border border-slate-200">
                        {slot.width}×{slot.height}
                      </span>
                    </div>

                    {/* 8 Resize Handles (When Slot is Active) */}
                    {isActive && (
                      <>
                        {/* 4 Corner Handles */}
                        <div
                          onMouseDown={(e) => handleMouseDownSlot(e, slot, 'resize', 'nw')}
                          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-600 rounded-xs cursor-nwse-resize shadow-sm"
                        />
                        <div
                          onMouseDown={(e) => handleMouseDownSlot(e, slot, 'resize', 'ne')}
                          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-600 rounded-xs cursor-nesw-resize shadow-sm"
                        />
                        <div
                          onMouseDown={(e) => handleMouseDownSlot(e, slot, 'resize', 'se')}
                          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-600 rounded-xs cursor-nwse-resize shadow-sm"
                        />
                        <div
                          onMouseDown={(e) => handleMouseDownSlot(e, slot, 'resize', 'sw')}
                          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-600 rounded-xs cursor-nesw-resize shadow-sm"
                        />

                        {/* 4 Edge Handles */}
                        <div
                          onMouseDown={(e) => handleMouseDownSlot(e, slot, 'resize', 'n')}
                          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-ns-resize"
                        />
                        <div
                          onMouseDown={(e) => handleMouseDownSlot(e, slot, 'resize', 's')}
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-ns-resize"
                        />
                        <div
                          onMouseDown={(e) => handleMouseDownSlot(e, slot, 'resize', 'w')}
                          className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3.5 bg-white border-2 border-emerald-600 rounded-xs cursor-ew-resize"
                        />
                        <div
                          onMouseDown={(e) => handleMouseDownSlot(e, slot, 'resize', 'e')}
                          className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3.5 bg-white border-2 border-emerald-600 rounded-xs cursor-ew-resize"
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

          {/* 2. Template Size Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
              Template Size
            </label>
            <select
              value={sizePreset}
              onChange={(e) => handleSizePresetChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#120CD6] cursor-pointer"
            >
              {Object.entries(SIZE_PRESETS).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Kategori Kiosk (Direct Connection to Kiosk App) */}
          <div className="space-y-1.5 bg-blue-50/70 p-3 rounded-2xl border border-blue-200">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#120CD6] block">
                Kategori Kiosk
              </label>
              <span className="px-2 py-0.5 bg-[#E5FD5F] text-[#111111] rounded text-[10px] font-black uppercase">
                Tersambung Kiosk
              </span>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#120CD6] cursor-pointer"
            >
              {KIOSK_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Bingkai ini akan otomatis masuk ke tab <b>{category}</b> pada pilihan bingkai di layar Kiosk photobooth.
            </p>
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
                  Photo count in Template: <span className="text-[#120CD6] font-black">{slots.length}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSlot}
                className="px-3 py-1 bg-slate-100 hover:bg-[#E5FD5F] hover:text-[#111111] text-slate-700 border border-slate-200 rounded-lg text-[10px] font-black uppercase transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add New Photo</span>
              </button>
            </div>

            {/* Slots List Cards */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {slots.map((s, idx) => {
                const isActive = s.id === activeSlotId;
                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveSlotId(s.id)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs ${
                          isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {s.id}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-xs leading-tight">
                          Photo {idx + 1}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono font-medium">
                          {s.width}×{s.height} at [{s.x}, {s.y}]
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSlot(s.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Hapus slot ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
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
