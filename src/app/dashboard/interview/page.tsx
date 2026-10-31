'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useSessionStore, type SessionAnalysis, type InterviewSession } from '@/store/session-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
  Mic, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  RotateCcw,
  Award,
  Volume2,
  VolumeX,
  Upload,
  FileText,
  Sliders
} from 'lucide-react';
import { InteractiveAvatar } from '@/components/avatar/interactive-avatar';

// Persona metadata
const PERSONAS: Record<string, { name: string; title: string; latency: string; voice: string; avatar: string; auraVoice: string; model: string }> = {
  'Sarah - Friendly HR': {
    name: 'Sarah Chen',
    title: 'Sarah — Friendly HR • 3 yrs at Linear',
    latency: '320ms',
    voice: 'Muse',
    avatar: '/avatars/sarah.webp',
    auraVoice: 'aura-asteria-en',
    model: '/avatars/sarah.glb'
  },
  'Michael - Strict Engineering Manager': {
    name: 'Michael Vance',
    title: 'Michael — Strict EM • 6 yrs at Stripe',
    latency: '410ms',
    voice: 'Muse',
    avatar: '/avatars/michael.webp',
    auraVoice: 'aura-orion-en',
    model: '/avatars/michael.glb'
  },
  'Emma - British Technical Lead': {
    name: 'Emma Watson',
    title: 'Emma — British Tech Lead • 4 yrs at DeepMind',
    latency: '350ms',
    voice: 'Muse',
    avatar: '/avatars/emma.webp',
    auraVoice: 'aura-luna-en',
    model: '/avatars/emma.glb'
  }
};

