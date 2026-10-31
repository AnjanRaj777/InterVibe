import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Missing or empty messages array' }, { status: 400 });
    }

    const formattedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content || m.text || '',
    }));

    const MODEL_API_KEY = process.env.MODEL_API_KEY;
    const META_API_BASE = process.env.META_API_BASE || 'https://api.meta.ai/v1';
    const SPARK_MODEL = model || process.env.SPARK_MODEL_ID || 'muse-spark-1.3-contributor';

    if (!MODEL_API_KEY) {
      return NextResponse.json({ error: 'MODEL_API_KEY is not configured in .env.local' }, { status: 500 });
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
      console.error('[Chat] Meta Muse Spark error:', metaRes.status, errText);
      return NextResponse.json(
        { error: `Meta Muse Spark failed (HTTP ${metaRes.status}): ${errText}` },
        { status: metaRes.status }
      );
    }
  } catch (error: any) {
    console.error('[Chat] Meta Muse Spark API Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
