import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://rifcawifuojzercjauhy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const bucketName = process.env.SUPABASE_BUCKET || 'pbak-assets';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const RETENTION_HOURS = parseInt(process.env.RETENTION_HOURS || '24', 10);

/**
 * Helper to extract storage relative file path from public CDN URL
 * E.g. https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/print_123.jpg -> print_123.jpg
 */
export function extractFilePathFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const prefix = `/storage/v1/object/public/${bucketName}/`;
  if (url.includes(prefix)) {
    return url.split(prefix)[1];
  }
  // If it's already a relative path or filename
  const parts = url.split('/');
  return parts[parts.length - 1];
}

/**
 * Get session metadata from Supabase Storage
 */
export async function getSessionMetadata(sessionId) {
  if (!sessionId) return null;
  const filePath = `sessions/${sessionId}.json`;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .download(filePath);

    if (error || !data) {
      // Fallback: search for direct filename if legacy
      return null;
    }

    const text = await data.text();
    return JSON.parse(text);
  } catch (err) {
    console.error(`[Supabase] Error reading session ${sessionId}:`, err.message);
    return null;
  }
}

/**
 * Save / Update session metadata in Supabase Storage
 */
export async function saveSessionMetadata(sessionId, metadata) {
  if (!sessionId || !metadata) return false;
  const filePath = `sessions/${sessionId}.json`;

  try {
    const jsonString = JSON.stringify(metadata, null, 2);
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, Buffer.from(jsonString, 'utf-8'), {
        contentType: 'application/json',
        upsert: true,
      });

    if (error) {
      console.error(`[Supabase] Error saving session ${sessionId}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Supabase] Exception saving session ${sessionId}:`, err.message);
    return false;
  }
}

/**
 * Delete all files belonging to a session from Supabase Storage
 */
