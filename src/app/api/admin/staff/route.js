import { NextResponse } from "next/server";
import { getStaffCloud, saveStaffCloud } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const staff = await getStaffCloud();
    return NextResponse.json(
      { success: true, staff },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      }
    );
  } catch (error) {
    console.error("[API Admin Staff GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, staffData, id, allowed_menus, allowed_kiosks, password } = body;
    let staffList = await getStaffCloud();

    if (action === "create") {
      const { name, email, password: newPassword, allowed_menus: menus, allowed_kiosks: kiosks } = staffData || {};
      if (!email || !email.trim()) {
        return NextResponse.json({ success: false, error: "Email staff wajib diisi." }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      if (staffList.some(s => s.email.toLowerCase() === cleanEmail)) {
        return NextResponse.json({ success: false, error: "Email staff sudah terdaftar." }, { status: 400 });
      }

      const newId = staffList.length > 0 ? Math.max(...staffList.map(s => Number(s.id) || 0)) + 1 : 1;
      const newStaff = {
        id: newId,
        name: (name || "").trim() || "Staff " + String(newId).padStart(2, "0"),
        email: cleanEmail,
        password: (newPassword || "Password123").trim(),
        role: "staff",
        allowed_menus: Array.isArray(menus) && menus.length > 0 ? menus : ["dashboard", "transactions", "live_monitor"],
        allowed_kiosks: Array.isArray(kiosks) && kiosks.length > 0 ? kiosks : ["all"],
        created_at: new Date().toISOString()
      };

      staffList.push(newStaff);
      const saved = await saveStaffCloud(staffList);
      if (!saved) {
        return NextResponse.json({ success: false, error: "Gagal menyimpan data staff ke cloud storage." }, { status: 500 });
      }

      return NextResponse.json({ success: true, staff: newStaff, staffList });
    }

    if (action === "update_access") {
      const staffId = Number(id);
      const idx = staffList.findIndex(s => Number(s.id) === staffId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Staff tidak ditemukan." }, { status: 404 });
      }

      staffList[idx].allowed_menus = Array.isArray(allowed_menus) ? allowed_menus : staffList[idx].allowed_menus;
      staffList[idx].allowed_kiosks = Array.isArray(allowed_kiosks) ? allowed_kiosks : staffList[idx].allowed_kiosks;
      staffList[idx].updated_at = new Date().toISOString();

      const saved = await saveStaffCloud(staffList);
      if (!saved) {
        return NextResponse.json({ success: false, error: "Gagal memperbarui hak akses staff ke cloud storage." }, { status: 500 });
      }

      return NextResponse.json({ success: true, staff: staffList[idx], staffList });
    }

    if (action === "change_password") {
      const staffId = Number(id);
      const idx = staffList.findIndex(s => Number(s.id) === staffId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Staff tidak ditemukan." }, { status: 404 });
      }

      if (!password || password.trim().length < 6) {
        return NextResponse.json({ success: false, error: "Password baru minimal 6 karakter." }, { status: 400 });
      }

      staffList[idx].password = password.trim();
      staffList[idx].updated_at = new Date().toISOString();

      const saved = await saveStaffCloud(staffList);
      if (!saved) {
        return NextResponse.json({ success: false, error: "Gagal memperbarui password staff." }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Password berhasil diperbarui.", staffList });
    }

    if (action === "delete") {
      const staffId = Number(id);
      const initialLength = staffList.length;
      staffList = staffList.filter(s => Number(s.id) !== staffId);

      if (staffList.length === initialLength) {
        return NextResponse.json({ success: false, error: "Staff tidak ditemukan untuk dihapus." }, { status: 404 });
      }

      const saved = await saveStaffCloud(staffList);
      if (!saved) {
        return NextResponse.json({ success: false, error: "Gagal menghapus staff dari cloud storage." }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Staff berhasil dihapus.", staffList });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenal." }, { status: 400 });
  } catch (error) {
    console.error("[API Admin Staff POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
