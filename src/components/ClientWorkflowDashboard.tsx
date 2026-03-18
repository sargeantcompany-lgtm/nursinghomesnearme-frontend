import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type MatchSummary = {
  id: number;
  nursingHomeId: number;
  nursingHomeName: string;
  providerName: string;
  suburb: string;
  state: string;
  postcode: string;
  phone: string;
  email: string;
  website: string;
  primaryImageUrl: string;
  oneLineDescription: string;
  beds?: number;
  careTypes: string[];
  specialties: string[];
  status: string;
  facilityResponseStatus: string;
  waitlistStatus: string;
  enquirySentAt?: string;
  contactedByFacilityAt?: string;
  facilityNotes: string;
  clientSelected: boolean;
  tourRequested: boolean;
};

type WorkflowSnapshot = {
  clientId: number;
  clientToken: string;
  dashboardPasswordSet: boolean;
  authenticated: boolean;
  contactName: string;
  email: string;
  phone: string;
  preferredArea: string;
  timing: string;
  careType: string;
  fundingPlan: string;
  budgetRange: string;
  acatNumber: string;
  waitingListPreference: string;
  notes: string;
  placementForName: string;
  placementForDob: string;
  placementForRelation: string;
  residentialIntake?: Partial<ResidentialIntake>;
  preferredHomes?: string;
  currentLocation?: string;
  hospitalWard?: string;
  residentialPermanentApproved?: string;
  myAgedCareReferralCode?: string;
  hasEpoa?: string;
  qcatOrder?: string;
  qcatCaseNumber?: string;
  memorySupportRequired?: string;
  advanceHealthDirective?: string;
  ndisPlan?: string;
  supportAtHome?: string;
  supportAtHomeStartDate?: string;
  pensionType?: string;
  pensionOrDvaNumber?: string;
  medicareNumber?: string;
  sa457Sa485Status?: string;
  estimatedAnnualIncome?: string;
  homeHasSpouseOrDependent?: string;
  carerInHomeTwoYears?: string;
  closeFamilyCarerFiveYears?: string;
  correspondenceRecipient?: string;
  approvalStatus: string;
  lastWorkflowStage: string;
  homeCareReferralPending: boolean;
  propertySupportPending: boolean;
  nextSteps: string[];
  matches: MatchSummary[];
};

