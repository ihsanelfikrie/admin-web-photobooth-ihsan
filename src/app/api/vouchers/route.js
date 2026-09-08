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
    const { action, voucher, pin } = body;
    const adminPin = process.env.ADMIN_PIN || '1234';

    // 1. Action: Mark Voucher Used (from Kiosk App or Admin)
    if (action === 'use' || action === 'redeem') {
      const codeToUse = (body.code || voucher?.code || '').trim().toUpperCase();
      if (!codeToUse) {
        return NextResponse.json({ success: false, error: 'Kode voucher required' }, { status: 400 });
      }

      const vouchers = await getCloudVouchers();
      const targetIdx = vouchers.findIndex(v => v.code.toUpperCase() === codeToUse);

      if (targetIdx === -1) {
        return NextResponse.json({ success: false, error: 'Voucher tidak ditemukan' }, { status: 404 });
      }

      vouchers[targetIdx].usedCount = (Number(vouchers[targetIdx].usedCount) || 0) + 1;
      vouchers[targetIdx].lastUsedAt = new Date().toISOString();
      if (body.kiosk_id) {
        vouchers[targetIdx].lastUsedKioskId = body.kiosk_id;
      }

      await saveCloudVouchers(vouchers);
      return NextResponse.json({
        success: true,
        message: 'Voucher berhasil ditandai telah digunakan',
        voucher: vouchers[targetIdx],
      });
    }

    // Security check for administrative actions
    if (pin !== adminPin) {
      return NextResponse.json({ success: false, error: 'Unauthorized PIN' }, { status: 401 });
    }

    // 2. Action: Bulk Generate Vouchers (e.g. 100 Random Cash Vouchers for Barista Cafe)
    if (action === 'generate_bulk') {
      const count = Math.min(500, Math.max(1, Number(body.count) || 100));
      const prefix = (body.prefix || 'CSH').trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CSH';
      const category = body.category || 'cash';
      const value = Number(body.value) || 15000;
      const kiosk_id = body.kiosk_id || null;
      const description = body.description || `Voucher Bayar Cash Barista Cafe (${new Date().toLocaleDateString('id-ID')})`;

      const vouchers = await getCloudVouchers();
      const existingCodes = new Set(vouchers.map(v => v.code.toUpperCase()));

      // Clean alphanumeric charset excluding confusing chars (0, O, 1, I)
      const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      const getRandomSegment = (len = 6) => {
        let res = '';
        for (let i = 0; i < len; i++) {
          res += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
        }
        return res;
      };

      const generatedList = [];
      let attempts = 0;
      const maxAttempts = count * 25;

      while (generatedList.length < count && attempts < maxAttempts) {
        attempts++;
        const candidateCode = `${prefix}-${getRandomSegment(6)}`;
        if (!existingCodes.has(candidateCode)) {
          existingCodes.add(candidateCode);
          generatedList.push({
            code: candidateCode,
            category, // 'cash' vs 'promo'
            type: category === 'cash' ? 'cash' : (body.type || 'free'),
            value,
            maxUses: Number(body.maxUses) || 1, // Single use per receipt
            usedCount: 0,
            active: true,
            description,
            kiosk_id,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Prepend the new generated vouchers to the list
      const updatedVouchers = [...generatedList, ...vouchers];
      await saveCloudVouchers(updatedVouchers);

      return NextResponse.json({
        success: true,
        count: generatedList.length,
        generatedCodes: generatedList.map(g => g.code),
        generatedVouchers: generatedList,
        vouchers: updatedVouchers,
      });
    }

    // 3. Action: Create or Update Single Voucher
    if (!voucher?.code) {
      return NextResponse.json({ success: false, error: 'Kode voucher harus diisi' }, { status: 400 });
    }

    const vouchers = await getCloudVouchers();
    const upperCode = voucher.code.trim().toUpperCase();

    const existingIdx = vouchers.findIndex(v => v.code.toUpperCase() === upperCode);
    const category = voucher.category || (voucher.type === 'cash' ? 'cash' : 'promo');
    const newVoucherObj = {
      code: upperCode,
      category, // 'cash' | 'promo'
      type: voucher.type || (category === 'cash' ? 'cash' : 'free'),
      value: Number(voucher.value) !== undefined ? Number(voucher.value) : (category === 'cash' ? 15000 : 100),
      maxUses: Number(voucher.maxUses) || (category === 'cash' ? 1 : 100),
      usedCount: existingIdx >= 0 ? (vouchers[existingIdx].usedCount || 0) : 0,
      active: voucher.active !== undefined ? voucher.active : true,
      description: voucher.description || (category === 'cash' ? 'Voucher Bayar Cash Barista Cafe' : 'Kode Voucher Photobooth'),
      kiosk_id: voucher.kiosk_id || null,
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
