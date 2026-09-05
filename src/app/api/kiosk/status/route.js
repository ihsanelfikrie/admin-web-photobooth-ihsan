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

    // Action 2: Telemetry Heartbeat from Kiosk App
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
