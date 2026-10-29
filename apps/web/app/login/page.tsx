"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("iv_theme");
      if (saved === "dark") setIsDark(true);
      else if (saved === "light") setIsDark(false);
    } catch {}
  }, []);

  async function handleQuickLogin() {
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch("/api/auth/dev-login", { method: "POST" });
      if (!res.ok) throw new Error("Could not sign in with demo account.");
      router.push("/mock");
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Sign-in failed. Please try email.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      // First attempt one-click dev login
      const devRes = await fetch("/api/auth/dev-login", { method: "POST" });
      if (devRes.ok) {
        router.push("/mock");
        return;
      }

      // If dev-login isn't available, fallback to magic link
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) throw new Error("Could not send sign-in link.");
      setMessage("Check your inbox for a sign-in link.");
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            href="/"
            style={{
              fontSize: "0.88rem",
              fontWeight: 500,
              color: isDark ? "#a1a1aa" : "#6b7280",
              textDecoration: "none",
              padding: "6px 12px",
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* ── Centered Auth Card ────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px 80px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            background: isDark ? "#18181b" : "#ffffff",
            borderRadius: 24,
            border: `1px solid ${isDark ? "#27272a" : "#e5e7eb"}`,
            boxShadow: isDark
              ? "0 25px 60px -15px rgba(0, 0, 0, 0.6)"
              : "0 25px 60px -15px rgba(0, 0, 0, 0.08)",
            padding: "36px 32px",
            boxSizing: "border-box",
            animation: "fadeIn 0.25s ease-out",
          }}
        >
          {/* Brand & Title */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h1
              style={{
                fontSize: "1.65rem",
                fontWeight: 700,
                color: isDark ? "#f4f4f5" : "#09090b",
                margin: "0 0 8px 0",
                letterSpacing: "-0.02em",
              }}
            >
              {tab === "signin" ? "Welcome back" : "Create an account"}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
                color: isDark ? "#a1a1aa" : "#6b7280",
                lineHeight: 1.45,
              }}
            >
              {tab === "signin"
                ? "Sign in to jump straight into your mock interview."
                : "Join Intervibe to practice voice interviews with real-time feedback."}
            </p>
          </div>

          {/* Tab Switcher */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 4,
              padding: 4,
              borderRadius: 12,
              background: isDark ? "#27272a" : "#f4f4f5",
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              onClick={() => { setTab("signin"); setMessage(""); }}
              style={{
                padding: "8px 0",
                borderRadius: 8,
                border: "none",
                background: tab === "signin" ? (isDark ? "#3f3f46" : "#ffffff") : "transparent",
                color: tab === "signin" ? (isDark ? "#ffffff" : "#09090b") : (isDark ? "#a1a1aa" : "#6b7280"),
                fontWeight: tab === "signin" ? 600 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: tab === "signin" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab("signup"); setMessage(""); }}
              style={{
                padding: "8px 0",
                borderRadius: 8,
                border: "none",
                background: tab === "signup" ? (isDark ? "#3f3f46" : "#ffffff") : "transparent",
                color: tab === "signup" ? (isDark ? "#ffffff" : "#09090b") : (isDark ? "#a1a1aa" : "#6b7280"),
                fontWeight: tab === "signup" ? 600 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: tab === "signup" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Quick Demo Login Button */}
          <button
            type="button"
            onClick={handleQuickLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 18px",
              borderRadius: 12,
              border: `1px solid ${isDark ? "#3b82f6" : "#2563eb"}`,
              background: isDark ? "rgba(59, 130, 246, 0.12)" : "rgba(37, 99, 235, 0.06)",
              color: isDark ? "#60a5fa" : "#2563eb",
              fontSize: "0.92rem",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.15s ease",
              marginBottom: 20,
            }}
          >
            <span>⚡</span>
            <span>{loading ? "Signing in…" : "One-Click Instant Access (Demo)"}</span>
          </button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              color: isDark ? "#52525b" : "#d1d5db",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "currentColor" }} />
            <span style={{ fontSize: "0.78rem", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              or email
            </span>
            <div style={{ flex: 1, height: 1, background: "currentColor" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {tab === "signup" && (
              <div>
                <label
                  htmlFor="signup-name"
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: isDark ? "#d4d4d8" : "#374151",
                    marginBottom: 6,
                  }}
                >
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: `1px solid ${isDark ? "#27272a" : "#d1d5db"}`,
                    background: isDark ? "#09090b" : "#f9fafb",
                    color: isDark ? "#f4f4f5" : "#09090b",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: isDark ? "#d4d4d8" : "#374151",
                  marginBottom: 6,
                }}
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: `1px solid ${isDark ? "#27272a" : "#d1d5db"}`,
                  background: isDark ? "#09090b" : "#f9fafb",
                  color: isDark ? "#f4f4f5" : "#09090b",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: isDark ? "#d4d4d8" : "#374151",
                  marginBottom: 6,
                }}
              >
                Password <span style={{ fontWeight: 400, color: isDark ? "#71717a" : "#9ca3af" }}>(optional for demo)</span>
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: `1px solid ${isDark ? "#27272a" : "#d1d5db"}`,
                  background: isDark ? "#09090b" : "#f9fafb",
                  color: isDark ? "#f4f4f5" : "#09090b",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {message && (
              <div
                style={{
                  fontSize: "0.84rem",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: isError ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                  border: `1px solid ${isError ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                  color: isError ? "#ef4444" : "#10b981",
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 18px",
                borderRadius: 12,
                border: "none",
                background: isDark ? "#ffffff" : "#09090b",
                color: isDark ? "#09090b" : "#ffffff",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                marginTop: 6,
                transition: "opacity 0.15s ease",
              }}
            >
              {loading
                ? "Connecting…"
                : tab === "signin"
                ? "Sign In & Start Interview →"
                : "Create Account & Start Interview →"}
            </button>
          </form>

          {/* Footnote */}
          <p
            style={{
              textAlign: "center",
              fontSize: "0.78rem",
              color: isDark ? "#71717a" : "#9ca3af",
              marginTop: 20,
              marginBottom: 0,
            }}
          >
            By continuing, you agree to Intervibe's Terms of Service and Privacy Policy.
          </p>
        </div>
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
