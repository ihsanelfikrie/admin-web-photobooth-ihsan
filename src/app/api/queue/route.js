import { NextResponse } from 'next/server';
import { getQueueStatus, updateQueueStatus } from '@/lib/supabase';

export async function GET() {
  try {
    const queue = await getQueueStatus();
    return NextResponse.json({ success: true, queue });
  } catch (err) {
    console.error('[API Queue GET] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, pin, queueData } = body;
    const adminPin = process.env.ADMIN_PIN || '1234';

    if (pin !== adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized PIN' }, { status: 401 });
    }

    const current = await getQueueStatus();

    if (action === 'promote_next') {
      const waiting = Array.isArray(current.waiting_list) ? [...current.waiting_list] : [];
      if (waiting.length === 0) {
        return NextResponse.json({ success: false, error: 'Tidak ada pengunjung dalam daftar tunggu antrian.' });
      }

      const nextPerson = waiting.shift();
      const updated = await updateQueueStatus({
        current_queue_code: nextPerson.code,
        current_queue_number: nextPerson.number,
        current_queue_name: nextPerson.name || 'Pengunjung Berikutnya',
        current_queue_status: 'ready',
        current_queue_remaining_seconds: 60,
        waiting_count: waiting.length,
        waiting_list: waiting,
      });

      return NextResponse.json({
        success: true,
        message: `Tiket ${nextPerson.number} (${nextPerson.name}) berhasil dipanggil ke bilik foto.`,
        queue: updated,
      });
    }

    if (action === 'release_current') {
      const updated = await updateQueueStatus({
        current_queue_status: 'expired',
        current_queue_remaining_seconds: 0,
      });

      return NextResponse.json({
        success: true,
        message: 'Tiket antrian aktif berhasil dilepaskan / ditandai expired.',
        queue: updated,
      });
    }

    if (action === 'update' && queueData) {
      const updated = await updateQueueStatus(queueData);
      return NextResponse.json({ success: true, queue: updated });
    }

    return NextResponse.json({ success: false, error: 'Aksi antrian tidak valid' }, { status: 400 });
  } catch (err) {
    console.error('[API Queue POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
