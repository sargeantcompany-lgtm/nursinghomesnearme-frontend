// src/components/AdminCases.tsx
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { API_BASE, TOKEN_ENV } from "../lib/runtimeConfig";
import { adminFetch } from "../lib/api";

type ListType = "FULL" | "SHORT";

type FacilityItem = {
  caseFacilityId: number;
  nursingHomeId: number;
  name: string;
  suburb: string;
  state: string;
  postcode?: string | null;
  listType: ListType;
  sortOrder?: number | null;
};

type CaseSummaryApi = {
  id: number;
  clientEmail: string;
  clientName?: string | null;
  clientSuburb?: string | null;
  publicToken: string;
  active?: boolean;
};

type ResidentialIntake = {
  preferredHomes: string;
  currentLocation: string;
  hospitalWard: string;
  residentialPermanentApproved: string;
  myAgedCareReferralCode: string;
  hasEpoa: string;
  qcatOrder: string;
  qcatCaseNumber: string;
  memorySupportRequired: string;
  advanceHealthDirective: string;
  ndisPlan: string;
  supportAtHome: string;
  supportAtHomeStartDate: string;
  pensionType: string;
  pensionOrDvaNumber: string;
  medicareNumber: string;
  sa457Sa485Status: string;
  estimatedAnnualIncome: string;
  homeHasSpouseOrDependent: string;
  carerInHomeTwoYears: string;
  closeFamilyCarerFiveYears: string;
  correspondenceRecipient: string;
};

type ClientCase = {
  id: number;
  publicToken: string;

  enquiryId?: number | null;

  clientEmail: string;
  clientName?: string | null;
  clientSuburb?: string | null;

  createdAt?: string;
  updatedAt?: string;

  contactName?: string | null;
  contactPhone?: string | null;
  preferredSuburbArea?: string | null;

  timing?: string | null;
  currentLocation?: string | null;
  dischargeDate?: string | null;

  placementNeed?: string | null;

  patientName?: string | null;
  relationshipToPatient?: string | null;
  placementForName?: string | null;
  placementForDob?: string | null;
  placementForRelation?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  pensionStatus?: string | null;
  livingSituation?: string | null;
  ownHome?: string | null;
  someoneLivingInHome?: string | null;
  whoLivingInHome?: string | null;

  haveHadAcat?: string | null;
  acatApprovedFor?: string | null;
  mobility?: string | null;
  cognition?: string | null;
  behaviours?: string | null;
  continence?: string | null;
  otherConcerns?: string | null;

  notes?: string | null;

  radRange?: string | null;
  paymentPreference?: string | null;
  govtHelpAccommodation?: string | null;
  meansTested?: string | null;
  fundingNotes?: string | null;

  consentToShare?: string | null;
  residentialIntake?: Partial<ResidentialIntake>;
  preferredHomes?: string | null;
  hospitalWard?: string | null;
  residentialPermanentApproved?: string | null;
  myAgedCareReferralCode?: string | null;
  hasEpoa?: string | null;
  qcatOrder?: string | null;
  qcatCaseNumber?: string | null;
  memorySupportRequired?: string | null;
  advanceHealthDirective?: string | null;
  ndisPlan?: string | null;
  supportAtHome?: string | null;
  supportAtHomeStartDate?: string | null;
  pensionType?: string | null;
  pensionOrDvaNumber?: string | null;
  medicareNumber?: string | null;
  sa457Sa485Status?: string | null;
  estimatedAnnualIncome?: string | null;
  homeHasSpouseOrDependent?: string | null;
  carerInHomeTwoYears?: string | null;
  closeFamilyCarerFiveYears?: string | null;
  correspondenceRecipient?: string | null;

  internalCaseNotes?: string | null;
  active?: boolean;

  fullList?: FacilityItem[];
  shortList?: FacilityItem[];
};

type CaseListItem = {
  id: number;
  clientName?: string | null;
  patientName?: string | null;
  preferredSuburbArea?: string | null;
  timing?: string | null;
  createdAt?: string | null;
  active?: boolean;
};

