"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  if (pathname === "/mock" || pathname === "/" || pathname === "/login") return null;

  const steps = [
    { num: 1, label: "Setup", path: "/setup" },
    { num: 2, label: "Voice Mock", path: "/mock" },
    { num: 3, label: "Diagnosis Plan", path: "/diagnose" },
  ];

  // Determine active step index
  const activeIndex = steps.findIndex((s) => pathname.startsWith(s.path));

  return (
    <header className="iv-navbar">
      {/* Brand */}
      <Link href="/" className="iv-brand">
        <div className="iv-brand-icon">
          <span>🎙️</span>
        </div>
        <div>
          <span>InterVibe</span>
          <span
            style={{
              marginLeft: 8,
              fontSize: "0.68rem",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 6,
              background: "linear-gradient(135deg, #2563eb, #06b6d4)",
              color: "#fff",
              verticalAlign: "middle",
              letterSpacing: "0.02em",
            }}
          >
            VOICE AI
          </span>
        </div>
      </Link>

      {/* Stepper Navigation */}
      <nav className="iv-stepper" aria-label="Interview Progress">
        {steps.map((step, idx) => {
          const isActive = pathname.startsWith(step.path);
          const isCompleted = activeIndex > idx;

          return (
            <Link
              key={step.path}
              href={step.path}
              className={`iv-step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
            >
              <span className="iv-step-num">
                {isCompleted ? "✓" : step.num}
              </span>
              <span>{step.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Status & Quick Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.8rem",
            color: "#059669",
            fontWeight: 500,
            padding: "4px 8px",
            borderRadius: 6,
            background: "rgba(16, 185, 129, 0.08)",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#10b981",
              display: "inline-block",
            }}
          />
          <span>Voice Audio Ready</span>
        </div>

        <Link
          href="/setup"
          style={{
            fontSize: "0.82rem",
            color: "var(--iv-text-muted)",
            textDecoration: "none",
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid var(--iv-border)",
            fontWeight: 500,
          }}
        >
          + New Session
        </Link>
      </div>
    </header>
  );
}
