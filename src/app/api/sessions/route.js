import { NextResponse } from 'next/server';
import { listAllSessions, saveSessionMetadata, deleteSessionFiles } from '@/lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');
    const expectedPin = process.env.ADMIN_PIN || '1234';

    if (pin !== expectedPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Admin PIN' }, { status: 401 });
    }

    const sessions = await listAllSessions();
    return NextResponse.json({
      success: true,
      total: sessions.length,
      sessions,
    });
  } catch (err) {
    console.error('[API Sessions GET] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { sessionId, ...metadata } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
    }

    const fullMeta = {
      sessionId,
      createdAt: metadata.createdAt || Date.now(),
      ...metadata,
    };

    const saved = await saveSessionMetadata(sessionId, fullMeta);

    if (!saved) {
      return NextResponse.json({ success: false, error: 'Failed to save session metadata to Supabase' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sessionId, session: fullMeta });
  } catch (err) {
    console.error('[API Sessions POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const pin = searchParams.get('pin');
    const expectedPin = process.env.ADMIN_PIN || '1234';

    if (pin !== expectedPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId required' }, { status: 400 });
    }

    const result = await deleteSessionFiles(sessionId);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[API Sessions DELETE] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