type FormState = {
  enquiryId: string;

  clientEmail: string;
  clientName: string;
  clientSuburb: string;

  contactName: string;
  contactPhone: string;
  preferredSuburbArea: string;

  timing: string;
  currentLocation: string;
  dischargeDate: string;

  placementNeed: string;

  patientName: string;
  relationshipToPatient: string;
  gender: string;
  maritalStatus: string;
  pensionStatus: string;
  livingSituation: string;
  ownHome: string;
  someoneLivingInHome: string;
  whoLivingInHome: string;

  haveHadAcat: string;
  acatApprovedFor: string;
  mobility: string;
  cognition: string;
  behaviours: string;
  continence: string;
  otherConcerns: string;

  notes: string;

  radRange: string;
  paymentPreference: string;
  govtHelpAccommodation: string;
  meansTested: string;
  fundingNotes: string;

  consentToShare: string;

  internalCaseNotes: string;
  active: boolean;
};

function emptyForm(): FormState {
  return {
    enquiryId: "",
    clientEmail: "",
    clientName: "",
    clientSuburb: "",

    contactName: "",
    contactPhone: "",
    preferredSuburbArea: "",

    timing: "",
    currentLocation: "",
    dischargeDate: "",

    placementNeed: "",

    patientName: "",
    relationshipToPatient: "",
    gender: "",
    maritalStatus: "",
    pensionStatus: "",
    livingSituation: "",
    ownHome: "",
    someoneLivingInHome: "",
    whoLivingInHome: "",

    haveHadAcat: "",
    acatApprovedFor: "",
    mobility: "",
    cognition: "",
    behaviours: "",
    continence: "",
    otherConcerns: "",

    notes: "",

    radRange: "",
    paymentPreference: "",
    govtHelpAccommodation: "",
    meansTested: "",
    fundingNotes: "",

    consentToShare: "",

    internalCaseNotes: "",
    active: true,
  };
}

function emptyResidentialIntake(): ResidentialIntake {
  return {
    preferredHomes: "",
    currentLocation: "",
    hospitalWard: "",
    residentialPermanentApproved: "",
    myAgedCareReferralCode: "",
    hasEpoa: "",
    qcatOrder: "",
    qcatCaseNumber: "",
    memorySupportRequired: "",
    advanceHealthDirective: "",
    ndisPlan: "",
    supportAtHome: "",
    supportAtHomeStartDate: "",
    pensionType: "",
    pensionOrDvaNumber: "",
    medicareNumber: "",
    sa457Sa485Status: "",
    estimatedAnnualIncome: "",
    homeHasSpouseOrDependent: "",
    carerInHomeTwoYears: "",
    closeFamilyCarerFiveYears: "",
    correspondenceRecipient: "",
  };
}

