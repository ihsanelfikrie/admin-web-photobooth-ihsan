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
    const { action, frameId, pin } = body;
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

    return NextResponse.json({ success: false, error: 'Aksi tidak valid' }, { status: 400 });
  } catch (err) {
    console.error('[API Frames POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
