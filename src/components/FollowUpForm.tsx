// src/components/FollowUpForm.tsx
import React, { useMemo, useState } from "react";

type Timing = "ASAP" | "Within 2 weeks" | "2–6 weeks" | "1–3 months" | "Unsure";
type CurrentLocation = "Home" | "Hospital" | "Other";

type PlacementNeed =
  | "Respite"
  | "Respite with a view to permanent"
  | "Permanent care"
  | "";

type Mobility =
  | "Independent"
  | "Walker"
  | "Wheelchair"
  | "1-person assist"
  | "2-person assist"
  | "Hoist"
  | "";

type Cognition = "None" | "Mild" | "Moderate" | "Dementia / high" | "";
type YesNoUnsure = "Yes" | "No" | "Unsure" | "";
type PensionStatus = "Full pension" | "Part pension" | "No pension" | "";
type LivingSituation = "Own home" | "Rental accommodation" | "With friends" | "Other" | "";
type Gender = "Male" | "Female" | "Other" | "Prefer not to say" | "";
type MaritalStatus =
  | "Single"
  | "Married / Partner"
  | "Widowed"
  | "Divorced / Separated"
  | "Other"
  | "";

type AcatApproval = "Residential respite" | "Residential permanent" | "Both" | "Not sure" | "";

type FundingSupport = "Yes" | "No" | "Unsure" | "";
type Payment = "RAD" | "DAP" | "Combination" | "Unsure" | "";

// relationship to patient
type Relationship =
  | "Self"
  | "Spouse/Partner"
  | "Parent"
  | "Child"
  | "Sibling"
  | "Friend"
  | "Other"
  | "";

type FormData = {
  // Contact
  contactName: string;
  phone: string;
  email: string;

  // Where/when
  preferredSuburbArea: string;
  timing: Timing | "";
  currentLocation: CurrentLocation | "";
  dischargeDate: string;

  // Care needs place
  placementNeed: PlacementNeed;

  // Patient details
  patientName: string;
  relationshipToPatient: Relationship;

  // Personal snapshot
  gender: Gender;
  maritalStatus: MaritalStatus;
  pensionStatus: PensionStatus;

  // Living situation + home
  livingSituation: LivingSituation;
  ownHome: YesNoUnsure;
  someoneLivingInHome: YesNoUnsure;
  whoLivingInHome: string;

  // ACAT
  haveHadAcat: YesNoUnsure;
  acatApprovedFor: AcatApproval;

  // Care triage
  mobility: Mobility;
  cognition: Cognition;
  behaviours: YesNoUnsure;
  continence: YesNoUnsure;

  // Other + notes
  otherConcerns: string;
  notes: string;

  // Funding
  radRange: string;
  paymentPreference: Payment;
  govtHelpAccommodation: FundingSupport;
  meansTested: YesNoUnsure;
  fundingNotes: string;

  // Consent
  consentToShare: boolean;

  // Honeypot
  botField: string;
};

// RAD brackets
const RAD_OPTIONS = ["$300k–$500k", "$500k–$700k", "$700k+", "Unsure"] as const;

// Your logo filename (in /public)
const LOGO_SRC = "/nursing-homes-near-me-logo.png";

// Hardcoded Web3Forms key
const WEB3FORMS_ACCESS_KEY = "4d3e088c-c6dd-4f5e-858e-edf38d13214f";

function getPrefillEmail(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("email") || "";
  } catch {
    return "";
  }
}

type Web3FormsResponse =
  | { success: true; message?: string }
  | { success: false; message?: string };

