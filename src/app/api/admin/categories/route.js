export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getCategoriesCloud, saveCategoriesCloud } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const kioskId = searchParams.get("kiosk_id");
    let categories = await getCategoriesCloud();

    if (kioskId) {
      categories = categories.filter(c => String(c.kiosk_id) === String(kioskId));
    }

    return NextResponse.json({
      success: true,
      categories: categories.map(c => ({
        ...c,
        template_count: c.template_count ?? 4
      }))
    });
  } catch (error) {
    console.error("[API Admin Categories GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, id, name, is_active, updates, category, categoryId } = body;
    let categories = await getCategoriesCloud();

    if (action === "create" || action === "add_category") {
      const catName = name || (category && category.name) || "Kategori Baru";
      const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id || 0)) + 1 : 1;
      const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const newCat = {
        id: newId,
        kiosk_id: body.kiosk_id || 1,
        name: catName,
        folder: slug,
        slug: slug,
        order: categories.length + 1,
        is_active: true,
        template_count: 0,
        created_at: new Date().toISOString()
      };
      categories.push(newCat);
      await saveCategoriesCloud(categories);
      return NextResponse.json({ success: true, category: newCat, message: "Kategori berhasil ditambahkan" });
    }

    if (action === "update" || action === "update_category") {
      const targetId = id || categoryId || (category && category.id);
      const data = updates || category || {};
      const index = categories.findIndex(c => c.id === targetId);
      if (index === -1) {
        return NextResponse.json({ success: false, error: "Kategori tidak ditemukan" }, { status: 404 });
      }
      categories[index] = {
        ...categories[index],
        ...data,
        name: data.name || categories[index].name,
        updated_at: new Date().toISOString()
      };
      await saveCategoriesCloud(categories);
      return NextResponse.json({ success: true, category: categories[index], message: "Kategori berhasil diperbarui" });
    }

    if (action === "toggle" || action === "toggle_active") {
      const targetId = id || categoryId || (category && category.id);
      const index = categories.findIndex(c => c.id === targetId);
      if (index === -1) {
        return NextResponse.json({ success: false, error: "Kategori tidak ditemukan" }, { status: 404 });
      }
      categories[index].is_active = is_active !== undefined ? is_active : !categories[index].is_active;
      categories[index].updated_at = new Date().toISOString();
      await saveCategoriesCloud(categories);
      return NextResponse.json({ success: true, category: categories[index], message: "Status kategori berhasil diubah" });
    }

    if (action === "delete" || action === "delete_category") {
      const targetId = id || categoryId || (category && category.id);
      categories = categories.filter(c => c.id !== targetId);
      await saveCategoriesCloud(categories);
      return NextResponse.json({ success: true, message: "Kategori berhasil dihapus" });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (error) {
    console.error("[API Admin Categories POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
