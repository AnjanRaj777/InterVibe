"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  api,
  classifyFile,
  type DrillTurn,
  type Plan,
  type SessionSummary,
} from "@/lib/api";
import {
  speakText,
  stopSpeaking,
  useVoiceInput,
  getSavedVoiceEngine,
  setSavedVoiceEngine,
  normalizeVoiceForEngine,
  getPersonaConfig,
  ORPHEUS_VOICES,
  getSavedOrpheusVoice,
  setSavedOrpheusVoice,
  type VoiceEngine,
} from "@/lib/voice";
import { KOKORO_VOICES, getSavedVoice, setSavedVoice, preloadKokoro } from "@/lib/kokoro";
import {
  PIPER_VOICES,
  getSavedPiperVoice,
  setSavedPiperVoice,
  preloadPiper,
} from "@/lib/piper";
import {
  ChatComposer,
  ChatComposerDrawer,
} from "@astryxdesign/core/Chat";
import { Token } from "@astryxdesign/core/Token";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Badge } from "@astryxdesign/core/Badge";
import { HStack, VStack } from "@astryxdesign/core/Layout";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ModuleView {
  teach: string;
  turns: DrillTurn[];
  status: "active" | "complete";
  completeReason: string;
  nextQuestion: string | null;
  promptVersion: string;
  budget: number;
}

type AppState = "idle" | "configuring" | "ready" | "interview";

/* ─── Constants ───────────────────────────────────────────────────────────── */

const SENIORITY_LEVELS = [
  { id: "Junior", label: "Junior (L3)" },
  { id: "Mid-Level", label: "Mid-Level (L4)" },
  { id: "Senior", label: "Senior (L5)" },
  { id: "Staff / Lead", label: "Staff / Lead (L6+)" },
];

