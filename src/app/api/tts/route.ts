import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

// SEC-08: Allowed Deepgram Aura voice models
const ALLOWED_TTS_MODELS = new Set([
  'aura-asteria-en',
  'aura-luna-en',
  'aura-stella-en',
  'aura-athena-en',
  'aura-hera-en',
  'aura-orion-en',
  'aura-arcas-en',
  'aura-perseus-en',
  'aura-angus-en',
  'aura-orpheus-en',
  'aura-helios-en',
  'aura-zeus-en',
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

    const { text, model = 'aura-asteria-en' } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Valid text is required' }, { status: 400 });
    }

    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json({ error: 'Speech synthesis is not configured on server' }, { status: 500 });
    }

    // SEC-08: Validate requested voice model
    const selectedModel = ALLOWED_TTS_MODELS.has(model) ? model : 'aura-asteria-en';

    // Clean text: strip code blocks, backticks, emojis, markdown symbols, and extra whitespace
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' [code implementation omitted] ')
      .replace(/`[^`]+`/g, ' ')
      .replace(/[*_#~>\[\]\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Ensure text fits within standard conversational speech limits to prevent timeouts
    const spokenText = cleanText.length > 1200 ? cleanText.substring(0, 1200) + '...' : cleanText;

    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(selectedModel)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: spokenText })
    });

    if (!response.ok) {
      const errorText = await response.text();
      // SEC-15: Log upstream error server-side
      console.error('[Deepgram TTS] API Error:', response.status, errorText);
      return NextResponse.json({ error: 'Speech synthesis service unavailable' }, { status: 502 });
    }

    // Return complete MP3 buffer with Content-Length to ensure reliable audio playback across all browsers
    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      }
    });
  } catch (error: any) {
    // SEC-15: Sanitize error output
    console.error('[Deepgram TTS] Route error:', error);
    return NextResponse.json({ error: 'Internal speech synthesis error' }, { status: 500 });
  }
}