export default function FollowUpForm() {
  const [data, setData] = useState<FormData>({
    contactName: "",
    phone: "",
    email: getPrefillEmail(),

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

    consentToShare: false,

    botField: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  // Only required fields are enforced here (UI does not say "optional")
  const canSubmit = useMemo(() => {
    if (!data.contactName.trim()) return false;
    if (!data.phone.trim()) return false;
    if (!data.email.trim()) return false;

    if (!data.preferredSuburbArea.trim()) return false;
    if (!data.timing) return false;
    if (!data.currentLocation) return false;

    if (!data.placementNeed) return false;

    if (!data.patientName.trim()) return false;
    if (!data.relationshipToPatient) return false;

    if (!data.haveHadAcat) return false;
    if (!data.acatApprovedFor) return false;

    if (!data.consentToShare) return false;

    return true;
  }, [data]);

  const buildSummary = () => {
    const lines: string[] = [];

    lines.push(`CONTACT NAME: ${data.contactName}`);
    lines.push(`PHONE: ${data.phone}`);
    lines.push(`EMAIL: ${data.email}`);

    lines.push("");
    lines.push(`PREFERRED AREA: ${data.preferredSuburbArea}`);
    lines.push(`TIMING: ${data.timing}`);
    lines.push(`CURRENT LOCATION: ${data.currentLocation}`);
    if (data.currentLocation === "Hospital" && data.dischargeDate) {
      lines.push(`DISCHARGE DATE: ${data.dischargeDate}`);
    }

    lines.push("");
    lines.push(`CARE NEEDS PLACE: ${data.placementNeed}`);

    lines.push("");
    lines.push(`PATIENT NAME: ${data.patientName}`);
    lines.push(`RELATIONSHIP TO PATIENT: ${data.relationshipToPatient}`);

    if (data.gender) lines.push(`GENDER: ${data.gender}`);
    if (data.maritalStatus) lines.push(`MARITAL STATUS: ${data.maritalStatus}`);
    if (data.pensionStatus) lines.push(`PENSION STATUS: ${data.pensionStatus}`);

    if (data.livingSituation) lines.push(`LIVING SITUATION: ${data.livingSituation}`);
    if (data.ownHome) lines.push(`DO YOU OWN YOUR HOME?: ${data.ownHome}`);
    if (data.ownHome === "Yes") {
      if (data.someoneLivingInHome) lines.push(`IS SOMEONE LIVING IN IT?: ${data.someoneLivingInHome}`);
      if (data.someoneLivingInHome === "Yes" && data.whoLivingInHome.trim()) {
        lines.push(`WHO IS LIVING IN IT?: ${data.whoLivingInHome}`);
      }
    }

    lines.push("");
    lines.push(`HAD AN ACAT?: ${data.haveHadAcat}`);
    lines.push(`ACAT APPROVED FOR: ${data.acatApprovedFor}`);

    if (data.mobility) lines.push(`MOBILITY: ${data.mobility}`);
    if (data.cognition) lines.push(`COGNITION: ${data.cognition}`);
    if (data.behaviours) lines.push(`BEHAVIOURS OF CONCERN: ${data.behaviours}`);
    if (data.continence) lines.push(`CONTINENCE SUPPORT: ${data.continence}`);

    if (data.otherConcerns.trim()) lines.push(`OTHER: ${data.otherConcerns}`);
    if (data.notes.trim()) lines.push(`NOTES: ${data.notes}`);

    if (data.radRange) lines.push(`RAD RANGE: ${data.radRange}`);
    if (data.paymentPreference) lines.push(`PAYMENT PREFERENCE (RAD/DAP): ${data.paymentPreference}`);
    if (data.govtHelpAccommodation) lines.push(`GOV HELP FOR ACCOMMODATION COSTS: ${data.govtHelpAccommodation}`);
    if (data.meansTested) lines.push(`MEANS TESTED: ${data.meansTested}`);
    if (data.fundingNotes.trim()) lines.push(`FUNDING NOTES: ${data.fundingNotes}`);

    lines.push("");
    lines.push(`CONSENT TO SHARE WITH FACILITIES: ${data.consentToShare ? "Yes" : "No"}`);

    return lines.join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.botField) return;

    if (!WEB3FORMS_ACCESS_KEY) {
      setStatus({ type: "error", message: "Missing Web3Forms access key." });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const message = buildSummary();

      const payload = {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `NHNM – Follow Up Intake – ${data.preferredSuburbArea || "Area"} – ${data.timing || "Timing"}`,
        from_name: "NursingHomesNearMe",
        ...data,
        consentToShare: data.consentToShare ? "Yes" : "No",
        message,
      };

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as Web3FormsResponse;

      if (json.success) {
        setStatus({ type: "success", message: "Submitted. Thank you — we’ll be in touch shortly." });

        setData((prev) => ({
          ...prev,
          contactName: "",
          phone: "",
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

          consentToShare: false,
          botField: "",
        }));
      } else {
        setStatus({ type: "error", message: json.message || "Submission failed. Please try again." });
      }
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // consistent form control sizing
  const inputClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
  const selectClass = "mt-1 w-full h-10 rounded-lg border border-slate-300 px-3 text-sm";
  const textareaClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  // Funding: force labels to equal height so SELECTS align
  const fundingLabelClass = "block text-sm font-medium text-slate-700 md:min-h-[72px]";

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        {/* Bigger logo proportional */}
        <div className="mb-8 flex justify-center">
          <img
            src={LOGO_SRC}
            alt="Nursing Homes Near Me"
            className="h-28 w-auto md:h-32"
            loading="eager"
          />
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">Follow-Up Details</h1>
        <p className="mt-2 text-sm text-slate-600">
          This form collects only what nursing homes need to check availability and suitability.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* honeypot */}
          <input
            type="text"
            value={data.botField}
            onChange={(e) => setField("botField", e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Contact */}
          <section className="rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Full name *</label>
                <input
                  className={inputClass}
                  value={data.contactName}
                  onChange={(e) => setField("contactName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phone *</label>
                <input
                  className={inputClass}
                  value={data.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Email *</label>
                <input
                  className={inputClass}
                  value={data.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Location + timing */}
          <section className="rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Location & timing</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Preferred suburb/area *</label>
                <input
                  className={inputClass}
                  value={data.preferredSuburbArea}
                  onChange={(e) => setField("preferredSuburbArea", e.target.value)}
                  placeholder="e.g. Southport + 15km"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">When is care needed? *</label>
                <select
                  className={selectClass}
                  value={data.timing}
                  onChange={(e) => setField("timing", e.target.value as FormData["timing"])}
                >
                  <option value="">Select…</option>
                  <option value="ASAP">ASAP</option>
                  <option value="Within 2 weeks">Within 2 weeks</option>
                  <option value="2–6 weeks">2–6 weeks</option>
                  <option value="1–3 months">1–3 months</option>
                  <option value="Unsure">Unsure</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Currently *</label>
                <select
                  className={selectClass}
                  value={data.currentLocation}
                  onChange={(e) =>
                    setField("currentLocation", e.target.value as FormData["currentLocation"])
                  }
                >
                  <option value="">Select…</option>
                  <option value="Home">Home</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {data.currentLocation === "Hospital" && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Discharge date (if known)</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={data.dischargeDate}
                    onChange={(e) => setField("dischargeDate", e.target.value)}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Care needs place */}
          <section className="rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Care needs place</h2>
            <div className="mt-4">
              <label className="text-sm font-medium text-slate-700">Care type needed *</label>
              <select
                className={selectClass}
                value={data.placementNeed}
                onChange={(e) => setField("placementNeed", e.target.value as FormData["placementNeed"])}
              >
                <option value="">Select…</option>
                <option value="Respite">Respite</option>
                <option value="Respite with a view to permanent">Respite with a view to permanent</option>
                <option value="Permanent care">Permanent care</option>
              </select>
            </div>
          </section>

          {/* Personal snapshot */}
          <section className="rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Personal snapshot</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Patient full name *</label>
                <input
                  className={inputClass}
                  value={data.patientName}
                  onChange={(e) => setField("patientName", e.target.value)}
                  placeholder="Full name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Your relationship to the patient *</label>
                <select
                  className={selectClass}
                  value={data.relationshipToPatient}
                  onChange={(e) =>
                    setField("relationshipToPatient", e.target.value as FormData["relationshipToPatient"])
                  }
                >
                  <option value="">Select…</option>
                  <option value="Self">Self</option>
                  <option value="Spouse/Partner">Spouse/Partner</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Gender</label>
                <select
                  className={selectClass}
                  value={data.gender}
                  onChange={(e) => setField("gender", e.target.value as FormData["gender"])}
                >
                  <option value="">Select…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Marital status</label>
                <select
                  className={selectClass}
                  value={data.maritalStatus}
                  onChange={(e) => setField("maritalStatus", e.target.value as FormData["maritalStatus"])}
                >
                  <option value="">Select…</option>
                  <option value="Single">Single</option>
                  <option value="Married / Partner">Married / Partner</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced / Separated">Divorced / Separated</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Pension status</label>
                <select
                  className={selectClass}
                  value={data.pensionStatus}
                  onChange={(e) => setField("pensionStatus", e.target.value as FormData["pensionStatus"])}
                >
                  <option value="">Select…</option>
                  <option value="Full pension">Full pension</option>
                  <option value="Part pension">Part pension</option>
                  <option value="No pension">No pension</option>
                </select>
              </div>
            </div>
          </section>

          {/* Living situation */}
          <section className="rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Living situation</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Current living situation</label>
                <select
                  className={selectClass}
                  value={data.livingSituation}
                  onChange={(e) => setField("livingSituation", e.target.value as FormData["livingSituation"])}
                >
                  <option value="">Select…</option>
                  <option value="Own home">Own home</option>
                  <option value="Rental accommodation">Rental accommodation</option>
                  <option value="With friends">With friends</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Do you own your home?</label>
                <select
                  className={selectClass}
                  value={data.ownHome}
                  onChange={(e) => setField("ownHome", e.target.value as FormData["ownHome"])}
                >
                  <option value="">Select…</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unsure">Unsure</option>
                </select>
              </div>

              {data.ownHome === "Yes" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-700">If yes, is someone living in it?</label>
                    <select
                      className={selectClass}
                      value={data.someoneLivingInHome}
                      onChange={(e) =>
                        setField("someoneLivingInHome", e.target.value as FormData["someoneLivingInHome"])
                      }
                    >
                      <option value="">Select…</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Unsure">Unsure</option>
                    </select>
                  </div>

                  {data.someoneLivingInHome === "Yes" && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">If so, who?</label>
                      <textarea
                        className={textareaClass}
                        rows={3}
                        value={data.whoLivingInHome}
                        onChange={(e) => setField("whoLivingInHome", e.target.value)}
                        placeholder="e.g. spouse, adult child, tenant, other"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* ACAT */}
          <section className="rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">ACAT</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Have you had an ACAT? *</label>
                <select
                  className={selectClass}
                  value={data.haveHadAcat}
                  onChange={(e) => setField("haveHadAcat", e.target.value as FormData["haveHadAcat"])}
                >
                  <option value="">Select…</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unsure">Unsure</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Approved for which residential care? *</label>
                <select
                  className={selectClass}
                  value={data.acatApprovedFor}
                  onChange={(e) =>
                    setField("acatApprovedFor", e.target.value as FormData["acatApprovedFor"])
                  }
                >
                  <option value="">Select…</option>
                  <option value="Residential respite">Residential respite</option>
                  <option value="Residential permanent">Residential permanent</option>
                  <option value="Both">Both</option>
                  <option value="Not sure">Not sure</option>
                </select>
              </div>
            </div>
          </section>

          {/* Care needs */}
          <section className="rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Care needs</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Mobility</label>
                <select
                  className={selectClass}
                  value={data.mobility}
                  onChange={(e) => setField("mobility", e.target.value as FormData["mobility"])}
                >
                  <option value="">Select…</option>
                  <option value="Independent">Independent</option>
                  <option value="Walker">Walker</option>
                  <option value="Wheelchair">Wheelchair</option>
                  <option value="1-person assist">1-person assist</option>
                  <option value="2-person assist">2-person assist</option>
                  <option value="Hoist">Hoist</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Cognition</label>
                <select
                  className={selectClass}
                  value={data.cognition}
                  onChange={(e) => setField("cognition", e.target.value as FormData["cognition"])}
                >
                  <option value="">Select…</option>
                  <option value="None">None</option>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Dementia / high">Dementia / high</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Behaviours of concern?</label>
                <select
                  className={selectClass}
                  value={data.behaviours}
                  onChange={(e) => setField("behaviours", e.target.value as FormData["behaviours"])}
                >
                  <option value="">Select…</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Unsure">Unsure</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Continence support?</label>
                <select
                  className={selectClass}
                  value={data.continence}
                  onChange={(e) => setField("continence", e.target.value as FormData["continence"])}
                >
                  <option value="">Select…</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Unsure">Unsure</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Other</label>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={data.otherConcerns}
                  onChange={(e) => setField("otherConcerns", e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  className={textareaClass}
                  rows={4}
                  value={data.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Funding */}
          <section className="rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Funding</h2>

            <p className="mt-2 text-sm text-slate-600">
              <strong>RAD</strong> = a refundable lump sum accommodation deposit.
              <br />
              <strong>Daily payment (DAP)</strong> = paying the accommodation cost as a daily amount instead of a
              lump sum (or you can do a mix).
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={fundingLabelClass}>RAD range</label>
                <select
                  className={selectClass}
                  value={data.radRange}
                  onChange={(e) => setField("radRange", e.target.value)}
                >
                  <option value="">Select…</option>
                  {RAD_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={fundingLabelClass}>
                  Will they likely need government help with accommodation costs?
                </label>
                <select
                  className={selectClass}
                  value={data.govtHelpAccommodation}
                  onChange={(e) =>
                    setField("govtHelpAccommodation", e.target.value as FormData["govtHelpAccommodation"])
                  }
                >
                  <option value="">Select…</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unsure">Unsure</option>
                </select>
              </div>

              <div>
                <label className={fundingLabelClass}>Do you prefer RAD or daily payment?</label>
                <select
                  className={selectClass}
                  value={data.paymentPreference}
                  onChange={(e) =>
                    setField("paymentPreference", e.target.value as FormData["paymentPreference"])
                  }
                >
                  <option value="">Select…</option>
                  <option value="RAD">RAD (lump sum)</option>
                  <option value="DAP">Daily payment (DAP)</option>
                  <option value="Combination">Combination</option>
                  <option value="Unsure">Unsure</option>
                </select>
              </div>

              <div>
                <label className={fundingLabelClass}>
                  Have they completed a means assessment (means tested) for aged care fees?
                </label>
                <select
                  className={selectClass}
                  value={data.meansTested}
                  onChange={(e) => setField("meansTested", e.target.value as FormData["meansTested"])}
                >
                  <option value="">Select…</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unsure">Unsure</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Funding notes</label>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={data.fundingNotes}
                  onChange={(e) => setField("fundingNotes", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Consent */}
          <section className="rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Consent</h2>
            <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={data.consentToShare}
                onChange={(e) => setField("consentToShare", e.target.checked)}
              />
              <span>I consent to sharing these details with nursing homes to check availability and arrange call-backs. *</span>
            </label>
          </section>

          {status.type === "success" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {status.message}
            </div>
          )}

          {status.type === "error" && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
