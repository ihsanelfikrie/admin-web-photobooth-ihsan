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

export function resolvePublicCdnUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const filename = url.split('/').pop();
  return filename ? `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filename}` : null;
}

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
    const meta = JSON.parse(text);

    // Normalize all media URLs to guaranteed public CDN URLs
    if (meta) {
      meta.cdnCompositeUrl = resolvePublicCdnUrl(meta.cdnCompositeUrl || meta.compositeUrl);
      meta.compositeUrl = meta.cdnCompositeUrl || meta.compositeUrl;
      meta.cdnVideoUrl = resolvePublicCdnUrl(meta.cdnVideoUrl || meta.videoUrl);
      meta.videoUrl = meta.cdnVideoUrl || meta.videoUrl;
      meta.cdnGifUrl = resolvePublicCdnUrl(meta.cdnGifUrl || meta.gifUrl);
      meta.gifUrl = meta.cdnGifUrl || meta.gifUrl;
      if (meta.singlePhotos && Array.isArray(meta.singlePhotos)) {
        meta.singlePhotos = meta.singlePhotos.map((sp) => ({
          ...sp,
          publicUrl: resolvePublicCdnUrl(sp.cdnUrl || sp.publicUrl || sp.filePath),
        }));
      }
    }

    return meta;
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

// ── Kiosk Telemetry & Paper Stock Helpers ─────────────────────────────────────
const TELEMETRY_PATH = 'system/kiosk_telemetry.json';
const CLOUD_PRINT_JOBS_PATH = 'system/cloud_print_jobs.json';
const QUEUE_STATUS_PATH = 'system/queue_status.json';

export async function getKioskTelemetry() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .download(TELEMETRY_PATH);

    if (error || !data) {
      return {
        license_key: 'TARASABOOTH-001',
        kiosk_name: 'TarasaBooth Main Studio',
        online: true,
        last_ping: Date.now(),
        paper: {
          raw_stock: 680,
          booked_stock: 0,
          pending_prints: 0,
          available: 680,
          initial_count: 700,
          low_paper_alert: false,
        },
        camera: {
          detected: true,
          model: 'Canon EOS DSLR (EDSDK)',
          battery_pct: 95,
          is_ac_power: false,
          iso: 800,
          shutter: '1/60',
          aperture: 'f/4.0',
        },
      };
    }

    const text = await data.text();
    return JSON.parse(text);
  } catch (_) {
    return {
      license_key: 'TARASABOOTH-001',
      kiosk_name: 'TarasaBooth Main Studio',
      online: true,
      last_ping: Date.now(),
      paper: { raw_stock: 700, booked_stock: 0, pending_prints: 0, available: 700, initial_count: 700 },
      camera: { detected: true, model: 'Canon EOS DSLR', battery_pct: 100 },
    };
  }
}

export async function saveKioskTelemetry(telemetry) {
  try {
    const current = await getKioskTelemetry();
    const merged = { ...current, ...telemetry, last_ping: Date.now() };
    const jsonString = JSON.stringify(merged, null, 2);

    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(TELEMETRY_PATH, Buffer.from(jsonString, 'utf-8'), {
        contentType: 'application/json',
        upsert: true,
      });

    return !error ? merged : current;
  } catch (err) {
    console.error('[Supabase] Error saving kiosk telemetry:', err.message);
    return null;
  }
}

export async function refillKioskPaper(quantity = 700) {
  const current = await getKioskTelemetry();
  const currentPaper = current.paper || { raw_stock: 0, booked_stock: 0, pending_prints: 0 };
  const newRaw = Math.max(0, (currentPaper.raw_stock || 0) + Number(quantity));
  const newAvailable = Math.max(0, newRaw - (currentPaper.booked_stock || 0) - (currentPaper.pending_prints || 0));

  const updated = {
    ...current,
    paper: {
      ...currentPaper,
      raw_stock: newRaw,
      available: newAvailable,
      low_paper_alert: newAvailable < 10,
      last_refill_at: new Date().toISOString(),
      last_refill_qty: quantity,
    },
  };

  return await saveKioskTelemetry(updated);
}

