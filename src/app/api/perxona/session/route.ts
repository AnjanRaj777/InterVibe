import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Endpoint to negotiate / retrieve Perxona Connect presentation sessions.
 * Communicates server-side with XRSPACE Perxona Connect API.
 */
export async function GET() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { enabled: false, error: 'Unauthorized: Valid session required' },
        { status: 401 }
      );
    }
  }

  const publishableKey = process.env.PERXONA_CONNECT_PUBLISHABLE_KEY || '';
  const secretKey = process.env.PERXONA_CONNECT_SECRET_KEY || '';
  const baseUrl = process.env.PERXONA_API_BASE_URL || 'https://console.perxona.ai/asia';

  if (!publishableKey) {
    return NextResponse.json({
      enabled: false,
      message: 'Perxona Connect publishable key not configured in .env.local',
    });
  }

  try {
    // If secret key is present, optionally create an authorized session ticket
    if (secretKey) {
      const res = await fetch(`${baseUrl}/api/v1/connect/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publishable_key: publishableKey,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        return NextResponse.json({
          enabled: true,
          publishableKey,
          baseUrl,
          session: data,
        });
      }
    }

    // Default to client direct connection via publishable key
    return NextResponse.json({
      enabled: true,
      publishableKey,
      baseUrl,
    });
  } catch (error: any) {
    return NextResponse.json({
      enabled: false,
      error: 'Failed to initialize Perxona session',
    });
  }
}
