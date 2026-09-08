import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { serverKey, isProduction } = body;

    if (!serverKey || !serverKey.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Midtrans Server Key wajib diisi untuk melakukan tes koneksi.',
      }, { status: 400 });
    }

    const trimmedKey = serverKey.trim();
    const authHeader = Buffer.from(`${trimmedKey}:`).toString('base64');
    const endpoint = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const testOrderId = `PING-${Date.now()}`;
    const testPayload = {
      transaction_details: {
        order_id: testOrderId,
        gross_amount: 10000,
      },
      item_details: [
        {
          id: 'TEST_CONNECTION',
          price: 10000,
          quantity: 1,
          name: 'Tes Koneksi Photobooth',
        },
      ],
      enabled_payments: ['qris', 'gopay'],
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authHeader}`,
      },
      body: JSON.stringify(testPayload),
    });

    const data = await res.json();

    if (data.token) {
      return NextResponse.json({
        success: true,
        message: 'Koneksi ke Midtrans Berhasil! Server Key valid dan siap memproses pembayaran.',
        environment: isProduction ? 'Production (Uang Asli / Live)' : 'Sandbox (Mode Uji Coba)',
        token: data.token,
      });
    } else {
      const errorMsg = Array.isArray(data.error_messages)
        ? data.error_messages.join(', ')
        : (data.message || 'Kredensial Server Key tidak valid atau tidak cocok dengan environment.');

      return NextResponse.json({
        success: false,
        error: errorMsg,
        environment: isProduction ? 'Production (Uang Asli / Live)' : 'Sandbox (Mode Uji Coba)',
      }, { status: 400 });
    }
  } catch (err) {
    console.error('[Payment API] Test connection error:', err);
    return NextResponse.json({
      success: false,
      error: 'Gagal terhubung ke server Midtrans: ' + err.message,
    }, { status: 500 });
  }
}