export async function deleteSessionFiles(sessionId, sessionData = null) {
  try {
    let session = sessionData;
    if (!session) {
      session = await getSessionMetadata(sessionId);
    }

    const filesToDelete = new Set();
    filesToDelete.add(`sessions/${sessionId}.json`);
    filesToDelete.add(`softfile_${sessionId}.html`);

    if (session) {
      if (session.cdnCompositeUrl) {
        const p = extractFilePathFromUrl(session.cdnCompositeUrl);
        if (p) filesToDelete.add(p);
      }
      if (session.compositeUrl) {
        const p = extractFilePathFromUrl(session.compositeUrl);
        if (p) filesToDelete.add(p);
      }
      if (session.cdnVideoUrl) {
        const p = extractFilePathFromUrl(session.cdnVideoUrl);
        if (p) filesToDelete.add(p);
      }
      if (session.videoUrl) {
        const p = extractFilePathFromUrl(session.videoUrl);
        if (p) filesToDelete.add(p);
      }
      if (session.cdnGifUrl) {
        const p = extractFilePathFromUrl(session.cdnGifUrl);
        if (p) filesToDelete.add(p);
      }
      if (session.gifUrl) {
        const p = extractFilePathFromUrl(session.gifUrl);
        if (p) filesToDelete.add(p);
      }
      if (Array.isArray(session.cdnSinglePhotos)) {
        session.cdnSinglePhotos.forEach((sp) => {
          const p = extractFilePathFromUrl(sp.publicUrl || sp.filePath);
          if (p) filesToDelete.add(p);
        });
      }
      if (Array.isArray(session.singlePhotos)) {
        session.singlePhotos.forEach((sp) => {
          const p = extractFilePathFromUrl(sp.publicUrl || sp.filePath);
          if (p) filesToDelete.add(p);
        });
      }
    }

    const fileList = Array.from(filesToDelete).filter(Boolean);
    if (fileList.length === 0) return { success: true, deletedCount: 0 };

    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove(fileList);

    if (error) {
      console.warn(`[Supabase] Partial delete error for ${sessionId}:`, error.message);
    }

    return {
      success: true,
      deletedCount: data ? data.length : fileList.length,
      files: fileList,
    };
  } catch (err) {
    console.error(`[Supabase] Failed to delete session files ${sessionId}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * List all sessions stored in Supabase Storage
 */
export async function listAllSessions() {
  try {
    const { data: files, error } = await supabaseAdmin.storage
      .from(bucketName)
      .list('sessions', {
        limit: 500,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error || !files) {
      console.warn('[Supabase] Error listing sessions folder:', error?.message);
      return [];
    }

    const sessions = [];
    for (const file of files) {
      if (!file.name.endsWith('.json')) continue;
      const sessionId = file.name.replace('.json', '');
      const meta = await getSessionMetadata(sessionId);
      if (meta) {
        sessions.push(meta);
      }
    }

    // Sort by createdAt descending
    sessions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return sessions;
  } catch (err) {
    console.error('[Supabase] Exception listing all sessions:', err.message);
    return [];
  }
}

/**
 * Scan all sessions and delete ones older than retention period (default 24 hours)
 */
export async function cleanupExpiredSessions(retentionHours = RETENTION_HOURS) {
  const cutoffTime = Date.now() - retentionHours * 60 * 60 * 1000;
  const result = {
    scannedCount: 0,
    deletedSessionsCount: 0,
    deletedFilesCount: 0,
    deletedSessionIds: [],
    errors: [],
  };

  try {
    const { data: files, error } = await supabaseAdmin.storage
      .from(bucketName)
      .list('sessions', { limit: 1000 });

    if (error || !files) {
      return { ...result, error: error?.message || 'Failed to list sessions' };
    }

    result.scannedCount = files.length;

    for (const file of files) {
      if (!file.name.endsWith('.json')) continue;
      const sessionId = file.name.replace('.json', '');
      const meta = await getSessionMetadata(sessionId);

      if (!meta) continue;

      const isExpired = (meta.createdAt || 0) < cutoffTime;

      if (isExpired) {
        console.log(`[Auto-Cleanup 24h] Session ${sessionId} is older than ${retentionHours}h. Deleting...`);
        const delRes = await deleteSessionFiles(sessionId, meta);
        if (delRes.success) {
          result.deletedSessionsCount++;
          result.deletedFilesCount += delRes.deletedCount || 0;
          result.deletedSessionIds.push(sessionId);
        } else if (delRes.error) {
          result.errors.push(`${sessionId}: ${delRes.error}`);
        }
      }
    }

    return result;
  } catch (err) {
    console.error('[Auto-Cleanup 24h] Exception during cleanup:', err.message);
    return { ...result, error: err.message };
  }
}

/**
 * Manage vouchers stored in Supabase Storage: vouchers/vouchers.json
 */
const VOUCHERS_PATH = 'vouchers/vouchers.json';

export async function getCloudVouchers() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .download(VOUCHERS_PATH);

    if (error || !data) {
      // Default initial vouchers
      return [
        {
          code: 'IHSAN',
          type: 'free',
          value: 100,
          maxUses: 1000,
          usedCount: 0,
          active: true,
          description: 'Voucher Akses Gratis Photobooth JobFair UPKK UIN Antasari',
          createdAt: new Date().toISOString(),
        },
        {
          code: 'VIPJOBFAIR',
          type: 'free',
          value: 100,
          maxUses: 100,
          usedCount: 0,
          active: true,
          description: 'Voucher Khusus Tamu VIP & Panitia JobFair',
          createdAt: new Date().toISOString(),
        },
        {
          code: 'DISKON50',
          type: 'percent',
          value: 50,
          maxUses: 500,
          usedCount: 0,
          active: true,
          description: 'Potongan Harga 50%',
          createdAt: new Date().toISOString(),
        },
      ];
    }

    const text = await data.text();
    return JSON.parse(text);
  } catch (_) {
    return [];
  }
}

export async function saveCloudVouchers(vouchersList) {
  try {
    const jsonString = JSON.stringify(vouchersList, null, 2);
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(VOUCHERS_PATH, Buffer.from(jsonString, 'utf-8'), {
        contentType: 'application/json',
        upsert: true,
      });

    return !error;
  } catch (err) {
    console.error('[Supabase] Error saving cloud vouchers:', err.message);
    return false;
  }
}
