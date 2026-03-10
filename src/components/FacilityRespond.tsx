import { useState } from "react";
import { apiFetch } from "../lib/api";

type VacancyOutcome = "vacancy" | "no_vacancy" | "waitlist_offered" | "needs_more_info";
type WaitlistStatus = "not_requested" | "requested" | "confirmed";

function getTokenFromPath(): string {
  return window.location.pathname.replace("/facility/respond/", "").trim();
}

export default function FacilityRespond() {
  const token = getTokenFromPath();

  const [vacancyOutcome, setVacancyOutcome] = useState<VacancyOutcome>("needs_more_info");
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus>("not_requested");
  const [facilityNotes, setFacilityNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    if (!token) return;
    setSaving(true);
    setOk("");
    setError("");

    try {
      await apiFetch(`/api/facility/matches/${token}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vacancyOutcome, waitlistStatus, facilityNotes }),
      });
      setOk("Response received. Thank you.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit response");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 20 }}>
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h1 style={{ margin: 0, color: "#0b3b5b" }}>Facility Enquiry Response</h1>
        <p style={{ color: "#475569" }}>Please update vacancy outcome for this referral.</p>

        <label style={{ display: "block", marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Vacancy outcome</div>
          <select
            value={vacancyOutcome}
            onChange={(e) => setVacancyOutcome(e.target.value as VacancyOutcome)}
            style={inputStyle}
          >
            <option value="vacancy">Vacancy available</option>
            <option value="no_vacancy">No vacancy</option>
            <option value="waitlist_offered">Can waitlist</option>
            <option value="needs_more_info">Need more info</option>
          </select>
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Waitlist status</div>
          <select
            value={waitlistStatus}
            onChange={(e) => setWaitlistStatus(e.target.value as WaitlistStatus)}
            style={inputStyle}
            disabled={vacancyOutcome !== "waitlist_offered"}
          >
            <option value="not_requested">Not requested</option>
            <option value="requested">Requested</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Notes (optional)</div>
          <textarea
            value={facilityNotes}
            onChange={(e) => setFacilityNotes(e.target.value)}
            rows={5}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>

        <div style={{ marginTop: 14 }}>
          <button onClick={submit} disabled={saving} style={btnStyle}>
            {saving ? "Submitting..." : "Submit response"}
          </button>
        </div>

        {ok ? <div style={{ color: "#166534", marginTop: 10 }}>{ok}</div> : null}
        {error ? <div style={{ color: "#991b1b", marginTop: 10 }}>{error}</div> : null}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14,
};

const btnStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #0b3b5b",
  background: "#0b3b5b",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};