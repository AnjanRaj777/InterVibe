"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("iv_theme");
      if (saved === "dark") setIsDark(true);
      else if (saved === "light") setIsDark(false);
    } catch {}
  }, []);

  return (
    <div
      className={`iv-minimal-viewport${isDark ? " dark" : ""}`}
      style={{ overflowY: "auto", minHeight: "100vh", position: "relative" }}
    >
      {/* ── Top Header ────────────────────────────────────────── */}
      <header className="iv-minimal-header">
        <Link href="/" className="iv-minimal-logo" style={{ textDecoration: "none" }}>
          Intervibe
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href="/login"
            style={{
              fontSize: "0.92rem",
              fontWeight: 500,
              color: isDark ? "#d4d4d8" : "#374151",
              textDecoration: "none",
              padding: "6px 12px",
            }}
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="iv-login-setup-btn"
            style={{ textDecoration: "none" }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────── */}
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px 80px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 48px" }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 9999, background: isDark ? "rgba(59,130,246,0.12)" : "rgba(37,99,235,0.08)", border: `1px solid ${isDark ? "rgba(59,130,246,0.25)" : "rgba(37,99,235,0.18)"}`, color: isDark ? "#60a5fa" : "#2563eb", fontSize: "0.85rem", fontWeight: 600, marginBottom: 20 }}>
            <span>🎙️ Voice-First AI Mock Interview Copilot</span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: isDark ? "#ffffff" : "#09090b",
              margin: "0 0 20px 0",
            }}
          >
            Master Technical & Behavioral Interviews Out Loud
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "1.12rem",
              lineHeight: 1.6,
              color: isDark ? "#a1a1aa" : "#4b5563",
              margin: "0 0 32px 0",
            }}
          >
            Upload your resume, add any job description, and practice realistic spoken interviews.
            The AI listens, challenges your architectural trade-offs, and scores your answers with
            transcript evidence.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 34px",
                borderRadius: 9999,
                background: isDark ? "#ffffff" : "#09090b",
                color: isDark ? "#09090b" : "#ffffff",
                fontSize: "1rem",
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
                transition: "all 0.15s ease",
              }}
            >
              <span>Start Mock Interview</span>
              <span>→</span>
            </Link>

            <Link
              href="/mock"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "14px 28px",
                borderRadius: 9999,
                background: isDark ? "#18181b" : "#ffffff",
                border: `1px solid ${isDark ? "#27272a" : "#d1d5db"}`,
                color: isDark ? "#f4f4f5" : "#09090b",
                fontSize: "1rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              Direct Demo Access
            </Link>
          </div>
        </div>

        {/* ── Product Preview Card ──────────────────────────────── */}
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto 72px",
            padding: "36px 32px",
            borderRadius: 32,
            background: isDark ? "#18181b" : "#ffffff",
            border: `1.5px solid ${isDark ? "rgba(139,92,246,0.3)" : "rgba(199,210,254,0.8)"}`,
            boxShadow: isDark
              ? "0 0 60px 10px rgba(139, 92, 246, 0.2)"
              : "0 0 60px 10px rgba(180, 185, 255, 0.4)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: isDark ? "#818cf8" : "#6366f1", marginBottom: 12 }}>
            Instant Setup & Practice
          </div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: isDark ? "#f4f4f5" : "#09090b", margin: "0 0 24px 0" }}>
            Ready in seconds — no friction
          </h3>

          {/* Miniature pill bar preview */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 12px 10px 18px",
              borderRadius: 9999,
              background: isDark ? "#09090b" : "#ffffff",
              border: `1px solid ${isDark ? "#27272a" : "#e5e7eb"}`,
              boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
              maxWidth: 580,
              margin: "0 auto",
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 9999,
                  border: `1px solid ${isDark ? "#3f3f46" : "#d1d5db"}`,
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: isDark ? "#d4d4d8" : "#374151",
                }}
              >
                <span>↑</span> Upload CV
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 9999,
                  border: `1px solid ${isDark ? "#3f3f46" : "#d1d5db"}`,
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: isDark ? "#d4d4d8" : "#374151",
                }}
              >
                <span>+</span> Add JD
              </span>
            </div>
            <Link
              href="/login"
              style={{
                padding: "9px 24px",
                borderRadius: 9999,
                background: isDark ? "#ffffff" : "#09090b",
                color: isDark ? "#09090b" : "#ffffff",
                fontSize: "0.88rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Start
            </Link>
          </div>
        </div>

        {/* ── 3 Core Pillars ───────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 60 }}>
          <div
            style={{
              padding: "28px 24px",
              borderRadius: 20,
              background: isDark ? "#18181b" : "#ffffff",
              border: `1px solid ${isDark ? "#27272a" : "#e5e7eb"}`,
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 14 }}>🎙️</div>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px 0", color: isDark ? "#f4f4f5" : "#09090b" }}>
              Spoken Voice AI
            </h4>
            <p style={{ margin: 0, fontSize: "0.9rem", color: isDark ? "#a1a1aa" : "#6b7280", lineHeight: 1.5 }}>
              Realistic voice synthesis with zero-latency on-device Kokoro TTS personas and Muse Voice STT
              for natural turn-taking.
            </p>
          </div>

          <div
            style={{
              padding: "28px 24px",
              borderRadius: 20,
              background: isDark ? "#18181b" : "#ffffff",
              border: `1px solid ${isDark ? "#27272a" : "#e5e7eb"}`,
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 14 }}>📄</div>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px 0", color: isDark ? "#f4f4f5" : "#09090b" }}>
              Resume & JD Alignment
            </h4>
            <p style={{ margin: 0, fontSize: "0.9rem", color: isDark ? "#a1a1aa" : "#6b7280", lineHeight: 1.5 }}>
              Automatically detects competencies, past company scale, and matches your job description
              requirements.
            </p>
          </div>

          <div
            style={{
              padding: "28px 24px",
              borderRadius: 20,
              background: isDark ? "#18181b" : "#ffffff",
              border: `1px solid ${isDark ? "#27272a" : "#e5e7eb"}`,
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 14 }}>🎯</div>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px 0", color: isDark ? "#f4f4f5" : "#09090b" }}>
              FAANG-Calibrated Rubrics
            </h4>
            <p style={{ margin: 0, fontSize: "0.9rem", color: isDark ? "#a1a1aa" : "#6b7280", lineHeight: 1.5 }}>
              Real-time evaluation with rubric score out of 100, STAR method analysis, and next-turn fix
              coaching.
            </p>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer
          style={{
            borderTop: `1px solid ${isDark ? "#27272a" : "#e5e7eb"}`,
            padding: "28px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.85rem",
            color: isDark ? "#71717a" : "#9ca3af",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>© 2026 Intervibe. Voice-First AI Mock Interview Copilot.</div>
          <div style={{ display: "flex", gap: 18 }}>
            <Link href="/login" style={{ color: "inherit", textDecoration: "none" }}>Sign In</Link>
            <Link href="/mock" style={{ color: "inherit", textDecoration: "none" }}>Mock Interview</Link>
          </div>
        </footer>
      </main>

      {/* ── Theme Toggle (bottom-left) ────────────────────────── */}
      <button
        type="button"
        className="iv-sun-toggle-btn"
        style={{ position: "fixed", bottom: 28, left: 28 }}
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
    </div>
  );
}
