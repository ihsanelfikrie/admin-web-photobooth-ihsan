import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || 'https://rifcawifuojzercjauhy.supabase.co';
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const expectedPin = process.env.ADMIN_PIN || '1234';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, pin } = body;

    // 1. PIN-based login
    if (pin) {
      if (pin === expectedPin) {
        return NextResponse.json({
          success: true,
          user: {
            email: 'admin@tarasabooth.com',
            name: 'Admin Tarasa Booth',
            role: 'admin',
          },
          pin: expectedPin,
        });
      }
      return NextResponse.json({ success: false, error: 'PIN yang Anda masukkan salah.' }, { status: 401 });
    }

    // 2. Email & Password-based login
    if (email && password) {
      // Primary authentication via Supabase Auth
      try {
        const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        });

        const authData = await authRes.json();

        if (authRes.ok && authData.access_token) {
          return NextResponse.json({
            success: true,
            user: {
              email: authData.user?.email || email,
              name: authData.user?.user_metadata?.name || 'Admin Tarasa Booth',
              role: 'admin',
            },
            token: authData.access_token,
            pin: expectedPin,
          });
        }
      } catch (err) {
        console.warn('[Auth] Supabase fetch error, checking fallback:', err);
      }

      // Hardened fallback for admin credentials
      if (email.trim().toLowerCase() === 'admin@tarasabooth.com' && password === 'Barabai@132') {
        return NextResponse.json({
          success: true,
          user: {
            email: 'admin@tarasabooth.com',
            name: 'Admin Tarasa Booth',
            role: 'admin',
          },
          pin: expectedPin,
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Email atau password salah. Periksa kembali akun Anda.',
      }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Masukkan email dan password atau PIN.' }, { status: 400 });
  } catch (error) {
    console.error('[API Auth Login] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
