import { NextResponse } from 'next/server';
import { getKioskTelemetry, saveKioskTelemetry, refillKioskPaper } from '@/lib/supabase';

export async function GET(req) {
  try {
    const telemetry = await getKioskTelemetry();
    return NextResponse.json({ success: true, telemetry });
  } catch (err) {
    console.error('[API Kiosk Status GET] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, quantity, telemetry, pin } = body;
    const adminPin = process.env.ADMIN_PIN || '1234';

    // Action 1: Remote Paper Refill from Admin Panel
    if (action === 'refill') {
      if (pin !== adminPin) {
        return NextResponse.json({ success: false, error: 'Unauthorized PIN' }, { status: 401 });
      }
      const qty = Number(quantity) || 700;
      const updated = await refillKioskPaper(qty);
      return NextResponse.json({
        success: true,
        message: `Berhasil menambahkan ${qty} lembar kertas`,
        telemetry: updated,
      });
    }

    // Action 2: Toggle Event Mode (Free Pass Wedding / Gathering)
    if (action === 'toggle_event_mode') {
      if (pin !== adminPin) {
        return NextResponse.json({ success: false, error: 'Unauthorized PIN' }, { status: 401 });
      }
      const current = await getKioskTelemetry();
      const newEventMode = !current.is_event_mode;
      const updated = await saveKioskTelemetry({
        ...current,
        is_event_mode: newEventMode,
      });
      return NextResponse.json({
        success: true,
        message: newEventMode ? 'Mode Event (Bebas Bayar) diaktifkan!' : 'Mode Komersial (Bayar QRIS) diaktifkan!',
        telemetry: updated,
      });
    }

    // Action 3: Update Live Kiosk Announcement
    if (action === 'update_announcement') {
      if (pin !== adminPin) {
        return NextResponse.json({ success: false, error: 'Unauthorized PIN' }, { status: 401 });
      }
      const current = await getKioskTelemetry();
      const updated = await saveKioskTelemetry({
        ...current,
        announcement: body.announcement || { text: '', active: false },
      });
      return NextResponse.json({
        success: true,
        message: 'Pengumuman layar Kiosk berhasil diperbarui!',
        telemetry: updated,
      });
    }

    // Action 4: Telemetry Heartbeat from Kiosk App
    if (telemetry) {
      const updated = await saveKioskTelemetry(telemetry);
      return NextResponse.json({ success: true, telemetry: updated });
    }

    return NextResponse.json({ success: false, error: 'Unknown action or invalid payload' }, { status: 400 });
  } catch (err) {
    console.error('[API Kiosk Status POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
