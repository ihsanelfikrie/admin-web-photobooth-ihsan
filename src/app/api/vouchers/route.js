export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getCloudVouchers, saveCloudVouchers } from '@/lib/supabase';

export async function GET(req) {
  try {
    const vouchers = await getCloudVouchers();
    return NextResponse.json({ success: true, vouchers });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { voucher, pin } = body;
    const adminPin = process.env.ADMIN_PIN || '1234';

    if (pin !== adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized PIN' }, { status: 401 });
    }

    if (!voucher?.code) {
      return NextResponse.json({ success: false, error: 'Kode voucher harus diisi' }, { status: 400 });
    }

    const vouchers = await getCloudVouchers();
    const upperCode = voucher.code.trim().toUpperCase();

    const existingIdx = vouchers.findIndex(v => v.code.toUpperCase() === upperCode);
    const newVoucherObj = {
      code: upperCode,
      type: voucher.type || 'free',
      value: Number(voucher.value) || 100,
      maxUses: Number(voucher.maxUses) || 100,
      usedCount: existingIdx >= 0 ? (vouchers[existingIdx].usedCount || 0) : 0,
      active: voucher.active !== undefined ? voucher.active : true,
      description: voucher.description || 'Kode Voucher Photobooth',
      createdAt: existingIdx >= 0 ? vouchers[existingIdx].createdAt : new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      vouchers[existingIdx] = newVoucherObj;
    } else {
      vouchers.unshift(newVoucherObj);
    }

    await saveCloudVouchers(vouchers);
    return NextResponse.json({ success: true, vouchers, savedVoucher: newVoucherObj });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const pin = searchParams.get('pin');
    const adminPin = process.env.ADMIN_PIN || '1234';

    if (pin !== adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized PIN' }, { status: 401 });
    }

    if (!code) {
      return NextResponse.json({ success: false, error: 'Kode voucher required' }, { status: 400 });
    }

    let vouchers = await getCloudVouchers();
    vouchers = vouchers.filter(v => v.code.toUpperCase() !== code.toUpperCase());

    await saveCloudVouchers(vouchers);
    return NextResponse.json({ success: true, vouchers });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
