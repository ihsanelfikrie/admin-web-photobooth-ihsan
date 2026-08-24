import { NextResponse } from 'next/server';
import { getSessionMetadata, deleteSessionFiles, RETENTION_HOURS } from '@/lib/supabase';

export async function GET(req, { params }) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    const session = await getSessionMetadata(sessionId);

    if (!session) {
      return NextResponse.json({
        success: false,
        expired: true,
        message: 'Softfile tidak ditemukan atau sudah kadaluarsa (lebih dari 24 jam) dan dihapus otomatis dari server.',
      }, { status: 404 });
    }

    const now = Date.now();
    const createdAt = session.createdAt || now;
    const ageSeconds = Math.floor((now - createdAt) / 1000);
    const totalExpirySeconds = RETENTION_HOURS * 3600;
    const remainingSeconds = Math.max(0, totalExpirySeconds - ageSeconds);

    // If expired (>24 hours), auto delete session files from Supabase Storage
    if (remainingSeconds <= 0) {
      deleteSessionFiles(sessionId, session).catch(err => {
        console.error('[Softfile API] Auto-delete expired session error:', err);
      });

      return NextResponse.json({
        success: false,
        expired: true,
        message: `Softfile telah kadaluarsa (melewati batas waktu ${RETENTION_HOURS} jam) dan telah dihapus untuk menghemat ruang penyimpanan.`,
      }, { status: 410 });
    }

    return NextResponse.json({
      success: true,
      sessionId,
      createdAt,
      remainingSeconds,
      retentionHours: RETENTION_HOURS,
      compositeUrl: session.cdnCompositeUrl || session.compositeUrl,
      videoUrl: session.cdnVideoUrl || session.videoUrl || null,
      gifUrl: session.cdnGifUrl || session.gifUrl || null,
      singlePhotos: session.cdnSinglePhotos || session.singlePhotos || [],
    });
  } catch (err) {
    console.error('[Softfile API] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
