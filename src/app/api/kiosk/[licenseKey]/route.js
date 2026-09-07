import { NextResponse } from "next/server";
import { getKiosksCloud, saveKiosksCloud } from "@/lib/supabase";

export async function GET(req, { params }) {
  try {
    const { licenseKey } = await params;
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("device_id");
    const hostname = searchParams.get("hostname") || null;
    const platform = searchParams.get("platform") || null;

    const kiosks = await getKiosksCloud();
    const kioskIndex = kiosks.findIndex(
      k => k.license_key && k.license_key.trim().toUpperCase() === licenseKey.trim().toUpperCase()
    );

    if (kioskIndex === -1) {
      return NextResponse.json({
        success: false,
        error: "Lisensi kiosk tidak ditemukan atau tidak valid."
      }, { status: 404 });
    }

    const kiosk = kiosks[kioskIndex];

    if (!kiosk.is_active) {
      return NextResponse.json({
        success: false,
        error: "Lisensi kiosk ini telah dinonaktifkan oleh administrator."
      }, { status: 403 });
    }

    // Hardware Lock check
    if (kiosk.device_id && deviceId && kiosk.device_id !== deviceId) {
      return NextResponse.json({
        success: false,
        error: "Lisensi ini telah terkunci pada perangkat lain (" + (kiosk.os_hostname || kiosk.device_id.substring(0, 8)) + "). Reset Device ID pada panel admin untuk memindahkan lisensi.",
        is_locked: true,
        locked_device: kiosk.os_hostname || "Perangkat Lain"
      }, { status: 409 });
    }

    // Auto-bind device on first activation or update ping
    let updated = false;
    if (!kiosk.device_id && deviceId) {
      kiosk.device_id = deviceId;
      updated = true;
    }
    if (hostname) {
      kiosk.os_hostname = hostname;
      updated = true;
    }
    if (platform) {
      kiosk.os_platform = platform;
      updated = true;
    }
    kiosk.last_ping_at = new Date().toISOString();
    updated = true;

    if (updated) {
      kiosks[kioskIndex] = kiosk;
      await saveKiosksCloud(kiosks);
    }

    return NextResponse.json({
      success: true,
      kiosk: {
        id: kiosk.id,
        name: kiosk.name,
        license_key: kiosk.license_key,
        device_id: kiosk.device_id,
        is_active: kiosk.is_active,
        is_testing_mode: kiosk.is_testing_mode ?? false,
        consent_enabled: kiosk.consent_enabled ?? true,
        consent_text: kiosk.consent_text || "Apakah anda berkenan foto anda kami unggah di media sosial kami?",
        consent_text_yes: kiosk.consent_text_yes || "Baik/Mengerti",
        consent_text_no: kiosk.consent_text_no || "Tidak",
        countdown_timer: kiosk.countdown_timer ?? 10,
        qr_timer: kiosk.qr_timer ?? 90,
        session_duration: kiosk.session_duration ?? 300,
        live_photo: kiosk.live_photo ?? true,
        max_photo: kiosk.max_photo ?? 6,
        max_print: kiosk.max_print ?? 5,
        no_retake_after: kiosk.no_retake_after ?? 0,
        price_per_photo: kiosk.price_per_photo ?? 30000,
        price_extra_print: kiosk.price_extra_print ?? 10000,
        price_discount: kiosk.price_discount ?? 0,
        paper_management_enabled: kiosk.paper_management_enabled ?? true,
        paper_stock: kiosk.paper_stock ?? 700,
        last_ping_at: kiosk.last_ping_at
      }
    });
  } catch (error) {
    console.error("[API Kiosk Handshake GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { licenseKey } = await params;
    const body = await req.json();
    const { action, pin, deviceId } = body;

    const kiosks = await getKiosksCloud();
    const kioskIndex = kiosks.findIndex(
      k => k.license_key && k.license_key.trim().toUpperCase() === licenseKey.trim().toUpperCase()
    );

    if (kioskIndex === -1) {
      return NextResponse.json({ success: false, error: "Lisensi tidak ditemukan" }, { status: 404 });
    }

    const kiosk = kiosks[kioskIndex];

    if (action === "unbind") {
      if (pin && String(pin) !== String(kiosk.pin || "1111")) {
        return NextResponse.json({ success: false, error: "Security PIN salah" }, { status: 401 });
      }
      kiosk.device_id = null;
      kiosk.os_hostname = null;
      kiosk.os_platform = null;
      kiosk.updated_at = new Date().toISOString();
      kiosks[kioskIndex] = kiosk;
      await saveKiosksCloud(kiosks);
      return NextResponse.json({ success: true, message: "Kiosk berhasil dilepas dari perangkat ini" });
    }

    if (action === "heartbeat") {
      kiosk.last_ping_at = new Date().toISOString();
      if (body.paper_stock !== undefined) kiosk.paper_stock = body.paper_stock;
      kiosks[kioskIndex] = kiosk;
      await saveKiosksCloud(kiosks);
      return NextResponse.json({ success: true, last_ping_at: kiosk.last_ping_at });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (error) {
    console.error("[API Kiosk Handshake POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
