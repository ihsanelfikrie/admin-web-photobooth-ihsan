import { NextResponse } from 'next/server';
import { addCloudPrintJob } from '@/lib/supabase';

export async function POST(req) {
  try {
    const body = await req.json();
    const { sessionId, orderId, copies = 1, pin } = body;
    const adminPin = process.env.ADMIN_PIN || '1234';

    if (pin !== adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized PIN' }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId is required for reprint' }, { status: 400 });
    }

    const job = await addCloudPrintJob({
      sessionCode: sessionId,
      orderId: orderId || `REPRINT-${Date.now().toString().slice(-6)}`,
      copies: Number(copies) || 1,
      type: 'remote_admin_reprint',
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Failed to enqueue cloud reprint job' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Perintah cetak ulang untuk sesi ${sessionId} (${copies} lembar) berhasil dikirim ke printer bilik foto.`,
      job,
    });
  } catch (err) {
    console.error('[API Reprint POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
