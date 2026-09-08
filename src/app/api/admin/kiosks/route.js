import { NextResponse } from "next/server";
import { getKiosksCloud, saveKiosksCloud } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function generateRandomKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (len) => Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
  return `${part(3)}-${part(3)}-${part(3)}`;
}

export async function GET(req) {
  try {
    const kiosks = await getKiosksCloud();
    return NextResponse.json(
      { success: true, kiosks },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      }
    );
  } catch (error) {
    console.error("[API Admin Kiosks GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, kiosk, kioskData, updates, license_key, kioskId } = body;
    let kiosks = await getKiosksCloud();

    if (action === "create" || action === "create_kiosk") {
      const data = kioskData || kiosk || {};
      const newId = kiosks.length > 0 ? Math.max(...kiosks.map(k => Number(k.id) || 0)) + 1 : 1;
      
      let finalLicenseKey = (data.license_key || "").trim().toUpperCase();
      if (!finalLicenseKey) {
        finalLicenseKey = generateRandomKey();
      }

      const kioskMode = data.kiosk_mode || (data.is_event_mode ? "event" : "regular");
      const isEvent = kioskMode === "event" || Boolean(data.is_event_mode);

      const newKiosk = {
        id: newId,
        uuid: crypto.randomUUID ? crypto.randomUUID() : "kiosk-" + Date.now(),
        license_key: finalLicenseKey,
        name: (data.name || "").trim() || ("Nadhisan Booth " + String(newId).padStart(2, "0")),
        kiosk_mode: kioskMode,
        is_event_mode: isEvent,
        pin: data.pin || "1111",
        is_active: data.is_active ?? true,
        is_testing_mode: data.is_testing_mode ?? false,
        device_id: null,
        os_hostname: null,
        os_platform: null,
        consent_enabled: data.consent_enabled ?? true,
        consent_text: data.consent_text || "Apakah anda berkenan foto anda kami unggah di media sosial kami?",
        consent_text_yes: data.consent_text_yes || "Baik/Mengerti",
        consent_text_no: data.consent_text_no || "Tidak",
        countdown_timer: Number(data.countdown_timer) || 5,
        qr_timer: Number(data.qr_timer) || 90,
        session_duration: Number(data.session_duration) || 300,
        live_photo: data.live_photo ?? true,
        max_photo: Number(data.max_photo) || 6,
        max_print: Number(data.max_print) || 5,
        no_retake_after: Number(data.no_retake_after) || 0,
        price_per_photo: Number(data.price_per_photo) || 30000,
        price_extra_print: Number(data.price_extra_print) || 10000,
        price_discount: Number(data.price_discount) || 0,
        paper_management_enabled: data.paper_management_enabled ?? true,
        paper_stock: Number(data.paper_stock) || 700,
        paper_booked: 0,
        midtrans_server_key: data.midtrans_server_key || "",
        midtrans_client_key: data.midtrans_client_key || "",
        templates_version: "v1.0.0",
        last_ping_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      kiosks.unshift(newKiosk);
      const saved = await saveKiosksCloud(kiosks);
      if (!saved) {
        return NextResponse.json({ success: false, error: "Gagal menyimpan ke Supabase Cloud" }, { status: 500 });
      }

      return NextResponse.json({ success: true, kiosk: newKiosk, message: "Kiosk berhasil dibuat" });
    }

    if (action === "update" || action === "update_kiosk" || action === "save") {
      const data = updates || kiosk || {};
      const key = (license_key || (data && data.license_key) || "").trim().toUpperCase();
      const targetId = data.id || kioskId;
      const index = kiosks.findIndex(k => (key && k.license_key === key) || (targetId && String(k.id) === String(targetId)));
      
      if (index === -1) {
        return NextResponse.json({ success: false, error: "Kiosk tidak ditemukan" }, { status: 404 });
      }

      const updatedMode = data.kiosk_mode || kiosks[index].kiosk_mode || (data.is_event_mode || kiosks[index].is_event_mode ? "event" : "regular");
      const updatedIsEvent = updatedMode === "event" ? true : (data.is_event_mode !== undefined ? Boolean(data.is_event_mode) : Boolean(kiosks[index].is_event_mode));

      kiosks[index] = {
        ...kiosks[index],
        ...data,
        kiosk_mode: updatedMode,
        is_event_mode: updatedIsEvent,
        updated_at: new Date().toISOString()
      };

      const saved = await saveKiosksCloud(kiosks);
      if (!saved) {
        return NextResponse.json({ success: false, error: "Gagal memperbarui di Supabase Cloud" }, { status: 500 });
      }

      return NextResponse.json({ success: true, kiosk: kiosks[index], message: "Konfigurasi kiosk berhasil disimpan" });
    }

    if (action === "unbind" || action === "unbind_device" || action === "reset_device") {
      const key = (license_key || (kiosk && kiosk.license_key) || "").trim().toUpperCase();
      const targetId = kioskId || (kiosk && kiosk.id);
      const index = kiosks.findIndex(k => (key && k.license_key === key) || (targetId && String(k.id) === String(targetId)));
      
      if (index === -1) {
        return NextResponse.json({ success: false, error: "Kiosk tidak ditemukan" }, { status: 404 });
      }

      kiosks[index] = {
        ...kiosks[index],
        device_id: null,
        os_hostname: null,
        os_platform: null,
        updated_at: new Date().toISOString()
      };

      const saved = await saveKiosksCloud(kiosks);
      if (!saved) {
        return NextResponse.json({ success: false, error: "Gagal mereset di Supabase Cloud" }, { status: 500 });
      }

      return NextResponse.json({ success: true, kiosk: kiosks[index], message: "Device ID berhasil direset. Kiosk siap diaktivasi ulang." });
    }

    if (action === "delete") {
      const targetId = kioskId || (kiosk && kiosk.id);
      const key = (license_key || (kiosk && kiosk.license_key) || "").trim().toUpperCase();
      
      kiosks = kiosks.filter(k => {
        if (targetId && String(k.id) === String(targetId)) return false;
        if (key && k.license_key === key) return false;
        return true;
      });

      const saved = await saveKiosksCloud(kiosks);
      if (!saved) {
        return NextResponse.json({ success: false, error: "Gagal menghapus di Supabase Cloud" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Kiosk berhasil dihapus" });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (error) {
    console.error("[API Admin Kiosks POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
