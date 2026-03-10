// src/components/AdminLogin.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/runtimeConfig";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const isAuthed = !!(localStorage.getItem("nhnm_admin_token") ?? "").trim();
  const cooldownMs = cooldownUntil ? Math.max(0, cooldownUntil - now) : 0;
  const inCooldown = cooldownMs > 0;

  useEffect(() => {
    if (!inCooldown) return;

    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [inCooldown]);

  // If already logged in, go to menu.
  if (isAuthed) {
    navigate("/admin/menu", { replace: true });
    return null;
  }

  async function login() {
    if (inCooldown) {
      setError(`Too many failed attempts. Try again in ${Math.ceil(cooldownMs / 1000)} seconds.`);
      return;
    }

    setError("");
    setBusy(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (!res.ok) {
        let serverMessage = "";
        try {
          const body = await res.json();
          serverMessage = typeof body?.message === "string" ? body.message : "";
        } catch {
          serverMessage = await res.text().catch(() => "");
        }

        if (res.status === 401) {
          const nextFailed = failedAttempts + 1;
          setFailedAttempts(nextFailed);

          if (nextFailed >= 5) {
            const until = Date.now() + 30_000;
            setCooldownUntil(until);
            setNow(Date.now());
            throw new Error("Too many failed attempts. Login is locked for 30 seconds.");
          }

          throw new Error("Incorrect password. Please try again.");
        }

        if (res.status >= 500) {
          throw new Error("Server error while signing in. Please try again shortly.");
        }

        throw new Error(serverMessage || `Login failed (${res.status}).`);
      }

      const data = (await res.json()) as { token?: string };
      if (!data?.token || !data.token.trim()) {
        throw new Error("Login failed: server did not return a token.");
      }

      localStorage.setItem("nhnm_admin_token", data.token.trim());
      setPassword("");
      setFailedAttempts(0);
      setCooldownUntil(null);
      setNow(Date.now());

      navigate("/admin/menu", { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", padding: 20, background: "#f8fafc" }}>
      <div style={shell}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, color: "#0b3b5b" }}>Admin Login</h1>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>
            API: {API_BASE}
          </div>
        </div>

        <p style={{ marginTop: 8, color: "#475569" }}>Enter password to access admin.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy && password.trim()) login();
          }}
        >
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900, color: "#334155", marginBottom: 6 }}>Password</div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              autoComplete="current-password"
            />
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
                color: "#475569",
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show password
            </label>
          </div>

          <button type="submit" disabled={busy || !password.trim() || inCooldown} style={primaryBtn}>
            {busy ? "Signing in..." : inCooldown ? `Try again in ${Math.ceil(cooldownMs / 1000)}s` : "Sign in"}
          </button>
        </form>

        {error ? (
          <div style={{ marginTop: 12, color: "#991b1b", fontWeight: 800 }}>{error}</div>
        ) : null}

        <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
          Tip: If you are stuck in admin, clear token in DevTools:
          <div style={{ fontFamily: "monospace", marginTop: 6 }}>
            localStorage.removeItem("nhnm_admin_token")
          </div>
        </div>
      </div>
    </div>
  );
}

const shell: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14,
};

const primaryBtn: React.CSSProperties = {
  marginTop: 12,
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #0b3b5b",
  background: "#0b3b5b",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};
