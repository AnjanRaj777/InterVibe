import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

// SEC-08: Allowed model identifiers
const ALLOWED_MODELS = new Set([
  'muse-spark-1.3-contributor',
  'muse-spark-1.3',
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
]);

export async function POST(req: NextRequest) {
  try {
    // SEC-05: Enforce server-side authentication
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized: Valid session required' }, { status: 401 });
      }
    }

    const { messages, model } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Missing or empty messages array' }, { status: 400 });
    }

    // Input bounds: limit message history length to avoid token flooding
    const boundedMessages = messages.slice(-40);
    const formattedMessages = boundedMessages.map((m: any) => ({
      role: m.role === 'user' || m.role === 'assistant' || m.role === 'system' ? m.role : 'user',
      content: String(m.content || m.text || '').slice(0, 4000),
    }));

    const MODEL_API_KEY = process.env.MODEL_API_KEY;
    const META_API_BASE = process.env.META_API_BASE || 'https://api.meta.ai/v1';

    // SEC-08: Enforce model allowlist
    const defaultModel = process.env.SPARK_MODEL_ID || 'muse-spark-1.3-contributor';
    const SPARK_MODEL = (model && ALLOWED_MODELS.has(model)) ? model : defaultModel;

    if (!MODEL_API_KEY) {
      return NextResponse.json({ error: 'MODEL_API_KEY is not configured on server' }, { status: 500 });
    }

    // Meta Muse Spark 1.3 Contributor API (POST /v1/chat/completions)
    const metaRes = await fetch(`${META_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MODEL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SPARK_MODEL,
        messages: formattedMessages,
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (metaRes.ok) {
      const metaData = await metaRes.json();
      const reply = metaData.choices?.[0]?.message?.content || '';
      console.log(`[Chat] Meta Muse Spark generation success (${reply.length} chars)`);
      return NextResponse.json({ 
        response: reply, 
        provider: 'meta-muse-spark', 
        model: SPARK_MODEL 
      });
    } else {
      const errText = await metaRes.text();
      // SEC-15: Log upstream error server-side, return sanitized client response
      console.error('[Chat] Meta Muse Spark error:', metaRes.status, errText);
      return NextResponse.json(
        { error: 'AI dialogue completion service unavailable' },
        { status: 502 }
      );
    }
  } catch (error: any) {
    // SEC-15: Sanitize client error
    console.error('[Chat] Meta Muse Spark API Exception:', error);
    return NextResponse.json({ error: 'Internal chat service error' }, { status: 500 });
  }
}