type DashboardAuthResult = {
  ok: boolean;
  authToken: string;
  expiresAt: string;
  snapshot: WorkflowSnapshot;
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

function getResidentialIntakeFromSnapshot(snapshot: WorkflowSnapshot): ResidentialIntake {
  const base = emptyResidentialIntake();
  if (snapshot.residentialIntake) {
    return { ...base, ...snapshot.residentialIntake };
  }

  return {
    ...base,
    preferredHomes: snapshot.preferredHomes || "",
    currentLocation: snapshot.currentLocation || "",
    hospitalWard: snapshot.hospitalWard || "",
    residentialPermanentApproved: snapshot.residentialPermanentApproved || "",
    myAgedCareReferralCode: snapshot.myAgedCareReferralCode || "",
    hasEpoa: snapshot.hasEpoa || "",
    qcatOrder: snapshot.qcatOrder || "",
    qcatCaseNumber: snapshot.qcatCaseNumber || "",
    memorySupportRequired: snapshot.memorySupportRequired || "",
    advanceHealthDirective: snapshot.advanceHealthDirective || "",
    ndisPlan: snapshot.ndisPlan || "",
    supportAtHome: snapshot.supportAtHome || "",
    supportAtHomeStartDate: snapshot.supportAtHomeStartDate || "",
    pensionType: snapshot.pensionType || "",
    pensionOrDvaNumber: snapshot.pensionOrDvaNumber || "",
    medicareNumber: snapshot.medicareNumber || "",
    sa457Sa485Status: snapshot.sa457Sa485Status || "",
    estimatedAnnualIncome: snapshot.estimatedAnnualIncome || "",
    homeHasSpouseOrDependent: snapshot.homeHasSpouseOrDependent || "",
    carerInHomeTwoYears: snapshot.carerInHomeTwoYears || "",
    closeFamilyCarerFiveYears: snapshot.closeFamilyCarerFiveYears || "",
    correspondenceRecipient: snapshot.correspondenceRecipient || "",
  };
}

function getTokenFromPath(): string {
  const fromPath = window.location.pathname.replace("/workflow/", "").trim();
  if (fromPath) return fromPath;
  return localStorage.getItem("nhnm_workflow_token") ?? "";
}

function titleForStatus(status: string): string {
  switch ((status || "").toLowerCase()) {
    case "vacancy":
      return "Vacancy available";
    case "no_vacancy":
      return "No vacancy";
    case "waitlist_offered":
      return "Can waitlist";
    case "needs_more_info":
      return "Needs more info";
    default:
      return "Enquiry sent";
  }
}

function locationLabel(match: MatchSummary): string {
  return [match.suburb, match.state, match.postcode].filter(Boolean).join(", ");
}

function availabilityBadge(status: string): { label: string; bg: string; color: string } {
  switch ((status || "").toLowerCase()) {
    case "vacancy":
      return { label: "Vacancy available", bg: "#dcfce7", color: "#166534" };
    case "no_vacancy":
      return { label: "Currently full", bg: "#fee2e2", color: "#991b1b" };
    case "waitlist_offered":
      return { label: "Waitlist open", bg: "#ffedd5", color: "#9a3412" };
    case "needs_more_info":
      return { label: "Needs more info", bg: "#dbeafe", color: "#1d4ed8" };
    default:
      return { label: "Enquiry sent", bg: "#e2e8f0", color: "#334155" };
  }
}

export default function ClientWorkflowDashboard() {
  const token = useMemo(() => getTokenFromPath(), []);
  const authStorageKey = useMemo(() => `nhnm_workflow_auth_${token}`, [token]);
  const intakeStorageKey = useMemo(() => `nhnm_workflow_intake_${token}`, [token]);
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem(authStorageKey) ?? "");
  const [data, setData] = useState<WorkflowSnapshot | null>(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [placementForName, setPlacementForName] = useState("");
  const [placementForDob, setPlacementForDob] = useState("");
  const [placementForRelation, setPlacementForRelation] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredArea, setPreferredArea] = useState("");
  const [timing, setTiming] = useState("");
  const [careType, setCareType] = useState("");
  const [fundingPlan, setFundingPlan] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [acatNumber, setAcatNumber] = useState("");
  const [waitingListPreference, setWaitingListPreference] = useState("");
  const [notes, setNotes] = useState("");
  const [intake, setIntake] = useState<ResidentialIntake>(() => emptyResidentialIntake());
  const [intakeNotice, setIntakeNotice] = useState("");

  useEffect(() => {
    setAuthToken(sessionStorage.getItem(authStorageKey) ?? "");
  }, [authStorageKey]);

  useEffect(() => {
    if (!token) {
      setError("Missing workflow token");
      return;
    }

    const headers = new Headers();
    if (authToken) headers.set("X-Client-Auth", authToken);

    apiFetch<WorkflowSnapshot>(`/api/workflow/client/${token}`, { headers })
      .then((snapshot) => {
        setData(snapshot);
        setContactName(snapshot.contactName || "");
        setEmail(snapshot.email || "");
        setPhone(snapshot.phone || "");
        setPreferredArea(snapshot.preferredArea || "");
        setTiming(snapshot.timing || "");
        setCareType(snapshot.careType || "");
        setFundingPlan(snapshot.fundingPlan || "");
        setBudgetRange(snapshot.budgetRange || "");
        setAcatNumber(snapshot.acatNumber || "");
        setWaitingListPreference(snapshot.waitingListPreference || "");
        setNotes(snapshot.notes || "");
        setPlacementForName(snapshot.placementForName || "");
        setPlacementForDob(snapshot.placementForDob || "");
        setPlacementForRelation(snapshot.placementForRelation || "");
        setIntake(getResidentialIntakeFromSnapshot(snapshot));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [token, authToken]);

  useEffect(() => {
    const raw = localStorage.getItem(intakeStorageKey);
    if (!raw) {
      setIntake(emptyResidentialIntake());
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<ResidentialIntake>;
      setIntake({ ...emptyResidentialIntake(), ...parsed });
    } catch {
      setIntake(emptyResidentialIntake());
    }
  }, [intakeStorageKey]);

  if (error) return <div style={{ padding: 16 }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 16 }}>Loading...</div>;

  async function updateMatch(matchId: number, patch: { clientSelected?: boolean; tourRequested?: boolean }) {
    setSavingId(matchId);
    setNotice("");
    try {
      const headers = new Headers({ "Content-Type": "application/json" });
      if (authToken) headers.set("X-Client-Auth", authToken);
      const next = await apiFetch<WorkflowSnapshot>(`/api/workflow/client/${token}/matches/${matchId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(patch),
      });
      setData(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSavingId(null);
    }
  }

  async function submitSelections() {
    setSubmitting(true);
    setNotice("");
    try {
      const headers = new Headers();
      if (authToken) headers.set("X-Client-Auth", authToken);
      const next = await apiFetch<WorkflowSnapshot>(`/api/workflow/client/${token}/submit-selections`, {
        method: "POST",
        headers,
      });
      setData(next);
      setNotice("Selections submitted for admin approval.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit selections");
    } finally {
      setSubmitting(false);
    }
  }

  async function setDashboardPassword() {
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setAuthLoading(true);
    setError("");
    try {
      const result = await apiFetch<DashboardAuthResult>(`/api/workflow/client/${token}/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      sessionStorage.setItem(authStorageKey, result.authToken);
      setAuthToken(result.authToken);
      setData(result.snapshot);
      setPlacementForName(result.snapshot.placementForName || "");
      setContactName(result.snapshot.contactName || "");
      setEmail(result.snapshot.email || "");
      setPhone(result.snapshot.phone || "");
      setPreferredArea(result.snapshot.preferredArea || "");
      setTiming(result.snapshot.timing || "");
      setCareType(result.snapshot.careType || "");
      setFundingPlan(result.snapshot.fundingPlan || "");
      setBudgetRange(result.snapshot.budgetRange || "");
      setAcatNumber(result.snapshot.acatNumber || "");
      setWaitingListPreference(result.snapshot.waitingListPreference || "");
      setNotes(result.snapshot.notes || "");
      setPlacementForDob(result.snapshot.placementForDob || "");
      setPlacementForRelation(result.snapshot.placementForRelation || "");
      setIntake(getResidentialIntakeFromSnapshot(result.snapshot));
      setPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set password");
    } finally {
      setAuthLoading(false);
    }
  }

  async function loginDashboard() {
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setAuthLoading(true);
    setError("");
    try {
      const result = await apiFetch<DashboardAuthResult>(`/api/workflow/client/${token}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      sessionStorage.setItem(authStorageKey, result.authToken);
      setAuthToken(result.authToken);
      setData(result.snapshot);
      setPlacementForName(result.snapshot.placementForName || "");
      setContactName(result.snapshot.contactName || "");
      setEmail(result.snapshot.email || "");
      setPhone(result.snapshot.phone || "");
      setPreferredArea(result.snapshot.preferredArea || "");
      setTiming(result.snapshot.timing || "");
      setCareType(result.snapshot.careType || "");
      setFundingPlan(result.snapshot.fundingPlan || "");
      setBudgetRange(result.snapshot.budgetRange || "");
      setAcatNumber(result.snapshot.acatNumber || "");
      setWaitingListPreference(result.snapshot.waitingListPreference || "");
      setNotes(result.snapshot.notes || "");
      setPlacementForDob(result.snapshot.placementForDob || "");
      setPlacementForRelation(result.snapshot.placementForRelation || "");
      setIntake(getResidentialIntakeFromSnapshot(result.snapshot));
      setPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function saveProfileSnapshot() {
    setProfileSaving(true);
    setError("");
    setNotice("");
    setIntakeNotice("");
    try {
      const headers = new Headers({ "Content-Type": "application/json" });
      if (authToken) headers.set("X-Client-Auth", authToken);
      const payload = {
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        preferredArea: preferredArea.trim(),
        timing: timing.trim(),
        careType: careType.trim(),
        fundingPlan: fundingPlan.trim(),
        budgetRange: budgetRange.trim(),
        acatNumber: acatNumber.trim(),
        waitingListPreference: waitingListPreference.trim(),
        notes: notes.trim(),
        placementForName: placementForName.trim(),
        placementForDob: placementForDob.trim(),
        placementForRelation: placementForRelation.trim(),
        residentialIntake: intake,
      };

      let next: WorkflowSnapshot;
      try {
        next = await apiFetch<WorkflowSnapshot>(`/api/workflow/client/${token}/profile`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        });
      } catch {
        // Backward compatibility for APIs that only accept snapshot fields.
        next = await apiFetch<WorkflowSnapshot>(`/api/workflow/client/${token}/profile`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            placementForName: placementForName.trim(),
            placementForDob: placementForDob.trim(),
            placementForRelation: placementForRelation.trim(),
            contactName: contactName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            preferredArea: preferredArea.trim(),
            timing: timing.trim(),
            careType: careType.trim(),
            fundingPlan: fundingPlan.trim(),
            budgetRange: budgetRange.trim(),
            acatNumber: acatNumber.trim(),
            waitingListPreference: waitingListPreference.trim(),
            notes: notes.trim(),
          }),
        });
      }
      setData(next);
      setIntake(getResidentialIntakeFromSnapshot(next));
      localStorage.setItem(intakeStorageKey, JSON.stringify(intake));
      setNotice("Your details have been updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  }

  function updateIntakeField<K extends keyof ResidentialIntake>(key: K, value: ResidentialIntake[K]) {
    setIntake((prev) => ({ ...prev, [key]: value }));
  }

  function logoutDashboard() {
    sessionStorage.removeItem(authStorageKey);
    setAuthToken("");
    setPassword("");
    setConfirmPassword("");
    setNotice("");
    setIntakeNotice("");
    window.location.href = "/";
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f8fafc 0%, #eef6ff 100%)", padding: 20 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 4px", flexWrap: "wrap" }}>
          <img src="/nursing-homes-near-me-logo.png" alt="Nursing Homes Near Me" style={{ height: 42 }} />
          <div style={{ color: "#0b3b5b", fontWeight: 900, fontSize: 22 }}>Client Dashboard</div>
          {data.authenticated ? (
            <button onClick={logoutDashboard} style={{ ...secondaryActionBtn, marginLeft: "auto" }}>
              Log out
            </button>
          ) : null}
        </div>

        {!data.dashboardPasswordSet ? (
          <div style={card}>
            <h2 style={{ marginTop: 0, color: "#0b3b5b" }}>Create your dashboard password</h2>
            <div style={{ color: "#475569", marginBottom: 10 }}>
              Set a password to secure your dashboard.
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              style={input}
            />
            <label style={passwordToggleRow}>
              <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
              <span>Show password</span>
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              style={{ ...input, marginTop: 8 }}
            />
            <label style={passwordToggleRow}>
              <input
                type="checkbox"
                checked={showConfirmPassword}
                onChange={(e) => setShowConfirmPassword(e.target.checked)}
              />
              <span>Show confirm password</span>
            </label>
            <div style={{ marginTop: 10 }}>
              <button onClick={setDashboardPassword} disabled={authLoading} style={submitBtn}>
                {authLoading ? "Saving..." : "Set password"}
              </button>
            </div>
          </div>
        ) : null}

        {data.dashboardPasswordSet && !data.authenticated ? (
          <div style={card}>
            <h2 style={{ marginTop: 0, color: "#0b3b5b" }}>Log in</h2>
            <div style={{ color: "#475569", marginBottom: 10 }}>
              Enter your dashboard password to continue.
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={input}
            />
            <label style={passwordToggleRow}>
              <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
              <span>Show password</span>
            </label>
            <div style={{ marginTop: 10 }}>
              <button onClick={loginDashboard} disabled={authLoading} style={submitBtn}>
                {authLoading ? "Logging in..." : "Log in"}
              </button>
            </div>
          </div>
        ) : null}

        {data.authenticated ? (
          <>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: 6, color: "#0b3b5b" }}>Update your details</h2>
                  <div style={{ color: "#475569" }}>
                    Keep your profile, placement details, and residential application answers together in one box.
                  </div>
                </div>
                <button onClick={saveProfileSnapshot} disabled={profileSaving} style={submitBtn}>
                  {profileSaving ? "Saving..." : "Save details"}
                </button>
              </div>

              <div style={{ marginTop: 18, marginBottom: 8, color: "#0b3b5b", fontWeight: 800 }}>Your information</div>
              <div style={twoColGrid}>
                <TextField label="Your name" value={contactName} onChange={setContactName} placeholder="Your name" />
                <TextField label="Your email" value={email} onChange={setEmail} placeholder="Email" />
                <TextField label="Your phone" value={phone} onChange={setPhone} placeholder="Phone" />
                <TextField label="Preferred area" value={preferredArea} onChange={setPreferredArea} placeholder="Preferred area" />
                <TextField label="Placement timing" value={timing} onChange={setTiming} placeholder="Timing" />
                <TextField label="Care type" value={careType} onChange={setCareType} placeholder="Care type" />
                <TextField label="Funding plan" value={fundingPlan} onChange={setFundingPlan} placeholder="Funding plan" />
                <TextField label="Budget range" value={budgetRange} onChange={setBudgetRange} placeholder="Budget range" />
                <TextField label="ACAT number" value={acatNumber} onChange={setAcatNumber} placeholder="ACAT number" />
                <TextField
                  label="Waiting list preference"
                  value={waitingListPreference}
                  onChange={setWaitingListPreference}
                  placeholder="Waiting list preference"
                />
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>Notes</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes"
                    style={{ ...input, minHeight: 90, resize: "vertical" }}
                  />
                </label>
              </div>

              <div style={{ marginTop: 18, marginBottom: 8, color: "#0b3b5b", fontWeight: 800 }}>Person needing placement</div>
              <input
                value={placementForName}
                onChange={(e) => setPlacementForName(e.target.value)}
                placeholder="e.g. Mary Jane Smith"
                style={input}
              />
              <div style={{ color: "#475569", margin: "10px 0 6px" }}>
                Relationship to this person
              </div>
              <input
                value={placementForRelation}
                onChange={(e) => setPlacementForRelation(e.target.value)}
                placeholder="e.g. Daughter, Son, Spouse, Friend"
                style={input}
              />
              <div style={{ color: "#475569", margin: "10px 0 6px" }}>Date of birth</div>
              <input
                type="date"
                value={placementForDob}
                onChange={(e) => setPlacementForDob(e.target.value)}
                style={input}
              />

              <div style={{ marginTop: 18, marginBottom: 8, color: "#0b3b5b", fontWeight: 800 }}>Residential application questions</div>
              <div style={{ color: "#475569", marginBottom: 10 }}>
                Use this to collect answers typically required for residential application forms.
              </div>

              <div style={{ color: "#475569", marginBottom: 6 }}>Aged care home preferences</div>
              <div style={{ color: "#475569", margin: "10px 0 6px" }}>Current location of applicant</div>
              <input
                value={intake.currentLocation}
                onChange={(e) => updateIntakeField("currentLocation", e.target.value)}
                placeholder="Own home, hospital, transition care, aged care home, other"
                style={input}
              />

              <div style={{ color: "#475569", margin: "10px 0 6px" }}>Hospital/ward (if applicable)</div>
              <input
                value={intake.hospitalWard}
                onChange={(e) => updateIntakeField("hospitalWard", e.target.value)}
                placeholder="Hospital and ward details"
                style={input}
              />

              <div style={twoColGrid}>
                <SelectField
                  label="Residential permanent approval on MAC letter?"
                  value={intake.residentialPermanentApproved}
                  onChange={(v) => updateIntakeField("residentialPermanentApproved", v)}
                />
                <TextField
                  label="My Aged Care referral code"
                  value={intake.myAgedCareReferralCode}
                  onChange={(v) => updateIntakeField("myAgedCareReferralCode", v)}
                  placeholder="Referral code"
                />
                <SelectField
                  label="Enduring Power of Attorney in place?"
                  value={intake.hasEpoa}
                  onChange={(v) => updateIntakeField("hasEpoa", v)}
                />
                <SelectField
                  label="QCAT order in place?"
                  value={intake.qcatOrder}
                  onChange={(v) => updateIntakeField("qcatOrder", v)}
                />
                <SelectField
                  label="Memory support required?"
                  value={intake.memorySupportRequired}
                  onChange={(v) => updateIntakeField("memorySupportRequired", v)}
                />
                <SelectField
                  label="Advance Health Directive?"
                  value={intake.advanceHealthDirective}
                  onChange={(v) => updateIntakeField("advanceHealthDirective", v)}
                />
                <SelectField
                  label="Currently receiving Support at Home?"
                  value={intake.supportAtHome}
                  onChange={(v) => updateIntakeField("supportAtHome", v)}
                />
                <TextField
                  label="Support at Home start date (if known)"
                  value={intake.supportAtHomeStartDate}
                  onChange={(v) => updateIntakeField("supportAtHomeStartDate", v)}
                  placeholder="YYYY-MM-DD"
                />
                <SelectField
                  label="Pension type"
                  value={intake.pensionType}
                  onChange={(v) => updateIntakeField("pensionType", v)}
                  options={[
                    { value: "full_pension", label: "Full pension" },
                    { value: "part_pension", label: "Part pension" },
                    { value: "dva", label: "DVA" },
                    { value: "self_funded", label: "Self-funded" },
                    { value: "non_pensioner", label: "Non-pensioner" },
                    { value: "unknown", label: "Unknown" },
                  ]}
                />
              </div>

              <div style={{ marginTop: 10 }}>
                {notice ? <span style={{ color: "#166534", fontWeight: 600 }}>{notice}</span> : null}
                {intakeNotice ? <span style={{ marginLeft: 10, color: "#166534" }}>{intakeNotice}</span> : null}
              </div>
            </div>

            <div style={card}>
              <h1 style={{ margin: 0, color: "#0b3b5b" }}>Your next steps</h1>
              <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                {data.nextSteps.map((s, i) => (
                  <div key={`${s}-${i}`} style={{ color: "#334155", fontWeight: 600 }}>
                    - {s}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, color: "#64748b", fontSize: 13 }}>
                Approval: {data.approvalStatus || "PENDING"} | Stage: {data.lastWorkflowStage}
              </div>
            </div>

            <div style={card}>
              <h2 style={{ marginTop: 0, color: "#0b3b5b" }}>Facility updates</h2>
              <div style={{ color: "#475569", marginBottom: 10 }}>
                Review the closest matches, open the full profile for more detail, and choose who you want us to contact.
              </div>
              <div style={{ marginBottom: 12 }}>
                <button onClick={submitSelections} disabled={submitting} style={submitBtn}>
                  {submitting ? "Submitting..." : "Send selections for approval"}
                </button>
              </div>
              {!data.matches.length ? <div style={{ color: "#64748b" }}>No facility matches yet.</div> : null}
              <div style={{ display: "grid", gap: 22, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                {data.matches.map((m) => (
                  <div key={m.id} style={facilityCard}>
                    <div style={facilityHero}>
                      {m.primaryImageUrl ? (
                        <img
                          src={m.primaryImageUrl}
                          alt={m.nursingHomeName}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <div style={facilityHeroFallback}>
                          <img
                            src="/nursing-homes-near-me-logo.png"
                            alt="Nursing Homes Near Me"
                            style={facilityFallbackLogo}
                          />
                        </div>
                      )}
                      <div style={facilityHeroOverlay} />
                      {locationLabel(m) ? (
                        <div style={facilityLocationPill}>{locationLabel(m)}</div>
                      ) : null}
                      <div
                        style={{
                          ...facilityStatusPill,
                          background: availabilityBadge(m.facilityResponseStatus || m.status).bg,
                          color: availabilityBadge(m.facilityResponseStatus || m.status).color,
                        }}
                      >
                        {availabilityBadge(m.facilityResponseStatus || m.status).label}
                      </div>
                    </div>

                    <div style={{ padding: 18, display: "grid", gap: 14 }}>
                      <div style={{ display: "grid", gap: 6 }}>
                        {m.providerName ? (
                          <div style={facilityProvider}>{m.providerName}</div>
                        ) : null}
                        <div style={facilityTitle}>{m.nursingHomeName}</div>
                      </div>

                      <p style={facilityDescription}>
                        {(m.oneLineDescription || "Review this facility and open the full details page for more information.").slice(0, 160)}
                      </p>

                      <div style={facilityMetaRow}>
                        {m.beds ? <span>{m.beds} beds</span> : null}
                        {locationLabel(m) ? <span>{locationLabel(m)}</span> : null}
                      </div>

                      {[...(m.careTypes || []), ...(m.specialties || [])].filter((tag, index, list) => list.indexOf(tag) === index).slice(0, 5).length ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {[...(m.careTypes || []), ...(m.specialties || [])]
                            .filter((tag, index, list) => list.indexOf(tag) === index)
                            .slice(0, 5)
                            .map((tag) => (
                              <span key={`${m.id}-${tag}`} style={facilityTag}>
                                {tag}
                              </span>
                            ))}
                        </div>
                      ) : null}

                      {(m.phone || m.email || m.website) ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {m.phone ? <a href={`tel:${m.phone}`} style={facilityActionPill}>Call</a> : null}
                          {m.email ? <a href={`mailto:${m.email}`} style={facilityActionPill}>Email</a> : null}
                          {m.website ? (
                            <a href={m.website} target="_blank" rel="noreferrer" style={facilityActionPill}>
                              Website
                            </a>
                          ) : null}
                        </div>
                      ) : null}

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <a
                          href={`/options/${m.nursingHomeId}`}
                          target="_blank"
                          rel="noreferrer"
                          style={facilityPreviewLink}
                        >
                          Open full profile
                        </a>
                        {m.enquirySentAt ? (
                          <span style={facilityLastTouched}>Contacted {new Date(m.enquirySentAt).toLocaleDateString()}</span>
                        ) : null}
                      </div>
                    </div>

                    <div style={facilityResponsePanel}>
                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={facilityResponseHeading}>Facility response</div>
                        <div style={facilityResponseText}>Status: {titleForStatus(m.facilityResponseStatus || m.status)}</div>
                        {m.waitlistStatus && m.waitlistStatus !== "not_requested" ? (
                          <div style={facilityResponseText}>Waitlist: {m.waitlistStatus}</div>
                        ) : null}
                        {m.facilityNotes ? <div style={facilityNotes}>{m.facilityNotes}</div> : null}
                      </div>
                      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                        <label style={facilityToggleLabel}>
                          <input
                            type="checkbox"
                            checked={m.clientSelected}
                            disabled={savingId === m.id}
                            onChange={(e) =>
                              updateMatch(m.id, {
                                clientSelected: e.target.checked,
                                tourRequested: e.target.checked ? m.tourRequested : false,
                              })
                            }
                          />
                          Contact facility
                        </label>
                        <label style={{ ...facilityToggleLabel, opacity: m.clientSelected ? 1 : 0.58 }}>
                          <input
                            type="checkbox"
                            checked={m.tourRequested}
                            disabled={!m.clientSelected || savingId === m.id}
                            onChange={(e) => updateMatch(m.id, { tourRequested: e.target.checked })}
                          />
                          Request tour
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
};

const submitBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #0b3b5b",
  background: "#0b3b5b",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryActionBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#0b3b5b",
  fontWeight: 700,
  cursor: "pointer",
};

const passwordToggleRow: React.CSSProperties = {
  marginTop: 8,
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#475569",
  fontSize: 13,
};

const facilityCard: React.CSSProperties = {
  background: "white",
  border: "1px solid #d7e4ec",
  borderRadius: 22,
  overflow: "hidden",
  boxShadow: "0 24px 54px rgba(15, 23, 42, 0.08)",
  display: "flex",
  flexDirection: "column",
};

const facilityHero: React.CSSProperties = {
  position: "relative",
  height: 224,
  background: "#dbeafe",
};

const facilityHeroFallback: React.CSSProperties = {
  width: "100%",
  height: "100%",
  background: "linear-gradient(140deg, #0b3b5b 0%, #0f766e 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const facilityFallbackLogo: React.CSSProperties = {
  width: 92,
  height: 92,
  objectFit: "contain",
  borderRadius: 16,
  background: "rgba(255,255,255,0.9)",
  padding: 12,
};

const facilityHeroOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(180deg, rgba(7,15,31,0.02) 0%, rgba(7,15,31,0.38) 100%)",
  pointerEvents: "none",
};

const facilityLocationPill: React.CSSProperties = {
  position: "absolute",
  left: 12,
  top: 12,
  background: "rgba(8,15,28,0.72)",
  color: "white",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 12,
  fontWeight: 800,
};

const facilityStatusPill: React.CSSProperties = {
  position: "absolute",
  right: 12,
  top: 12,
  borderRadius: 999,
  padding: "5px 10px",
  fontSize: 11,
  fontWeight: 800,
  boxShadow: "0 10px 18px rgba(0,0,0,0.08)",
};

const facilityProvider: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#0f766e",
  fontWeight: 800,
};

const facilityTitle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 26,
  lineHeight: 1.12,
  color: "#0b3b5b",
};

const facilityDescription: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.65,
};

const facilityMetaRow: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  color: "#526072",
  fontSize: 13,
  fontWeight: 800,
};

const facilityTag: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#0f766e",
  border: "1px solid #bde7e2",
  borderRadius: 999,
  padding: "5px 9px",
  background: "#eef9f7",
};

const facilityActionPill: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 999,
  border: "1px solid #d7e0ea",
  background: "#f8fbfd",
  color: "#0b3b5b",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 12,
};

const facilityPreviewLink: React.CSSProperties = {
  color: "#0b3b5b",
  fontWeight: 800,
  textDecoration: "none",
  borderBottom: "2px solid #a7d6d0",
  paddingBottom: 2,
};

const facilityLastTouched: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
};

const facilityResponsePanel: React.CSSProperties = {
  margin: "0 18px 18px",
  borderRadius: 18,
  border: "1px solid #dce6ee",
  background: "linear-gradient(180deg, #f8fbfd 0%, #f2f8fb 100%)",
  padding: 16,
  display: "grid",
  gap: 14,
};

const facilityResponseHeading: React.CSSProperties = {
  color: "#0b3b5b",
  fontWeight: 900,
  fontSize: 14,
};

const facilityResponseText: React.CSSProperties = {
  color: "#334155",
  fontSize: 13,
};

const facilityNotes: React.CSSProperties = {
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.55,
};

const facilityToggleLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
};

const input: React.CSSProperties = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  padding: "10px 12px",
  fontSize: 15,
};

const twoColGrid: React.CSSProperties = {
  marginTop: 10,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 10,
};

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
}) {
  const items = options ?? [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "unknown", label: "Unknown" },
  ];

  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={input}>
        <option value="">Select</option>
        {items.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={input} />
    </label>
  );
}