// ── Cloud Print Jobs Helpers ──────────────────────────────────────────────────
export async function getCloudPrintJobs() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .download(CLOUD_PRINT_JOBS_PATH);

    if (error || !data) return [];
    const text = await data.text();
    return JSON.parse(text);
  } catch (_) {
    return [];
  }
}

export async function addCloudPrintJob(job) {
  try {
    const jobs = await getCloudPrintJobs();
    const newJob = {
      id: `print_job_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      session_code: job.sessionCode || job.sessionId || 'TARASA',
      order_id: job.orderId || `ORD-${Date.now()}`,
      copies: Number(job.copies) || 1,
      status: 'pending',
      created_at: new Date().toISOString(),
      ...job,
    };

    jobs.unshift(newJob);
    // Keep max 100 recent jobs
    const trimmed = jobs.slice(0, 100);

    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(CLOUD_PRINT_JOBS_PATH, Buffer.from(JSON.stringify(trimmed, null, 2), 'utf-8'), {
        contentType: 'application/json',
        upsert: true,
      });

    return !error ? newJob : null;
  } catch (err) {
    console.error('[Supabase] Error adding cloud print job:', err.message);
    return null;
  }
}

// ── Queue Status Helpers ──────────────────────────────────────────────────────
export async function getQueueStatus() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .download(QUEUE_STATUS_PATH);

    if (error || !data) {
      return {
        current_queue_code: null,
        current_queue_number: null,
        current_queue_name: null,
        current_queue_status: 'idle',
        current_queue_remaining_seconds: 0,
        waiting_count: 0,
        waiting_list: [],
      };
    }

    const text = await data.text();
    return JSON.parse(text);
  } catch (_) {
    return {
      current_queue_code: null,
      current_queue_number: null,
      current_queue_status: 'idle',
      current_queue_remaining_seconds: 0,
      waiting_count: 0,
      waiting_list: [],
    };
  }
}

export async function updateQueueStatus(updateData) {
  try {
    const current = await getQueueStatus();
    const updated = { ...current, ...updateData, updated_at: new Date().toISOString() };

    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(QUEUE_STATUS_PATH, Buffer.from(JSON.stringify(updated, null, 2), 'utf-8'), {
        contentType: 'application/json',
        upsert: true,
      });

    return !error ? updated : current;
  } catch (err) {
    console.error('[Supabase] Error updating queue status:', err.message);
    return null;
  }
}

// ── Frames Catalog Remote Manager ─────────────────────────────────────────────
const FRAMES_CATALOG_PATH = 'system/frames_catalog.json';

const DEFAULT_FRAMES_CATALOG = [
  {
    id: 'img_0834',
    name: 'IMG_0834 Classic Studio',
    category: 'Umum',
    width: 1200,
    height: 1800,
    photoCount: 6,
    active: true,
    description: 'Tata letak 6 pose portrait studio elegan',
    previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/img_0834.png',
  },
  {
    id: 'uwin_1',
    name: 'UWIN 1 Modern Grid',
    category: 'Modern',
    width: 1200,
    height: 1800,
    photoCount: 6,
    active: true,
    description: 'Grid 6 foto simetris berkarakter kontemporer',
    previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/uwin_1.png',
  },
  {
    id: 'strip_2r_mono',
    name: 'Photostrip 2x6 Classic',
    category: 'Photostrip',
    width: 600,
    height: 1800,
    photoCount: 3,
    active: true,
    description: 'Format potong otomatis 2R strip vertikal 3 pose',
    previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/strip_mono.png',
  },
  {
    id: 'polaroid_retro',
    name: 'Retro Polaroid 4R',
    category: 'Classic',
    width: 1200,
    height: 1800,
    photoCount: 4,
    active: true,
    description: 'Nuansa polaroid nostalgic dengan margin bawah lebar',
    previewUrl: 'https://rifcawifuojzercjauhy.supabase.co/storage/v1/object/public/pbak-assets/frames/polaroid.png',
  },
];

export async function getFramesCatalog() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .download(FRAMES_CATALOG_PATH);

    if (error || !data) return DEFAULT_FRAMES_CATALOG;
    const text = await data.text();
    return JSON.parse(text);
  } catch (_) {
    return DEFAULT_FRAMES_CATALOG;
  }
}

export async function saveFramesCatalog(catalog) {
  try {
    const jsonString = JSON.stringify(catalog, null, 2);
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(FRAMES_CATALOG_PATH, Buffer.from(jsonString, 'utf-8'), {
        contentType: 'application/json',
        upsert: true,
      });

    return !error ? catalog : null;
  } catch (err) {
    console.error('[Supabase] Error saving frames catalog:', err.message);
    return null;
  }
}

// ── Financial Analytics Calculation Helper ────────────────────────────────────
export async function getFinancialSummary(filterRange = 'all') {
  const sessions = await listAllSessions();
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const nowDate = new Date();
  const startOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();
  const startOfDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();

  let filtered = sessions;
  if (filterRange === 'today') {
    filtered = sessions.filter(s => (s.createdAt || 0) >= startOfDay);
  } else if (filterRange === 'week') {
    filtered = sessions.filter(s => (now - (s.createdAt || 0)) <= 7 * ONE_DAY_MS);
  } else if (filterRange === 'month') {
    filtered = sessions.filter(s => (s.createdAt || 0) >= startOfMonth);
  }

  let totalGross = 0;
  let monthGross = 0;
  let todayGross = 0;
  let qrisCount = 0;
  let qrisAmount = 0;
  let cashCount = 0;
  let cashAmount = 0;
  let voucherCount = 0;
  let voucherAmount = 0;

  // Calculate month and today revenue across all sessions
  for (const s of sessions) {
    const sessionTime = s.createdAt || 0;
    const price = Number(s.price || s.amount || s.sessionPrice || 0);
    if (sessionTime >= startOfMonth) {
      monthGross += price;
    }
    if (sessionTime >= startOfDay) {
      todayGross += price;
    }
  }

  const transactions = [];

  for (let idx = 0; idx < filtered.length; idx++) {
    const s = filtered[idx];
    const price = Number(s.price || s.amount || s.sessionPrice || 0);
    const method = (s.paymentMethod || s.paymentMode || '').toLowerCase();

    if (method.includes('qris')) {
      qrisCount++;
      qrisAmount += price;
      totalGross += price;
    } else if (method.includes('cash') || method.includes('manual')) {
      cashCount++;
      cashAmount += price;
      totalGross += price;
    } else if (method.includes('voucher')) {
      voucherCount++;
      voucherAmount += 0;
    } else if (price > 0) {
      qrisCount++;
      qrisAmount += price;
      totalGross += price;
    }

    if (price > 0 || method) {
      transactions.push({
        orderId: s.orderId || `ORD-${s.sessionId?.slice(-8) || idx}`,
        sessionId: s.sessionId,
        createdAt: s.createdAt || now,
        amount: method.includes('voucher') ? 0 : price,
        originalPrice: price,
        paymentMethod: method.includes('qris') ? 'QRIS (Midtrans)' : method.includes('cash') ? 'Tunai / Manual' : method.includes('voucher') ? 'Voucher Free Pass' : 'QRIS (Midtrans)',
        status: s.paymentStatus || 'PAID',
      });
    }
  }

  return {
    filterRange,
    totalSessions: filtered.length,
    totalGross,
    totalRevenue: totalGross,
    monthRevenue: monthGross,
    todayRevenue: todayGross,
    averageOrderValue: (qrisCount + cashCount) > 0 ? Math.round(totalGross / (qrisCount + cashCount)) : 0,
    breakdown: {
      qris: { count: qrisCount, amount: qrisAmount },
      cash: { count: cashCount, amount: cashAmount },
      voucher: { count: voucherCount, amount: voucherAmount },
    },
    transactions,
  };
}

export async function uploadFrameStorage(frameId, xmlText, pngBase64) {
  try {
    let previewUrl = null;

    if (xmlText) {
      await supabaseAdmin.storage
        .from(bucketName)
        .upload(`frames/${frameId}.xml`, Buffer.from(xmlText, 'utf-8'), {
          contentType: 'application/xml',
          upsert: true,
        });
    }

    if (pngBase64) {
      const base64Clean = pngBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Clean, 'base64');
      const { error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(`frames/${frameId}.png`, buffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (!error) {
        previewUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/frames/${frameId}.png`;
      }
    }

    return { success: true, previewUrl };
  } catch (err) {
    console.error('[Supabase] uploadFrameStorage error:', err);
    return { success: false, error: err.message };
  }
}