function getResidentialIntakeFromCase(c: ClientCase): ResidentialIntake {
  const base = emptyResidentialIntake();
  if (c.residentialIntake) {
    return {
      ...base,
      ...c.residentialIntake,
      currentLocation: toStr(c.residentialIntake.currentLocation ?? c.currentLocation),
    };
  }

  return {
    ...base,
    preferredHomes: toStr(c.preferredHomes),
    currentLocation: toStr(c.currentLocation),
    hospitalWard: toStr(c.hospitalWard),
    residentialPermanentApproved: toStr(c.residentialPermanentApproved),
    myAgedCareReferralCode: toStr(c.myAgedCareReferralCode),
    hasEpoa: toStr(c.hasEpoa),
    qcatOrder: toStr(c.qcatOrder),
    qcatCaseNumber: toStr(c.qcatCaseNumber),
    memorySupportRequired: toStr(c.memorySupportRequired),
    advanceHealthDirective: toStr(c.advanceHealthDirective),
    ndisPlan: toStr(c.ndisPlan),
    supportAtHome: toStr(c.supportAtHome),
    supportAtHomeStartDate: toStr(c.supportAtHomeStartDate),
    pensionType: toStr(c.pensionType),
    pensionOrDvaNumber: toStr(c.pensionOrDvaNumber),
    medicareNumber: toStr(c.medicareNumber),
    sa457Sa485Status: toStr(c.sa457Sa485Status),
    estimatedAnnualIncome: toStr(c.estimatedAnnualIncome),
    homeHasSpouseOrDependent: toStr(c.homeHasSpouseOrDependent),
    carerInHomeTwoYears: toStr(c.carerInHomeTwoYears),
    closeFamilyCarerFiveYears: toStr(c.closeFamilyCarerFiveYears),
    correspondenceRecipient: toStr(c.correspondenceRecipient),
  };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

function toStr(v: unknown): string {
  return v == null ? "" : String(v);
}

export default function AdminCases() {
  const [token, setToken] = useState<string>(() => {
    const saved = localStorage.getItem("nhnm_admin_token");
    return saved ?? (TOKEN_ENV ?? "");
  });

  const [list, setList] = useState<CaseListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingOne, setLoadingOne] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<null | "short" | "full">(null);
  const [sendingDashboardLink, setSendingDashboardLink] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [current, setCurrent] = useState<ClientCase | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [intakeForm, setIntakeForm] = useState<ResidentialIntake>(emptyResidentialIntake());
  const [newCaseEmail, setNewCaseEmail] = useState("");
  const [newCaseName, setNewCaseName] = useState("");
  const [newCaseSuburb, setNewCaseSuburb] = useState("");

  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }, [list]);

  async function refreshList() {
    setError("");
    setNotice("");
    setLoadingList(true);
    try {
      const data = await adminFetch<CaseSummaryApi[]>("/api/admin/cases", token);

      const items: CaseListItem[] = (data ?? []).map((c) => ({
        id: c.id,
        clientName: c.clientName ?? c.clientEmail ?? null,
        patientName: null,
        preferredSuburbArea: c.clientSuburb ?? null,
        timing: null,
        createdAt: null,
        active: c.active ?? true,
      }));

      setList(items);

      if (selectedId == null && items.length) {
        setSelectedId(items[0].id);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingList(false);
    }
  }

  async function loadOne(id: number) {
    setError("");
    setNotice("");
    setLoadingOne(true);
    try {
      const c = await adminFetch<ClientCase>(`/api/admin/cases/${id}`, token);
      setCurrent(c);
      setIntakeForm(getResidentialIntakeFromCase(c));

      setForm({
        enquiryId: c.enquiryId == null ? "" : String(c.enquiryId),

        clientEmail: toStr(c.clientEmail),
        clientName: toStr(c.clientName),
        clientSuburb: toStr(c.clientSuburb),

        contactName: toStr(c.contactName),
        contactPhone: toStr(c.contactPhone),
        preferredSuburbArea: toStr(c.preferredSuburbArea),

        timing: toStr(c.timing),
        currentLocation: toStr(c.currentLocation),
        dischargeDate: toStr(c.dischargeDate),

        placementNeed: toStr(c.placementNeed),

        patientName: toStr(c.patientName),
        relationshipToPatient: toStr(c.relationshipToPatient || c.placementForRelation),
        gender: toStr(c.gender),
        maritalStatus: toStr(c.maritalStatus),
        pensionStatus: toStr(c.pensionStatus),
        livingSituation: toStr(c.livingSituation),
        ownHome: toStr(c.ownHome),
        someoneLivingInHome: toStr(c.someoneLivingInHome),
        whoLivingInHome: toStr(c.whoLivingInHome),

        haveHadAcat: toStr(c.haveHadAcat),
        acatApprovedFor: toStr(c.acatApprovedFor),
        mobility: toStr(c.mobility),
        cognition: toStr(c.cognition),
        behaviours: toStr(c.behaviours),
        continence: toStr(c.continence),
        otherConcerns: toStr(c.otherConcerns),

        notes: toStr(c.notes),

        radRange: toStr(c.radRange),
        paymentPreference: toStr(c.paymentPreference),
        govtHelpAccommodation: toStr(c.govtHelpAccommodation),
        meansTested: toStr(c.meansTested),
        fundingNotes: toStr(c.fundingNotes),

        consentToShare: toStr(c.consentToShare),

        internalCaseNotes: toStr(c.internalCaseNotes),
        active: c.active ?? true,
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingOne(false);
    }
  }

  async function save() {
    if (!current) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const payload = {
        enquiryId: form.enquiryId.trim() ? Number(form.enquiryId.trim()) : null,

        clientEmail: form.clientEmail.trim() || current.clientEmail,
        clientName: form.clientName.trim() || null,
        clientSuburb: form.clientSuburb.trim() || null,

        contactName: form.contactName.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
        preferredSuburbArea: form.preferredSuburbArea.trim() || null,

        timing: form.timing.trim() || null,
        currentLocation: form.currentLocation.trim() || intakeForm.currentLocation.trim() || null,
        dischargeDate: form.dischargeDate.trim() ? form.dischargeDate.trim() : null,

        placementNeed: form.placementNeed.trim() || null,

        patientName: form.patientName.trim() || null,
        relationshipToPatient: form.relationshipToPatient.trim() || null,
        placementForName: form.patientName.trim() || null,
        placementForDob: null,
        placementForRelation: form.relationshipToPatient.trim() || null,
        gender: form.gender.trim() || null,
        maritalStatus: form.maritalStatus.trim() || null,
        pensionStatus: form.pensionStatus.trim() || null,
        livingSituation: form.livingSituation.trim() || null,
        ownHome: form.ownHome.trim() || null,
        someoneLivingInHome: form.someoneLivingInHome.trim() || null,
        whoLivingInHome: form.whoLivingInHome.trim() || null,

        haveHadAcat: form.haveHadAcat.trim() || null,
        acatApprovedFor: form.acatApprovedFor.trim() || null,
        mobility: form.mobility.trim() || null,
        cognition: form.cognition.trim() || null,
        behaviours: form.behaviours.trim() || null,
        continence: form.continence.trim() || null,
        otherConcerns: form.otherConcerns.trim() || null,

        notes: form.notes.trim() || null,

        radRange: form.radRange.trim() || null,
        paymentPreference: form.paymentPreference.trim() || null,
        govtHelpAccommodation: form.govtHelpAccommodation.trim() || null,
        meansTested: form.meansTested.trim() || null,
        fundingNotes: form.fundingNotes.trim() || null,

        consentToShare: form.consentToShare.trim() || null,
        residentialIntake: intakeForm,

        internalCaseNotes: form.internalCaseNotes.trim() || null,
        active: form.active,
      };

      let updated: ClientCase;
      let savedWithFallback = false;
      try {
        updated = await adminFetch<ClientCase>(`/api/admin/cases/${current.id}/file`, token, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } catch {
        // Backward compatibility: retry without the new intake object.
        const fallbackPayload = { ...payload };
        delete (fallbackPayload as { residentialIntake?: ResidentialIntake }).residentialIntake;
        updated = await adminFetch<ClientCase>(`/api/admin/cases/${current.id}/file`, token, {
          method: "PATCH",
          body: JSON.stringify(fallbackPayload),
        });
        savedWithFallback = true;
      }

      setCurrent(updated);
      setIntakeForm(getResidentialIntakeFromCase(updated));
      setNotice(
        savedWithFallback
          ? `Saved case file (ID ${updated.id}) without residential intake fields (backend schema pending).`
          : `Saved case file (ID ${updated.id}).`,
      );
      await refreshList();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function createCase() {
    const clientEmail = newCaseEmail.trim();
    if (!clientEmail) {
      setError("Client email is required to create a case.");
      return;
    }

    setError("");
    setNotice("");
    setCreating(true);
    try {
      const created = await adminFetch<CaseSummaryApi>("/api/admin/cases", token, {
        method: "POST",
        body: JSON.stringify({
          clientEmail,
          clientName: newCaseName.trim() || null,
          clientSuburb: newCaseSuburb.trim() || null,
        }),
      });

      setNotice(`Created case #${created.id}.`);
      setNewCaseEmail("");
      setNewCaseName("");
      setNewCaseSuburb("");
      await refreshList();
      setSelectedId(created.id);
      await loadOne(created.id);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  async function send(kind: "short" | "full") {
    if (!current) return;
    setError("");
    setNotice("");
    setSending(kind);
    try {
      await adminFetch<void>(`/api/admin/cases/${current.id}/send-${kind}`, token, {
        method: "POST",
      });
      setNotice(`Sent ${kind.toUpperCase()} list email to ${current.clientEmail}.`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSending(null);
    }
  }

  async function sendDashboardLink() {
    if (!current?.clientEmail?.trim()) {
      setError("Client email is required before sending a dashboard link.");
      return;
    }

    setError("");
    setNotice("");
    setSendingDashboardLink(true);
    try {
      const res = await fetch(`${API_BASE}/api/workflow/request-login-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: current.clientEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to send dashboard link.");
      setNotice(`Sent dashboard link to ${current.clientEmail}.`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSendingDashboardLink(false);
    }
  }

  useEffect(() => {
    localStorage.setItem("nhnm_admin_token", token);
  }, [token]);

  useEffect(() => {
    refreshList().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId == null) return;
    loadOne(selectedId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const disabled = loadingList || loadingOne || saving || creating || sending != null;

  const shortCount = current?.shortList?.length ?? 0;
  const fullCount = current?.fullList?.length ?? 0;

  function setIntakeField<K extends keyof ResidentialIntake>(key: K, value: ResidentialIntake[K]) {
    setIntakeForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div style={{ minHeight: "100vh", padding: 20, background: "#f8fafc" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ margin: 0, color: "#0b3b5b" }}>Admin: Case Files</h1>
        <p style={{ marginTop: 8, color: "#334155" }}>
          Case file editor + email send. Facilities in case: Short={shortCount} / Full={fullCount}
        </p>

        <div style={topCard}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>Admin Token</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token here (X-Admin-Token)"
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={() => refreshList()} disabled={disabled} style={primaryBtn}>
              {loadingList ? "Refreshing..." : "Refresh Cases"}
            </button>

            <div style={{ marginLeft: "auto", color: "#64748b", fontSize: 13 }}>
              API: {API_BASE} /api/admin/cases
            </div>
          </div>

          {error ? <Alert color="#991b1b" bg="#fee2e2" title="Error" text={error} /> : null}
          {notice ? <Alert color="#166534" bg="#dcfce7" title="OK" text={notice} /> : null}
        </div>

        <div style={topCard}>
          <div style={{ fontWeight: 800, color: "#0b3b5b", marginBottom: 8 }}>
            Create New Case File
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <input
              value={newCaseEmail}
              onChange={(e) => setNewCaseEmail(e.target.value)}
              placeholder="Client email (required)"
              style={inputStyle}
            />
            <input
              value={newCaseName}
              onChange={(e) => setNewCaseName(e.target.value)}
              placeholder="Client name (optional)"
              style={inputStyle}
            />
            <input
              value={newCaseSuburb}
              onChange={(e) => setNewCaseSuburb(e.target.value)}
              placeholder="Client suburb (optional)"
              style={inputStyle}
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => createCase()}
              disabled={disabled || !newCaseEmail.trim()}
              style={primaryBtn}
            >
              {creating ? "Creating..." : "Create Case"}
            </button>
          </div>
        </div>

        <div style={gridWrap}>
          {/* LEFT */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 800, marginBottom: 10, color: "#0b3b5b" }}>
              Cases ({sortedList.length})
            </div>

            <select
              value={selectedId == null ? "" : String(selectedId)}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              disabled={disabled || !sortedList.length}
              style={inputStyle}
            >
              {!sortedList.length ? <option value="">No cases yet</option> : null}
              {sortedList.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} — {c.patientName || c.clientName || "Unnamed"}{" "}
                  {c.active === false ? "(CLOSED)" : ""}
                </option>
              ))}
            </select>

            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              Tip: open a case and keep your working notes in <b>Internal Case Notes</b>.
            </div>
          </div>

          {/* RIGHT */}
          <div style={cardStyle}>
            {!current ? (
              <div style={{ color: "#64748b" }}>Select a case to edit.</div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 800, color: "#0b3b5b" }}>
                    Edit Case File (ID {current.id})
                  </div>
                  {loadingOne ? <span style={{ color: "#64748b" }}>Loading…</span> : null}
                  <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>
                    Public token: <code>{current.publicToken}</code>
                  </div>
                </div>

                <SectionTitle text="Email sending" />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ color: "#475569", fontSize: 13 }}>
                    Sends to: <b>{current.clientEmail}</b> — Short={shortCount} / Full={fullCount}
                  </div>

                  <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => sendDashboardLink()}
                      disabled={disabled || sendingDashboardLink || !current.clientEmail?.trim()}
                      style={secondaryBtn}
                    >
                      {sendingDashboardLink ? "Sending dashboard..." : "Send dashboard link"}
                    </button>
                    <button
                      onClick={() => send("short")}
                      disabled={disabled || shortCount === 0}
                      style={secondaryBtn}
                      title={shortCount === 0 ? "No facilities in SHORT list" : ""}
                    >
                      {sending === "short" ? "Sending..." : "Send SHORT list"}
                    </button>
                    <button
                      onClick={() => send("full")}
                      disabled={disabled || fullCount === 0}
                      style={primaryBtn}
                      title={fullCount === 0 ? "No facilities in FULL list" : ""}
                    >
                      {sending === "full" ? "Sending..." : "Send FULL list"}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <FacilityList title="Short list (emailed)" items={current.shortList ?? []} />
                  <FacilityList title="Full list (emailed)" items={current.fullList ?? []} />
                </div>

                <SectionTitle text="Status" />
                <Grid2>
                  <label style={{ display: "block" }}>
                    <div style={labelStyle}>Active</div>
                    <select
                      value={form.active ? "true" : "false"}
                      onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === "true" }))}
                      disabled={disabled}
                      style={inputStyle}
                    >
                      <option value="true">ACTIVE</option>
                      <option value="false">CLOSED</option>
                    </select>
                  </label>
                  <Field
                    label="Enquiry ID (optional)"
                    value={form.enquiryId}
                    onChange={(v) => setForm((p) => ({ ...p, enquiryId: v }))}
                    disabled={disabled}
                  />
                </Grid2>

                <SectionTitle text="Contact (person submitting form)" />
                <Grid2>
                  <Field label="Contact name" value={form.contactName} onChange={(v) => setForm((p) => ({ ...p, contactName: v }))} disabled={disabled} />
                  <Field label="Phone" value={form.contactPhone} onChange={(v) => setForm((p) => ({ ...p, contactPhone: v }))} disabled={disabled} />
                  <Field label="Email (clientEmail)" value={form.clientEmail} onChange={(v) => setForm((p) => ({ ...p, clientEmail: v }))} disabled={disabled} />
                  <Field label="Preferred suburb/area" value={form.preferredSuburbArea} onChange={(v) => setForm((p) => ({ ...p, preferredSuburbArea: v }))} disabled={disabled} />
                </Grid2>

                <SectionTitle text="Timing / situation" />
                <Grid2>
                  <Field label="Timing" value={form.timing} onChange={(v) => setForm((p) => ({ ...p, timing: v }))} disabled={disabled} />
                  <Field label="Current location" value={form.currentLocation} onChange={(v) => setForm((p) => ({ ...p, currentLocation: v }))} disabled={disabled} />
                  <Field label="Discharge date (yyyy-mm-dd)" value={form.dischargeDate} onChange={(v) => setForm((p) => ({ ...p, dischargeDate: v }))} disabled={disabled} />
                  <Field label="Placement need" value={form.placementNeed} onChange={(v) => setForm((p) => ({ ...p, placementNeed: v }))} disabled={disabled} />
                </Grid2>

                <SectionTitle text="Patient details" />
                <Grid2>
                  <Field label="Patient name" value={form.patientName} onChange={(v) => setForm((p) => ({ ...p, patientName: v }))} disabled={disabled} />
                  <Field label="Relationship to patient" value={form.relationshipToPatient} onChange={(v) => setForm((p) => ({ ...p, relationshipToPatient: v }))} disabled={disabled} />
                  <Field label="Gender" value={form.gender} onChange={(v) => setForm((p) => ({ ...p, gender: v }))} disabled={disabled} />
                  <Field label="Marital status" value={form.maritalStatus} onChange={(v) => setForm((p) => ({ ...p, maritalStatus: v }))} disabled={disabled} />
                  <Field label="Pension status" value={form.pensionStatus} onChange={(v) => setForm((p) => ({ ...p, pensionStatus: v }))} disabled={disabled} />
                  <Field label="Living situation" value={form.livingSituation} onChange={(v) => setForm((p) => ({ ...p, livingSituation: v }))} disabled={disabled} />
                  <Field label="Own home (Yes/No)" value={form.ownHome} onChange={(v) => setForm((p) => ({ ...p, ownHome: v }))} disabled={disabled} />
                  <Field label="Someone living in home (Yes/No)" value={form.someoneLivingInHome} onChange={(v) => setForm((p) => ({ ...p, someoneLivingInHome: v }))} disabled={disabled} />
                </Grid2>

                <div style={{ marginTop: 12 }}>
                  <TextArea
                    label="Who is living in home"
                    value={form.whoLivingInHome}
                    onChange={(v) => setForm((p) => ({ ...p, whoLivingInHome: v }))}
                    disabled={disabled}
                    rows={3}
                  />
                </div>

                <SectionTitle text="Residential application questions" />
                <Grid2>
                  <Field label="Current location (residential)" value={intakeForm.currentLocation} onChange={(v) => setIntakeField("currentLocation", v)} disabled={disabled} />
                  <Field label="Hospital/ward" value={intakeForm.hospitalWard} onChange={(v) => setIntakeField("hospitalWard", v)} disabled={disabled} />
                  <Field label="Residential permanent approved (Yes/No)" value={intakeForm.residentialPermanentApproved} onChange={(v) => setIntakeField("residentialPermanentApproved", v)} disabled={disabled} />
                  <Field label="My Aged Care referral code" value={intakeForm.myAgedCareReferralCode} onChange={(v) => setIntakeField("myAgedCareReferralCode", v)} disabled={disabled} />
                  <Field label="EPOA in place? (Yes/No)" value={intakeForm.hasEpoa} onChange={(v) => setIntakeField("hasEpoa", v)} disabled={disabled} />
                  <Field label="QCAT order? (Yes/No)" value={intakeForm.qcatOrder} onChange={(v) => setIntakeField("qcatOrder", v)} disabled={disabled} />
                  <Field label="Memory support required? (Yes/No)" value={intakeForm.memorySupportRequired} onChange={(v) => setIntakeField("memorySupportRequired", v)} disabled={disabled} />
                  <Field label="Advance Health Directive? (Yes/No)" value={intakeForm.advanceHealthDirective} onChange={(v) => setIntakeField("advanceHealthDirective", v)} disabled={disabled} />
                  <Field label="Support at Home? (Yes/No)" value={intakeForm.supportAtHome} onChange={(v) => setIntakeField("supportAtHome", v)} disabled={disabled} />
                  <Field label="Support at Home start date" value={intakeForm.supportAtHomeStartDate} onChange={(v) => setIntakeField("supportAtHomeStartDate", v)} disabled={disabled} />
                  <SelectInput
                    label="Pension type"
                    value={intakeForm.pensionType}
                    onChange={(v) => setIntakeField("pensionType", v)}
                    disabled={disabled}
                    options={[
                      { value: "full_pension", label: "Full pension" },
                      { value: "part_pension", label: "Part pension" },
                      { value: "dva", label: "DVA" },
                      { value: "self_funded", label: "Self-funded" },
                      { value: "non_pensioner", label: "Non-pensioner" },
                      { value: "unknown", label: "Unknown" },
                    ]}
                  />
                </Grid2>

                <SectionTitle text="ACAT + care profile" />
                <Grid2>
                  <Field label="Had ACAT? (Yes/No/Booked)" value={form.haveHadAcat} onChange={(v) => setForm((p) => ({ ...p, haveHadAcat: v }))} disabled={disabled} />
                  <Field label="ACAT approved for" value={form.acatApprovedFor} onChange={(v) => setForm((p) => ({ ...p, acatApprovedFor: v }))} disabled={disabled} />
                  <Field label="Mobility" value={form.mobility} onChange={(v) => setForm((p) => ({ ...p, mobility: v }))} disabled={disabled} />
                  <Field label="Cognition" value={form.cognition} onChange={(v) => setForm((p) => ({ ...p, cognition: v }))} disabled={disabled} />
                  <Field label="Behaviours" value={form.behaviours} onChange={(v) => setForm((p) => ({ ...p, behaviours: v }))} disabled={disabled} />
                  <Field label="Continence" value={form.continence} onChange={(v) => setForm((p) => ({ ...p, continence: v }))} disabled={disabled} />
                </Grid2>

                <div style={{ marginTop: 12 }}>
                  <TextArea
                    label="Other concerns"
                    value={form.otherConcerns}
                    onChange={(v) => setForm((p) => ({ ...p, otherConcerns: v }))}
                    disabled={disabled}
                    rows={3}
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <TextArea
                    label="Notes (big)"
                    value={form.notes}
                    onChange={(v) => setForm((p) => ({ ...p, notes: v }))}
                    disabled={disabled}
                    rows={6}
                  />
                </div>

                <SectionTitle text="Funding" />
                <Grid2>
                  <Field label="RAD range" value={form.radRange} onChange={(v) => setForm((p) => ({ ...p, radRange: v }))} disabled={disabled} />
                  <Field label="Payment preference (RAD/DAP/Unsure)" value={form.paymentPreference} onChange={(v) => setForm((p) => ({ ...p, paymentPreference: v }))} disabled={disabled} />
                  <Field label="Govt help for accommodation? (Yes/No/Unsure)" value={form.govtHelpAccommodation} onChange={(v) => setForm((p) => ({ ...p, govtHelpAccommodation: v }))} disabled={disabled} />
                  <Field label="Means tested? (Yes/No/Unsure)" value={form.meansTested} onChange={(v) => setForm((p) => ({ ...p, meansTested: v }))} disabled={disabled} />
                </Grid2>

                <div style={{ marginTop: 12 }}>
                  <TextArea
                    label="Funding notes"
                    value={form.fundingNotes}
                    onChange={(v) => setForm((p) => ({ ...p, fundingNotes: v }))}
                    disabled={disabled}
                    rows={4}
                  />
                </div>

                <SectionTitle text="Consent" />
                <Grid2>
                  <Field label="Consent to share (Yes/No)" value={form.consentToShare} onChange={(v) => setForm((p) => ({ ...p, consentToShare: v }))} disabled={disabled} />
                  <Field label="Client name (legacy field)" value={form.clientName} onChange={(v) => setForm((p) => ({ ...p, clientName: v }))} disabled={disabled} />
                </Grid2>

                <div style={{ marginTop: 12 }}>
                  <Field
                    label="Client suburb (legacy field)"
                    value={form.clientSuburb}
                    onChange={(v) => setForm((p) => ({ ...p, clientSuburb: v }))}
                    disabled={disabled}
                  />
                </div>

                <SectionTitle text="Admin-only internal case notes" />
                <div style={{ marginTop: 8 }}>
                  <TextArea
                    label="Internal Case Notes (not shown to families)"
                    value={form.internalCaseNotes}
                    onChange={(v) => setForm((p) => ({ ...p, internalCaseNotes: v }))}
                    disabled={disabled}
                    rows={10}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                  <button onClick={() => save()} disabled={disabled || !current} style={saveBtn(disabled || !current)}>
                    {saving ? "Saving..." : "Save"}
                  </button>

                  <button onClick={() => refreshList()} disabled={disabled} style={secondaryBtn}>
                    Refresh
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- small components ---------- */

function FacilityList({ title, items }: { title: string; items: FacilityItem[] }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#fff" }}>
      <div style={{ fontWeight: 800, color: "#0b3b5b", marginBottom: 8 }}>
        {title} ({items.length})
      </div>
      {!items.length ? (
        <div style={{ fontSize: 12, color: "#64748b" }}>No facilities in this list.</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, color: "#334155", fontSize: 13 }}>
          {items
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((x) => (
              <li key={x.caseFacilityId}>
                <b>{x.name}</b> — {x.suburb}, {x.state} {x.postcode ?? ""}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 800, color: "#0b3b5b" }}>
      {text}
    </div>
  );
}

function Grid2({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Alert(props: { color: string; bg: string; title: string; text: string }) {
  return (
    <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: props.bg }}>
      <strong style={{ color: props.color }}>{props.title}:</strong>{" "}
      <span style={{ color: props.color }}>{props.text}</span>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
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

function SelectInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={labelStyle}>{props.label}</div>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
        style={inputStyle}
      >
        <option value="">Select</option>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  rows?: number;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={labelStyle}>{props.label}</div>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
        rows={props.rows ?? 6}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #cbd5e1",
          fontSize: 14,
          resize: "vertical",
        }}
      />
    </label>
  );
}

/* ---------- styles ---------- */

const topCard: CSSProperties = {
  marginTop: 14,
  padding: 14,
  background: "white",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
};

const gridWrap: CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "340px 1fr",
  gap: 14,
};

const cardStyle: CSSProperties = {
  padding: 14,
  background: "white",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
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

const primaryBtn: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #0b3b5b",
  background: "#0b3b5b",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryBtn: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#0b3b5b",
  cursor: "pointer",
  fontWeight: 700,
};

const saveBtn = (disabled: boolean): CSSProperties => ({
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #0D9488",
  background: "#0D9488",
  color: "white",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 800,
  opacity: disabled ? 0.6 : 1,
});
