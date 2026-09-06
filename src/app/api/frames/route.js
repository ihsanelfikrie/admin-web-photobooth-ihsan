import { NextResponse } from 'next/server';
import { getFramesCatalog, saveFramesCatalog } from '@/lib/supabase';

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
      const newFrame = {
        id: frame.id || `frame_${Date.now()}`,
        name: frame.name || 'Custom Frame',
        size: frame.size || 'Receipt',
        category: frame.category || 'Receipt Strip',
        photoCount: Number(frame.photoCount) || 3,
        width: Number(frame.width) || 576,
        height: Number(frame.height) || 1200,
        active: true,
        source: 'Custom Upload',
        userCaptured: 0,
        previewUrl: frame.previewUrl || 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/strip_mono.png',
        xml: frame.xml || '',
      };
      const updated = [newFrame, ...catalog.filter(f => f.id !== newFrame.id)];
      await saveFramesCatalog(updated);
      return NextResponse.json({ success: true, frames: updated });
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