// ── Kiosks Cloud Storage Helpers ──────────────────────────────────────────────
const KIOSKS_PATH = "system/kiosks.json";

const DEFAULT_KIOSKS = [
  {
    id: 1,
    uuid: "7c4861bd-b8b8-4abd-a0eb-536827abaff3",
    license_key: "88Q-TUR-W2G",
    name: "TESTING2",
    pin: "1111",
    device_id: "fa4eb4cf-62d3-4e09-bd6f-036937babb49",
    os_platform: "darwin",
    os_hostname: "Ihsan-Macbook-Pro.local",
    is_active: true,
    is_event_mode: false,
    is_queue_enabled: true,
    session_duration: 300,
    countdown_timer: 5,
    qr_timer: 90,
    max_photo: 6,
    max_print: 5,
    price_per_photo: 30000,
    price_extra_print: 10000,
    price_discount: 0,
    live_photo: true,
    no_retake_after: 0,
    paper_management_enabled: true,
    paper_stock: 496,
    paper_booked: 0,
    consent_enabled: true,
    consent_text: "Apakah anda berkenan foto anda kami unggah di media sosial kami?",
    consent_text_yes: "Baik/Mengerti",
    consent_text_no: "Tidak",
    midtrans_server_key: process.env.MIDTRANS_SERVER_KEY || "",
    midtrans_client_key: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
    templates_version: "v1.0.0",
    last_ping_at: new Date().toISOString(),
    created_at: "2026-09-06T15:35:17.723Z",
    updated_at: new Date().toISOString()
  }
];

