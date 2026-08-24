import { NextResponse } from 'next/server';
import { cleanupExpiredSessions, RETENTION_HOURS } from '@/lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const adminPin = process.env.ADMIN_PIN || '1234';

    // Verify authorization if CRON_SECRET or PIN is provided
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && pin !== adminPin) {
      // If cronSecret configured, require auth
      return NextResponse.json({ success: false, error: 'Unauthorized cron request' }, { status: 401 });
    }

    console.log(`[Cron Cleanup] Starting 24h storage garbage collection (Retention: ${RETENTION_HOURS}h)...`);
    const result = await cleanupExpiredSessions(RETENTION_HOURS);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      retentionHours: RETENTION_HOURS,
      ...result,
    });
  } catch (err) {
    console.error('[Cron Cleanup Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  // Allow POST trigger from Admin UI
  return GET(req);
}
