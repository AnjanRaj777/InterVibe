import { NextResponse } from 'next/server';
import { runPgQuery, escapeSqlLiteral } from '@/lib/db';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body?.action as 'confirm' | 'ensure_signup';
    const rawEmail = String(body?.email || '').trim().toLowerCase();
    const password = typeof body?.password === 'string' ? body.password : '';
    const fullName = String(body?.name || rawEmail.split('@')[0] || 'Candidate')
      .trim()
      .slice(0, 100);

    if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
      return NextResponse.json({ ok: false, error: 'Valid email is required' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'Valid password is required' },
        { status: 400 }
      );
    }

    const emailLit = escapeSqlLiteral(rawEmail);
    const pwdLit = escapeSqlLiteral(password);

    if (action === 'confirm') {
      // SECURITY FIX:
      // 1. Never overwrite encrypted_password on OAuth accounts (prevents Account Takeover).
      // 2. Only confirm email_confirmed_at when the caller proves knowledge of the existing password.
      await runPgQuery(`
        UPDATE auth.users
        SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE LOWER(email) = ${emailLit}
          AND encrypted_password IS NOT NULL
          AND encrypted_password != ''
          AND encrypted_password = extensions.crypt(${pwdLit}, encrypted_password);
      `);

      return NextResponse.json({ ok: true });
    }

    if (action === 'ensure_signup') {
      const nameJsonLit = escapeSqlLiteral(JSON.stringify({ full_name: fullName }));
      const nameLit = escapeSqlLiteral(fullName);

      await runPgQuery(`
        DO $$
        DECLARE
          v_user_id uuid;
        BEGIN
          SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = ${emailLit} LIMIT 1;
          IF v_user_id IS NULL THEN
            v_user_id := gen_random_uuid();
            INSERT INTO auth.users (
              instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
              raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
              confirmation_token, email_change, email_change_token_new, recovery_token
            ) VALUES (
              '00000000-0000-0000-0000-000000000000',
              v_user_id,
              'authenticated',
              'authenticated',
              ${emailLit},
              extensions.crypt(${pwdLit}, extensions.gen_salt('bf')),
              NOW(),
              '{"provider":"email","providers":["email"],"subscription_tier":"free"}'::jsonb,
              ${nameJsonLit}::jsonb,
              NOW(),
              NOW(),
              '', '', '', ''
            );

            INSERT INTO auth.identities (
              id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
            ) VALUES (
              gen_random_uuid(),
              v_user_id,
              v_user_id::text,
              jsonb_build_object('sub', v_user_id::text, 'email', ${emailLit}, 'email_verified', true, 'phone_verified', false),
              'email',
              NOW(),
              NOW(),
              NOW()
            );

            INSERT INTO public.profiles (
              id, email, full_name, subscription_tier, credits_remaining, created_at, updated_at
            ) VALUES (
              v_user_id, ${emailLit}, ${nameLit}, 'free', 3, NOW(), NOW()
            ) ON CONFLICT (id) DO NOTHING;
          ELSE
            -- Only auto-confirm if caller proves knowledge of the existing account password
            UPDATE auth.users
            SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
                updated_at = NOW()
            WHERE id = v_user_id
              AND encrypted_password IS NOT NULL
              AND encrypted_password != ''
              AND encrypted_password = extensions.crypt(${pwdLit}, encrypted_password);
          END IF;
        END $$;
      `);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    console.warn('[Auth Assist] Notice:', err?.message || err);
    return NextResponse.json({ ok: false, error: 'Authentication assist unavailable' }, { status: 500 });
  }
}