const FOCUS_AREAS = [
  "System Design & Distributed Systems",
  "Algorithms & Data Structures",
  "LLMs, Prompt Engineering & RAG",
  "Frontend Architecture & Web Vitals",
  "API Design & Databases",
  "Cloud, K8s & Observability",
  "Behavioral & Leadership",
];

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function MockPage() {
  /* Session */
  const [sessionId, setSessionId] = useState("");

  /* App-level state machine */
  const [appState, setAppState] = useState<AppState>("idle");
  const isInterviewing = appState === "interview";

  /* Settings / config */
  const [showSettings, setShowSettings] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showJdModal, setShowJdModal] = useState(false);
  const [isDark, setIsDark] = useState(false);

  /* Interview config */
  const [role, setRole] = useState("Software Engineer");
  const [customRole, setCustomRole] = useState("");
  const [company, setCompany] = useState("Meta");
  const [customCompany, setCustomCompany] = useState("");
  const [seniority, setSeniority] = useState("Senior");
  const [focusArea, setFocusArea] = useState("System Design & Distributed Systems");
  const [selectedVoice, setSelectedVoice] = useState("en_US-amy-medium");
  const [commsWanted, setCommsWanted] = useState(true);
  const [strictness, setStrictness] = useState<"standard" | "faang_strict">("faang_strict");

  /* Resume / JD upload within settings */
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeParsed, setResumeParsed] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [jdText, setJdText] = useState("");
  const [jdParsed, setJdParsed] = useState(false);
  const [jdParsingText, setJdParsingText] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  /* Interview state */
  const [candidateName, setCandidateName] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [view, setView] = useState<ModuleView | null>(null);
  const [draft, setDraft] = useState("");
  const [scoring, setScoring] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceEngine, setVoiceEngineState] = useState<VoiceEngine>("piper");
  const [latestScore, setLatestScore] = useState<{ overall: number; fix: string } | null>(null);
  const [subtitleText, setSubtitleText] = useState("");
  const [error, setError] = useState("");
  const [preparingInterview, setPreparingInterview] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const effectiveRole = customRole.trim() || role;
  const effectiveCompany = customCompany.trim() || company;
  const piperV = PIPER_VOICES.find((v) => v.id === selectedVoice);
  const kokoroV = KOKORO_VOICES.find((v) => v.id === selectedVoice);
  const orpheusV = ORPHEUS_VOICES.find((v) => v.id === selectedVoice);
  const voiceName = piperV?.name ?? kokoroV?.name ?? orpheusV?.name ?? getPersonaConfig(selectedVoice).name;

  /* ── Voice (STT) ─────────────────────────────────────────────────── */

  const voice = useVoiceInput({
    sessionId,
    onFinalTranscript: (text) => setDraft(text),
    onAutoSend: (text) => {
      setDraft(text);
      void submitAnswer(text);
    },
  });

  const startListeningRef = useRef(voice.startListening);
  startListeningRef.current = voice.startListening;

  /* ── TTS ─────────────────────────────────────────────────────────── */

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (voiceMuted) {
        const words = text.split(/\s+/).length;
        const readingMs = Math.min(Math.max(words * 200, 1500), 4000);
        const timer = setTimeout(() => onDone?.(), readingMs);
        return () => clearTimeout(timer);
      }
      stopSpeaking();
      return speakText(text, {
        voice: selectedVoice,
        onStart: () => setAiSpeaking(true),
        onEnd: () => {
          setAiSpeaking(false);
          onDone?.();
        },
        onError: () => {
          setAiSpeaking(false);
          onDone?.();
        },
      });
    },
    [voiceMuted, selectedVoice],
  );

  const replayQuestion = useCallback(() => {
    const textToReplay = view?.nextQuestion || subtitleText.replace(/^"|"$/g, "");
    if (!textToReplay) return;
    speak(textToReplay, () => {
      startListeningRef.current();
    });
  }, [view?.nextQuestion, subtitleText, speak]);

  /* ── Load session & saved theme on mount ─────────────────────────── */

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("iv_theme");
      if (savedTheme === "dark") setIsDark(true);
      else if (savedTheme === "light") setIsDark(false);
    } catch {}

    const engine = getSavedVoiceEngine();
    setVoiceEngineState(engine);
    if (engine === "groq-orpheus") {
      setSelectedVoice(getSavedOrpheusVoice());
    } else if (engine === "piper") {
      setSelectedVoice(getSavedPiperVoice());
      preloadPiper();
    } else if (engine === "kokoro") {
      setSelectedVoice(getSavedVoice());
      preloadKokoro();
    } else {
      setSelectedVoice(normalizeVoiceForEngine(getSavedPiperVoice(), "instant"));
    }

    api.currentSession().then((s: SessionSummary) => {
      setSessionId(s.session.id);
      if (s.session.role) setRole(s.session.role);
      if (s.session.company) setCompany(s.session.company);
      if (s.session.voice) {
        setSelectedVoice(normalizeVoiceForEngine(s.session.voice, engine));
      }

      const resumeDoc = s.documents.find((d) => d.kind === "resume" && d.parsed);
      const jdDoc = s.documents.find((d) => d.kind === "jd" && d.parsed);

      if (resumeDoc) {
        const cName = (resumeDoc.profile as { name?: string })?.name ?? "";
        setCandidateName(cName);
        setResumeParsed(true);
        setResumeName(cName || "Resume uploaded");
        if (jdDoc) {
          const p = jdDoc.profile as { title?: string; company?: string };
          if (p.title) setRole(p.title);
          if (p.company) setCompany(p.company);
        }
      }
      if (jdDoc) setJdParsed(true);

      // Load plan if one exists, but keep appState idle for main page
      api.getPlan(s.session.id).then((res) => {
        if (res && res.plan) setPlan(res.plan);
      }).catch(() => {
        // No plan yet
      });
    }).catch(() => {
      // Not logged in or error, stay idle
    });

    return () => { stopSpeaking(); };
  }, []);

  /* ── Settings: upload resume file ────────────────────────────────── */

  async function handleResumeUpload(file: File) {
    if (!sessionId) { setUploadMsg("Session not ready — please refresh."); return; }
    const cls = classifyFile(file);
    if ("error" in cls) { setUploadMsg(cls.error); return; }
    setResumeUploading(true);
    setUploadMsg("Parsing resume…");
    try {
      const { profile } = await api.uploadDocument(sessionId, "resume", file);
      const cName = (profile as { name?: string })?.name ?? "";
      setCandidateName(cName);
      setResumeParsed(true);
      setResumeName(cName || file.name);
      setUploadMsg("✓ Resume parsed successfully!");
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setResumeUploading(false);
    }
  }

  /* ── Auto-focus input when entering interview mode ────────────────── */
  useEffect(() => {
    if (isInterviewing) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isInterviewing]);

  /* ── Settings: parse pasted JD ───────────────────────────────────── */

  async function handleJdParse() {
    if (!sessionId || !jdText.trim()) { setUploadMsg("Paste a job description first."); return; }
    setJdParsingText(true);
    setUploadMsg("Parsing job description…");
    try {
      const { profile } = await api.uploadDocument(sessionId, "jd", jdText);
      const p = profile as { title?: string; company?: string; seniority?: string };
      if (p.title) setRole(p.title);
      if (p.company) setCompany(p.company);
      if (p.seniority) setSeniority(p.seniority);
      setJdParsed(true);
      setUploadMsg("✓ Job description parsed!");
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : "Parse failed.");
    } finally {
      setJdParsingText(false);
    }
  }

  /* ── Load a drill module ─────────────────────────────────────────── */

  const loadModule = useCallback(async (
    sid: string,
    idx: number,
    modules: Plan["modules"],
    candName: string,
    r: string,
    c: string,
    v: string,
    autoGreet = true,
  ) => {
    try {
      let mv: ModuleView;
      const started = await api.startDrill(sid, idx);
      if (started.turnsAsked > 0) {
        const snap = await api.getDrill(sid, idx);
        mv = {
          teach: snap.drill.teach,
          turns: snap.drill.turns,
          status: snap.drill.status,
          completeReason: snap.drill.completeReason,
          nextQuestion: snap.nextQuestion,
          promptVersion: snap.drill.promptVersion,
          budget: modules[idx]?.estimatedQuestions ?? 6,
        };
      } else {
        mv = {
          teach: started.teach,
          turns: [],
          status: started.status,
          completeReason: "",
          nextQuestion: started.question,
          promptVersion: started.promptVersion,
          budget: modules[idx]?.estimatedQuestions ?? 6,
        };
      }
      setView(mv);

      if (autoGreet && mv.nextQuestion) {
        const vName =
          PIPER_VOICES.find((x) => x.id === v)?.name ??
          KOKORO_VOICES.find((x) => x.id === v)?.name ??
          getPersonaConfig(v).name;
        const isComms = modules[idx]?.kind === "comms";
        let greeting: string;
        if (idx === 0 && isComms) {
          greeting = candName
            ? `Hi ${candName}, I'm ${vName}. Thanks for meeting with me today for the ${r} position at ${c}. We'll do about four questions, and I'll leave time for your questions at the end. To start off, could you tell me a bit about yourself and why you're interested in this role?`
            : `Hello, I'm ${vName}. Thanks for meeting with me today for the ${r} position at ${c}. We'll do about four questions, and I'll leave time for your questions at the end. To start off, could you tell me a bit about yourself and why you're interested in this role?`;
        } else {
          greeting = `Moving on to ${modules[idx]?.title}. ${mv.nextQuestion}`;
        }
        setSubtitleText(`"${mv.nextQuestion}"`);
        speak(greeting, () => {
          startListeningRef.current();
        });
      } else if (mv.nextQuestion) {
        setSubtitleText(`"${mv.nextQuestion}"`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load module.");
    }
  }, [speak]);

  /* ── Start interview ─────────────────────────────────────────────── */

  async function handleStart() {
    if (appState === "interview") return; // already running
    if (!sessionId) return;

    setError("");
    setPreparingInterview(true);
    setSavedVoice(selectedVoice);

    // Immediately trigger visual slide-down of the bar and pop-in of character
    setAppState("interview");
    setSubtitleText(candidateName ? `Hello ${candidateName}! Preparing your first question…` : "Preparing your first question…");

    try {
      const { plan: p } = plan
        ? { plan }
        : await api.autoDiagnose(sessionId, {
            role: effectiveRole,
            company: effectiveCompany,
            seniority,
            voice: selectedVoice,
            focusArea,
            commsWanted,
          });

      setPlan(p);
      setModuleIndex(0);
      setLatestScore(null);
      setDraft("");
      setPreparingInterview(false);

      await loadModule(sessionId, 0, p.modules, candidateName, effectiveRole, effectiveCompany, selectedVoice, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start. Try again.");
      setPreparingInterview(false);
    }
  }

  /* ── Submit answer ───────────────────────────────────────────────── */

  async function submitAnswer(overrideText?: string) {
    const text = (overrideText ?? draft).trim() || voice.interimTranscript.trim();
    if (!sessionId || !view || view.status === "complete" || scoring || !text) return;

    voice.stopListening();
    stopSpeaking();
    setError("");
    setScoring(true);
    setSubtitleText("Analyzing your answer…");

    const activeChar =
      PIPER_VOICES.find((x) => x.id === selectedVoice)?.name ??
      KOKORO_VOICES.find((x) => x.id === selectedVoice)?.name ??
      getPersonaConfig(selectedVoice).name;

    try {
      const res = await api.answerDrill(sessionId, moduleIndex, text, {
        character: activeChar,
        voice: selectedVoice,
      });
      const turn: DrillTurn = {
        question: view.nextQuestion ?? "",
        answer: text,
        evaluation: res.evaluation,
        promptVersion: res.promptVersion,
      };
      setView((prev) => prev ? {
        ...prev,
        turns: [...prev.turns, turn],
        status: res.moduleComplete ? "complete" : "active",
        completeReason: res.completeReason,
        nextQuestion: res.nextQuestion,
      } : null);
      setDraft("");
      voice.resetTranscript();
      setLatestScore({ overall: res.evaluation.overall, fix: res.evaluation.next_fix });

      const isIntro = plan?.modules[moduleIndex]?.kind === "comms";
      let spokenText = res.spokenResponse?.trim() ?? "";

      if (!spokenText) {
        if (isIntro) {
          if (res.moduleComplete) {
            spokenText = "Great introduction, thank you! That gives me a clear sense of your background. Let's dive right into your technical questions.";
            setSubtitleText("Introduction complete — advancing to technical questions…");
          } else if (res.nextQuestion) {
            spokenText = `Thanks for sharing that background! To expand on that: ${res.nextQuestion}`;
            setSubtitleText(`"${res.nextQuestion}"`);
          } else {
            spokenText = "Thank you for walking me through your background!";
          }
        } else {
          // Technical questions: lively conversational acknowledgement (no scores read aloud)
          const score = res.evaluation.overall;
          let ack = "Good points.";
          if (score >= 82) {
            ack = "Excellent explanation, that's very well reasoned.";
          } else if (score >= 68) {
            ack = "Good points. That makes sense.";
          } else {
            ack = "Got it. Let's look closer at that.";
          }

          if (res.moduleComplete) {
            spokenText = `${ack} You've completed this section! ${res.completeReason || "Great progress."}`;
            setSubtitleText(`Section complete: ${res.completeReason || "Advancing to next topic"}`);
          } else if (res.nextQuestion) {
            spokenText = `${ack} Following up on that: ${res.nextQuestion}`;
            setSubtitleText(`"${res.nextQuestion}"`);
          } else {
            spokenText = ack;
          }
        }
      } else {
        if (res.moduleComplete) {
          setSubtitleText(`Section complete: ${res.completeReason || "Advancing to next topic"}`);
        } else if (res.nextQuestion) {
          setSubtitleText(`"${res.nextQuestion}"`);
        }
      }

      speak(spokenText, () => {
        if (res.moduleComplete && plan && moduleIndex < plan.modules.length - 1) {
          const nextIdx = moduleIndex + 1;
          setModuleIndex(nextIdx);
          setLatestScore(null);
          void loadModule(sessionId, nextIdx, plan.modules, candidateName, effectiveRole, effectiveCompany, selectedVoice, true);
        } else if (!res.moduleComplete && res.nextQuestion) {
          // Auto-start mic after feedback + next question finishes speaking
          startListeningRef.current();
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scoring failed.");
      setSubtitleText(view?.nextQuestion ? `"${view.nextQuestion}"` : "");
    } finally {
      setScoring(false);
    }
  }

  /* ── Reset ───────────────────────────────────────────────────────── */

  function handleNewConversation() {
    stopSpeaking();
    voice.stopListening();
    setAppState("idle");
    setView(null);
    setPlan(null);
    setDraft("");
    setLatestScore(null);
    setSubtitleText("");
    setError("");
  }

  /* ── Derived display ─────────────────────────────────────────────── */

  const currentModule = plan?.modules[moduleIndex];
  const turnsAsked = view?.turns.length ?? 0;

  const avatarState: "idle" | "speaking" | "thinking" =
    aiSpeaking ? "speaking" : scoring ? "thinking" : "idle";

  const pillPlaceholder = isInterviewing
    ? (voice.isListening ? "Listening…" : "Type your answer")
    : `Interview chatbot (${effectiveRole} @ ${effectiveCompany})`;

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className={`iv-minimal-viewport${isDark ? " dark" : ""}`}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="iv-minimal-header">
        <span
          className="iv-minimal-logo"
          role="button"
          tabIndex={0}
          onClick={handleNewConversation}
          onKeyDown={(e) => e.key === "Enter" && handleNewConversation()}
        >
          Intervibe
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isInterviewing ? (
            <>
              {currentModule && (
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: 9999,
                    background: isDark ? "#18181b" : "#f4f4f5",
                    border: `1px solid ${isDark ? "#27272a" : "#e5e7eb"}`,
                    color: isDark ? "#a1a1aa" : "#6b7280",
                  }}
                >
                  {currentModule.kind === "comms" ? "Introduction" : currentModule.title} · {turnsAsked}/{view?.budget ?? currentModule.estimatedQuestions}
                </span>
              )}

              {/* Meeting Details & Summary Button */}
              <Button
                label="Meeting Summary"
                variant="secondary"
                size="sm"
                onClick={() => setShowSummaryModal(true)}
                endContent={
                  view && view.turns.length > 0 ? (
                    <Badge
                      variant="success"
                      label={Math.round(
                        view.turns.reduce((acc, t) => acc + t.evaluation.overall, 0) /
                          view.turns.length,
                      )}
                    />
                  ) : undefined
                }
                icon={<span>📊</span>}
              />

              <Button
                label="New conversation"
                variant="ghost"
                size="sm"
                onClick={handleNewConversation}
              />
            </>
          ) : (
            <Link
              href="/login"
              className="iv-login-setup-btn"
              style={{ textDecoration: "none" }}
              title="Sign In or Configure"
            >
              login / set up
            </Link>
          )}
        </div>
      </header>

      {/* ── Center Stage ────────────────────────────────────────── */}
      <main className="iv-minimal-center">
        {isInterviewing && (
          /* Character pops in when the interview starts */
          <div className="iv-avatar-stage popping-in">
            {/* Ambient glow behind avatar in dark mode */}
            <div
              style={{
                position: "absolute",
                width: 320,
                height: 320,
                borderRadius: "50%",
                background: isDark
                  ? `radial-gradient(circle, rgba(59,130,246,${aiSpeaking ? 0.18 : 0.08}) 0%, transparent 70%)`
                  : "none",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -70%)",
                pointerEvents: "none",
                transition: "opacity 0.5s ease",
                zIndex: 0,
              }}
            />
            <div className={`iv-avatar-figure ${avatarState}`} style={{ position: "relative", zIndex: 1 }}>
              <div className="iv-avatar-head" />
              <div className="iv-avatar-torso" />
            </div>

            {/* Status & Subtitle text below avatar */}
            <div style={{ marginTop: 28, textAlign: "center", maxWidth: 580 }}>
              {/* Module label */}
              {currentModule && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: isDark ? "#71717a" : "#9ca3af",
                    marginBottom: 10,
                  }}
                >
                  {currentModule.kind === "comms" ? "Introduction" : currentModule.title}
                </div>
              )}

              {/* Current question or status */}
              <div
                className="iv-question-speech"
                style={{
                  color: isDark ? "#f4f4f5" : "#18181b",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: view?.nextQuestion && !scoring ? "pointer" : "default",
                }}
                onClick={() => {
                  if (view?.nextQuestion && !scoring) replayQuestion();
                }}
                title={view?.nextQuestion && !scoring ? "Click to replay question aloud" : undefined}
              >
                <span>
                  {scoring
                    ? <span style={{ color: isDark ? "#a1a1aa" : "#6b7280" }}>Analyzing your answer…</span>
                    : subtitleText || <span style={{ color: isDark ? "#71717a" : "#9ca3af" }}>Preparing your question…</span>
                  }
                </span>
                {view?.nextQuestion && !scoring && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      replayQuestion();
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "2px 4px",
                      cursor: "pointer",
                      color: aiSpeaking ? "#3b82f6" : (isDark ? "#71717a" : "#9ca3af"),
                      opacity: 0.75,
                      display: "inline-flex",
                      alignItems: "center",
                      transition: "opacity 0.15s ease",
                    }}
                    title="Replay question aloud"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error toast */}
        {error && (
          <div
            style={{
              position: "absolute",
              bottom: 120,
              maxWidth: 440,
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444",
              fontSize: "0.85rem",
              zIndex: 50,
            }}
          >
            {error}
          </div>
        )}
      </main>

      {/* ── Live Voice Recording Waveform Meter ── */}
      {isInterviewing && voice.isListening && (
        <div className="iv-live-voice-meter">
          <span className="iv-mic-dot-pulsing" />
          <span>Recording your voice… Click mic to finish & transcribe</span>
          <div className="iv-voice-bars">
            <span style={{ transform: `scaleY(${Math.max(0.2, voice.volume * 2.4)})` }} />
            <span style={{ transform: `scaleY(${Math.max(0.35, voice.volume * 3.2)})` }} />
            <span style={{ transform: `scaleY(${Math.max(0.2, voice.volume * 2.0)})` }} />
            <span style={{ transform: `scaleY(${Math.max(0.3, voice.volume * 2.8)})` }} />
          </div>
        </div>
      )}

      {/* ── Transcribing Indicator via Muse Voice Transcribe ── */}
      {isInterviewing && voice.isTranscribing && (
        <div className="iv-live-voice-meter" style={{ borderColor: "rgba(59, 130, 246, 0.4)" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", display: "inline-block", animation: "avatar-pulse 1s ease-in-out infinite alternate" }} />
          <span>Transcribing with Meta Muse Voice Transcribe…</span>
        </div>
      )}

      {/* ── Quick Introduction Suggestion Chip (first module if empty draft) ── */}
      {isInterviewing && !voice.isListening && !draft.trim() && moduleIndex === 0 && (
        <button
          type="button"
          className="iv-quick-suggestion-chip"
          onClick={() => {
            const intro = candidateName
              ? `Hi, I'm ${candidateName}. I'm a ${effectiveRole} with experience designing and deploying scalable services, and I'm very excited about the opportunity at ${effectiveCompany}.`
              : `Hi, I'm a ${effectiveRole} with a background in distributed systems and software engineering, excited to interview for ${effectiveCompany}.`;
            setDraft(intro);
            inputRef.current?.focus();
          }}
          title="Click to auto-populate a sample introduction from your profile"
        >
          <span>💡 Quick introduction from CV</span>
        </button>
      )}

      {/* ── Modern Astryx Chatbox with Collapsible Context Drawer ── */}
      <div
        className={`iv-chat-composer-wrap ${isInterviewing ? "docked-bottom" : "centered"}`}
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: 740,
          zIndex: 80,
          transition: "bottom 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease",
          bottom: isInterviewing ? "24px" : "calc(50% - 90px)",
        }}
      >
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSubmit={(val) => {
            if (!isInterviewing) {
              void handleStart();
            } else if (voice.isListening) {
              void voice.stopAndSend();
            } else {
              void submitAnswer(val);
            }
          }}
          onStop={() => {
            if (aiSpeaking) stopSpeaking();
            if (voice.isListening) voice.cancelListening();
          }}
          isStopShown={aiSpeaking || scoring}
          isDisabled={scoring || voice.isTranscribing || preparingInterview}
          placeholder={
            !isInterviewing
              ? (candidateName ? `Ready to start interview, ${candidateName}? Press Start...` : "Click Start to begin your FAANG mock interview...")
              : aiSpeaking
              ? "Interviewer speaking… (listen or click mic to interrupt)"
              : voice.isListening
              ? (voice.interimTranscript ? voice.interimTranscript : "Listening… speak your answer, click mic when done")
              : voice.isTranscribing
              ? "Transcribing with Meta Muse Voice Transcribe…"
              : "Type your answer or click mic to speak..."
          }
          density="balanced"
          elevation="low"
          drawer={
            <ChatComposerDrawer
              count={(resumeParsed ? 1 : 0) + (jdParsed ? 1 : 0) + 2}
              label="Interview Context"
              defaultIsCollapsed={false}
            >
              <HStack gap={1.5} wrap="wrap" vAlign="center" paddingBlock={1}>
                {resumeParsed ? (
                  <Token
                    label={candidateName ? `CV: ${candidateName}` : (resumeName || "CV attached")}
                    color="blue"
                    description="Resume loaded — click to change or remove"
                    onClick={() => resumeInputRef.current?.click()}
                    onRemove={(e) => {
                      e?.stopPropagation?.();
                      setResumeParsed(false);
                      setCandidateName("");
                      setResumeName("");
                    }}
                  />
                ) : (
                  <Token
                    label="+ Attach CV"
                    color="gray"
                    description="Upload your resume (PDF, DOCX, TXT)"
                    onClick={() => resumeInputRef.current?.click()}
                  />
                )}

                {jdParsed ? (
                  <Token
                    label={`JD: ${effectiveRole} @ ${effectiveCompany}`}
                    color="teal"
                    description="Job description added — click to edit or remove"
                    onClick={() => setShowJdModal(true)}
                    onRemove={(e) => {
                      e?.stopPropagation?.();
                      setJdParsed(false);
                      setJdText("");
                    }}
                  />
                ) : (
                  <Token
                    label="+ Add Job Description"
                    color="gray"
                    description="Paste job description to tailor interview questions"
                    onClick={() => setShowJdModal(true)}
                  />
                )}

                <Token
                  label={`${seniority} · ${effectiveRole}`}
                  color="purple"
                  description="Target seniority and role (click to configure in settings)"
                  onClick={() => setShowSettings(true)}
                />

                <Token
                  label={`Voice: ${voiceName}`}
                  color="green"
                  description="Active voice persona (click to configure in settings)"
                  onClick={() => setShowSettings(true)}
                />

                {isInterviewing && !voice.isListening && !draft.trim() && moduleIndex === 0 && (
                  <Token
                    label="💡 Quick intro from CV"
                    color="orange"
                    description="Click to populate a sample introduction from your profile"
                    onClick={() => {
                      const intro = candidateName
                        ? `Hi, I'm ${candidateName}. I'm a ${effectiveRole} with experience designing and deploying scalable services, and I'm very excited about the opportunity at ${effectiveCompany}.`
                        : `Hi, I'm a ${effectiveRole} with a background in distributed systems and software engineering, excited to interview for ${effectiveCompany}.`;
                      setDraft(intro);
                    }}
                  />
                )}
              </HStack>
            </ChatComposerDrawer>
          }
          headerActions={
            !isInterviewing ? (
              <HStack gap={1} vAlign="center">
                <Button
                  label={resumeParsed ? "CV Attached" : "Upload CV"}
                  variant="ghost"
                  size="sm"
                  onClick={() => resumeInputRef.current?.click()}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  }
                />
                <Button
                  label={jdParsed ? "JD Attached" : "Add JD"}
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowJdModal(true)}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  }
                />
              </HStack>
            ) : view?.nextQuestion && !scoring ? (
              <Button
                label="Replay Question"
                variant="ghost"
                size="sm"
                onClick={replayQuestion}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                }
              />
            ) : undefined
          }
          footerActions={
            isInterviewing && currentModule ? (
              <span style={{ fontSize: "0.76rem", color: isDark ? "#a1a1aa" : "#6b7280" }}>
                {currentModule.kind === "comms" ? "Introduction" : currentModule.title} · Turn {turnsAsked + 1} of {view?.budget ?? currentModule.estimatedQuestions}
              </span>
            ) : !isInterviewing ? (
              <span style={{ fontSize: "0.76rem", color: isDark ? "#a1a1aa" : "#6b7280" }}>
                {effectiveRole} @ {effectiveCompany} · {seniority}
              </span>
            ) : undefined
          }
          sendActions={
            <HStack gap={1} vAlign="center">
              {/* Live Audio Indicator while audio is captured */}
              {voice.isListening && (
                <HStack
                  gap={1}
                  vAlign="center"
                  paddingInline={1}
                  style={{
                    background: isDark ? "rgba(59, 130, 246, 0.16)" : "rgba(59, 130, 246, 0.1)",
                    border: "1px solid rgba(59, 130, 246, 0.4)",
                    borderRadius: 9999,
                    padding: "3px 8px",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#ef4444",
                      display: "inline-block",
                      boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)",
                      animation: "pulse 1s infinite",
                    }}
                  />
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#3b82f6" }}>
                    Recording
                  </span>
                  <HStack gap={0.5} vAlign="center" height={14}>
                    {[0.35, 0.9, 0.6, 1.0, 0.5, 0.8, 0.4].map((mult, i) => (
                      <span
                        key={i}
                        style={{
                          width: 3,
                          height: `${Math.max(4, voice.volume * 18 * mult)}px`,
                          background: "#3b82f6",
                          borderRadius: 2,
                          transition: "height 0.05s ease",
                        }}
                      />
                    ))}
                  </HStack>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      voice.cancelListening();
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: isDark ? "#a1a1aa" : "#6b7280",
                      padding: "0 2px",
                      fontSize: "0.82rem",
                    }}
                    title="Cancel recording (discard audio)"
                  >
                    ✕
                  </button>
                </HStack>
              )}

              {/* Transcribing indicator */}
              {voice.isTranscribing && (
                <HStack
                  gap={1}
                  vAlign="center"
                  paddingInline={1}
                  style={{
                    background: isDark ? "rgba(139, 92, 246, 0.16)" : "rgba(139, 92, 246, 0.1)",
                    border: "1px solid rgba(139, 92, 246, 0.4)",
                    borderRadius: 9999,
                    padding: "3px 8px",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#8b5cf6",
                      display: "inline-block",
                      animation: "pulse 1s infinite",
                    }}
                  />
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#8b5cf6" }}>
                    Transcribing…
                  </span>
                </HStack>
              )}

              {/* Mic button (Start / Stop / Send Audio) */}
              <IconButton
                label={voice.isListening ? "Stop & Send Audio" : "Voice Input"}
                variant={voice.isListening ? "destructive" : "ghost"}
                size="sm"
                tooltip={voice.isListening ? "Stop & Send Audio (Click to submit)" : "Start recording voice answer (Click to speak)"}
                isDisabled={scoring || voice.isTranscribing}
                isLoading={voice.isTranscribing}
                onClick={(e) => {
                  e.stopPropagation();
                  if (aiSpeaking) stopSpeaking();
                  if (voice.isListening) {
                    void voice.stopAndSend();
                  } else {
                    voice.startListening();
                  }
                }}
                icon={
                  voice.isListening ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  )
                }
              />
            </HStack>
          }
          sendButton={
            !isInterviewing ? (
              <Button
                label={preparingInterview ? "Preparing…" : "Start"}
                variant="primary"
                size="md"
                isLoading={preparingInterview}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleStart();
                }}
              />
            ) : undefined
          }
          status={
            error
              ? { type: "error", message: error }
              : scoring
              ? { type: "warning", message: "Analyzing response…" }
              : undefined
          }
        />
      </div>

      {/* ── Bottom-Left: Minimalist Gear Icon (strictly matching Main page@2x.png) ── */}
      <button
        type="button"
        className="iv-floating-gear-btn"
        onClick={() => setShowSettings(true)}
        title="Interview Settings & Setup"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {/* ── Theme Toggle (subtle, next to gear) ───────────────── */}
      <button
        type="button"
        className="iv-sun-toggle-btn"
        onClick={() => {
          setIsDark((d) => {
            const next = !d;
            try { localStorage.setItem("iv_theme", next ? "dark" : "light"); } catch {}
            return next;
          });
        }}
        title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
      >
        {isDark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* Hidden file input for Resume */}
      <input
        ref={resumeInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleResumeUpload(f);
          e.target.value = "";
        }}
      />

      {/* ── Add JD Modal ─────────────────────────────────────── */}
      {showJdModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 150,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowJdModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 540,
              background: isDark ? "#18181b" : "#ffffff",
              borderRadius: 20,
              border: `1px solid ${isDark ? "#27272a" : "#e5e7eb"}`,
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
              padding: "24px 28px",
              boxSizing: "border-box",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: isDark ? "#f4f4f5" : "#09090b" }}>
                Add Job Description
              </h3>
              <button
                type="button"
                onClick={() => setShowJdModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: isDark ? "#71717a" : "#9ca3af",
                  fontSize: "1.2rem",
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: isDark ? "#a1a1aa" : "#6b7280", lineHeight: 1.5 }}>
              Paste the job description or key responsibilities (optional). The AI will tailor the interview topics and depth to this role.
            </p>

            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={6}
              placeholder="Paste job description requirements, responsibilities, or tech stack here..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${isDark ? "#27272a" : "#d1d5db"}`,
                background: isDark ? "#09090b" : "#f9fafb",
                color: isDark ? "#f4f4f5" : "#09090b",
                fontSize: "0.88rem",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 16,
              }}
            />

            {uploadMsg && (
              <div style={{ fontSize: "0.82rem", color: uploadMsg.startsWith("✓") ? "#10b981" : "#ef4444", marginBottom: 12 }}>
                {uploadMsg}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                {jdParsed && (
                  <button
                    type="button"
                    onClick={() => {
                      setJdText("");
                      setJdParsed(false);
                      setUploadMsg("");
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      fontSize: "0.84rem",
                      cursor: "pointer",
                      padding: "6px 0",
                    }}
                  >
                    Clear JD
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowJdModal(false)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 9999,
                    background: "transparent",
                    border: `1px solid ${isDark ? "#3f3f46" : "#e5e7eb"}`,
                    color: isDark ? "#d4d4d8" : "#374151",
                    fontSize: "0.88rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={jdParsingText || !jdText.trim()}
                  onClick={async () => {
                    await handleJdParse();
                    setShowJdModal(false);
                  }}
                  style={{
                    padding: "8px 22px",
                    borderRadius: 9999,
                    background: isDark ? "#ffffff" : "#09090b",
                    color: isDark ? "#09090b" : "#ffffff",
                    border: "none",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    cursor: jdParsingText || !jdText.trim() ? "not-allowed" : "pointer",
                    opacity: jdParsingText || !jdText.trim() ? 0.6 : 1,
                  }}
                >
                  {jdParsingText ? "Parsing…" : "Save JD"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Full-Screen Popup ────────────────────────── */}
      {showSettings && (
        <SettingsPanel
          isDark={isDark}
          /* Session */
          sessionId={sessionId}
          /* Resume/JD state */
          resumeUploading={resumeUploading}
          resumeParsed={resumeParsed}
          resumeName={resumeName}
          jdText={jdText}
          setJdText={setJdText}
          jdParsed={jdParsed}
          jdParsingText={jdParsingText}
          uploadMsg={uploadMsg}
          setUploadMsg={setUploadMsg}
          onResumeUpload={handleResumeUpload}
          onJdParse={handleJdParse}
          resumeInputRef={resumeInputRef}
          /* Config */
          seniority={seniority} setSeniority={setSeniority}
          focusArea={focusArea} setFocusArea={setFocusArea}
          selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice}
          voiceEngine={voiceEngine} setVoiceEngine={setVoiceEngineState}
          commsWanted={commsWanted} setCommsWanted={setCommsWanted}
          strictness={strictness} setStrictness={setStrictness}
          voiceMuted={voiceMuted} setVoiceMuted={setVoiceMuted}
          /* Close */
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── Meeting Details & Scorecard Summary Modal ─────────── */}
      {showSummaryModal && (
        <MeetingSummaryModal
          isDark={isDark}
          sessionId={sessionId}
          role={effectiveRole}
          company={effectiveCompany}
          candidateName={candidateName}
          voiceName={voiceName}
          voiceEngine={voiceEngine}
          turns={view?.turns ?? []}
          currentModuleTitle={currentModule?.title ?? "Interview"}
          onClose={() => setShowSummaryModal(false)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Settings Panel — full-screen slide-up overlay
   ══════════════════════════════════════════════════════════════════════════ */

interface SettingsPanelProps {
  isDark: boolean;
  sessionId: string;
  resumeUploading: boolean;
  resumeParsed: boolean;
  resumeName: string;
  jdText: string;
  setJdText: (v: string) => void;
  jdParsed: boolean;
  jdParsingText: boolean;
  uploadMsg: string;
  setUploadMsg: (v: string) => void;
  onResumeUpload: (f: File) => void;
  onJdParse: () => void;
  resumeInputRef: React.RefObject<HTMLInputElement | null>;
  seniority: string; setSeniority: (v: string) => void;
  focusArea: string; setFocusArea: (v: string) => void;
  selectedVoice: string; setSelectedVoice: (v: string) => void;
  voiceEngine: VoiceEngine; setVoiceEngine: (v: VoiceEngine) => void;
  commsWanted: boolean; setCommsWanted: (v: boolean) => void;
  strictness: "standard" | "faang_strict"; setStrictness: (v: "standard" | "faang_strict") => void;
  voiceMuted: boolean; setVoiceMuted: (v: boolean) => void;
  onClose: () => void;
}

function SettingsPanel(p: SettingsPanelProps) {
  const { isDark } = p;
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);

  const handleTestVoice = (voiceId: string, name: string) => {
    setTestingVoiceId(voiceId);
    stopSpeaking();
    speakText(`Hello! I'm ${name}. I'll be your interviewer today.`, {
      voice: voiceId,
      onEnd: () => setTestingVoiceId(null),
      onError: () => setTestingVoiceId(null),
    });
  };

  const bg = isDark ? "#09090b" : "#ffffff";
  const border = isDark ? "#27272a" : "#e5e7eb";
  const textMain = isDark ? "#f4f4f5" : "#111827";
  const textMuted = isDark ? "#71717a" : "#9ca3af";
  const surfaceSubtle = isDark ? "#18181b" : "#f9fafb";
  const surfaceCard = isDark ? "#18181b" : "#f4f4f5";

  function chipStyle(active: boolean): React.CSSProperties {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "7px 13px",
      borderRadius: 8,
      fontSize: "0.84rem",
      fontWeight: active ? 600 : 400,
      cursor: "pointer",
      border: `1px solid ${active ? "#3b82f6" : border}`,
      background: active ? "rgba(59,130,246,0.12)" : "transparent",
      color: active ? "#60a5fa" : textMain,
      transition: "all 0.12s ease",
    };
  }

  function sectionHeader(title: string) {
    return (
      <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: textMuted, marginBottom: 10, marginTop: 24 }}>
        {title}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        background: bg,
        overflowY: "auto",
        animation: "fadeIn 0.22s ease",
      }}
    >
      {/* Settings header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 32px",
          borderBottom: `1px solid ${border}`,
          position: "sticky",
          top: 0,
          background: bg,
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span style={{ fontSize: "1.05rem", fontWeight: 700, color: textMain }}>
            Interview Settings
          </span>
        </div>
        <button
          type="button"
          onClick={p.onClose}
          style={{
            background: surfaceCard,
            border: `1px solid ${border}`,
            borderRadius: 8,
            padding: "7px 16px",
            fontSize: "0.88rem",
            fontWeight: 600,
            cursor: "pointer",
            color: textMain,
          }}
        >
          Save & Close
        </button>
      </div>

      {/* Settings content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "8px 32px 60px", width: "100%", boxSizing: "border-box" }}>

        {/* ── Documents Section ────────────────────────────────── */}
        {sectionHeader("Documents")}

        {/* Resume Upload */}
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: `1px solid ${p.resumeParsed ? "rgba(16,185,129,0.4)" : border}`,
            background: p.resumeParsed ? "rgba(16,185,129,0.06)" : surfaceSubtle,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.92rem", color: textMain }}>
                Resume / CV {p.resumeParsed && <span style={{ color: "#10b981" }}>✓</span>}
              </div>
              <div style={{ fontSize: "0.78rem", color: textMuted, marginTop: 2 }}>
                {p.resumeParsed ? `Parsed: ${p.resumeName}` : "PDF, DOCX, or TXT (max 10 MB)"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => p.resumeInputRef.current?.click()}
              disabled={p.resumeUploading}
              style={{
                padding: "8px 16px",
                borderRadius: 9999,
                background: p.resumeParsed ? "transparent" : (isDark ? "#ffffff" : "#09090b"),
                color: p.resumeParsed ? textMuted : (isDark ? "#09090b" : "#ffffff"),
                border: `1px solid ${p.resumeParsed ? border : "transparent"}`,
                fontWeight: 600,
                fontSize: "0.84rem",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {p.resumeUploading ? "Uploading…" : p.resumeParsed ? "Replace" : "Upload CV"}
            </button>
            <input
              ref={p.resumeInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) p.onResumeUpload(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* JD Paste */}
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: `1px solid ${p.jdParsed ? "rgba(16,185,129,0.4)" : border}`,
            background: p.jdParsed ? "rgba(16,185,129,0.06)" : surfaceSubtle,
            marginBottom: 6,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: "0.92rem", color: textMain, marginBottom: 4 }}>
            Job Description <span style={{ fontWeight: 400, color: textMuted }}>(optional)</span>{" "}
            {p.jdParsed && <span style={{ color: "#10b981" }}>✓</span>}
          </div>
          <div style={{ fontSize: "0.78rem", color: textMuted, marginBottom: 8 }}>
            Paste the JD to get role-specific questions. If skipped, standard competencies are synthesized.
          </div>
          <textarea
            value={p.jdText}
            onChange={(e) => p.setJdText(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              background: isDark ? "#09090b" : "#ffffff",
              border: `1px solid ${border}`,
              borderRadius: 8,
              color: textMain,
              fontSize: "0.85rem",
              padding: "10px 12px",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
            placeholder="Paste job description text here…"
          />
          <button
            type="button"
            disabled={p.jdParsingText || !p.jdText.trim()}
            onClick={p.onJdParse}
            style={{
              marginTop: 8,
              padding: "7px 16px",
              borderRadius: 9999,
              background: "transparent",
              border: `1px solid ${border}`,
              color: textMain,
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            {p.jdParsingText ? "Parsing…" : "Parse JD"}
          </button>
        </div>

        {p.uploadMsg && (
          <div style={{ fontSize: "0.82rem", color: p.uploadMsg.startsWith("✓") ? "#10b981" : "#ef4444", marginBottom: 12 }}>
            {p.uploadMsg}
          </div>
        )}

        {/* ── Voice Engine & Model Selection ──────────────────── */}
        {sectionHeader("Speech Engine & Model")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            style={chipStyle(p.voiceEngine === "piper")}
            onClick={() => {
              p.setVoiceEngine("piper");
              setSavedVoiceEngine("piper");
              p.setSelectedVoice(normalizeVoiceForEngine(p.selectedVoice, "piper"));
            }}
          >
            {p.voiceEngine === "piper" && "✓ "}✨ Piper Neural (Ultra-fast & Natural — Recommended)
          </button>
          <button
            type="button"
            style={chipStyle(p.voiceEngine === "groq-orpheus")}
            onClick={() => {
              p.setVoiceEngine("groq-orpheus");
              setSavedVoiceEngine("groq-orpheus");
              p.setSelectedVoice(getSavedOrpheusVoice());
            }}
          >
            {p.voiceEngine === "groq-orpheus" && "✓ "}⚡ Groq Orpheus V1 (Canopy Labs LPU)
          </button>
          <button
            type="button"
            style={chipStyle(p.voiceEngine === "kokoro")}
            onClick={() => {
              p.setVoiceEngine("kokoro");
              setSavedVoiceEngine("kokoro");
              p.setSelectedVoice(normalizeVoiceForEngine(p.selectedVoice, "kokoro"));
            }}
          >
            {p.voiceEngine === "kokoro" && "✓ "}🧠 Kokoro Neural (82M ONNX)
          </button>
          <button
            type="button"
            style={chipStyle(p.voiceEngine === "instant")}
            onClick={() => {
              p.setVoiceEngine("instant");
              setSavedVoiceEngine("instant");
              p.setSelectedVoice(normalizeVoiceForEngine(p.selectedVoice, "instant"));
            }}
          >
            {p.voiceEngine === "instant" && "✓ "}⚡ Instant Natural (&lt;0.1s response)
          </button>
        </div>

        {/* ── Voice Selection Grid ──────────────────────────────── */}
        {p.voiceEngine === "piper" && (
          <>
            {sectionHeader("Interviewer Voice (Piper Neural · On-device VITS)")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {PIPER_VOICES.map((v) => {
                const selected = p.selectedVoice === v.id;
                const isPlaying = testingVoiceId === v.id;
                return (
                  <div
                    key={`piper-${v.id}-${v.name}`}
                    onClick={() => {
                      p.setSelectedVoice(v.id);
                      setSavedPiperVoice(v.id);
                      handleTestVoice(v.id, v.name);
                    }}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1px solid ${selected ? "#3b82f6" : border}`,
                      background: selected ? "rgba(59,130,246,0.10)" : surfaceSubtle,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: textMain }}>
                        {v.gender === "Female" ? "👩 " : "👨 "}{v.name}
                      </span>
                      {selected && <span style={{ color: "#60a5fa", fontSize: "0.72rem", fontWeight: 700 }}>✓ Selected</span>}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: textMuted }}>{v.accent} · {v.gender}</span>
                    <span style={{ fontSize: "0.78rem", color: textMuted, flex: 1 }}>{v.desc}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        p.setSelectedVoice(v.id);
                        setSavedPiperVoice(v.id);
                        handleTestVoice(v.id, v.name);
                      }}
                      style={{
                        marginTop: 6,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: `1px solid ${selected ? "#3b82f6" : border}`,
                        background: isPlaying ? "#3b82f6" : selected ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
                        color: isPlaying ? "#ffffff" : textMain,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        alignSelf: "flex-start",
                      }}
                    >
                      {isPlaying ? "🔊 Playing…" : "▶ Test Voice"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {p.voiceEngine === "kokoro" && (
          <>
            {sectionHeader("Interviewer Voice (Kokoro Neural · On-device)")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {KOKORO_VOICES.map((v) => {
                const selected = p.selectedVoice === v.id;
                const isPlaying = testingVoiceId === v.id;
                return (
                  <div
                    key={`kokoro-${v.id}-${v.name}`}
                    onClick={() => {
                      p.setSelectedVoice(v.id);
                      setSavedVoice(v.id);
                      handleTestVoice(v.id, v.name);
                    }}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1px solid ${selected ? "#3b82f6" : border}`,
                      background: selected ? "rgba(59,130,246,0.10)" : surfaceSubtle,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: textMain }}>
                        {v.gender === "Female" ? "👩 " : "👨 "}{v.name}
                      </span>
                      {selected && <span style={{ color: "#60a5fa", fontSize: "0.72rem", fontWeight: 700 }}>✓ Selected</span>}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: textMuted }}>{v.accent} · {v.gender}</span>
                    <span style={{ fontSize: "0.78rem", color: textMuted, flex: 1 }}>{v.desc}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        p.setSelectedVoice(v.id);
                        setSavedVoice(v.id);
                        handleTestVoice(v.id, v.name);
                      }}
                      style={{
                        marginTop: 6,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: `1px solid ${selected ? "#3b82f6" : border}`,
                        background: isPlaying ? "#3b82f6" : selected ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
                        color: isPlaying ? "#ffffff" : textMain,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        alignSelf: "flex-start",
                      }}
                    >
                      {isPlaying ? "🔊 Playing…" : "▶ Test Voice"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {p.voiceEngine === "instant" && (
          <>
            {sectionHeader("Interviewer Voice (Instant Neural · Browser Subsystem)")}
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                background: surfaceSubtle,
                border: `1px solid ${border}`,
                fontSize: "0.85rem",
                color: textMuted,
                lineHeight: 1.5,
                marginBottom: 12,
              }}
            >
              ⚡ <strong>Instant Speech Mode:</strong> Uses your browser's neural voice engine (e.g. Edge Natural / Google Cloud) matched to each interviewer's gender, British/American accent, and vocal pitch with zero download delay.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {PIPER_VOICES.map((v) => {
                const selected = p.selectedVoice === v.id || getPersonaConfig(p.selectedVoice).name === v.name;
                const isPlaying = testingVoiceId === v.id;
                return (
                  <div
                    key={`instant-${v.id}-${v.name}`}
                    onClick={() => {
                      p.setSelectedVoice(v.id);
                      setSavedPiperVoice(v.id);
                      handleTestVoice(v.id, v.name);
                    }}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1px solid ${selected ? "#3b82f6" : border}`,
                      background: selected ? "rgba(59,130,246,0.10)" : surfaceSubtle,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: textMain }}>
                        {v.gender === "Female" ? "👩 " : "👨 "}{v.name}
                      </span>
                      {selected && <span style={{ color: "#60a5fa", fontSize: "0.72rem", fontWeight: 700 }}>✓ Selected</span>}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: textMuted }}>{v.accent} · {v.gender}</span>
                    <span style={{ fontSize: "0.78rem", color: textMuted, flex: 1 }}>{v.desc}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        p.setSelectedVoice(v.id);
                        setSavedPiperVoice(v.id);
                        handleTestVoice(v.id, v.name);
                      }}
                      style={{
                        marginTop: 6,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: `1px solid ${selected ? "#3b82f6" : border}`,
                        background: isPlaying ? "#3b82f6" : selected ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
                        color: isPlaying ? "#ffffff" : textMain,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        alignSelf: "flex-start",
                      }}
                    >
                      {isPlaying ? "🔊 Playing…" : "▶ Test Voice"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {p.voiceEngine === "groq-orpheus" && (
          <>
            {sectionHeader("Interviewer Voice (Groq Orpheus V1 · Canopy Labs)")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
              {ORPHEUS_VOICES.map((v) => {
                const selected = p.selectedVoice === v.id;
                const isPlaying = testingVoiceId === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      p.setSelectedVoice(v.id);
                      setSavedOrpheusVoice(v.id);
                    }}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1.5px solid ${selected ? "#3b82f6" : border}`,
                      background: selected ? "rgba(59, 130, 246, 0.12)" : surfaceSubtle,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: textMain }}>
                        {v.gender === "female" ? "👩 " : "👨 "}{v.name}
                      </span>
                      {selected && <span style={{ color: "#60a5fa", fontSize: "0.72rem", fontWeight: 700 }}>✓ Selected</span>}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: textMuted }}>{v.gender === "female" ? "Female" : "Male"} · English</span>
                    <span style={{ fontSize: "0.78rem", color: textMuted, flex: 1 }}>{v.description}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        p.setSelectedVoice(v.id);
                        setSavedOrpheusVoice(v.id);
                        handleTestVoice(v.id, v.name);
                      }}
                      style={{
                        marginTop: 6,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: `1px solid ${selected ? "#3b82f6" : border}`,
                        background: isPlaying ? "#3b82f6" : selected ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
                        color: isPlaying ? "#ffffff" : textMain,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        alignSelf: "flex-start",
                      }}
                    >
                      {isPlaying ? "🔊 Playing…" : "▶ Test Voice"}
                    </button>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: "0.8rem", color: textMuted, marginTop: 10, lineHeight: 1.5 }}>
              ⚡ <strong>Model:</strong> <code>canopylabs/orpheus-v1-english</code> hosted on Groq&apos;s LPU inference engine. Supports dynamic vocal directions (e.g. <code>[cheerful]</code>, <code>[thoughtful]</code>). Place your <code>GROQ_API_KEY</code> in <code>.env</code>.
            </p>
          </>
        )}

        {/* ── Speech Recognition (STT Model Details) ─────────────── */}
        {sectionHeader("Speech Recognition (STT)")}
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 12,
            border: `1px solid ${border}`,
            background: surfaceSubtle,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: "1.1rem" }}>🎙️</span>
            <span style={{ fontWeight: 600, fontSize: "0.9rem", color: textMain }}>
              Meta Muse Voice Transcribe
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                background: "rgba(59,130,246,0.12)",
                color: "#3b82f6",
                padding: "2px 8px",
                borderRadius: 9999,
                fontWeight: 700,
              }}
            >
              muse-voice-transcribe-1.0
            </span>
          </div>
          <div style={{ fontSize: "0.78rem", color: textMuted, lineHeight: 1.5 }}>
            Candidate voice answers are encoded client-side into standard 16 kHz mono 16-bit PCM WAV and transcribed via Meta's native VAD endpointing ASR API.
          </div>
        </div>

        {/* ── Seniority ─────────────────────────────────────────── */}
        {sectionHeader("Seniority Level")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SENIORITY_LEVELS.map((s) => (
            <button key={s.id} type="button" style={chipStyle(p.seniority === s.id)} onClick={() => p.setSeniority(s.id)}>
              {p.seniority === s.id && "✓ "}{s.label}
            </button>
          ))}
        </div>

        {/* ── Focus Area ────────────────────────────────────────── */}
        {sectionHeader("Technical Focus")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {FOCUS_AREAS.map((fa) => (
            <button key={fa} type="button" style={chipStyle(p.focusArea === fa)} onClick={() => p.setFocusArea(fa)}>
              {p.focusArea === fa && "✓ "}{fa}
            </button>
          ))}
        </div>

        {/* ── Interview Options (Fixed & Balanced) ─────────────── */}
        {sectionHeader("Interview Options")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
          {/* Introduction toggle */}
          <div style={{ padding: "16px 18px", borderRadius: 12, border: `1px solid ${border}`, background: surfaceSubtle, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "1.1rem" }}>🗣️</span>
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: textMain }}>
                  Introduction Turn
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: textMuted, marginBottom: 14, lineHeight: 1.45 }}>
                {p.commsWanted
                  ? "Begins with a 60–90s self-introduction and role motivations."
                  : "Skips intro and jumps straight to technical questions."}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => p.setCommsWanted(true)}
                style={chipStyle(p.commsWanted)}
              >
                {p.commsWanted && "✓ "}Enabled
              </button>
              <button
                type="button"
                onClick={() => p.setCommsWanted(false)}
                style={chipStyle(!p.commsWanted)}
              >
                {!p.commsWanted && "✓ "}Off
              </button>
            </div>
          </div>

          {/* Strictness toggle */}
          <div style={{ padding: "16px 18px", borderRadius: 12, border: `1px solid ${border}`, background: surfaceSubtle, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "1.1rem" }}>🎯</span>
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: textMain }}>
                  Evaluation Bar
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: textMuted, marginBottom: 14, lineHeight: 1.45 }}>
                {p.strictness === "faang_strict"
                  ? "FAANG bar: rigorous probe on edge cases, scale & trade-offs."
                  : "Standard: encouraging conversational technical screening."}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => p.setStrictness("standard")}
                style={chipStyle(p.strictness === "standard")}
              >
                {p.strictness === "standard" && "✓ "}Standard
              </button>
              <button
                type="button"
                onClick={() => p.setStrictness("faang_strict")}
                style={chipStyle(p.strictness === "faang_strict")}
              >
                {p.strictness === "faang_strict" && "✓ "}FAANG
              </button>
            </div>
          </div>

          {/* Audio / Voice toggle */}
          <div style={{ padding: "16px 18px", borderRadius: 12, border: `1px solid ${border}`, background: surfaceSubtle, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "1.1rem" }}>🔊</span>
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: textMain }}>
                  Interviewer Audio
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: textMuted, marginBottom: 14, lineHeight: 1.45 }}>
                {p.voiceMuted
                  ? "Audio muted: questions and feedback are rendered in text."
                  : "Spoken audio active: interviewer speaks questions via Piper or Kokoro Neural TTS."}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => p.setVoiceMuted(false)}
                style={chipStyle(!p.voiceMuted)}
              >
                {!p.voiceMuted && "✓ "}Voice On
              </button>
              <button
                type="button"
                onClick={() => p.setVoiceMuted(true)}
                style={chipStyle(p.voiceMuted)}
              >
                {p.voiceMuted && "✓ "}Muted
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Meeting Summary & Scorecard Modal
   ══════════════════════════════════════════════════════════════════════════ */