export async function getKiosksCloud() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .download(KIOSKS_PATH);

    if (error || !data) {
      return DEFAULT_KIOSKS;
    }
    const text = await data.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_KIOSKS;
  } catch (err) {
    console.warn("[Supabase] Error reading kiosks cloud:", err.message);
    return DEFAULT_KIOSKS;
  }
}

export async function saveKiosksCloud(kiosks) {
  try {
    const jsonString = JSON.stringify(kiosks, null, 2);
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(KIOSKS_PATH, Buffer.from(jsonString, "utf-8"), {
        contentType: "application/json",
        upsert: true
      });

    return !error;
  } catch (err) {
    console.error("[Supabase] Error saving kiosks cloud:", err.message);
    return false;
  }
}

// ── Categories Cloud Storage Helpers ──────────────────────────────────────────
const CATEGORIES_PATH = "system/categories.json";

const DEFAULT_CATEGORIES = [
  {
    id: 1,
    kiosk_id: 1,
    name: "Standard Studio",
    folder: "studio",
    slug: "studio",
    order: 1,
    is_active: true,
    created_at: "2026-09-05T18:21:09.041Z"
  },
  {
    id: 2,
    kiosk_id: 1,
    name: "Wedding & Formal",
    folder: "wedding",
    slug: "wedding",
    order: 2,
    is_active: true,
    created_at: "2026-09-05T18:21:09.041Z"
  },
  {
    id: 3,
    kiosk_id: 1,
    name: "Event Strip 2R",
    folder: "strip",
    slug: "strip",
    order: 3,
    is_active: true,
    created_at: "2026-09-05T18:21:09.041Z"
  }
];

export async function getCategoriesCloud() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .download(CATEGORIES_PATH);

    if (error || !data) {
      return DEFAULT_CATEGORIES;
    }
    const text = await data.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch (err) {
    console.warn("[Supabase] Error reading categories cloud:", err.message);
    return DEFAULT_CATEGORIES;
  }
}

export async function saveCategoriesCloud(categories) {
  try {
    const jsonString = JSON.stringify(categories, null, 2);
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(CATEGORIES_PATH, Buffer.from(jsonString, "utf-8"), {
        contentType: "application/json",
        upsert: true
      });

    return !error;
  } catch (err) {
    console.error("[Supabase] Error saving categories cloud:", err.message);
    return false;
  }
}
