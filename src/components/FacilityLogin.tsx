// src/components/FacilityLogin.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/runtimeConfig";
import SeoHead from "./SeoHead";

export default function FacilityLogin() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setSending(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/facility/auth/request-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to send login link");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <SeoHead
        title="Facility Login | Nursing Homes Near Me"
        description="Nursing home facility portal login."
        canonicalUrl="https://www.nursinghomesnearme.com.au/facility/login"
        robots="noindex,follow"
      />

      {/* Header */}
      <header style={{ padding: "16px 24px", backgroundColor: "#0b3b5b", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: 900, letterSpacing: 0.2 }}>
          Nursing Homes Near Me
        </Link>
        <Link to="/" style={{ color: "white", fontSize: 14, textDecoration: "underline" }}>
          ← Back to site
        </Link>
      </header>

      <main style={{ maxWidth: 520, margin: "48px auto", padding: "0 16px" }}>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 28 }}>
          {/* Icon */}
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0b3b5b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>

          <h1 style={{ margin: "0 0 6px", color: "#0b3b5b", fontSize: 22, fontWeight: 800 }}>
            Facility Portal
          </h1>
          <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
            Enter your facility's registered email address. We'll send you a secure login link — no password needed.
          </p>

          {sent ? (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 16 }}>
              <div style={{ color: "#166534", fontWeight: 700, marginBottom: 4 }}>Login link sent</div>
              <div style={{ color: "#15803d", fontSize: 14 }}>
                Check your inbox at <strong>{email}</strong> and click the link to access your dashboard.
              </div>
              <button
                style={{ marginTop: 12, background: "none", border: "none", color: "#0b3b5b", cursor: "pointer", fontSize: 13, textDecoration: "underline", padding: 0 }}
                onClick={() => { setSent(false); setEmail(""); }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={requestLink}>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Facility email address
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourfacility.com.au"
                  required
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </label>

              {error ? (
                <div style={{ marginTop: 10, color: "#991b1b", fontSize: 13, background: "#fef2f2", borderRadius: 8, padding: "8px 12px" }}>
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={sending || !email.trim()}
                style={{
                  marginTop: 14,
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: sending || !email.trim() ? "#94a3b8" : "#0b3b5b",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: sending || !email.trim() ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Sending link..." : "Send login link"}
              </button>
            </form>
          )}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e5e7eb", fontSize: 13, color: "#94a3b8" }}>
            Not registered as a facility?{" "}
            <a href="mailto:info@nursinghomesnearme.com.au" style={{ color: "#0b3b5b", textDecoration: "underline" }}>
              Contact us
            </a>{" "}
            to get set up.
          </div>
        </div>
      </main>
    </div>
  );
}