function float32To16kMonoWav(samples: Float32Array, sampleRate: number): Blob {
  let finalSamples = samples;
  let finalRate = sampleRate;

  // Linear resample to 16000Hz if needed
  if (sampleRate !== 16000 && sampleRate > 0) {
    const ratio = sampleRate / 16000;
    const newLen = Math.floor(samples.length / ratio);
    const resampled = new Float32Array(newLen);
    for (let i = 0; i < newLen; i++) {
      const idx = i * ratio;
      const lo = Math.floor(idx);
      const hi = Math.min(lo + 1, samples.length - 1);
      const frac = idx - lo;
      resampled[i] = samples[lo] + frac * (samples[hi] - samples[lo]);
    }
    finalSamples = resampled;
    finalRate = 16000;
  }

  const dataLength = finalSamples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (pos: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(pos + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono (1 channel)
  view.setUint32(24, finalRate, true); // 16000
  view.setUint32(28, finalRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let pos = 44;
  for (let i = 0; i < finalSamples.length; i++) {
    const s = Math.max(-1, Math.min(1, finalSamples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(pos, Math.round(intSample), true);
    pos += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export default function InterviewPage() {
  const { user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Step navigation: 'upload' -> 'configure' -> 'interview'
  const [step, setStep] = useState<'upload' | 'configure' | 'interview'>('upload');
  const [resumeText, setResumeText] = useState("");
  const [resumeFilename, setResumeFilename] = useState("");
  
  // Configuration State
  const [jobRole, setJobRole] = useState("Senior Full Stack Developer");
  const [jobDescription, setJobDescription] = useState("Looking for an experienced engineer proficient in Next.js, React, Node.js, distributed system design, API optimization, and real-time architectures.");
  const [interviewFocus, setInterviewFocus] = useState("Mixed");
  const [difficultyLevel, setDifficultyLevel] = useState("Mid-Level");
  const [interviewerVoice, setInterviewerVoice] = useState("Sarah - Friendly HR");
  const [interviewLength, setInterviewLength] = useState("Standard");

  // Chat & Conversation State
  const [messages, setMessages] = useState<{ id: string; time: string; role: 'system' | 'user' | 'assistant'; speaker: string; label: string; text: string }[]>([]);
  const messagesRef = useRef(messages);
  const [inputMsg, setInputMsg] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  
  // Audio & Voice Loop State
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  // Manual state override pill support
  const [manualState, setManualState] = useState<'speaking' | 'thinking' | 'listening' | null>(null);
  const [avatarMode, setAvatarMode] = useState<'3d' | '2d'>('3d');

  // Summary & Analysis State
  const [showSummary, setShowSummary] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<SessionAnalysis | null>(null);
  const [interviewStartTime, setInterviewStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const { addSession } = useSessionStore();

  // Synchronized state refs to defeat stale closure bugs in audio callbacks
  const stepRef = useRef<'upload' | 'configure' | 'interview'>('upload');
  const voiceModeRef = useRef<boolean>(true);
  const isRecordingRef = useRef<boolean>(false);
  const isProcessingAudioRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const recordingStartTimeRef = useRef<number>(0);

  // Refs for audio handling
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const visualizerRafIdRef = useRef<number | null>(null);
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const transcriptConsoleRef = useRef<HTMLDivElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const startRecordingRef = useRef<(() => Promise<void>) | null>(null);
  const stopRecordingRef = useRef<((cancelProcessing?: boolean) => Promise<void>) | null>(null);

  // Calculate active persona info
  const currentPersona = PERSONAS[interviewerVoice] || PERSONAS['Sarah - Friendly HR'];
  const currentPersonaRef = useRef(currentPersona);
  currentPersonaRef.current = currentPersona;

  // Determine current active visual state
  const activeState: 'speaking' | 'thinking' | 'listening' = manualState || (
    isPlaying ? 'speaking' :
    (isChatting || isProcessingAudio) ? 'thinking' :
    'listening'
  );

  // Synchronize refs with state
  useEffect(() => {
    messagesRef.current = messages;
    if (transcriptConsoleRef.current) {
      transcriptConsoleRef.current.scrollTop = transcriptConsoleRef.current.scrollHeight;
    }
  }, [messages, isRecording, isProcessingAudio]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    isProcessingAudioRef.current = isProcessingAudio;
  }, [isProcessingAudio]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Session elapsed timer (starts when interview begins)
  useEffect(() => {
    if (step !== 'interview' || !interviewStartTime) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - interviewStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, interviewStartTime]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Push-to-Talk: Hold Space key down to speak, release Space key to send
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== textInputRef.current) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        textInputRef.current?.focus();
        return;
      }

      if (e.key === 'Escape') {
        if (isRecordingRef.current) {
          stopRecordingRef.current?.(true);
          toast.info("Recording cancelled");
        }
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          setIsPlaying(false);
        }
        return;
      }

      if (e.code !== 'Space') return;
      if (e.repeat) return;

      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (stepRef.current === 'interview' && voiceModeRef.current) {
        e.preventDefault();
        if (!isRecordingRef.current && !isProcessingAudioRef.current && !isPlayingRef.current) {
          startRecordingRef.current?.();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;

      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (stepRef.current === 'interview' && voiceModeRef.current) {
        e.preventDefault();
        if (isRecordingRef.current) {
          stopRecordingRef.current?.(false);
        }
      }
    };

    const handleBlur = () => {
      if (isRecordingRef.current) {
        stopRecordingRef.current?.(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Native TTS fallback
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        availableVoicesRef.current = window.speechSynthesis.getVoices();
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      stopRecordingRef.current?.(true);
    };
  }, []);

  // 1. Resume Upload Handler
  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a resume file first (.pdf)");
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/extract-resume", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse resume");
      
      toast.success(`Resume parsed successfully! Extracted ${data.text.length} characters.`);
      setResumeText(data.text);
      setResumeFilename(file.name);
      setStep('configure');
      stepRef.current = 'configure';
    } catch (error: any) {
      toast.error(error.message || "Error processing resume");
    } finally {
      setIsUploading(false);
    }
  };

  // Fallback TTS: Browser Native Speech Synthesis
  const playNativeTTSFallback = (text: string) => {
    if (!voiceModeRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`~>\[\]\(\)]/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = availableVoicesRef.current.length > 0 
      ? availableVoicesRef.current 
      : window.speechSynthesis.getVoices();

    if (interviewerVoice.includes('Sarah')) {
      const femaleVoice = voices.find(v => (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English')) && v.lang.startsWith('en'));
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.pitch = 1.1;
    } else if (interviewerVoice.includes('Emma')) {
      const britishVoice = voices.find(v => (v.lang === 'en-GB' || v.name.includes('UK') || v.name.includes('British') || v.name.includes('George')));
      if (britishVoice) utterance.voice = britishVoice;
      utterance.pitch = 1.05;
    } else {
      const maleVoice = voices.find(v => (v.name.includes('David') || v.name.includes('Male') || v.name.includes('Alex')) && v.lang.startsWith('en'));
      if (maleVoice) utterance.voice = maleVoice;
      utterance.pitch = 0.92;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
    };
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  // Deepgram Aura TTS (Primary Voice Output)
  const playTTS = async (text: string) => {
    if (!voiceModeRef.current) return;

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    setIsPlaying(true);

    try {
      const persona = currentPersonaRef.current || currentPersona;
      const auraModel = persona.auraVoice || 'aura-asteria-en';

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text,
          model: auraModel,
        })
      });

      if (!res.ok) {
        throw new Error(`Deepgram TTS failed with HTTP ${res.status}`);
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioElementRef.current = null;
      };

      audio.onerror = (e) => {
        console.error("Deepgram audio playback error:", e);
        setIsPlaying(false);
        audioElementRef.current = null;
      };

      await audio.play();
    } catch (e: any) {
      console.warn("Deepgram TTS playback failed:", e.message);
      setIsPlaying(false);
    }
  };

  // Push-to-Talk: Start Candidate Microphone Recording (Direct 16kHz PCM Capture)
  const startRecording = async () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);

    if (isRecordingRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      audioStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);

      // Soundwave Visualizer Analyser
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      // Raw PCM Capture Node
      const bufferSize = 4096;
      const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;
      pcmChunksRef.current = [];

      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;
        const channelData = e.inputBuffer.getChannelData(0);
        pcmChunksRef.current.push(new Float32Array(channelData));
      };

      source.connect(processor);
      const muteGain = audioCtx.createGain();
      muteGain.gain.value = 0;
      processor.connect(muteGain);
      muteGain.connect(audioCtx.destination);

      recordingStartTimeRef.current = Date.now();
      isRecordingRef.current = true;
      setIsRecording(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const updateVisualizer = () => {
        if (!isRecordingRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round(avg * 3.5)));
        visualizerRafIdRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

    } catch (err: any) {
      toast.error("Microphone access error: " + err.message);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  // Push-to-Talk: Stop Recording on Space Release
  const stopRecording = async (cancelProcessing: boolean = false) => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);

    if (visualizerRafIdRef.current) {
      cancelAnimationFrame(visualizerRafIdRef.current);
      visualizerRafIdRef.current = null;
    }
    setAudioLevel(0);

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    const duration = Date.now() - recordingStartTimeRef.current;
    const stream = audioStreamRef.current;
    const audioCtx = audioContextRef.current;
    const capturedChunks = [...pcmChunksRef.current];

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    if (cancelProcessing) {
      pcmChunksRef.current = [];
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {});
      return;
    }

    if (capturedChunks.length === 0 || duration < 300) {
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {});
      return;
    }

    let totalSamples = 0;
    for (const chunk of capturedChunks) totalSamples += chunk.length;
    const merged = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of capturedChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const sampleRate = (audioCtx && audioCtx.sampleRate) || 16000;
    if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {});

    const wavBlob = float32To16kMonoWav(merged, sampleRate);
    await handleSTT(wavBlob);
  };

  startRecordingRef.current = startRecording;
  stopRecordingRef.current = stopRecording;

  // Speech-to-Text Handler (Meta Muse Voice Transcribe)
  const handleSTT = async (audioBlob: Blob) => {
    setIsProcessingAudio(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "speech.wav");
      
      const res = await fetch("/api/stt", {
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "STT failed");
      
      const rawTranscript = (data.transcription || "").trim();
      const cleanText = rawTranscript.replace(/[.,!?;:'"~\-–—]/g, '').trim().toLowerCase();
      const isNoise = cleanText.length === 0 || cleanText === 'you' || cleanText === 'thank you' || cleanText === 'thanks' || cleanText === 'bye';

      setIsProcessingAudio(false);

      if (rawTranscript.length > 0 && !isNoise) {
        await handleSendMessage(rawTranscript);
      } else {
        toast.info("No speech detected. Hold Spacebar to speak.");
      }
    } catch (e: any) {
      setIsProcessingAudio(false);
      toast.error("Speech recognition error: " + e.message);
    }
  };

  // 2. Start Interview Step Transition
  const handleStartInterview = async () => {
    if (!jobRole.trim()) {
      toast.error("Please enter a Target Job Role");
      return;
    }
    
    const systemInstruction = `You are an expert, highly realistic AI Interviewer executing a simulated live verbal technical interview loop.

### YOUR PERSONA
- Role: Senior Technical Recruiter / Engineering Manager.
- Persona Name & Style: ${interviewerVoice}
- Focus Domain: ${interviewFocus}
- Difficulty Setting: ${difficultyLevel}
- Tone Constraints: Speak professionally, concisely, and strictly maintain character. Do not mention you are an AI. Do not break character under any circumstance.

### THE APPLICATION CONTEXT
- Target Role: ${jobRole}
- Target Job Description: 
"""
${jobDescription}
"""

### CANDIDATE CONTEXT (Resume Memory)
Use these explicit facts from the candidate's background to cross-examine their experience against target job requirements:
"""
${resumeText.substring(0, 10000)}
"""

### CONVERSATIONAL VOICE CONSTRAINTS (CRITICAL FOR LIVE AUDIO)
1. ONE QUESTION AT A TIME: Never ask double-barreled or multi-part questions. Keep responses to 1-3 sentences total to prevent voice fatigue for the listener.
2. NATURAL TRANSITIONS: Acknowledge their previous answer briefly before diving into your next thought.
3. CONVERSATIONAL TEXT ONLY: Never output markdown symbols (no asterisks, no bullet lists, no bold tags, no backticks). The output text goes directly into a text-to-speech engine.
4. PROBE DEEPLY: Challenge them on specific architectural choices, trade-offs, or concrete code implementations.`;

    const personaFirstName = currentPersona.name.split(' ')[0];
    const initialGreeting = `Hello! Welcome to your interview today. I have reviewed your resume for the ${jobRole} position. Let's get started. To kick things off, could you briefly introduce yourself and highlight a recent challenging technical project you led?`;
    
    setStep('interview');
    stepRef.current = 'interview';
    const now = Date.now();
    setInterviewStartTime(now);
    setElapsedSeconds(0);
    
    setMessages([
      { id: 'sys-1', time: '00:00', role: 'system', speaker: 'System', label: 'SYS', text: systemInstruction },
      { id: 'greet-1', time: '00:02', role: 'assistant', speaker: personaFirstName, label: 'AI', text: initialGreeting }
    ]);
    
    if (voiceModeRef.current) {
      setTimeout(() => playTTS(initialGreeting), 600);
    }
  };

  // 3. Send Message & Meta Muse Spark 1.3 LLM Generation
  const handleSendMessage = async (textToProcess?: string) => {
    const textToSend = typeof textToProcess === 'string' ? textToProcess : inputMsg;
    if (!textToSend.trim()) return;
    
    stopRecording(true);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);

    const currentTime = formatTimer(elapsedSeconds);
    const newMsg = {
      id: `msg-${Date.now()}`,
      time: currentTime,
      role: 'user' as const,
      speaker: 'You',
      label: 'Me',
      text: textToSend
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMsg("");
    setIsChatting(true);
    
    try {
      const chatHistory = [
        ...messagesRef.current.map(m => ({ role: m.role, content: m.text })),
        { role: 'user', content: textToSend }
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate interviewer response");
      }
      
      const data = await res.json();
      const assistantReply = data.response;
      
      const replyMsg = {
        id: `msg-${Date.now() + 1}`,
        time: formatTimer(elapsedSeconds + 1),
        role: 'assistant' as const,
        speaker: currentPersona.name.split(' ')[0],
        label: 'AI',
        text: assistantReply
      };

      setMessages(prev => [...prev, replyMsg]);
      
      if (voiceModeRef.current) {
        playTTS(assistantReply);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsChatting(false);
    }
  };

  // End Interview & Meta Muse Spark Evaluation
  const handleEndInterview = async () => {
    stopRecording(true);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setShowSummary(true);
    setIsAnalyzing(true);

    try {
      const durationSeconds = interviewStartTime ? (Date.now() - interviewStartTime) / 1000 : elapsedSeconds;
      const res = await fetch('/api/analyze-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobRole,
          jobDescription,
          resumeText,
          interviewerVoice,
          messages: messages.map(m => ({ role: m.role, text: m.text })),
          durationSeconds,
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        setCurrentAnalysis(data.analysis);

        const newSession: InterviewSession = {
          id: `session_${Date.now()}`,
          createdAt: new Date().toISOString(),
          jobRole,
          jobDescription,
          interviewerVoice,
          durationSeconds: Math.round(durationSeconds),
          questionCount: messages.filter(m => m.role === 'user').length,
          messages: messages.map(m => ({ role: m.role, text: m.text })),
          analysis: data.analysis,
        };
        addSession(newSession);
        toast.success("AI interview analysis saved to Dashboard!");
      } else {
        throw new Error(data.error || "Analysis response incomplete");
      }
    } catch (err: any) {
      console.error("Analysis generation error:", err);
      toast.error("Error generating analysis: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyTranscript = () => {
    const text = messages
      .filter(m => m.role !== 'system')
      .map(m => `[${m.time}] ${m.label} ${m.speaker}: ${m.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success("Transcript copied to clipboard!");
  };

  const handleClearTranscript = () => {
    setMessages(prev => prev.filter(m => m.role === 'system'));
    toast.info("Transcript cleared");
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Interview session link copied to clipboard!");
    }
  };

  const handleResetSession = () => {
    setShowSummary(false);
    setCurrentAnalysis(null);
    setStep('upload');
    stepRef.current = 'upload';
    setElapsedSeconds(0);
    setInterviewStartTime(null);
    setMessages([]);
    setFile(null);
    setResumeText("");
    setResumeFilename("");
  };

  // Pro Subscription Gate
  if (!user?.hasProSubscription) {
    return (
      <div className="flex flex-1 flex-col justify-center items-center h-full min-h-[500px] text-center space-y-4 max-w-md mx-auto p-6">
        <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="text-2xl font-bold">Pro Subscription Required</h1>
        <p className="text-muted-foreground text-sm">
          Access to the live AI verbal interview simulator is available to Pro members.
        </p>
        <div className="flex gap-3">
          <Link href="/dashboard/billing">
            <Button>Upgrade to Pro ($15/mo)</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-background text-foreground selection:bg-primary/10 antialiased p-3 md:p-6">
      <div className="mx-auto max-w-[1100px] h-full flex flex-col justify-center">

        {/* STEP 1: UPLOAD RESUME */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto w-full py-6">
            <Card className="border border-border bg-card dark:border-[#222] dark:bg-[#121212] shadow-sm rounded-[20px] text-foreground">
              <CardHeader className="border-b border-border dark:border-[#1e1e1e] pb-5">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-foreground text-background flex items-center justify-center font-bold shadow-sm">
                    <Upload className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground">Prepare for Interview</CardTitle>
                    <CardDescription className="text-muted-foreground text-xs mt-0.5">
                      Upload your resume (PDF/DOCX) to give the AI context about your experience.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="border-2 border-dashed border-border dark:border-[#262626] rounded-xl p-8 text-center hover:border-foreground/50 transition-colors bg-muted/20 dark:bg-[#161616]/40">
                  <FileText className="size-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1 text-foreground">
                    {file ? file.name : "Select your PDF resume to begin"}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports PDF files up to 10MB"}
                  </p>
                  <div className="flex justify-center">
                    <Input 
                      type="file" 
                      accept=".pdf,.docx" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="max-w-xs cursor-pointer bg-background border-border text-foreground"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-muted/40 p-3.5 border border-border dark:bg-[#171717] dark:border-[#242424] text-xs text-muted-foreground flex items-center gap-2.5">
                  <Sparkles className="size-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span>The AI extracts your skills, tech stack, and seniority to cross-examine your answers realistically.</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border dark:border-[#1e1e1e] pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setResumeText("Senior Software Engineer with 5+ years building scalable distributed web applications, Next.js, TypeScript, PostgreSQL, and high-concurrency microservices.");
                    setResumeFilename("demo_resume.pdf");
                    setStep('configure');
                    stepRef.current = 'configure';
                    toast.info("Using demo candidate profile");
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  Skip / Use Demo Resume
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading || !file} 
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Extracting Text...
                    </>
                  ) : (
                    "Upload & Continue"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* STEP 2: CONFIGURE MOCK INTERVIEW */}
        {step === 'configure' && (
          <div className="max-w-2xl mx-auto w-full py-6">
            <Card className="border border-border bg-card dark:border-[#222] dark:bg-[#121212] shadow-sm rounded-[20px] text-foreground">
              <CardHeader className="border-b border-border dark:border-[#1e1e1e] pb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-foreground text-background flex items-center justify-center font-bold shadow-sm">
                      <Sliders className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">Interview Configuration Setup</CardTitle>
                      <CardDescription className="text-muted-foreground text-xs mt-0.5">
                        Customize your mock interview experience to match your target job loop.
                      </CardDescription>
                    </div>
                  </div>
                  {resumeFilename && (
                    <Badge variant="outline" className="gap-1.5 text-xs text-emerald-500 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                      <CheckCircle2 className="size-3.5" /> {resumeFilename}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Target Job Role / Title (Mandatory)</Label>
                  <Input 
                    value={jobRole} 
                    onChange={(e) => setJobRole(e.target.value)} 
                    placeholder="e.g. Senior Frontend Engineer"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Job Description (JD)</Label>
                  <Textarea 
                    value={jobDescription} 
                    onChange={(e) => setJobDescription(e.target.value)} 
                    placeholder="Paste the target job requirements or responsibilities here..."
                    className="min-h-[85px] bg-background border-border text-foreground text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Interview Focus</Label>
                    <Select value={interviewFocus} onValueChange={setInterviewFocus}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select Focus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mixed">Mixed (Comprehensive Loop)</SelectItem>
                        <SelectItem value="Technical / Domain">Technical / Domain Architecture</SelectItem>
                        <SelectItem value="System Design">System Design & Scalability</SelectItem>
                        <SelectItem value="Behavioral / HR">Behavioral / Leadership (STAR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Difficulty Setting</Label>
                    <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Intern / Junior">Intern / Junior</SelectItem>
                        <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                        <SelectItem value="Senior / Staff">Senior / Staff</SelectItem>
                        <SelectItem value="Stress Test">Stress Test (FAANG Hard)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Interviewer Persona & Voice</Label>
                    <Select value={interviewerVoice} onValueChange={setInterviewerVoice}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select Persona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sarah - Friendly HR">Sarah - Friendly HR (Aura Asteria Female)</SelectItem>
                        <SelectItem value="Michael - Strict Engineering Manager">Michael - Strict EM (Aura Orion Male)</SelectItem>
                        <SelectItem value="Emma - British Technical Lead">Emma - Tech Lead (Aura Luna Female)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Interview Length</Label>
                    <Select value={interviewLength} onValueChange={setInterviewLength}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select Length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Quick Warmup">Quick Warmup (10m)</SelectItem>
                        <SelectItem value="Standard">Standard (30m)</SelectItem>
                        <SelectItem value="Full Loop">Full Loop (45m+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border dark:border-[#1e1e1e] pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep('upload');
                    stepRef.current = 'upload';
                  }}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleStartInterview} 
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm"
                >
                  <Mic className="size-4" /> Start Interview Loop
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* STEP 3: LIVE AVATAR CENTER INTERVIEW ROOM */}
        {step === 'interview' && (
          <>
            {/* MAIN INTERVIEW CARD */}
            <div className="flex-1 rounded-[20px] md:rounded-[24px] border border-[#222] bg-[#121212] overflow-hidden flex flex-col shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_20px_60px_-20px_rgba(0,0,0,0.8)]">
              
              {/* HEADER BAR */}
              <div className="h-[68px] md:h-[72px] shrink-0 px-4 md:px-6 flex items-center justify-between border-b border-[#1e1e1e] bg-[#141414]/60 backdrop-blur">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full overflow-hidden border border-[#2a2a2a] shrink-0 hidden md:block">
                    <img 
                      src={currentPersona.avatar} 
                      alt={currentPersona.name} 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-[14px] md:text-[15px] font-semibold tracking-tight truncate text-white">
                        {jobRole}
                      </h1>
                      <span className="hidden md:inline-flex h-5 px-2 rounded-full bg-[#1c1c1c] border border-[#262626] text-[10px] font-mono tracking-wide text-zinc-400 items-center">
                        MOCK • {formatTimer(elapsedSeconds)}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-zinc-500 mt-0.5 font-mono truncate">
                      {currentPersona.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Reconfigure / Settings Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setStep('configure');
                      stepRef.current = 'configure';
                    }}
                    className="h-8 px-3 rounded-full bg-[#1e1e1e] hover:bg-[#232323] border border-[#2a2a2a] text-[12px] font-medium text-zinc-400 hover:text-zinc-200 transition hidden md:flex items-center gap-1.5 cursor-pointer"
                    title="Change interview settings"
                  >
                    <Sliders className="size-3.5" />
                    <span>Config</span>
                  </button>

                  {/* Voice Mode Toggle Switch */}
                  <div className="hidden md:flex items-center gap-2 mr-2 pl-3 pr-1 py-1 rounded-full bg-[#181818] border border-[#242424]">
                    <span className="text-[11px] font-mono text-zinc-400">Voice Mode</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !voiceMode;
                        setVoiceMode(next);
                        voiceModeRef.current = next;
                        if (!next) {
                          stopRecording(true);
                          if (audioElementRef.current) audioElementRef.current.pause();
                          setIsPlaying(false);
                        }
                      }}
                      className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${voiceMode ? 'bg-white' : 'bg-[#2a2a2a]'}`}
                    >
                      <span className={`absolute top-[2px] h-4 w-4 rounded-full transition-all ${voiceMode ? 'left-[18px] bg-black' : 'left-[2px] bg-zinc-400'}`} />
                    </button>
                  </div>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="h-8 px-3.5 rounded-full bg-[#1e1e1e] hover:bg-[#232323] border border-[#2a2a2a] text-[12.5px] font-medium text-zinc-300 transition hidden md:flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="h-3 w-3">
                      <svg viewBox="0 0 16 16" fill="none" className="w-full h-full">
                        <path d="M8 3.5v8M3.5 8h8" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    </span>
                    Share
                  </button>

                  {/* End Interview Button */}
                  <button
                    type="button"
                    onClick={handleEndInterview}
                    className="h-8 px-3.5 rounded-full bg-[#ff3b30] hover:bg-[#ff4a40] text-white text-[12.5px] font-medium transition flex items-center gap-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] cursor-pointer"
                  >
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    End Interview
                  </button>
                </div>
              </div>

              {/* CENTER HERO STAGE (AVATAR & RADAR) */}
              <div className="flex-1 relative flex flex-col items-center justify-center py-8 md:py-12 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.06)_0%,_transparent_55%)] min-h-[420px] md:min-h-[500px]">
                {/* Grid Pattern Overlay */}
                <div 
                  className="pointer-events-none absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize: "32px 32px"
                  }}
                />

                {/* Top State Pills */}
                <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 rounded-full bg-[#171717] border border-[#232323] shadow-lg z-10">
                  {(['speaking', 'thinking', 'listening'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setManualState(manualState === s ? null : s)}
                      className={`h-7 px-3.5 rounded-full text-[11px] font-mono font-medium tracking-wide uppercase transition-all cursor-pointer ${
                        activeState === s 
                          ? 'bg-white text-black shadow' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                  <div className="h-4 w-px bg-[#262626] mx-1" />
                  <button
                    type="button"
                    onClick={() => setManualState(null)}
                    className={`h-7 w-7 grid place-items-center rounded-full border transition cursor-pointer ${
                      manualState === null 
                        ? 'bg-[#212121] border-[#2a2a2a] text-white' 
                        : 'border-transparent text-zinc-500'
                    }`}
                    title="Auto live state sync"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M2.5 8a5.5 5.5 0 1 0 1.2-3.5M2.5 2.5v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {/* INTERACTIVE AVATAR STAGE (3D XRSPACE Behavior AI™ / 2D Minimal with Deepgram Aura Voice) */}
                <div className="relative flex flex-col items-center w-full">
                  <InteractiveAvatar
                    persona={currentPersona}
                    activeState={activeState}
                    isRecording={isRecording}
                    audioPlaying={isPlaying}
                    avatarMode={avatarMode}
                    onToggleMode={setAvatarMode}
                  />
                </div>

                  {/* Persona and State Subtitles */}
                  <div className="mt-4 flex flex-col items-center gap-2 text-center">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        activeState === 'speaking' ? 'bg-[#ff4a3d]' :
                        activeState === 'thinking' ? 'bg-yellow-400' :
                        (isRecording ? 'bg-[#ff4a3d] animate-ping' : 'bg-emerald-400')
                      }`} />
                      <p className="font-mono text-[11px] tracking-widest uppercase text-zinc-400">
                        {activeState === 'speaking' ? 'Interviewer is speaking...' :
                         activeState === 'thinking' ? 'Interviewer is thinking (Meta Muse Spark)...' :
                         (isRecording ? 'You are speaking (Space held)...' : 'Listening...')}
                      </p>
                    </div>
                    <h2 className="text-[16px] md:text-[18px] font-medium tracking-tight text-white">
                      {currentPersona.name}
                    </h2>
                    <p className="font-mono text-[11px] text-zinc-500">
                      {currentPersona.title} • Latency {currentPersona.latency} • Voice: {currentPersona.voice}
                    </p>
                  </div>

                {/* RIGHT SIDE CONTEXT & AUDIO TELEMETRY WIDGETS */}
                <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-3">
                  <div className="rounded-xl bg-[#161616] border border-[#232323] p-3 w-[160px] shadow-sm">
                    <p className="font-mono text-[10px] text-zinc-500 tracking-widest">AUDIO</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-300">Input</span>
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        16kHz
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full bg-[#232323] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-150"
                        style={{
                          width: isRecording ? `${Math.max(10, Math.min(100, audioLevel))}%` : '68%',
                          animation: activeState === 'listening' && !isRecording ? 'shimmer 1.2s ease-in-out infinite' : 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#161616] border border-[#232323] p-3 w-[160px] shadow-sm">
                    <p className="font-mono text-[10px] text-zinc-500 tracking-widest">CONTEXT</p>
                    <p className="text-[11px] text-zinc-400 mt-2 leading-snug">
                      React, Node, System Design — tailored prompts active
                    </p>
                  </div>
                </div>
              </div>

              {/* BOTTOM TRANSCRIPT & SUBTITLE CONSOLE */}
              <div className="border-t border-[#1e1e1e] bg-[#0f0f0f] flex flex-col">
                
                {/* Console Toolbar */}
                <div className="h-9 px-4 md:px-5 flex items-center justify-between border-b border-[#1a1a1a]">
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-[10px] tracking-widest text-zinc-500">
                      TRANSCRIPT • SUBTITLES
                    </p>
                    <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                      <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                      AUTO-SCROLL
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearTranscript}
                      className="h-6 px-2.5 rounded-full bg-[#191919] border border-[#262626] text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyTranscript}
                      className="h-6 px-2.5 rounded-full bg-[#191919] border border-[#262626] text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Scrollable Dialogue Feed */}
                <div 
                  ref={transcriptConsoleRef}
                  className="px-4 md:px-5 py-3 md:py-4 space-y-2.5 max-h-[180px] overflow-y-auto scrollbar-thin"
                >
                  {messages.filter(m => m.role !== 'system').map((s) => (
                    <div key={s.id} className="flex gap-3 md:gap-4 text-[12.5px] md:text-[13px] leading-[1.6] group">
                      <span className="font-mono text-[11px] text-zinc-600 mt-0.5 shrink-0 w-[38px]">
                        {s.time}
                      </span>
                      <span className={`shrink-0 font-mono text-[11px] font-medium tracking-wide px-1.5 py-0.5 rounded border h-fit mt-0.5 ${
                        s.label === 'AI' 
                          ? 'bg-[#1b1b1b] border-[#262626] text-zinc-300' 
                          : 'bg-white text-black border-white'
                      }`}>
                        {s.label}
                      </span>
                      <span className="text-zinc-400">
                        <span className="text-zinc-200 font-medium mr-1.5">{s.speaker}:</span>
                        {s.text}
                      </span>
                    </div>
                  ))}

                  {/* Real-time In-flight Transcription / Recording Preview */}
                  {(isRecording || isProcessingAudio) && (
                    <div className="flex gap-3 md:gap-4 text-[12.5px] md:text-[13px] leading-[1.6] items-start animate-fade-in">
                      <span className="font-mono text-[11px] text-[#facc15]/70 mt-0.5 shrink-0 w-[38px] flex items-center gap-1">
                        {formatTimer(elapsedSeconds)}
                        <span className="h-1 w-1 rounded-full bg-[#facc15] animate-pulse" />
                      </span>
                      <span className="shrink-0 font-mono text-[11px] font-medium tracking-wide px-1.5 py-0.5 rounded bg-[#facc15]/10 border border-[#facc15]/20 text-[#facc15] h-fit mt-0.5">
                        Me
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[#facc15]/90 font-[450]">
                          {isRecording ? "Transcribing live voice (Hold Space)..." : "Transcribing audio (Muse Voice)..."}
                        </span>
                        <span className="text-zinc-500 ml-2">
                          • {isRecording ? "Speak now into microphone..." : "Processing PCM buffer with Meta Muse ASR"}
                        </span>
                        <span className="inline-block w-[2px] h-[14px] bg-[#facc15] ml-1 translate-y-[2px] animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Interviewer Thinking In-flight Log */}
                  {isChatting && (
                    <div className="flex gap-3 md:gap-4 text-[12.5px] md:text-[13px] leading-[1.6] items-start animate-fade-in">
                      <span className="font-mono text-[11px] text-zinc-600 mt-0.5 shrink-0 w-[38px]">
                        {formatTimer(elapsedSeconds)}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] font-medium tracking-wide px-1.5 py-0.5 rounded border border-[#262626] bg-[#1b1b1b] text-zinc-300 h-fit mt-0.5">
                        AI
                      </span>
                      <div className="flex-1 min-w-0 flex items-center gap-2 text-zinc-400">
                        <Loader2 className="size-3.5 animate-spin text-zinc-400" />
                        <span className="italic">Interviewer is thinking (Meta Muse Spark)...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTTOM CONTROLS BAR (PUSH-TO-TALK & INPUT) */}
                <div className="px-3 md:px-4 py-3 bg-[#0c0c0c] border-t border-[#1a1a1a] flex items-center gap-2 md:gap-3">
                  
                  {/* Push-to-Talk Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isProcessingAudio && !isPlaying) {
                        if (!isRecording) startRecording();
                        else stopRecording(false);
                      }
                    }}
                    onMouseDown={() => {
                      if (!isProcessingAudio && !isPlaying) startRecording();
                    }}
                    onMouseUp={() => {
                      if (isRecording) stopRecording(false);
                    }}
                    disabled={isProcessingAudio || isPlaying}
                    className={`h-10 md:h-11 px-4 md:px-5 rounded-full text-[12.5px] md:text-[13px] font-medium flex items-center gap-2 transition shrink-0 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] cursor-pointer select-none ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                        : 'bg-white hover:bg-zinc-100 text-black'
                    }`}
                  >
                    <span className={`h-5 w-5 rounded-full grid place-items-center ${isRecording ? 'bg-white text-red-600' : 'bg-black text-white'}`}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2a2 2 0 0 0-2 2v4a2 2 0 1 0 4 0V4a2 2 0 0 0-2-2Z" fill="currentColor" />
                        <path d="M11 8a3 3 0 0 1-6 0M8 12v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="hidden md:inline">
                      {isRecording ? "Release to Send" : "Tap to Speak"}
                    </span>
                    <span className="md:hidden">
                      {isRecording ? "Release" : "Speak"}
                    </span>
                    <span className="hidden md:inline-flex ml-1 h-5 px-1.5 rounded bg-black/10 font-mono text-[10px] items-center">
                      SPACE
                    </span>
                  </button>

                  {/* Text Fallback Input */}
                  <div className="flex-1 relative">
                    <input
                      ref={textInputRef}
                      type="text"
                      placeholder={voiceMode ? "Voice mode active (or type response here)..." : "Type your response..."}
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="h-10 md:h-11 w-full rounded-full bg-[#171717] border border-[#262626] pl-4 pr-[88px] text-[13px] text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#2e2e2e] focus:bg-[#1a1a1a] transition"
                    />
                    <div className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !voiceMode;
                          setVoiceMode(next);
                          voiceModeRef.current = next;
                        }}
                        title={voiceMode ? "Mute Voice Output" : "Enable Voice Output"}
                        className={`h-8 w-8 grid place-items-center rounded-full transition cursor-pointer ${
                          voiceMode ? 'bg-[#232323] hover:bg-[#2a2a2a] text-emerald-400' : 'bg-[#232323] hover:bg-[#2a2a2a] text-zinc-500'
                        }`}
                      >
                        {voiceMode ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendMessage()}
                        disabled={!inputMsg.trim() || isChatting}
                        className="h-8 px-3 rounded-full bg-white text-black text-[12px] font-medium hover:bg-zinc-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  {/* Telemetry Bitrate and Language Badge */}
                  <div className="hidden md:flex items-center gap-2 shrink-0">
                    <span className="h-7 px-2.5 rounded-full bg-[#171717] border border-[#232323] text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      128kbps
                    </span>
                    <span className="h-7 px-2.5 rounded-full bg-[#171717] border border-[#232323] text-[10px] font-mono text-zinc-500">
                      EN
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* FOOTER KEYBOARD SHORTCUTS HINT */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-600">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#262626] text-zinc-400">/</kbd>
              <span>to focus •</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#262626] text-zinc-400">Esc</kbd>
              <span>to cancel • Hold</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#262626] text-zinc-400">Space</kbd>
              <span>to speak</span>
            </div>
          </>
        )}

      </div>

      {/* FEEDBACK SUMMARY EVALUATION DIALOG */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col bg-card border-border dark:bg-[#121212] dark:border-[#222] text-foreground">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 mb-1">
              <Award className="size-5" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Interview Complete</span>
            </div>
            <DialogTitle className="text-xl font-semibold text-foreground">Performance Evaluation &amp; Analysis</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Live diagnostic report generated by Meta Muse Spark 1.3 for {jobRole}
            </DialogDescription>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="size-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground animate-pulse">
                <Loader2 className="size-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-base text-foreground">Evaluating Session with Meta Muse Spark 1.3...</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Reviewing your verbal answers, technical depth, system design decisions, and communication structure.
                </p>
              </div>
            </div>
          ) : currentAnalysis ? (
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 text-sm">
              <div className="grid grid-cols-4 gap-2.5 text-center">
                <div className={`rounded-xl border p-3 ${
                  currentAnalysis.overallScore >= 80 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400'
                    : currentAnalysis.overallScore >= 60
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-500 dark:text-red-400'
                }`}>
                  <div className="text-2xl font-black">{currentAnalysis.overallScore}%</div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mt-0.5">Overall Score</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <div className="text-2xl font-bold text-foreground">{currentAnalysis.technicalDepthScore}%</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Technical Depth</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <div className="text-2xl font-bold text-foreground">{currentAnalysis.clarityScore}%</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Clarity &amp; Delivery</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <div className="text-2xl font-bold text-foreground">{currentAnalysis.architectureScore}%</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Architecture</div>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3.5 bg-muted/40 space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Executive Assessment</div>
                <p className="text-xs text-foreground leading-relaxed italic">
                  &ldquo;{currentAnalysis.executiveSummary}&rdquo;
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/20 p-3.5 bg-emerald-500/5 space-y-2">
                <div className="font-semibold text-xs flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Strengths Observed:</span>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-xs text-muted-foreground leading-relaxed">
                  {currentAnalysis.strengths.map((str, idx) => (
                    <li key={idx}><span className="text-foreground">{str}</span></li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-amber-500/20 p-3.5 bg-amber-500/5 space-y-2">
                <div className="font-semibold text-xs flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>Areas for Improvement:</span>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-xs text-muted-foreground leading-relaxed">
                  {currentAnalysis.improvements.map((imp, idx) => (
                    <li key={idx}><span className="text-foreground">{imp}</span></li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-purple-500/20 p-3.5 bg-purple-500/5 space-y-2">
                <div className="font-semibold text-xs flex items-center gap-1.5 text-purple-500 dark:text-purple-400">
                  <Sparkles className="size-4 shrink-0" />
                  <span>Targeted Practice Drills:</span>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-xs text-muted-foreground leading-relaxed">
                  {currentAnalysis.actionPlan.map((act, idx) => (
                    <li key={idx}><span className="text-foreground">{act}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex sm:justify-between gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={handleResetSession} className="gap-1.5 text-xs">
              <RotateCcw className="size-3.5" /> Start New Interview
            </Button>
            <Link href="/dashboard/overview">
              <Button className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                View Full Report on Dashboard
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
