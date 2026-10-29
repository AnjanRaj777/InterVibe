"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, FileInput, Text, TextArea } from "@astryxdesign/core";
import { api, classifyFile, type SessionSummary } from "@/lib/api";
import { useVoiceInput, speakText, stopSpeaking } from "@/lib/voice";
import { KOKORO_VOICES, getSavedVoice, setSavedVoice, type KokoroVoiceOption } from "@/lib/kokoro";

type Phase = "loading" | "ready" | "uploading" | "parsing" | "automating" | "error";

interface CandidateData {
  name?: string;
  skills?: string[];
  experience?: Array<{ role?: string; company?: string; highlights?: string[] }>;
  metrics?: string[];
}

interface JDData {
  title?: string;
  company?: string;
  seniority?: string;
  must_haves?: string[];
  nice_to_haves?: string[];
  responsibilities?: string[];
}

interface DocState {
  id: string;
  parsed: boolean;
  profile: Record<string, unknown> | null;
  draft: string;
  saving: boolean;
  message: string;
}

const emptyDoc = (id = "", parsed = false): DocState => ({
  id,
  parsed,
  profile: null,
  draft: "",
  saving: false,
  message: "",
});

const PRESET_ROLES = [
  "Software Engineer",
  "Machine Learning Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full-Stack Engineer",
  "Data Scientist",
  "DevOps / SRE",
  "Product Manager",
];

const PRESET_COMPANIES = [
  "Meta",
  "Google",
  "Amazon",
  "Apple",
  "Netflix",
  "Microsoft",
  "OpenAI",
  "Stripe",
  "Uber",
];

const SENIORITY_LEVELS = [
  { id: "Junior", label: "Junior / Entry (L3)" },
  { id: "Mid-Level", label: "Mid-Level (L4)" },
  { id: "Senior", label: "Senior (L5)" },
  { id: "Staff / Lead", label: "Staff / Lead (L6+)" },
];

const FOCUS_AREAS = [
  "System Design & Distributed Architecture",
  "Core Algorithms & Data Structures",
  "LLMs, Prompt Engineering & RAG",
  "Frontend Architecture & Web Vitals",
  "API Resilience & Database Modeling",
  "Observability, Cloud & Kubernetes",
  "Behavioral & Cross-Functional Leadership",
];