interface MeetingSummaryModalProps {
  isDark: boolean;
  sessionId: string;
  role: string;
  company: string;
  candidateName: string;
  voiceName: string;
  voiceEngine: VoiceEngine;
  turns: DrillTurn[];
  currentModuleTitle: string;
  onClose: () => void;
}

function MeetingSummaryModal(p: MeetingSummaryModalProps) {
  const { isDark, turns } = p;
  const bg = isDark ? "#09090b" : "#ffffff";
  const border = isDark ? "#27272a" : "#e5e7eb";
  const textMain = isDark ? "#f4f4f5" : "#111827";
  const textMuted = isDark ? "#71717a" : "#9ca3af";
  const surfaceSubtle = isDark ? "#18181b" : "#f9fafb";
  const surfaceCard = isDark ? "#27272a" : "#f3f4f6";

  const totalTurns = turns.length;
  const avgOverall =
    totalTurns > 0
      ? Math.round(turns.reduce((acc, t) => acc + t.evaluation.overall, 0) / totalTurns)
      : null;

  const avgCorrectness =
    totalTurns > 0
      ? Math.round(
          turns.reduce(
            (acc, t) =>
              acc +
              (t.evaluation.dimensions.find((d) => d.dimension === "correctness_depth")?.score ?? 0),
            0,
          ) / totalTurns,
        )
      : null;

  const avgStructure =
    totalTurns > 0
      ? Math.round(
          turns.reduce(
            (acc, t) =>
              acc +
              (t.evaluation.dimensions.find((d) => d.dimension === "structure")?.score ?? 0),
            0,
          ) / totalTurns,
        )
      : null;

  const avgComms =
    totalTurns > 0
      ? Math.round(
          turns.reduce(
            (acc, t) =>
              acc +
              (t.evaluation.dimensions.find((d) => d.dimension === "communication_clarity")?.score ?? 0),
            0,
          ) / totalTurns,
        )
      : null;

  const avgJd =
    totalTurns > 0
      ? Math.round(
          turns.reduce(
            (acc, t) =>
              acc +
              (t.evaluation.dimensions.find((d) => d.dimension === "jd_relevance")?.score ?? 0),
            0,
          ) / totalTurns,
        )
      : null;

  const avgEvidence =
    totalTurns > 0
      ? Math.round(
          turns.reduce(
            (acc, t) =>
              acc +
              (t.evaluation.dimensions.find((d) => d.dimension === "evidence_examples")?.score ?? 0),
            0,
          ) / totalTurns,
        )
      : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={p.onClose}
    >
      <div
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 18,
          width: "100%",
          maxWidth: 680,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: textMain }}>
              📊 Meeting Details &amp; Scorecard
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: textMuted }}>
              Detailed performance metrics, scores, and transcript history
            </p>
          </div>
          <button
            type="button"
            onClick={p.onClose}
            style={{
              background: "none",
              border: `1px solid ${border}`,
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              color: textMuted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Meeting Details Pill Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
              padding: 14,
              borderRadius: 12,
              background: surfaceSubtle,
              border: `1px solid ${border}`,
            }}
          >
            <div>
              <div style={{ fontSize: "0.72rem", color: textMuted, textTransform: "uppercase", fontWeight: 600 }}>Role &amp; Company</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: textMain, marginTop: 2 }}>{p.role} @ {p.company}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: textMuted, textTransform: "uppercase", fontWeight: 600 }}>Candidate</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: textMain, marginTop: 2 }}>{p.candidateName || "Candidate"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: textMuted, textTransform: "uppercase", fontWeight: 600 }}>Interviewer Voice</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: textMain, marginTop: 2 }}>{p.voiceName} ({p.voiceEngine})</div>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: textMuted, textTransform: "uppercase", fontWeight: 600 }}>Answers Scored</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: textMain, marginTop: 2 }}>{totalTurns} turn{totalTurns === 1 ? "" : "s"}</div>
            </div>
          </div>

          {/* Overall Score Card */}
          {avgOverall !== null ? (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: 14,
                background: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)",
                border: "1px solid rgba(16,185,129,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase" }}>Overall Interview Score</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#10b981", lineHeight: 1.1, marginTop: 4 }}>
                  {avgOverall}<span style={{ fontSize: "1rem", color: textMuted, fontWeight: 500 }}>/100</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: textMuted, marginTop: 4 }}>
                  {avgOverall >= 80 ? "🌟 Ready to pass — strong domain competence" : avgOverall >= 65 ? "📈 Good baseline — a few trade-off gaps to refine" : "⚠️ Needs preparation on technical edge cases"}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 200, fontSize: "0.78rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: textMuted }}>Correctness / Depth:</span>
                  <span style={{ fontWeight: 600, color: textMain }}>{avgCorrectness}/100</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: textMuted }}>Structure &amp; Flow:</span>
                  <span style={{ fontWeight: 600, color: textMain }}>{avgStructure}/100</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: textMuted }}>Communication Clarity:</span>
                  <span style={{ fontWeight: 600, color: textMain }}>{avgComms}/100</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: textMuted }}>JD Alignment:</span>
                  <span style={{ fontWeight: 600, color: textMain }}>{avgJd}/100</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: textMuted }}>Evidence &amp; Metrics:</span>
                  <span style={{ fontWeight: 600, color: textMain }}>{avgEvidence}/100</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "24px 20px", textAlign: "center", borderRadius: 12, background: surfaceSubtle, border: `1px solid ${border}`, color: textMuted, fontSize: "0.88rem" }}>
              No answers scored yet. Speak and submit your first answer to view live rubric scores.
            </div>
          )}

          {/* Turn History Section */}
          {turns.length > 0 && (
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: textMuted, marginBottom: 12 }}>
                Question &amp; Answer Breakdown
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {turns.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: surfaceSubtle,
                      border: `1px solid ${border}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: textMain }}>
                        Q{idx + 1}: {t.question}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 9999,
                          background: t.evaluation.overall >= 75 ? "rgba(16,185,129,0.12)" : "rgba(234,179,8,0.12)",
                          color: t.evaluation.overall >= 75 ? "#10b981" : "#eab308",
                          flexShrink: 0,
                        }}
                      >
                        {t.evaluation.overall}/100
                      </span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: textMuted, fontStyle: "italic", background: surfaceCard, padding: "8px 10px", borderRadius: 8 }}>
                      &ldquo;{t.answer}&rdquo;
                    </div>
                    {t.evaluation.next_fix && (
                      <div style={{ fontSize: "0.78rem", color: isDark ? "#a1a1aa" : "#4b5563" }}>
                        💡 <strong>Actionable fix:</strong> {t.evaluation.next_fix}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${border}`,
            background: surfaceSubtle,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={p.onClose}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              background: "#3b82f6",
              color: "#ffffff",
              border: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Close &amp; Resume Interview
          </button>
        </div>
      </div>
    </div>
  );
}
