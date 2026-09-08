export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { listAllSessions, saveSessionMetadata, deleteSessionFiles } from '@/lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');
    const expectedPin = process.env.ADMIN_PIN || '1234';

    if (pin !== expectedPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid Admin PIN' }, { status: 401 });
    }

    let sessions = await listAllSessions();
    if (!sessions || sessions.length === 0) {
      const fallbackPaths = [
        path.join(process.cwd(), "..", "photobooth-monochrome", "public", "assets", "captures", "sessions_metadata.json"),
        path.join(process.cwd(), "public", "assets", "captures", "sessions_metadata.json"),
      ];
      for (const p of fallbackPaths) {
        if (fs.existsSync(p)) {
          try {
            const raw = JSON.parse(fs.readFileSync(p, "utf8"));
            sessions = Object.values(raw);
            if (sessions.length > 0) break;
          } catch (_) {}
        }
      }
    }
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
