import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, model = 'aura-asteria-en' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json({ error: 'Deepgram API key is not configured' }, { status: 500 });
    }

    // Clean text: strip code blocks, backticks, emojis, markdown symbols, and extra whitespace
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' [code implementation omitted] ')
      .replace(/`[^`]+`/g, ' ')
      .replace(/[*_#~>\[\]\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Ensure text fits within standard conversational speech limits to prevent timeouts
    const spokenText = cleanText.length > 1200 ? cleanText.substring(0, 1200) + '...' : cleanText;

    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: spokenText })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Deepgram TTS] API Error:', response.status, errorText);
      return NextResponse.json({ error: `Deepgram API error: ${errorText}` }, { status: response.status });
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
    console.error('[Deepgram TTS] Route error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
