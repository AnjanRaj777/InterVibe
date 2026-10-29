"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Banner, Button, Card, ProgressBar, Text, TextArea } from "@astryxdesign/core";
import { api, type Plan } from "@/lib/api";
import { speakText, stopSpeaking, useVoiceInput } from "@/lib/voice";

type Phase = "loading" | "answering" | "submitting" | "review";

interface Question {
  question: string;
  skillTag: string;
}

interface Verdict {
  skill: string;
  source: string;
  verdict: "verified" | "shaky" | "gap";
  evidence: string;
}

const VERDICT_LABEL: Record<Verdict["verdict"], string> = {
  verified: "Verified",
  shaky: "Needs Practice",
  gap: "Gap Identified",
};

export default function DiagnosePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lowConfidence, setLowConfidence] = useState(false);
  const [clarifying, setClarifying] = useState<string | undefined>(undefined);
  const [answers, setAnswers] = useState<string[]>([]);
  const [commsWanted, setCommsWanted] = useState(true);
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");
  const [activeVoiceIndex, setActiveVoiceIndex] = useState<number | null>(null);

  // Hook for voice speech-to-text (defaults to Meta Muse Voice Transcribe)
  const voice = useVoiceInput({
    sessionId: sessionId || undefined,
    onFinalTranscript: (text) => {
      if (activeVoiceIndex !== null) {
        setAnswers((prev) =>
          prev.map((a, j) => (j === activeVoiceIndex ? (a ? `${a} ${text}` : text) : a)),
        );
      }
    },
  });

  useEffect(() => {
    api
      .currentSession()
      .then(async (s) => {
        setSessionId(s.session.id);
        // Reload persistence: a reviewed plan renders without re-answering.
        try {
          const saved = await api.getPlan(s.session.id);
          if (saved && saved.plan) {
            setVerdicts(((saved.diagnostic ?? {}) as { verdicts?: Verdict[] }).verdicts ?? []);
            setPlan(saved.plan);
            setPhase("review");
            return;
          }
        } catch {
          // No plan yet — run automated diagnosis!
        }
        try {
          const auto = await api.autoDiagnose(s.session.id, true);
          setVerdicts(((auto.diagnostic ?? {}) as { verdicts?: Verdict[] }).verdicts ?? []);
          setPlan(auto.plan);
          setPhase("review");
          return;
        } catch {
          // Fallback to questions if documents are missing
        }
        const d = await api.diagnose(s.session.id);
        setQuestions(d.questions);
        setLowConfidence(d.lowConfidence);
        setClarifying(d.clarifyingQuestion);
        setAnswers(d.questions.map(() => ""));
        setPhase("answering");
      })
      .catch((e: Error) => {
        setError(e.message);
        setPhase("answering");
      });
  }, []);

  function handleVoiceToggle(idx: number) {
    if (activeVoiceIndex === idx && voice.isListening) {
      voice.stopListening();
      setActiveVoiceIndex(null);
    } else {
      setActiveVoiceIndex(idx);
      voice.resetTranscript();
      voice.startListening();
    }
  }

  function handleReadQuestion(text: string) {
    stopSpeaking();
    speakText(text);
  }

  async function submit() {
    if (!sessionId || phase !== "answering") return;
    voice.stopListening();
    setActiveVoiceIndex(null);

    const missing = answers.filter((a) => !a.trim()).length;
    if (answers.length === 0 || missing > 0) {
      setError("Please provide an answer for each question (speaking a 1-sentence answer is fine).");
      return;
    }
    setError("");
    setPhase("submitting");
    try {
      const payload = questions.map((q, i) => ({
        question: q.question,
        skillTag: q.skillTag,
        answer: answers[i].trim(),
      }));
      const res = await api.submitPlan(sessionId, payload, commsWanted);
      setVerdicts(((res.diagnostic ?? {}) as { verdicts?: Verdict[] }).verdicts ?? []);
      setPlan(res.plan);
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build your plan.");
      setPhase("answering");
    }
  }

  if (phase === "loading") {
    return (
      <main style={{ maxWidth: 720, margin: "64px auto", padding: "0 24px" }}>
        <Text type="body">Analyzing resume & job requirements to generate targeted questions…</Text>
      </main>
    );
  }

  // Plan Review Screen
  if (phase === "review" && plan) {
    return (
      <main style={{ maxWidth: 780, margin: "36px auto", padding: "0 24px 64px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span
              style={{
                background: "#10b981",
                color: "#fff",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: "0.78rem",
              }}
            >
              STEP 2 OF 3 COMPLETE
            </span>
            <span style={{ color: "var(--iv-text-muted)", fontSize: "0.85rem" }}>
              Preparation Plan & Diagnosis
            </span>
          </div>
          <Text type="display-1">Your Tailored Interview Plan</Text>
          <div style={{ height: 6 }} />
          <Text type="body">
            {lowConfidence || plan.lowConfidence
              ? "We mapped your competencies against the job description. Here are your custom prep modules."
              : "Modules prioritized by your biggest JD-weighted gaps first."}
          </Text>
        </div>

        {/* Skill Verdicts Grid */}
        <div style={{ marginBottom: 24 }}>
          <Text type="display-2">Diagnosed Skill Status</Text>
          <div style={{ height: 8 }} />
          <div style={{ display: "grid", gap: 10 }}>
            {verdicts.map((v) => {
              const chipClass =
                v.verdict === "verified"
                  ? "iv-chip-green"
                  : v.verdict === "shaky"
                    ? "iv-chip-amber"
                    : "";
              return (
                <div
                  key={v.skill}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: "var(--iv-surface)",
                    border: "1px solid var(--iv-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{v.skill}</span>
                    <span style={{ marginLeft: 8 }} className={`iv-chip ${chipClass}`}>
                      {VERDICT_LABEL[v.verdict]}
                    </span>
                    <div style={{ fontSize: "0.8rem", color: "var(--iv-text-muted)", marginTop: 4 }}>
                      Evidence: “{v.evidence}”
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ordered Modules */}
        <div style={{ marginBottom: 28 }}>
          <Text type="display-2">Practice & Drill Modules</Text>
          <div style={{ height: 8 }} />
          <div style={{ display: "grid", gap: 12 }}>
            {plan.modules.map((m, i) => (
              <Card key={`${m.title}-${i}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#2563eb",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Module {i + 1}
                    </span>
                    <Text type="display-2">{m.title}</Text>
                  </div>
                  <span className="iv-chip">
                    {m.estimatedQuestions} questions
                  </span>
                </div>
                <div style={{ height: 4 }} />
                <Text type="body">{m.goal}</Text>
                <div style={{ height: 8 }} />
                <div style={{ fontSize: "0.82rem", color: "var(--iv-text-muted)" }}>
                  Target bar: {m.passBar}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Launch Mock CTA */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(6, 182, 212, 0.1))",
            padding: 24,
            borderRadius: 12,
            border: "1px solid rgba(37, 99, 235, 0.2)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 6 }}>
            Ready for Your Spoken Mock Interview?
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--iv-text-muted)", marginBottom: 16 }}>
            The AI interviewer will greet you by voice, ask targeted questions from your modules,
            and evaluate your spoken answers in real time.
          </div>
          <Button
            label="🎙️ Launch Live Voice Mock Interview"
            clickAction={() => {
              router.push("/mock");
            }}
          />
        </div>
      </main>
    );
  }

  // Answering Screen (with Voice Answering Support)
  return (
    <main style={{ maxWidth: 780, margin: "36px auto", padding: "0 24px 64px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span
            style={{
              background: "#2563eb",
              color: "#fff",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: "0.78rem",
            }}
          >
            STEP 2 OF 3
          </span>
          <span style={{ color: "var(--iv-text-muted)", fontSize: "0.85rem" }}>
            Skill Diagnosis
          </span>
        </div>
        <Text type="display-1">Diagnose Your Knowledge</Text>
        <div style={{ height: 6 }} />
        <Text type="body">
          Answer each question with what you actually did — one honest spoken sentence beats a
          lengthy paragraph. You can speak into your microphone or type.
        </Text>
      </div>

      {clarifying && (
        <Banner status="warning" title="Thin inputs" description={clarifying} />
      )}
      {error && <Banner status="error" title="Check your answers" description={error} />}

      <div style={{ display: "grid", gap: 18, margin: "20px 0" }}>
        {questions.map((q, i) => {
          const isCurrentVoice = activeVoiceIndex === i && voice.isListening;
          return (
            <Card key={`${q.skillTag}-${i}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <span className="iv-chip" style={{ marginBottom: 6 }}>
                    Skill: {q.skillTag}
                  </span>
                  <Text type="display-2">{q.question}</Text>
                </div>
                <button
                  type="button"
                  onClick={() => handleReadQuestion(q.question)}
                  title="Read question out loud"
                  style={{
                    background: "var(--iv-surface-subtle)",
                    border: "1px solid var(--iv-border)",
                    borderRadius: "50%",
                    width: 34,
                    height: 34,
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  🔊
                </button>
              </div>

              <div style={{ height: 10 }} />

              <TextArea
                label=""
                placeholder="What did you build, and what was the outcome? (Or click the mic below to speak)"
                value={answers[i] ?? ""}
                onChange={(v) =>
                  setAnswers((prev) => prev.map((a, j) => (j === i ? v : a)))
                }
              />

              {/* Voice Input Action Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleVoiceToggle(i)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: isCurrentVoice ? "#ef4444" : "rgba(37, 99, 235, 0.08)",
                    color: isCurrentVoice ? "#fff" : "#2563eb",
                    border: "1px solid",
                    borderColor: isCurrentVoice ? "#dc2626" : "rgba(37, 99, 235, 0.2)",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  <span>{isCurrentVoice ? "⏹ Stop Speaking" : "🎙️ Speak Answer"}</span>
                  {isCurrentVoice && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#fff",
                        animation: "pulse-dot 1s infinite",
                      }}
                    />
                  )}
                </button>

                {isCurrentVoice && (
                  <span style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 500 }}>
                    Listening to your microphone…
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Communication Module Toggle */}
      <Card>
        <Text type="display-2">Communication & Storytelling Training</Text>
        <Text type="body">
          {commsWanted
            ? "Included — intro pitch (60–90s) and STAR storytelling drills are enabled."
            : "Off — knowledge drills only. Turn on to practice elevator pitches and storytelling."}
        </Text>
        <div style={{ marginTop: 12 }}>
          <Button
            label={commsWanted ? "Turn comms training off" : "Include comms training"}
            clickAction={() => setCommsWanted((v) => !v)}
          />
        </div>
      </Card>

      <div style={{ marginTop: 20 }}>
        <Button
          label={phase === "submitting" ? "Constructing Your Plan…" : "Generate My Prep Plan →"}
          clickAction={() => void submit()}
        />
      </div>
    </main>
  );
}