export default function SetupPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionSummary["session"] | null>(null);
  const [resume, setResume] = useState<DocState>(emptyDoc());
  const [jd, setJd] = useState<DocState>(emptyDoc());
  const [jdText, setJdText] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [showRawEditor, setShowRawEditor] = useState(false);

  // Role & Company Mimic Selections
  const [role, setRole] = useState("Software Engineer");
  const [customRole, setCustomRole] = useState("");
  const [company, setCompany] = useState("Meta");
  const [customCompany, setCustomCompany] = useState("");
  const [seniority, setSeniority] = useState("Senior");
  const [focusArea, setFocusArea] = useState("System Design & Distributed Architecture");

  // Interview Persona & Kokoro Voice
  const [selectedVoice, setSelectedVoice] = useState("af_bella");
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);

  // Small Details Preferences
  const [commsWanted, setCommsWanted] = useState(true);
  const [interviewMode, setInterviewMode] = useState<"standard" | "faang_strict">("faang_strict");
  const [showJdAccordion, setShowJdAccordion] = useState(false);

  // Mic test state to verify STT (defaults to Meta Muse Voice Transcribe)
  const [showMicTest, setShowMicTest] = useState(false);
  const micTest = useVoiceInput({
    sessionId: session?.id,
  });

  useEffect(() => {
    setSelectedVoice(getSavedVoice());

    api
      .currentSession()
      .then((s) => {
        setSession(s.session);
        if (s.session.company) setCompany(s.session.company);
        if (s.session.role) setRole(s.session.role);
        if (s.session.voice) setSelectedVoice(s.session.voice);

        const r = s.documents.find((d) => d.kind === "resume");
        const j = s.documents.find((d) => d.kind === "jd");
        if (r?.parsed) {
          setResume({
            id: r.id,
            parsed: true,
            profile: r.profile ?? null,
            draft: r.profile ? JSON.stringify(r.profile, null, 2) : "",
            saving: false,
            message: "",
          });
        }
        if (j?.parsed) {
          setJd({
            id: j.id,
            parsed: true,
            profile: j.profile ?? null,
            draft: j.profile ? JSON.stringify(j.profile, null, 2) : "",
            saving: false,
            message: "",
          });
          const targetJD = (j.profile ?? {}) as JDData;
          if (targetJD.title) setRole(targetJD.title);
          if (targetJD.company) setCompany(targetJD.company);
          if (targetJD.seniority) setSeniority(targetJD.seniority);
        }
        setPhase("ready");
      })
      .catch((e: Error) => {
        setError(e.message);
        setPhase("error");
      });

    return () => {
      stopSpeaking();
    };
  }, []);

  async function upload(
    kind: "resume" | "jd",
    file: File | string,
    setDoc: React.Dispatch<React.SetStateAction<DocState>>,
  ) {
    if (!session) return;
    if (typeof file !== "string") {
      const cls = classifyFile(file);
      if ("error" in cls) {
        setDoc((d) => ({ ...d, message: cls.error }));
        return;
      }
    }
    setPhase("uploading");
    setDoc((d) => ({ ...d, message: "Reading and extracting insights…" }));
    try {
      setPhase("parsing");
      const { documentId, profile, truncated } = await api.uploadDocument(
        session.id,
        kind,
        file,
      );
      setDoc({
        id: documentId,
        parsed: true,
        profile: profile,
        draft: JSON.stringify(profile, null, 2),
        saving: false,
        message: truncated ? "Note: first 200k characters read." : "",
      });
      if (kind === "jd") {
        const p = profile as JDData;
        if (p.title) setRole(p.title);
        if (p.company) setCompany(p.company);
        if (p.seniority) setSeniority(p.seniority);
      }
      setPhase("ready");
    } catch (e) {
      setDoc((d) => ({
        ...d,
        message: e instanceof Error ? e.message : "Upload failed.",
      }));
      setPhase("ready");
    }
  }

  async function uploadJdText() {
    if (!jdText.trim()) {
      setJd((d) => ({ ...d, message: "Paste the job description first." }));
      return;
    }
    await upload("jd", jdText, setJd);
  }

  async function saveEdit(kind: "resume" | "jd") {
    if (!session) return;
    const [doc, setDoc] = kind === "resume" ? [resume, setResume] : [jd, setJd];
    let parsed: unknown;
    try {
      parsed = JSON.parse(doc.draft);
    } catch {
      setDoc((d) => ({ ...d, message: "Invalid JSON format." }));
      return;
    }
    setDoc((d) => ({ ...d, saving: true, message: "Saving…" }));
    try {
      const { profile } = await api.saveProfile(session.id, doc.id, parsed);
      setDoc((d) => ({
        ...d,
        profile,
        draft: JSON.stringify(profile, null, 2),
        saving: false,
        message: "Saved successfully.",
      }));
    } catch (e) {
      setDoc((d) => ({
        ...d,
        saving: false,
        message: e instanceof Error ? e.message : "Save failed.",
      }));
    }
  }

  function handleVoiceTest(voiceId: string, voiceName: string) {
    if (testingVoiceId === voiceId) {
      stopSpeaking();
      setTestingVoiceId(null);
      return;
    }
    stopSpeaking();
    setTestingVoiceId(voiceId);
    const targetComp = customCompany.trim() || company || "our team";
    const targetR = customRole.trim() || role || "engineering";
    speakText(
      `Hello! I'm ${voiceName}. I'll be your interviewer for the ${targetR} position at ${targetComp}. Let's kick off with a brief introduction.`,
      {
        voice: voiceId,
        onEnd: () => setTestingVoiceId(null),
        onError: () => setTestingVoiceId(null),
      },
    );
  }

  // Automated diagnosis and directly start mock interview!
  async function startMockDirectly() {
    if (!session) return;
    setPhase("automating");
    setError("");

    try {
      setSavedVoice(selectedVoice);
      const effectiveRole = customRole.trim() || role;
      const effectiveCompany = customCompany.trim() || company;

      await api.autoDiagnose(session.id, {
        role: effectiveRole,
        company: effectiveCompany,
        seniority,
        voice: selectedVoice,
        focusArea,
        commsWanted,
      });

      router.push("/mock");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start mock interview.");
      setPhase("ready");
    }
  }

  // Run automated diagnosis and go to review plan screen
  async function reviewDiagnosisPlan() {
    if (!session) return;
    setPhase("automating");
    setError("");

    try {
      setSavedVoice(selectedVoice);
      const effectiveRole = customRole.trim() || role;
      const effectiveCompany = customCompany.trim() || company;

      await api.autoDiagnose(session.id, {
        role: effectiveRole,
        company: effectiveCompany,
        seniority,
        voice: selectedVoice,
        focusArea,
        commsWanted,
      });

      router.push("/diagnose");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate plan.");
      setPhase("ready");
    }
  }

  if (phase === "loading") {
    return (
      <main style={{ maxWidth: 760, margin: "64px auto", padding: "0 24px" }}>
        <Text type="body">Preparing your interview workspace…</Text>
      </main>
    );
  }

  if (phase === "automating") {
    const effectiveCompany = customCompany.trim() || company;
    const effectiveRole = customRole.trim() || role;
    return (
      <main style={{ maxWidth: 760, margin: "64px auto", padding: "0 24px", textAlign: "center" }}>
        <div className="iv-orb-container" style={{ margin: "0 auto 20px" }}>
          <div className="iv-orb speaking" />
        </div>
        <div style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 8 }}>
          Setting Up Your {effectiveCompany} Interview…
        </div>
        <div style={{ color: "var(--iv-text-muted)", fontSize: "0.95rem" }}>
          Synthesizing {effectiveRole} competencies, calibrating {effectiveCompany} interview style,
          and preparing your voice interviewer.
        </div>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main style={{ maxWidth: 760, margin: "64px auto", padding: "0 24px" }}>
        <Card>
          <Text type="display-2">Setup encountered an error</Text>
          <Text type="body">{error}</Text>
          <div style={{ marginTop: 16 }}>
            <Button label="Reload" clickAction={() => window.location.reload()} />
          </div>
        </Card>
      </main>
    );
  }

  const candidate = (resume.profile ?? {}) as CandidateData;
  const targetJD = (jd.profile ?? {}) as JDData;
  const effectiveRole = customRole.trim() || role;
  const effectiveCompany = customCompany.trim() || company;
  const activeVoiceObj = KOKORO_VOICES.find((v) => v.id === selectedVoice) || KOKORO_VOICES[0];

  return (
    <main style={{ maxWidth: 840, margin: "32px auto", padding: "0 20px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span
            style={{
              background: "#2563eb",
              color: "#fff",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: "0.76rem",
              letterSpacing: "0.04em",
            }}
          >
            INTERVIEW CONFIGURATION
          </span>
          <span style={{ color: "var(--iv-text-muted)", fontSize: "0.85rem" }}>
            Role Selection • Company Persona • Kokoro Voice
          </span>
        </div>
        <Text type="display-1">Customize Your Mock Interview</Text>
        <div style={{ height: 6 }} />
        <Text type="body">
          Select your target role, company to mimic, and interviewer voice. Starting with an introduction,
          the AI will drill you through prepared core competencies. (Job description is optional).
        </Text>
      </div>

      <div style={{ display: "grid", gap: 22 }}>
        {/* 1. Target Role Selection */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#f4f4f5" }}>
              1. Target Role
            </div>
            <span className="iv-chip iv-chip-blue" style={{ fontSize: "0.75rem" }}>
              {effectiveRole}
            </span>
          </div>
          <div style={{ fontSize: "0.84rem", color: "var(--iv-text-muted)", marginBottom: 12 }}>
            Choose the position you are interviewing for to shape questions and grading criteria:
          </div>

          <div className="iv-selector-grid">
            {PRESET_ROLES.map((r) => {
              const isActive = role === r && !customRole;
              return (
                <button
                  key={r}
                  type="button"
                  className={`iv-chip-btn ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setRole(r);
                    setCustomRole("");
                  }}
                >
                  {isActive && <span>✓</span>}
                  {r}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              className="iv-input"
              placeholder="Or enter a custom role (e.g. Distributed Systems Engineer, Staff iOS Developer)…"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
            />
          </div>
        </Card>

        {/* 2. Company to Mimic Selection */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#f4f4f5" }}>
              2. Company to Mimic
            </div>
            <span className="iv-chip iv-chip-purple" style={{ fontSize: "0.75rem" }}>
              Mimicking {effectiveCompany}
            </span>
          </div>
          <div style={{ fontSize: "0.84rem", color: "var(--iv-text-muted)", marginBottom: 12 }}>
            The AI interviewer adapts its question style, architectural scale, and cultural bar to this company:
          </div>

          <div className="iv-selector-grid">
            {PRESET_COMPANIES.map((c) => {
              const isActive = company === c && !customCompany;
              return (
                <button
                  key={c}
                  type="button"
                  className={`iv-chip-btn ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setCompany(c);
                    setCustomCompany("");
                  }}
                >
                  {isActive && <span>✓</span>}
                  {c}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              className="iv-input"
              placeholder="Or enter a custom company or startup name…"
              value={customCompany}
              onChange={(e) => setCustomCompany(e.target.value)}
            />
          </div>
        </Card>

        {/* 3. Kokoro Interviewer Voice Selection */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#f4f4f5" }}>
              3. Interviewer Voice Persona (Kokoro TTS)
            </div>
            <span className="iv-chip iv-chip-green" style={{ fontSize: "0.75rem" }}>
              {activeVoiceObj.name} ({activeVoiceObj.accent})
            </span>
          </div>
          <div style={{ fontSize: "0.84rem", color: "var(--iv-text-muted)", marginBottom: 12 }}>
            Zero-latency, on-device Kokoro TTS synthesizes your interviewer's spoken questions:
          </div>

          <div className="iv-voice-grid">
            {KOKORO_VOICES.map((v) => {
              const isSelected = selectedVoice === v.id;
              const isTesting = testingVoiceId === v.id;
              return (
                <div
                  key={v.id}
                  className={`iv-voice-card ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    setSelectedVoice(v.id);
                    setSavedVoice(v.id);
                  }}
                >
                  <div className="iv-voice-header">
                    <div className="iv-voice-name">
                      <span>{v.gender === "Female" ? "👩" : "👨"}</span>
                      <span>{v.name}</span>
                    </div>
                    <span className="iv-voice-meta">
                      {v.accent} • {v.gender}
                    </span>
                  </div>

                  <div className="iv-voice-desc">{v.desc}</div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <button
                      type="button"
                      className={`iv-voice-play-btn ${isTesting ? "playing" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVoiceTest(v.id, v.name);
                      }}
                    >
                      {isTesting ? "⏹ Stop" : "▶ Preview Voice"}
                    </button>

                    {isSelected && (
                      <span style={{ fontSize: "0.72rem", color: "#34d399", fontWeight: 700 }}>
                        ✓ Selected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 4. Small Job Details & Preferences */}
        <Card>
          <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#f4f4f5", marginBottom: 6 }}>
            4. Job Details & Interview Strictness
          </div>
          <div style={{ fontSize: "0.84rem", color: "var(--iv-text-muted)", marginBottom: 14 }}>
            Tailor the seniority expectations and technical focus:
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {/* Seniority */}
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#d4d4d8", marginBottom: 6 }}>
                Seniority Level:
              </div>
              <div className="iv-selector-grid">
                {SENIORITY_LEVELS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`iv-chip-btn ${seniority === s.id ? "active" : ""}`}
                    onClick={() => setSeniority(s.id)}
                  >
                    {seniority === s.id && <span>✓</span>}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Area */}
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#d4d4d8", marginBottom: 6 }}>
                Primary Technical Focus / Domain:
              </div>
              <div className="iv-selector-grid">
                {FOCUS_AREAS.map((fa) => (
                  <button
                    key={fa}
                    type="button"
                    className={`iv-chip-btn ${focusArea === fa ? "active" : ""}`}
                    onClick={() => setFocusArea(fa)}
                  >
                    {focusArea === fa && <span>✓</span>}
                    {fa}
                  </button>
                ))}
              </div>
            </div>

            {/* Strictness & Comms Toggles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
              {/* Interviewer Strictness */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--iv-border)",
                  background: "var(--iv-surface-subtle)",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#f4f4f5" }}>
                  Interviewer Strictness
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--iv-text-muted)", margin: "4px 0 10px" }}>
                  {interviewMode === "faang_strict"
                    ? "FAANG rigour: probing trade-offs, failure modes, scale."
                    : "Standard: balanced conversational depth."}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setInterviewMode("standard")}
                    className={`iv-chip-btn ${interviewMode === "standard" ? "active" : ""}`}
                    style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewMode("faang_strict")}
                    className={`iv-chip-btn ${interviewMode === "faang_strict" ? "active" : ""}`}
                    style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                  >
                    FAANG Strict
                  </button>
                </div>
              </div>

              {/* Start with Introduction (Comms) Toggle */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--iv-border)",
                  background: "var(--iv-surface-subtle)",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#f4f4f5" }}>
                  Start with Introduction
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--iv-text-muted)", margin: "4px 0 10px" }}>
                  {commsWanted
                    ? "Starts with 60–90s candidate introduction pitch, then technical questions."
                    : "Jumps directly into technical questions."}
                </div>
                <button
                  type="button"
                  onClick={() => setCommsWanted((v) => !v)}
                  className={`iv-chip-btn ${commsWanted ? "active" : ""}`}
                  style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                >
                  {commsWanted ? "✓ Introduction First" : "Skip Introduction"}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* 5. Resume Upload (Recommended) */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#f4f4f5" }}>
              5. Your Resume <span style={{ fontSize: "0.8rem", color: "#a1a1aa", fontWeight: 400 }}>(Recommended)</span>
            </div>
            {resume.parsed && (
              <span className="iv-chip iv-chip-green" style={{ fontSize: "0.75rem" }}>
                ✓ Parsed
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.84rem", color: "var(--iv-text-muted)", marginBottom: 12 }}>
            Upload your resume so the interviewer can ground questions and intro follow-ups in your real background:
          </div>

          <FileInput
            label="Upload Resume (PDF, DOCX, or TXT)"
            accept=".pdf,.docx,.txt"
            value={null}
            onChange={(files) => {
              const f = Array.isArray(files) ? files[0] : files;
              if (f) void upload("resume", f, setResume);
            }}
          />

          {resume.message && (
            <div style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--iv-text-muted)" }}>
              {resume.message}
            </div>
          )}

          {resume.parsed && candidate && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 8,
                background: "var(--iv-surface-subtle)",
                border: "1px solid var(--iv-border)",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: 6 }}>
                Candidate: {candidate.name || "Identified"}
              </div>
              {candidate.skills && candidate.skills.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--iv-text-muted)", marginBottom: 4 }}>
                    Extracted Skills:
                  </div>
                  <div className="iv-chip-container">
                    {candidate.skills.slice(0, 10).map((s, i) => (
                      <span key={i} className="iv-chip">
                        {s}
                      </span>
                    ))}
                    {candidate.skills.length > 10 && (
                      <span className="iv-chip">+{candidate.skills.length - 10} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 6. (Optional) Custom Job Description Accordion */}
        <div className="iv-accordion">
          <div
            className="iv-accordion-header"
            onClick={() => setShowJdAccordion((prev) => !prev)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1rem" }}>{showJdAccordion ? "▾" : "▸"}</span>
              <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#f4f4f5" }}>
                (Optional) Provide Specific Job Description
              </span>
              <span className="iv-chip" style={{ fontSize: "0.72rem" }}>
                Optional
              </span>
            </div>
            <span style={{ fontSize: "0.8rem", color: "#60a5fa" }}>
              {showJdAccordion ? "Collapse" : "Upload or paste JD file →"}
            </span>
          </div>

          {showJdAccordion && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--iv-border)" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--iv-text-muted)", marginBottom: 12 }}>
                If you have an exact job description from {effectiveCompany}, paste it or upload it below.
                If omitted, InterVibe automatically synthesizes standard competencies for {effectiveRole}.
              </div>

              <FileInput
                label="Upload JD File"
                accept=".pdf,.docx,.txt"
                value={null}
                onChange={(files) => {
                  const f = Array.isArray(files) ? files[0] : files;
                  if (f) void upload("jd", f, setJd);
                }}
              />

              <div style={{ height: 12 }} />

              <TextArea
                label="Or paste the job description text"
                value={jdText}
                onChange={setJdText}
                placeholder="Paste the job requirements, responsibilities, or target role description here…"
              />

              <div style={{ marginTop: 10 }}>
                <Button
                  label={phase === "parsing" ? "Parsing…" : "Parse Pasted Job Description"}
                  clickAction={() => void uploadJdText()}
                />
              </div>

              {jd.message && (
                <div style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--iv-text-muted)" }}>
                  {jd.message}
                </div>
              )}

              {jd.parsed && targetJD && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 14,
                    borderRadius: 8,
                    background: "var(--iv-surface-subtle)",
                    border: "1px solid var(--iv-border)",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: 6 }}>
                    Custom JD: {targetJD.title || effectiveRole} @ {targetJD.company || effectiveCompany}
                  </div>
                  {targetJD.must_haves && targetJD.must_haves.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "var(--iv-text-muted)", marginBottom: 4 }}>
                        Must-Have Competencies:
                      </div>
                      <div className="iv-chip-container">
                        {targetJD.must_haves.map((m, i) => (
                          <span key={i} className="iv-chip iv-chip-green">
                            ★ {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 7. Speech-To-Text (STT) Quick Mic Test */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#f4f4f5" }}>
                🎙️ Microphone Check (Muse Voice STT)
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--iv-text-muted)", marginTop: 2 }}>
                Verify speech recognition before starting the interview.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowMicTest((prev) => !prev);
                if (micTest.isListening) micTest.stopListening();
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid var(--iv-border)",
                background: "var(--iv-surface)",
                color: "#f4f4f5",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 500,
              }}
            >
              {showMicTest ? "Close Mic Test" : "Test Microphone"}
            </button>
          </div>

          {showMicTest && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 8,
                background: "var(--iv-surface-subtle)",
                border: "1px solid var(--iv-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={micTest.toggleListening}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 9999,
                    background: micTest.isListening ? "#ef4444" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                  }}
                >
                  {micTest.isListening ? "⏹ Stop Test" : "🎙️ Speak to Test"}
                </button>

                <span style={{ fontSize: "0.85rem", color: micTest.isListening ? "#059669" : "var(--iv-text-muted)" }}>
                  {micTest.isListening ? "Listening… say a sentence into your mic" : "Click to test speech recognition"}
                </span>
              </div>

              {micTest.isListening && (
                <div className="iv-equalizer" style={{ marginBottom: 8 }}>
                  {[0.4, 0.7, 1.0, 0.8, 0.5, 0.9, 0.6, 0.3].map((mult, idx) => (
                    <div
                      key={idx}
                      className="iv-eq-bar"
                      style={{
                        height: `${Math.max(6, micTest.volume * 32 * mult)}px`,
                        background: "#10b981",
                      }}
                    />
                  ))}
                </div>
              )}

              {(micTest.transcript || micTest.interimTranscript) && (
                <div style={{ fontSize: "0.9rem", color: "var(--iv-text)", fontWeight: 500 }}>
                  <span style={{ color: "#059669" }}>Transcribed: </span>
                  {micTest.transcript || micTest.interimTranscript}
                </div>
              )}

              {micTest.error && (
                <div style={{ fontSize: "0.82rem", color: "#ef4444", marginTop: 6 }}>
                  {micTest.error}
                </div>
              )}

              <div style={{ fontSize: "0.75rem", color: "var(--iv-text-muted)", marginTop: 6 }}>
                STT Engine: <strong>Meta Muse Voice Transcribe</strong> (<code>muse-voice-transcribe-1.0</code>) · Default
              </div>
            </div>
          )}
        </Card>

        {/* Optional Advanced Raw JSON Editor Toggle */}
        {(resume.parsed || jd.parsed) && (
          <div style={{ fontSize: "0.85rem" }}>
            <button
              type="button"
              onClick={() => setShowRawEditor((prev) => !prev)}
              style={{
                background: "none",
                border: "none",
                color: "var(--iv-primary)",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              {showRawEditor ? "Hide Raw Data Editor" : "Advanced: View / Edit Raw Extracted JSON"}
            </button>

            {showRawEditor && (
              <div style={{ marginTop: 12 }}>
                <Card>
                  {resume.parsed && (
                    <div style={{ marginBottom: 16 }}>
                      <Text type="label">Resume Raw JSON</Text>
                      <TextArea
                        label=""
                        value={resume.draft}
                        onChange={(v) => setResume((d) => ({ ...d, draft: v }))}
                      />
                      <Button
                        label={resume.saving ? "Saving…" : "Save Resume Changes"}
                        clickAction={() => void saveEdit("resume")}
                      />
                    </div>
                  )}
                  {jd.parsed && (
                    <div>
                      <Text type="label">JD Raw JSON</Text>
                      <TextArea
                        label=""
                        value={jd.draft}
                        onChange={(v) => setJd((d) => ({ ...d, draft: v }))}
                      />
                      <Button
                        label={jd.saving ? "Saving…" : "Save JD Changes"}
                        clickAction={() => void saveEdit("jd")}
                      />
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              fontSize: "0.9rem",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            {error}
          </div>
        )}

        {/* 8. Launch Action Bar */}
        <div
          style={{
            marginTop: 8,
            padding: 24,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.08))",
            border: "1px solid rgba(37, 99, 235, 0.3)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f4f4f5" }}>
            Ready for your {effectiveCompany} Mock Interview
          </div>
          <div style={{ fontSize: "0.85rem", color: "#a1a1aa", maxWidth: 540 }}>
            {commsWanted ? "Starts with an introduction pitch" : "Direct start"} for the{" "}
            <strong style={{ color: "#60a5fa" }}>{seniority} {effectiveRole}</strong> role at{" "}
            <strong style={{ color: "#a78bfa" }}>{effectiveCompany}</strong> with{" "}
            <strong style={{ color: "#34d399" }}>{activeVoiceObj.name} ({activeVoiceObj.accent})</strong>.
          </div>

          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            <Button
              label={`🎙️ Start Live Mock Interview at ${effectiveCompany}`}
              clickAction={() => void startMockDirectly()}
              isDisabled={phase === "uploading" || phase === "parsing"}
            />

            <button
              type="button"
              onClick={() => void reviewDiagnosisPlan()}
              style={{
                background: "none",
                border: "none",
                color: "var(--iv-text-muted)",
                cursor: "pointer",
                fontSize: "0.84rem",
                textDecoration: "underline",
              }}
            >
              Or review automated competency plan breakdown first →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
