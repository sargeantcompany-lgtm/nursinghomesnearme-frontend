import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { API_BASE } from "../lib/runtimeConfig";

type Category = "REAL_ESTATE" | "FURNITURE_REMOVAL" | "AGED_CARE_SERVICES" | "OTHER";
type FeeType = "FIXED" | "PERCENT";
type PaymentTrigger = "SETTLEMENT" | "INVOICE_PAID" | "OTHER";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

export default function ReferralAgreement() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState<string>("");

  // Provider (you)
  const [providerBusinessName, setProviderBusinessName] = useState("Nursing Homes Near Me");
  const [providerAbn, setProviderAbn] = useState("");

  // Partner (referrer)
  const [partnerName, setPartnerName] = useState("");
  const [partnerBusinessName, setPartnerBusinessName] = useState("");
  const [partnerAbn, setPartnerAbn] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");

  // Terms
  const [category, setCategory] = useState<Category>("AGED_CARE_SERVICES");
  const [feeType, setFeeType] = useState<FeeType>("FIXED");
  const [feeValue, setFeeValue] = useState("500"); // example
  const [paymentTrigger, setPaymentTrigger] = useState<PaymentTrigger>("INVOICE_PAID");

  // Optional referral info
  const [referredClientName, setReferredClientName] = useState("");
  const [referredClientEmail, setReferredClientEmail] = useState("");
  const [referredClientPhone, setReferredClientPhone] = useState("");

  // Acceptance
  const [signedName, setSignedName] = useState("");
  const [accepted, setAccepted] = useState(false);

  const termsVersion = "v1";

  const termsText = useMemo(() => {
    const catLabel =
      category === "REAL_ESTATE"
        ? "Real estate services"
        : category === "FURNITURE_REMOVAL"
        ? "Furniture removal"
        : category === "AGED_CARE_SERVICES"
        ? "Aged care services"
        : "Other services";

    const feeLabel = feeType === "FIXED" ? `Fixed fee: $${feeValue} AUD` : `Percentage: ${feeValue}%`;

    const triggerLabel =
      paymentTrigger === "SETTLEMENT"
        ? "On settlement"
        : paymentTrigger === "INVOICE_PAID"
        ? "After invoice is paid in full"
        : "Other trigger as agreed";

    return `REFERRAL PARTNER AGREEMENT (${termsVersion})

This Agreement is between:
Provider: ${providerBusinessName}${providerAbn.trim() ? ` (ABN ${providerAbn.trim()})` : ""} (“Provider”)
and
Referral Partner: ${partnerName || "[Partner Name]"}${partnerBusinessName.trim() ? ` (${partnerBusinessName.trim()})` : ""}${
      partnerAbn.trim() ? ` (ABN ${partnerAbn.trim()})` : ""
    } (“Partner”)

1) Purpose
Partner may introduce clients to Provider for: ${catLabel}.

2) Referral definition
A “Referral” is a client introduction made by Partner to Provider where the client engages Provider within 90 days of the introduction.

3) Referral fee
Fee: ${feeLabel}
Payment trigger: ${triggerLabel}
Payment timeframe: Provider pays Partner within 7 business days of the trigger event.

4) No employment / no exclusivity
Partner is an independent contractor. This Agreement is not exclusive.

5) Confidentiality & privacy
Both parties agree to keep client information confidential and comply with privacy laws.

6) No guarantees
Provider makes no guarantee of acceptance, pricing, or outcomes for referred clients.

7) Disputes
Good faith negotiation first. If unresolved, mediation in Queensland.

8) Term & termination
Either party may terminate with 7 days notice. Referrals received before termination remain payable if the trigger event occurs.

9) Electronic acceptance
Partner agrees this Agreement can be accepted electronically, and stored digital records are evidence of acceptance.
`;
  }, [
    category,
    feeType,
    feeValue,
    paymentTrigger,
    providerBusinessName,
    providerAbn,
    partnerName,
    partnerBusinessName,
    partnerAbn,
  ]);

  async function submit() {
    setError("");
    setOk("");

    if (!partnerName.trim()) return setError("Partner name is required.");
    if (!partnerEmail.trim()) return setError("Partner email is required.");
    if (!signedName.trim()) return setError("Typed signature name is required.");
    if (!accepted) return setError("You must tick the acceptance box.");

    setBusy(true);
    try {
      const payload = {
        category,
        providerBusinessName: providerBusinessName.trim(),
        providerAbn: providerAbn.trim() || null,

        partnerName: partnerName.trim(),
        partnerBusinessName: partnerBusinessName.trim() || null,
        partnerAbn: partnerAbn.trim() || null,
        partnerEmail: partnerEmail.trim(),
        partnerPhone: partnerPhone.trim() || null,

        feeType,
        feeValue: feeValue.trim(),
        paymentTrigger,

        referredClientName: referredClientName.trim() || null,
        referredClientEmail: referredClientEmail.trim() || null,
        referredClientPhone: referredClientPhone.trim() || null,

        termsVersion,
        termsText,
        signedName: signedName.trim(),
      };

      const res = await fetch(`${API_BASE}/api/referrals/agreements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
      }

      const data = (await res.json()) as { partnerId: number; agreementId: number };
      setOk(`Saved. Partner ID: ${data.partnerId} | Agreement ID: ${data.agreementId}`);
      setAccepted(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", padding: 20, background: "#f8fafc" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ margin: 0, color: "#0b3b5b" }}>Referral Partner Agreement</h1>
        <p style={{ marginTop: 8, color: "#475569" }}>
          Fill this in, preview the agreement text, then sign online.
        </p>

        <div style={card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Provider business name" value={providerBusinessName} onChange={setProviderBusinessName} disabled={busy} />
            <Field label="Provider ABN (optional)" value={providerAbn} onChange={setProviderAbn} disabled={busy} />

            <Field label="Partner name" value={partnerName} onChange={setPartnerName} disabled={busy} />
            <Field label="Partner business name (optional)" value={partnerBusinessName} onChange={setPartnerBusinessName} disabled={busy} />

            <Field label="Partner email" value={partnerEmail} onChange={setPartnerEmail} disabled={busy} />
            <Field label="Partner phone (optional)" value={partnerPhone} onChange={setPartnerPhone} disabled={busy} />

            <Field label="Partner ABN (optional)" value={partnerAbn} onChange={setPartnerAbn} disabled={busy} />

            <label style={{ display: "block" }}>
              <div style={labelStyle}>Category</div>
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)} disabled={busy} style={inputStyle}>
                <option value="REAL_ESTATE">REAL_ESTATE</option>
                <option value="FURNITURE_REMOVAL">FURNITURE_REMOVAL</option>
                <option value="AGED_CARE_SERVICES">AGED_CARE_SERVICES</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>

            <label style={{ display: "block" }}>
              <div style={labelStyle}>Fee type</div>
              <select value={feeType} onChange={(e) => setFeeType(e.target.value as FeeType)} disabled={busy} style={inputStyle}>
                <option value="FIXED">FIXED</option>
                <option value="PERCENT">PERCENT</option>
              </select>
            </label>

            <Field
              label={feeType === "FIXED" ? "Fee value (AUD)" : "Fee value (%)"}
              value={feeValue}
              onChange={setFeeValue}
              disabled={busy}
            />

            <label style={{ display: "block" }}>
              <div style={labelStyle}>Payment trigger</div>
              <select
                value={paymentTrigger}
                onChange={(e) => setPaymentTrigger(e.target.value as PaymentTrigger)}
                disabled={busy}
                style={inputStyle}
              >
                <option value="SETTLEMENT">SETTLEMENT</option>
                <option value="INVOICE_PAID">INVOICE_PAID</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, color: "#0b3b5b" }}>Optional referral details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 10 }}>
              <Field label="Referred client name" value={referredClientName} onChange={setReferredClientName} disabled={busy} />
              <Field label="Referred client email" value={referredClientEmail} onChange={setReferredClientEmail} disabled={busy} />
              <Field label="Referred client phone" value={referredClientPhone} onChange={setReferredClientPhone} disabled={busy} />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 900, color: "#0b3b5b", marginBottom: 8 }}>Agreement preview</div>
            <pre style={previewBox}>{termsText}</pre>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
              Stored snapshot: <b>{termsVersion}</b>
            </div>
          </div>

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Typed signature (full name)" value={signedName} onChange={setSignedName} disabled={busy} />
            <div />
          </div>

          <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={busy}
            />
            <span style={{ color: "#111827", fontWeight: 700 }}>
              I agree to the terms above and accept electronically.
            </span>
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button onClick={submit} disabled={busy} style={primaryBtn(busy)}>
              {busy ? "Saving..." : "Sign & Save Agreement"}
            </button>

            <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>
              API: {API_BASE}/api/referrals/agreements
            </div>
          </div>

          {error ? <Alert color="#991b1b" bg="#fee2e2" title="Error" text={error} /> : null}
          {ok ? <Alert color="#166534" bg="#dcfce7" title="OK" text={ok} /> : null}
        </div>
      </div>
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <label style={{ display: "block" }}>
      <div style={labelStyle}>{props.label}</div>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
        style={inputStyle}
      />
    </label>
  );
}

function Alert(props: { color: string; bg: string; title: string; text: string }) {
  return (
    <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: props.bg }}>
      <strong style={{ color: props.color }}>{props.title}:</strong>{" "}
      <span style={{ color: props.color }}>{props.text}</span>
    </div>
  );
}

const card: CSSProperties = {
  marginTop: 14,
  padding: 14,
  background: "white",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: "#334155",
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14,
};

const previewBox: CSSProperties = {
  whiteSpace: "pre-wrap",
  background: "#0b1220",
  color: "white",
  padding: 12,
  borderRadius: 12,
  border: "1px solid #111827",
  maxHeight: 360,
  overflow: "auto",
  fontSize: 13,
  lineHeight: 1.5,
};

const primaryBtn = (disabled: boolean): CSSProperties => ({
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #0b3b5b",
  background: "#0b3b5b",
  color: "white",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 900,
  opacity: disabled ? 0.7 : 1,
});
