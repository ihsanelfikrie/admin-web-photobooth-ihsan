import { NextResponse } from 'next/server';
import { getFinancialSummary } from '@/lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');
    const range = searchParams.get('range') || 'all';
    const adminPin = process.env.ADMIN_PIN || '1234';

    if (pin !== adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized PIN' }, { status: 401 });
    }

    const finance = await getFinancialSummary(range);
    return NextResponse.json({ success: true, finance });
  } catch (err) {
    console.error('[API Finance GET] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
