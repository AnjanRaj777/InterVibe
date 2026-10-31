import { NextRequest, NextResponse } from 'next/server';

/**
 * Resamples any PCM WAV buffer to 16000 Hz Mono s16le WAV.
 * Meta Muse Voice Transcribe strictly requires:
 * mono s16le at 16000 or 24000 Hz.
 */
function resampleWavTo16kMono(buffer: Buffer): Buffer {
  if (buffer.length < 44) return buffer;
  const riff = buffer.toString('ascii', 0, 4);
  const wave = buffer.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || wave !== 'WAVE') return buffer;

  let offset = 12;
  let fmtOffset = -1;
  let dataOffset = -1;
  let dataLength = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === 'fmt ') {
      fmtOffset = offset + 8;
    } else if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataLength = chunkSize;
    }
    offset += 8 + chunkSize;
  }

  if (fmtOffset === -1 || dataOffset === -1) return buffer;

  const audioFormat = buffer.readUInt16LE(fmtOffset);
  const numChannels = buffer.readUInt16LE(fmtOffset + 2);
  const sampleRate = buffer.readUInt32LE(fmtOffset + 4);
  const bitsPerSample = buffer.readUInt16LE(fmtOffset + 14);

  // If already 16kHz or 24kHz mono 16-bit PCM, return as-is
  if (audioFormat === 1 && numChannels === 1 && bitsPerSample === 16 && (sampleRate === 16000 || sampleRate === 24000)) {
    return buffer;
  }

  if (audioFormat !== 1 || bitsPerSample !== 16) {
    return buffer;
  }

  const totalInputSamples = Math.floor(dataLength / (2 * numChannels));
  const targetSampleRate = 16000;
  const totalOutputSamples = Math.floor(totalInputSamples * (targetSampleRate / sampleRate));

  const outData = Buffer.alloc(totalOutputSamples * 2);
  for (let i = 0; i < totalOutputSamples; i++) {
    const srcIndexFloat = i * (sampleRate / targetSampleRate);
    const srcIndex = Math.floor(srcIndexFloat);
    const frac = srcIndexFloat - srcIndex;
    const nextIndex = Math.min(srcIndex + 1, totalInputSamples - 1);

    let sample1 = 0;
    let sample2 = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      sample1 += buffer.readInt16LE(dataOffset + (srcIndex * numChannels + ch) * 2);
      sample2 += buffer.readInt16LE(dataOffset + (nextIndex * numChannels + ch) * 2);
    }
    sample1 /= numChannels;
    sample2 /= numChannels;

    const interp = Math.round(sample1 + frac * (sample2 - sample1));
    const clamped = Math.max(-32768, Math.min(32767, interp));
    outData.writeInt16LE(clamped, i * 2);
  }

  // Create clean 44-byte 16000Hz mono s16le RIFF header
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + outData.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // Mono
  header.writeUInt32LE(16000, 24); // 16kHz
  header.writeUInt32LE(16000 * 2, 28); // Byte rate (16000 * 2 * 1)
  header.writeUInt16LE(2, 32); // Block align (2)
  header.writeUInt16LE(16, 34); // Bits per sample (16)
  header.write('data', 36);
  header.writeUInt32LE(outData.length, 40);

  return Buffer.concat([header, outData]);
}

export async function POST(req: NextRequest) {
  try {
    const incomingFormData = await req.formData();
    const audioFile = (incomingFormData.get('file') || incomingFormData.get('audio')) as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    let audioBytes = Buffer.from(arrayBuffer);
    console.log(`[STT] Received audio file: size=${audioBytes.length} bytes, name=${audioFile.name || 'unnamed'}`);

    // Ensure audio is 16kHz mono s16le WAV for Meta Muse
    audioBytes = resampleWavTo16kMono(audioBytes);

    const MUSE_API_KEY = process.env.MUSE_API_KEY;
    const META_API_BASE = process.env.META_API_BASE || 'https://api.meta.ai/v1';
    const TRANSCRIBE_MODEL = process.env.TRANSCRIBE_MODEL_ID || 'muse-voice-transcribe-1.0';

    if (!MUSE_API_KEY) {
      return NextResponse.json({ error: 'MUSE_API_KEY is not configured in .env.local' }, { status: 500 });
    }

    // Meta Muse Voice Transcribe (POST /v1/asr/transcribe)
    const form = new FormData();
    const requestConfig = {
      model: TRANSCRIBE_MODEL,
      audioEncoding: 'WAV',
      mode: 'PUSH_TO_TALK',
    };

    const reqBlob = new Blob([JSON.stringify(requestConfig)], { type: 'application/json' });
    form.append('request', reqBlob);
    form.append('audio', new Blob([audioBytes], { type: 'audio/wav' }), 'audio.wav');

    const metaResponse = await fetch(`${META_API_BASE}/asr/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MUSE_API_KEY}`,
      },
      body: form,
    });

    if (metaResponse.ok) {
      const data = (await metaResponse.json()) as any;
      const transcript = (
        data.transcript ??
        data.text ??
        data.turns?.map((t: any) => t.transcript).filter(Boolean).join(' ') ??
        ''
      ).trim();

      console.log(`[STT] Meta Muse Voice Transcribe response: "${transcript}"`);
      return NextResponse.json({
        transcription: transcript,
        provider: 'meta-muse-voice',
        model: TRANSCRIBE_MODEL,
      });
    } else {
      const errText = await metaResponse.text();
      console.error('[STT] Meta Muse Transcribe error:', metaResponse.status, errText);
      return NextResponse.json(
        { error: `Meta Muse Transcribe failed (HTTP ${metaResponse.status}): ${errText}` },
        { status: metaResponse.status }
      );
    }
  } catch (error: any) {
    console.error('[STT] Meta Muse STT API Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
