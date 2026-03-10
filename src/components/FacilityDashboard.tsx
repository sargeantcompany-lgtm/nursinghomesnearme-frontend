// src/components/FacilityDashboard.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { API_BASE } from "../lib/runtimeConfig";
import SeoHead from "./SeoHead";

type AvailabilityStatus = "available" | "waitlist" | "full";

type CaseMatch = {
  matchId: number;
  caseId: number;
  clientName: string;
  timing: string;
  careTypes: string;
  preferredSuburb: string;
  submittedAt: string;
  vacancyOutcome: string | null;
  facilityNotes: string | null;
  matchResponseToken: string | null;
};

type FacilityInfo = {
  id: number;
  name: string;
  suburb: string;
  availabilityStatus: AvailabilityStatus | null;
  availabilityUpdatedAt: string | null;
};

type DashboardData = {
  facility: FacilityInfo;
  matches: CaseMatch[];
};

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: "Vacancy Available",
  waitlist: "Waitlist Only",
  full: "Currently Full",
};

const STATUS_COLORS: Record<AvailabilityStatus, { bg: string; text: string; border: string }> = {
  available: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  waitlist: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  full: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
};

const OUTCOME_LABELS: Record<string, string> = {
  vacancy: "Vacancy offered",
  no_vacancy: "No vacancy",
  waitlist_offered: "Waitlist offered",
  needs_more_info: "Needs more info",
  "": "Not yet responded",
};

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function FacilityDashboard() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [token, setToken] = useState(() => tokenFromUrl || localStorage.getItem("nhnm_facility_token") || "");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Availability update
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Per-match inline respond
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseOutcome, setResponseOutcome] = useState("needs_more_info");
  const [responseNotes, setResponseNotes] = useState("");
  const [responseSaving, setResponseSaving] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      localStorage.setItem("nhnm_facility_token", tokenFromUrl);
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [token]);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/facility/dashboard`, {
        headers: authHeader(token),
      });
      if (res.status === 401) throw new Error("Session expired. Please request a new login link.");
      if (!res.ok) throw new Error("Unable to load dashboard. Please try again.");
      const json: DashboardData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function updateAvailability(status: AvailabilityStatus) {
    if (!token) return;
    setUpdatingStatus(true);
    setStatusMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/facility/availability`, {
        method: "PATCH",
        headers: authHeader(token),
        body: JSON.stringify({ availabilityStatus: status }),
      });
      if (!res.ok) throw new Error("Failed to update availability.");
      setData((prev) =>
        prev
          ? {
              ...prev,
              facility: {
                ...prev.facility,
                availabilityStatus: status,
                availabilityUpdatedAt: new Date().toISOString(),
              },
            }
          : prev,
      );
      setStatusMsg("Availability updated.");
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function submitResponse(matchResponseToken: string, matchId: number) {
    setResponseSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/facility/matches/${matchResponseToken}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vacancyOutcome: responseOutcome,
          facilityNotes: responseNotes,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit response.");
      // Update local state
      setData((prev) =>
        prev
          ? {
              ...prev,
              matches: prev.matches.map((m) =>
                m.matchId === matchId
                  ? { ...m, vacancyOutcome: responseOutcome, facilityNotes: responseNotes }
                  : m,
              ),
            }
          : prev,
      );
      setRespondingId(null);
      setResponseOutcome("needs_more_info");
      setResponseNotes("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit response.");
    } finally {
      setResponseSaving(false);
    }
  }

  // ── No token ──
  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <SeoHead title="Facility Dashboard | Nursing Homes Near Me" description="" canonicalUrl="" robots="noindex,nofollow" />
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ color: "#0b3b5b", marginBottom: 8 }}>Session not found</h1>
          <p style={{ color: "#64748b", marginBottom: 20 }}>Please use the login link sent to your email address.</p>
          <Link
            to="/facility/login"
            style={{ display: "inline-block", background: "#0b3b5b", color: "white", padding: "10px 20px", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}
          >
            Request a new login link
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748b" }}>Loading dashboard…</div>
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h2 style={{ color: "#991b1b", marginBottom: 8 }}>Unable to load dashboard</h2>
          <p style={{ color: "#64748b", marginBottom: 20 }}>{error}</p>
          <Link to="/facility/login" style={{ color: "#0b3b5b", textDecoration: "underline" }}>
            Request a new login link
          </Link>
        </div>
      </div>
    );
  }

  const { facility, matches } = data;
  const currentStatus = facility.availabilityStatus;
  const statusStyle = currentStatus ? STATUS_COLORS[currentStatus] : null;

  const pendingMatches = matches.filter((m) => !m.vacancyOutcome || m.vacancyOutcome === "needs_more_info");
  const respondedMatches = matches.filter((m) => m.vacancyOutcome && m.vacancyOutcome !== "needs_more_info");

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <SeoHead title="Facility Dashboard | Nursing Homes Near Me" description="" canonicalUrl="" robots="noindex,nofollow" />

      {/* Header */}
      <header style={{ padding: "16px 24px", backgroundColor: "#0b3b5b", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Nursing Homes Near Me</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Facility Portal</div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>{facility.name}</span>
          <button
            onClick={() => { localStorage.removeItem("nhnm_facility_token"); window.location.href = "/facility/login"; }}
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}
          >
            Log out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

        {/* Facility info + availability */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, color: "#0b3b5b", fontSize: 22, fontWeight: 800 }}>{facility.name}</h1>
              <div style={{ color: "#64748b", fontSize: 14, marginTop: 2 }}>{facility.suburb}</div>
            </div>
            {statusStyle && currentStatus ? (
              <div style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.text, borderRadius: 999, padding: "6px 14px", fontWeight: 700, fontSize: 14 }}>
                {STATUS_LABELS[currentStatus]}
              </div>
            ) : (
              <div style={{ background: "#f1f5f9", borderRadius: 999, padding: "6px 14px", color: "#64748b", fontSize: 14 }}>
                No status set
              </div>
            )}
          </div>

          {facility.availabilityUpdatedAt ? (
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>
              Last updated: {formatDate(facility.availabilityUpdatedAt)}
            </div>
          ) : null}

          {/* Availability controls */}
          <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>
              Update your current availability
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["available", "waitlist", "full"] as AvailabilityStatus[]).map((s) => {
                const col = STATUS_COLORS[s];
                const isActive = currentStatus === s;
                return (
                  <button
                    key={s}
                    onClick={() => updateAvailability(s)}
                    disabled={updatingStatus || isActive}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: `2px solid ${isActive ? col.border : "#e2e8f0"}`,
                      background: isActive ? col.bg : "white",
                      color: isActive ? col.text : "#334155",
                      fontWeight: isActive ? 800 : 600,
                      cursor: updatingStatus || isActive ? "default" : "pointer",
                      fontSize: 13,
                      transition: "all 0.15s",
                    }}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
            {statusMsg ? (
              <div style={{ marginTop: 8, fontSize: 13, color: "#166534" }}>{statusMsg}</div>
            ) : null}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total enquiries", value: matches.length },
            { label: "Awaiting response", value: pendingMatches.length },
            { label: "Responded", value: respondedMatches.length },
          ].map((s) => (
            <div key={s.label} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#0b3b5b" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pending enquiries */}
        {pendingMatches.length > 0 ? (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ margin: "0 0 12px", color: "#0b3b5b", fontSize: 17, fontWeight: 800 }}>
              Enquiries awaiting your response ({pendingMatches.length})
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              {pendingMatches.map((m) => (
                <MatchCard
                  key={m.matchId}
                  match={m}
                  isResponding={respondingId === m.matchId}
                  responseOutcome={responseOutcome}
                  responseNotes={responseNotes}
                  responseSaving={responseSaving}
                  onStartRespond={() => {
                    setRespondingId(m.matchId);
                    setResponseOutcome(m.vacancyOutcome || "needs_more_info");
                    setResponseNotes(m.facilityNotes || "");
                  }}
                  onOutcomeChange={setResponseOutcome}
                  onNotesChange={setResponseNotes}
                  onSubmit={() => m.matchResponseToken && submitResponse(m.matchResponseToken, m.matchId)}
                  onCancel={() => setRespondingId(null)}
                />
              ))}
            </div>
          </section>
        ) : (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20, textAlign: "center", color: "#64748b" }}>
            No pending enquiries at this time.
          </div>
        )}

        {/* Responded */}
        {respondedMatches.length > 0 ? (
          <section>
            <h2 style={{ margin: "0 0 12px", color: "#0b3b5b", fontSize: 17, fontWeight: 800 }}>
              Responded ({respondedMatches.length})
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              {respondedMatches.map((m) => (
                <MatchCard
                  key={m.matchId}
                  match={m}
                  isResponding={respondingId === m.matchId}
                  responseOutcome={responseOutcome}
                  responseNotes={responseNotes}
                  responseSaving={responseSaving}
                  onStartRespond={() => {
                    setRespondingId(m.matchId);
                    setResponseOutcome(m.vacancyOutcome || "needs_more_info");
                    setResponseNotes(m.facilityNotes || "");
                  }}
                  onOutcomeChange={setResponseOutcome}
                  onNotesChange={setResponseNotes}
                  onSubmit={() => m.matchResponseToken && submitResponse(m.matchResponseToken, m.matchId)}
                  onCancel={() => setRespondingId(null)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

/* ── Match card ── */
function MatchCard({
  match: m,
  isResponding,
  responseOutcome,
  responseNotes,
  responseSaving,
  onStartRespond,
  onOutcomeChange,
  onNotesChange,
  onSubmit,
  onCancel,
}: {
  match: CaseMatch;
  isResponding: boolean;
  responseOutcome: string;
  responseNotes: string;
  responseSaving: boolean;
  onStartRespond: () => void;
  onOutcomeChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const hasResponded = m.vacancyOutcome && m.vacancyOutcome !== "needs_more_info";

  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, borderLeft: hasResponded ? "4px solid #0D9488" : "4px solid #f59e0b" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800, color: "#0b3b5b", fontSize: 16 }}>{m.clientName || "Enquiry"}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
            Received: {formatDate(m.submittedAt)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {hasResponded ? (
            <span style={{ fontSize: 12, fontWeight: 700, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 999, padding: "4px 10px" }}>
              {OUTCOME_LABELS[m.vacancyOutcome!] || m.vacancyOutcome}
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: 999, padding: "4px 10px" }}>
              Awaiting response
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginTop: 12 }}>
        <Detail label="Preferred suburb" value={m.preferredSuburb} />
        <Detail label="Timing" value={m.timing} />
        <Detail label="Care type" value={m.careTypes} />
        {m.facilityNotes ? <Detail label="Your notes" value={m.facilityNotes} /> : null}
      </div>

      {/* Respond inline */}
      {isResponding ? (
        <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#334155" }}>Update response</div>

          <label style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Vacancy outcome</div>
            <select
              value={responseOutcome}
              onChange={(e) => onOutcomeChange(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
            >
              <option value="vacancy">Vacancy available</option>
              <option value="waitlist_offered">Can offer waitlist</option>
              <option value="no_vacancy">No vacancy</option>
              <option value="needs_more_info">Need more information</option>
            </select>
          </label>

          <label style={{ display: "block", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Notes (optional)</div>
            <textarea
              value={responseNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              placeholder="e.g. Room available from 1 July, suite 4B"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
            />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onSubmit}
              disabled={responseSaving}
              style={{ padding: "9px 16px", borderRadius: 8, background: "#0b3b5b", color: "white", border: "none", fontWeight: 700, fontSize: 13, cursor: responseSaving ? "not-allowed" : "pointer" }}
            >
              {responseSaving ? "Saving..." : "Save response"}
            </button>
            <button
              onClick={onCancel}
              style={{ padding: "9px 16px", borderRadius: 8, background: "white", color: "#334155", border: "1px solid #e2e8f0", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={onStartRespond}
            style={{ padding: "8px 14px", borderRadius: 8, background: "white", color: "#0b3b5b", border: "1px solid #0b3b5b", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            {hasResponded ? "Update response" : "Respond to enquiry"}
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 13, color: "#334155", marginTop: 1 }}>{value}</div>
    </div>
  );
}
