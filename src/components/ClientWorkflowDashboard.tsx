import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type MatchSummary = {
  id: number;
  nursingHomeId: number;
  nursingHomeName: string;
  suburb: string;
  phone: string;
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

export default function ClientWorkflowDashboard() {
  const token = useMemo(() => getTokenFromPath(), []);
  const authStorageKey = useMemo(() => `nhnm_workflow_auth_${token}`, [token]);
  const intakeStorageKey = useMemo(() => `nhnm_workflow_intake_${token}`, [token]);
  const [data, setData] = useState<WorkflowSnapshot | null>(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
  const [acatNumber, setAcatNumber] = useState("");
  const [waitingListPreference, setWaitingListPreference] = useState("");
  const [notes, setNotes] = useState("");
  const [intake, setIntake] = useState<ResidentialIntake>(() => emptyResidentialIntake());
  const [intakeNotice, setIntakeNotice] = useState("");

  const currentAuthToken = useCallback(
    () => sessionStorage.getItem(authStorageKey) ?? "",
    [authStorageKey],
  );

  useEffect(() => {
    if (!token) {
      setError("Missing workflow token");
      return;
    }

    const headers = new Headers();
    const authToken = currentAuthToken();
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
        setAcatNumber(snapshot.acatNumber || "");
        setWaitingListPreference(snapshot.waitingListPreference || "");
        setNotes(snapshot.notes || "");
        setPlacementForName(snapshot.placementForName || "");
        setPlacementForDob(snapshot.placementForDob || "");
        setPlacementForRelation(snapshot.placementForRelation || "");
        setIntake(getResidentialIntakeFromSnapshot(snapshot));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [token, currentAuthToken]);

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
      const authToken = currentAuthToken();
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
      const authToken = currentAuthToken();
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
      setData(result.snapshot);
      setPlacementForName(result.snapshot.placementForName || "");
      setContactName(result.snapshot.contactName || "");
      setEmail(result.snapshot.email || "");
      setPhone(result.snapshot.phone || "");
      setPreferredArea(result.snapshot.preferredArea || "");
      setTiming(result.snapshot.timing || "");
      setCareType(result.snapshot.careType || "");
      setFundingPlan(result.snapshot.fundingPlan || "");
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
      setData(result.snapshot);
      setPlacementForName(result.snapshot.placementForName || "");
      setContactName(result.snapshot.contactName || "");
      setEmail(result.snapshot.email || "");
      setPhone(result.snapshot.phone || "");
      setPreferredArea(result.snapshot.preferredArea || "");
      setTiming(result.snapshot.timing || "");
      setCareType(result.snapshot.careType || "");
      setFundingPlan(result.snapshot.fundingPlan || "");
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
    try {
      const headers = new Headers({ "Content-Type": "application/json" });
      const authToken = currentAuthToken();
      if (authToken) headers.set("X-Client-Auth", authToken);
      const payload = {
        contactName: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        preferredArea: preferredArea.trim(),
        timing: timing.trim(),
        careType: careType.trim(),
        fundingPlan: fundingPlan.trim(),
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
            acatNumber: acatNumber.trim(),
            waitingListPreference: waitingListPreference.trim(),
            notes: notes.trim(),
          }),
        });
      }
      setData(next);
      setIntake(getResidentialIntakeFromSnapshot(next));
      localStorage.setItem(intakeStorageKey, JSON.stringify(intake));
      setNotice("Client snapshot saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  }

  function updateIntakeField<K extends keyof ResidentialIntake>(key: K, value: ResidentialIntake[K]) {
    setIntake((prev) => ({ ...prev, [key]: value }));
  }

  async function saveResidentialIntake() {
    setProfileSaving(true);
    setError("");
    setNotice("");
    setIntakeNotice("");
    try {
      const headers = new Headers({ "Content-Type": "application/json" });
      const authToken = currentAuthToken();
      if (authToken) headers.set("X-Client-Auth", authToken);

      const next = await apiFetch<WorkflowSnapshot>(`/api/workflow/client/${token}/profile`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ residentialIntake: intake }),
      });
      setData(next);
      setIntake(getResidentialIntakeFromSnapshot(next));
      localStorage.setItem(intakeStorageKey, JSON.stringify(intake));
      setIntakeNotice("Residential questions saved.");
    } catch {
      // Fallback for older API versions: still keep browser save.
      localStorage.setItem(intakeStorageKey, JSON.stringify(intake));
      setIntakeNotice("Saved on this device (server API update pending).");
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f8fafc 0%, #eef6ff 100%)", padding: 20 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 4px" }}>
          <img src="/nursing-homes-near-me-logo.png" alt="Nursing Homes Near Me" style={{ height: 42 }} />
          <div style={{ color: "#0b3b5b", fontWeight: 900, fontSize: 22 }}>Client Dashboard</div>
        </div>

        {!data.dashboardPasswordSet ? (
          <div style={card}>
            <h2 style={{ marginTop: 0, color: "#0b3b5b" }}>Create your dashboard password</h2>
            <div style={{ color: "#475569", marginBottom: 10 }}>
              Set a password to secure your dashboard.
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              style={input}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              style={{ ...input, marginTop: 8 }}
            />
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={input}
            />
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
              <h2 style={{ marginTop: 0, color: "#0b3b5b" }}>Your submitted information</h2>
              <div style={twoColGrid}>
                <TextField label="Your name" value={contactName} onChange={setContactName} placeholder="Your name" />
                <TextField label="Your email" value={email} onChange={setEmail} placeholder="Email" />
                <TextField label="Your phone" value={phone} onChange={setPhone} placeholder="Phone" />
                <TextField label="Preferred area" value={preferredArea} onChange={setPreferredArea} placeholder="Preferred area" />
                <TextField label="Placement timing" value={timing} onChange={setTiming} placeholder="Timing" />
                <TextField label="Care type" value={careType} onChange={setCareType} placeholder="Care type" />
                <TextField label="Funding plan" value={fundingPlan} onChange={setFundingPlan} placeholder="Funding plan" />
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
            </div>

            <div style={card}>
              <h2 style={{ marginTop: 0, color: "#0b3b5b" }}>Client snapshot</h2>
              <div style={{ color: "#475569", marginBottom: 10 }}>
                Full name of person needing placement
              </div>
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
              <div style={{ marginTop: 10 }}>
                <button onClick={saveProfileSnapshot} disabled={profileSaving} style={submitBtn}>
                  {profileSaving ? "Saving..." : "Save snapshot"}
                </button>
                {notice ? <span style={{ marginLeft: 10, color: "#166534" }}>{notice}</span> : null}
              </div>
            </div>

            <div style={card}>
              <h2 style={{ marginTop: 0, color: "#0b3b5b" }}>Residential application questions</h2>
              <div style={{ color: "#475569", marginBottom: 10 }}>
                Use this to collect answers typically required for residential application forms.
              </div>

              <div style={{ color: "#475569", marginBottom: 6 }}>Aged care home preferences</div>
              <textarea
                value={intake.preferredHomes}
                onChange={(e) => updateIntakeField("preferredHomes", e.target.value)}
                placeholder="1st preference, 2nd preference, 3rd preference..."
                style={{ ...input, minHeight: 80, resize: "vertical" }}
              />

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
                <TextField
                  label="QCAT case number"
                  value={intake.qcatCaseNumber}
                  onChange={(v) => updateIntakeField("qcatCaseNumber", v)}
                  placeholder="Case number"
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
                  label="NDIS plan in place?"
                  value={intake.ndisPlan}
                  onChange={(v) => updateIntakeField("ndisPlan", v)}
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
                <TextField
                  label="Pension type"
                  value={intake.pensionType}
                  onChange={(v) => updateIntakeField("pensionType", v)}
                  placeholder="Full pension, part pension, non-pensioner"
                />
                <TextField
                  label="Pension / DVA number"
                  value={intake.pensionOrDvaNumber}
                  onChange={(v) => updateIntakeField("pensionOrDvaNumber", v)}
                  placeholder="Number"
                />
                <TextField
                  label="Medicare number"
                  value={intake.medicareNumber}
                  onChange={(v) => updateIntakeField("medicareNumber", v)}
                  placeholder="Medicare number"
                />
                <TextField
                  label="SA457 / SA485 status"
                  value={intake.sa457Sa485Status}
                  onChange={(v) => updateIntakeField("sa457Sa485Status", v)}
                  placeholder="Lodged, reply received, not required, etc."
                />
                <TextField
                  label="Estimated annual income"
                  value={intake.estimatedAnnualIncome}
                  onChange={(v) => updateIntakeField("estimatedAnnualIncome", v)}
                  placeholder="Amount"
                />
                <SelectField
                  label="Spouse or dependent child living in home?"
                  value={intake.homeHasSpouseOrDependent}
                  onChange={(v) => updateIntakeField("homeHasSpouseOrDependent", v)}
                />
                <SelectField
                  label="Carer (pension-eligible) in home for 2+ years?"
                  value={intake.carerInHomeTwoYears}
                  onChange={(v) => updateIntakeField("carerInHomeTwoYears", v)}
                />
                <SelectField
                  label="Close family/friend carer in home for 5+ years?"
                  value={intake.closeFamilyCarerFiveYears}
                  onChange={(v) => updateIntakeField("closeFamilyCarerFiveYears", v)}
                />
                <TextField
                  label="Correspondence recipient"
                  value={intake.correspondenceRecipient}
                  onChange={(v) => updateIntakeField("correspondenceRecipient", v)}
                  placeholder="Applicant, first contact, second contact, or other"
                />
              </div>

              <div style={{ marginTop: 10 }}>
                <button onClick={saveResidentialIntake} disabled={profileSaving} style={submitBtn}>
                  {profileSaving ? "Saving..." : "Save residential questions"}
                </button>
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
                Select facilities and request tours, then submit for approval.
              </div>
              <div style={{ marginBottom: 12 }}>
                <button onClick={submitSelections} disabled={submitting} style={submitBtn}>
                  {submitting ? "Submitting..." : "Send selections for approval"}
                </button>
              </div>
              {!data.matches.length ? <div style={{ color: "#64748b" }}>No facility matches yet.</div> : null}
              <div style={{ display: "grid", gap: 10 }}>
                {data.matches.map((m) => (
                  <div key={m.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>
                      {m.nursingHomeName} {m.suburb ? `(${m.suburb})` : ""}
                    </div>
                    {m.phone ? <div style={{ color: "#475569", fontSize: 13 }}>Phone: {m.phone}</div> : null}
                    <div style={{ color: "#334155", marginTop: 4 }}>
                      Status: {titleForStatus(m.facilityResponseStatus || m.status)}
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                        Send enquiry
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, opacity: m.clientSelected ? 1 : 0.6 }}>
                        <input
                          type="checkbox"
                          checked={m.tourRequested}
                          disabled={!m.clientSelected || savingId === m.id}
                          onChange={(e) => updateMatch(m.id, { tourRequested: e.target.checked })}
                        />
                        Request tour
                      </label>
                    </div>
                    {m.waitlistStatus && m.waitlistStatus !== "not_requested" ? (
                      <div style={{ color: "#334155" }}>Waitlist: {m.waitlistStatus}</div>
                    ) : null}
                    {m.facilityNotes ? <div style={{ color: "#475569" }}>Notes: {m.facilityNotes}</div> : null}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={input}>
        <option value="">Select</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
        <option value="unknown">Unknown</option>
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
