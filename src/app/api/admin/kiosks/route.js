import { NextResponse } from "next/server";
import { getKiosksCloud, saveKiosksCloud } from "@/lib/supabase";

export async function GET() {
  try {
    const kiosks = await getKiosksCloud();
    return NextResponse.json({ success: true, kiosks });
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
      const newId = kiosks.length > 0 ? Math.max(...kiosks.map(k => k.id || 0)) + 1 : 1;
      const newKiosk = {
        id: newId,
        uuid: crypto.randomUUID ? crypto.randomUUID() : "kiosk-" + Date.now(),
        license_key: data.license_key || "NDHS-" + Math.random().toString(36).substring(2, 5).toUpperCase() + "-" + Math.random().toString(36).substring(2, 5).toUpperCase(),
        name: data.name || "Nadhisan Booth " + newId,
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
        countdown_timer: data.countdown_timer ?? 10,
        qr_timer: data.qr_timer ?? 90,
        session_duration: data.session_duration ?? 300,
        live_photo: data.live_photo ?? true,
        max_photo: data.max_photo ?? 6,
        max_print: data.max_print ?? 5,
        no_retake_after: data.no_retake_after ?? 0,
        price_per_photo: data.price_per_photo ?? 30000,
        price_extra_print: data.price_extra_print ?? 10000,
        price_discount: data.price_discount ?? 0,
        paper_management_enabled: data.paper_management_enabled ?? true,
        paper_stock: data.paper_stock ?? 700,
        paper_booked: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      kiosks.push(newKiosk);
      await saveKiosksCloud(kiosks);
      return NextResponse.json({ success: true, kiosk: newKiosk, message: "Kiosk berhasil dibuat" });
    }

    if (action === "update" || action === "update_kiosk" || action === "save") {
      const data = updates || kiosk || {};
      const key = license_key || (data && data.license_key);
      const targetId = data.id || kioskId;
      const index = kiosks.findIndex(k => (key && k.license_key === key) || (targetId && k.id === targetId));
      if (index === -1) {
        return NextResponse.json({ success: false, error: "Kiosk tidak ditemukan" }, { status: 404 });
      }
      kiosks[index] = {
        ...kiosks[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      await saveKiosksCloud(kiosks);
      return NextResponse.json({ success: true, kiosk: kiosks[index], message: "Konfigurasi kiosk berhasil disimpan" });
    }

    if (action === "unbind" || action === "unbind_device" || action === "reset_device") {
      const key = license_key || (kiosk && kiosk.license_key);
      const targetId = kioskId || (kiosk && kiosk.id);
      const index = kiosks.findIndex(k => (key && k.license_key === key) || (targetId && k.id === targetId));
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
      await saveKiosksCloud(kiosks);
      return NextResponse.json({ success: true, kiosk: kiosks[index], message: "Device ID berhasil direset. Kiosk siap diaktivasi ulang." });
    }

    if (action === "delete") {
      const targetId = kioskId || (kiosk && kiosk.id);
      kiosks = kiosks.filter(k => k.id !== targetId && (!license_key || k.license_key !== license_key));
      await saveKiosksCloud(kiosks);
      return NextResponse.json({ success: true, message: "Kiosk berhasil dihapus" });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (error) {
    console.error("[API Admin Kiosks POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
