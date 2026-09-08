export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getFramesCatalog, saveFramesCatalog, uploadFrameStorage } from '@/lib/supabase';

export async function GET() {
  try {
    const frames = await getFramesCatalog();
    return NextResponse.json({ success: true, frames });
  } catch (err) {
    console.error('[API Frames GET] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, frameId, frame, pin } = body;
    const adminPin = process.env.ADMIN_PIN || '1234';

    if (pin !== adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized PIN' }, { status: 401 });
    }

    const catalog = await getFramesCatalog();

    if (action === 'toggle' && frameId) {
      const updated = catalog.map(f => {
        if (f.id === frameId) return { ...f, active: !f.active };
        return f;
      });
      await saveFramesCatalog(updated);
      return NextResponse.json({ success: true, frames: updated });
    }

    if (action === 'add' && frame) {
      const id = frame.id || `frame_${Date.now()}`;
      let cdnPreviewUrl = frame.previewUrl || null;

      // Upload XML & PNG overlay to Supabase Storage if provided
      const uploadRes = await uploadFrameStorage(id, frame.xml, frame.pngBase64);
      if (uploadRes?.previewUrl) {
        cdnPreviewUrl = uploadRes.previewUrl;
      }

      const isReceipt = ['58mm', '80mm', 'Receipt'].includes(frame.size) || (frame.paperSize && String(frame.paperSize).startsWith('thermal')) || frame.category === 'Receipt' || frame.templateType === 'receipt';
      const templateType = frame.templateType || (isReceipt ? 'receipt' : 'regular');

      const newFrame = {
        id,
        name: frame.name || 'Custom Frame',
        size: frame.size || (isReceipt ? '80mm' : '4R'),
        category: frame.category || (isReceipt ? 'Receipt' : 'Umum'),
        templateType,
        paperSize: frame.paperSize || (isReceipt ? 'thermal_80mm' : '4r'),
        photoCount: Number(frame.photoCount) || (frame.slots ? frame.slots.length : 3),
        width: Number(frame.width) || (isReceipt ? 576 : 1200),
        height: Number(frame.height) || (isReceipt ? 1600 : 1800),
        rotation: Number(frame.rotation) || 0,
        active: true,
        source: 'Custom Studio',
        userCaptured: 0,
        previewUrl: cdnPreviewUrl || 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/strip_mono.png',
        xml: frame.xml || '',
        slots: frame.slots || [],
      };
      const updated = [newFrame, ...catalog.filter(f => f.id !== newFrame.id)];
      await saveFramesCatalog(updated);
      return NextResponse.json({ success: true, frames: updated, frame: newFrame });
    }

    if (action === 'delete' && frameId) {
      const updated = catalog.filter(f => f.id !== frameId);
      await saveFramesCatalog(updated);
      return NextResponse.json({ success: true, frames: updated });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak valid' }, { status: 400 });
  } catch (err) {
    console.error('[API Frames POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
