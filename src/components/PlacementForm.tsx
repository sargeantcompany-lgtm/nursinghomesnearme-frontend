import React, { useMemo, useState } from "react";
import { API_BASE } from "../lib/runtimeConfig";

type Timing = "ASAP" | "Within 2 weeks" | "Next 1-3 months" | "Just researching";
type CareType = "Permanent" | "Respite" | "Dementia" | "High care";
type CurrentLocation = "At home" | "In hospital" | "In respite care" | "Other";
type FundingPlan =
  | "Selling home to fund care"
  | "RAD available from savings/cash"
  | "Combination of RAD and daily payments"
  | "Likely concessional / government support"
  | "Unsure";
type WaitingListPreference =
  | "Yes, open to both (waiting list + home care)"
  | "Waiting list only"
  | "Home care only"
  | "Placement must be immediate";
type SupportAtHome = "Yes" | "No" | "Unsure";
type BudgetRange =
  | "Below $300k"
  | "$300k-$500k"
  | "$500k-$700k"
  | "$700k+"
  | "Unsure";

type FormData = {
  contactName: string;
  email: string;
  phone: string;
  preferredLocation1: string;
  preferredLocation2: string;
  timing: Timing | "";
  currentLocation: CurrentLocation | "";
  careTypes: CareType[];
  fundingPlan: FundingPlan | "";
  budgetRange: BudgetRange | "";
  waitingListPreference: WaitingListPreference | "";
  supportAtHome: SupportAtHome | "";
  acatNumber: string;
  notes: string;
  consentToShareWithHomes: boolean;
};

const initialData: FormData = {
  contactName: "",
  email: "",
  phone: "",
  preferredLocation1: "",
  preferredLocation2: "",
  timing: "",
  currentLocation: "",
  careTypes: [],
  fundingPlan: "",
  budgetRange: "",
  waitingListPreference: "",
  supportAtHome: "",
  acatNumber: "",
  notes: "",
  consentToShareWithHomes: false,
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-sm">
    {children}
  </div>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl sm:text-3xl font-semibold text-[#1E3A5F] mb-4">{children}</h2>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm font-medium text-[#1F2937] mb-2">{children}</div>
);

const Help = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{children}</p>
);

const Btn = ({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={[
      "rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-150",
      disabled
        ? "opacity-50 cursor-not-allowed"
        : "hover:shadow-md active:scale-95",
      variant === "primary"
        ? "bg-[#0D9488] text-white hover:bg-[#0f7a6e]"
        : "bg-[#F5F1E8] text-[#1E3A5F] border border-[#E5E7EB] hover:bg-[#EDE9DF]",
    ].join(" ")}
  >
    {children}
  </button>
);

const Radio = ({
  name,
  value,
  checked,
  label,
  onChange,
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  onChange: () => void;
}) => (
  <label
    className={[
      "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
      checked
        ? "bg-[#0D9488]/10 border-[#0D9488] shadow-sm"
        : "border-[#E5E7EB] hover:bg-[#FAFAF7] hover:border-[#0D9488]/30",
    ].join(" ")}
  >
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
    <div
      className={[
        "h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
        checked ? "border-[#0D9488] bg-[#0D9488]" : "border-[#CBD5E1]",
      ].join(" ")}
    >
      {checked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
    </div>
    <span className={["font-medium transition-colors", checked ? "text-[#0D9488]" : "text-[#1F2937]"].join(" ")}>
      {label}
    </span>
  </label>
);

const Check = ({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) => (
  <label
    className={[
      "flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
      checked
        ? "bg-[#0D9488]/10 border-[#0D9488] shadow-sm"
        : "border-[#E5E7EB] hover:bg-[#FAFAF7] hover:border-[#0D9488]/30",
    ].join(" ")}
  >
    <div
      className={[
        "h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
        checked ? "border-[#0D9488] bg-[#0D9488]" : "border-[#CBD5E1]",
      ].join(" ")}
    >
      {checked && (
        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 10">
          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    <span className={["font-medium transition-colors", checked ? "text-[#0D9488]" : "text-[#1F2937]"].join(" ")}>
      {label}
    </span>
  </label>
);

const STEP_LABELS = ["Get started", "Care needs", "Budget & funding", "Review"];

function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={[
              "h-2 flex-1 rounded-full transition-all duration-300",
              i < current ? "bg-[#0D9488]" : "bg-[#E5E7EB]",
            ].join(" ")}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#0D9488]">
          {STEP_LABELS[current - 1]}
        </span>
        <span className="text-xs text-[#94A3B8]">
          Step {current} of {total}
        </span>
      </div>
    </div>
  );
}

export default function PlacementForm() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [data, setData] = useState<FormData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSending, setLoginSending] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  const preferredLocations = useMemo(
    () => [data.preferredLocation1, data.preferredLocation2].map((x) => x.trim()).filter(Boolean),
    [data.preferredLocation1, data.preferredLocation2],
  );

  const canNext = useMemo(() => {
    if (step === 1) {
      return (
        data.contactName.trim().length >= 2 &&
        isValidEmail(data.email)
      );
    }
    if (step === 2) {
      return (
        preferredLocations.length >= 1 &&
        data.timing !== "" &&
        data.currentLocation !== "" &&
        data.careTypes.length > 0
      );
    }
    if (step === 3) {
      return (
        data.fundingPlan !== "" &&
        data.budgetRange !== "" &&
        data.waitingListPreference !== "" &&
        data.supportAtHome !== ""
      );
    }
    if (step === 4) return data.consentToShareWithHomes;
    return true;
  }, [step, data, preferredLocations.length]);

  function toggleCareType(t: CareType) {
    setData((prev) => ({
      ...prev,
      careTypes: prev.careTypes.includes(t) ? prev.careTypes.filter((x) => x !== t) : [...prev.careTypes, t],
    }));
  }

  async function sendDashboardLoginLink(email: string) {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      throw new Error("Missing email address for dashboard access.");
    }

    const res = await fetch(`${API_BASE}/api/workflow/request-login-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || "Failed to send login email");
  }

  async function submit() {
    if (!canNext || submitting) return;

    setSubmitting(true);
    setLoginMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/workflow/placement-intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          suburb: preferredLocations[0] ?? "",
          preferredLocations,
          timing: data.timing,
          currentLocation: data.currentLocation,
          careTypes: data.careTypes,
          acatNumber: data.acatNumber,
          notes: data.notes,
          consentToShare: data.consentToShareWithHomes,
          fundingPlan: data.fundingPlan,
          budgetRange: data.budgetRange,
          supportAtHome: data.supportAtHome,
          waitingListPreference: data.waitingListPreference,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "We couldn't create your client profile.");

      if (json?.clientToken) {
        localStorage.setItem("nhnm_workflow_token", json.clientToken);
      }

      setSubmitted(true);
      setStep(5);
      const trimmedEmail = data.email.trim();
      setLoginEmail(trimmedEmail);

      try {
        await sendDashboardLoginLink(trimmedEmail);
        setLoginMessage("Your dashboard access email has been sent. Open it to set your password.");
      } catch (linkError) {
        setLoginMessage(
          linkError instanceof Error
            ? `Your dashboard was created, but the email link could not be sent yet: ${linkError.message}`
            : "Your dashboard was created, but the email link could not be sent yet.",
        );
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function requestDashboardLoginLink() {
    const email = loginEmail.trim();
    if (!email || loginSending) return;
    setLoginSending(true);
    setLoginMessage("");
    try {
      await sendDashboardLoginLink(email);
      setLoginMessage("Login link sent. Check your inbox and set your password.");
    } catch (e) {
      setLoginMessage(e instanceof Error ? e.message : "Failed to send login email");
    } finally {
      setLoginSending(false);
    }
  }

  if (step === 5 && submitted) {
    const workflowToken = localStorage.getItem("nhnm_workflow_token");

    return (
      <div className="bg-white px-2 py-2">
        <div className="max-w-4xl mx-auto w-full">
          <Card>
            <div className="text-[#0D9488] font-bold text-lg mb-2">Client profile created</div>
            <H2>Check your email to set your password</H2>
            <p className="text-[#475569] leading-relaxed">
              We have created your client card and started building local matches. Your dashboard email
              lets you set a password, answer a few more questions, and review your options.
            </p>

            <div className="mt-4 text-sm text-[#334155]">{loginMessage}</div>

            <div className="mt-4">
              <Label>Email for dashboard access</Label>
              <input
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#0D9488]/30"
              />
            </div>

            <div className="mt-4 flex gap-3 flex-wrap">
              <Btn onClick={requestDashboardLoginLink} disabled={!isValidEmail(loginEmail) || loginSending}>
                {loginSending ? "Sending..." : "Resend my dashboard link"}
              </Btn>
              {workflowToken ? (
                <a
                  href={`/workflow/${workflowToken}`}
                  className="text-[#0D9488] font-semibold underline self-center text-sm"
                >
                  Open dashboard now &rarr;
                </a>
              ) : null}
            </div>

            <div className="mt-6">
              <Btn
                variant="secondary"
                onClick={() => {
                  setStep(1);
                  setData(initialData);
                  setSubmitted(false);
                  setLoginEmail("");
                  setLoginMessage("");
                }}
              >
                Start a new enquiry
              </Btn>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white px-2 py-2">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-4 px-1">
          {["Free service", "No referral fees", "Independent advice"].map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-xs font-semibold text-[#0D9488]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 14 14">
                <circle cx="7" cy="7" r="6.5" stroke="#0D9488" strokeWidth="1.2" />
                <path d="M4 7l2 2 4-4" stroke="#0D9488" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t}
            </span>
          ))}
        </div>
        <Steps current={step} total={totalSteps} />

        {step > 1 && step <= totalSteps && (
          <div className="mb-4">
            <Btn variant="secondary" onClick={() => setStep((s) => Math.max(1, s - 1))}>
              &larr; Back
            </Btn>
          </div>
        )}

        <Card>
          {step === 1 && (
            <>
              <H2>Find the best nursing home option</H2>
              <p className="text-sm text-[#475569] mb-5 leading-relaxed">
                Takes about 2 minutes. We'll create your profile and send matching options straight to your inbox.
              </p>

              <div className="space-y-4">
                <div>
                  <Label>Your name</Label>
                  <input
                    value={data.contactName}
                    onChange={(e) => setData((p) => ({ ...p, contactName: e.target.value }))}
                    placeholder="e.g. Jane Smith"
                    className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                  />
                </div>

                <div>
                  <Label>Email address</Label>
                  <input
                    value={data.email}
                    onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                  />
                  {data.email.length > 0 && !isValidEmail(data.email) ? (
                    <div className="text-sm text-[#B91C1C] mt-1">Please enter a valid email.</div>
                  ) : null}
                </div>

                <div className="flex justify-end">
                  <Btn onClick={() => setStep(2)} disabled={!canNext}>
                    Next &rarr;
                  </Btn>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <H2>Placement needs</H2>

              <div className="space-y-4 mb-6">
                <div>
                  <Label>Phone number</Label>
                  <input
                    value={data.phone}
                    onChange={(e) => setData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. 0400 000 000"
                    className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                  />
                </div>
                <div>
                  <Label>Preferred suburb</Label>
                  <input
                    value={data.preferredLocation1}
                    onChange={(e) => setData((p) => ({ ...p, preferredLocation1: e.target.value }))}
                    placeholder="e.g. Southport"
                    className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                  />
                </div>
                <div>
                  <Label>Second preferred suburb (optional)</Label>
                  <input
                    value={data.preferredLocation2}
                    onChange={(e) => setData((p) => ({ ...p, preferredLocation2: e.target.value }))}
                    placeholder="e.g. Robina"
                    className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                  />
                </div>
              </div>

              <div className="mb-5">
                <Label>When is care needed?</Label>
                <div className="grid gap-3">
                  {(["ASAP", "Within 2 weeks", "Next 1-3 months", "Just researching"] as Timing[]).map((t) => (
                    <Radio
                      key={t}
                      name="timing"
                      value={t}
                      checked={data.timing === t}
                      label={t}
                      onChange={() => setData((p) => ({ ...p, timing: t }))}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <Label>Where is the person now?</Label>
                <div className="grid gap-3">
                  {(["At home", "In hospital", "In respite care", "Other"] as CurrentLocation[]).map((t) => (
                    <Radio
                      key={t}
                      name="currentLocation"
                      value={t}
                      checked={data.currentLocation === t}
                      label={t}
                      onChange={() => setData((p) => ({ ...p, currentLocation: t }))}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <Label>Type of care needed</Label>
                <div className="grid gap-3">
                  {(["Permanent", "Respite", "Dementia", "High care"] as CareType[]).map((t) => (
                    <Check
                      key={t}
                      checked={data.careTypes.includes(t)}
                      label={t}
                      onChange={() => toggleCareType(t)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>ACAT / My Aged Care approval number (optional)</Label>
                <input
                  value={data.acatNumber}
                  onChange={(e) => setData((p) => ({ ...p, acatNumber: e.target.value }))}
                  placeholder="If you have it"
                  className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                />
              </div>

              <div className="flex justify-end mt-6">
                <Btn onClick={() => setStep(3)} disabled={!canNext}>
                  Next &rarr;
                </Btn>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <H2>Budget and funding</H2>

              <div className="mb-5">
                <Label>How will care likely be funded?</Label>
                <div className="grid gap-3">
                  {([
                    "Selling home to fund care",
                    "RAD available from savings/cash",
                    "Combination of RAD and daily payments",
                    "Likely concessional / government support",
                    "Unsure",
                  ] as FundingPlan[]).map((t) => (
                    <Radio
                      key={t}
                      name="fundingPlan"
                      value={t}
                      checked={data.fundingPlan === t}
                      label={t}
                      onChange={() => setData((p) => ({ ...p, fundingPlan: t }))}
                    />
                  ))}
                </div>
                <Help>We use this to flag selling-home cases, government support, and likely pathway.</Help>
              </div>

              <div className="mb-5">
                <Label>Accommodation budget range</Label>
                <div className="grid gap-3">
                  {(["Below $300k", "$300k-$500k", "$500k-$700k", "$700k+", "Unsure"] as BudgetRange[]).map((t) => (
                    <Radio
                      key={t}
                      name="budgetRange"
                      value={t}
                      checked={data.budgetRange === t}
                      label={t}
                      onChange={() => setData((p) => ({ ...p, budgetRange: t }))}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <Label>What if there is no immediate vacancy?</Label>
                <div className="grid gap-3">
                  {([
                    "Yes, open to both (waiting list + home care)",
                    "Waiting list only",
                    "Home care only",
                    "Placement must be immediate",
                  ] as WaitingListPreference[]).map((t) => (
                    <Radio
                      key={t}
                      name="waitingListPreference"
                      value={t}
                      checked={data.waitingListPreference === t}
                      label={t}
                      onChange={() => setData((p) => ({ ...p, waitingListPreference: t }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Already on a home care / Support at Home package?</Label>
                <div className="grid gap-3">
                  {(["Yes", "No", "Unsure"] as SupportAtHome[]).map((t) => (
                    <Radio
                      key={t}
                      name="supportAtHome"
                      value={t}
                      checked={data.supportAtHome === t}
                      label={t}
                      onChange={() => setData((p) => ({ ...p, supportAtHome: t }))}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Btn onClick={() => setStep(4)} disabled={!canNext}>
                  Next &rarr;
                </Btn>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <H2>Review and create your dashboard</H2>
              <p className="text-sm text-[#475569] mb-5 leading-relaxed">
                We will create your client profile, shortlist likely local options, and email you a dashboard
                link so you can set your password and add more details.
              </p>

              <div className="mb-5">
                <Label>Anything else we should know? (optional)</Label>
                <textarea
                  value={data.notes}
                  onChange={(e) => setData((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Hospital urgency, dementia support needs, preferred facilities, or anything else important."
                  rows={4}
                  className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[#0D9488]/30"
                />
              </div>

              <div className="bg-[#FAFAF7] border border-[#E5E7EB] rounded-2xl p-4 mb-5">
                <div className="text-xs font-bold tracking-wide text-[#0D9488] mb-1">YOUR SUMMARY</div>
                <div className="text-sm text-[#334155] space-y-1">
                  <div><span className="font-semibold">Name:</span> {data.contactName}</div>
                  <div><span className="font-semibold">Area:</span> {preferredLocations.join(", ")}</div>
                  <div><span className="font-semibold">Timing:</span> {data.timing}</div>
                  <div><span className="font-semibold">Care type:</span> {data.careTypes.join(", ")}</div>
                  <div><span className="font-semibold">Funding:</span> {data.fundingPlan}</div>
                  <div><span className="font-semibold">Budget:</span> {data.budgetRange}</div>
                  <div><span className="font-semibold">Fallback path:</span> {data.waitingListPreference}</div>
                  <div><span className="font-semibold">Home care package:</span> {data.supportAtHome}</div>
                </div>
              </div>

              <div className="mb-5">
                <Check
                  checked={data.consentToShareWithHomes}
                  label="I consent to my contact details being shared with matched nursing homes so they can follow up directly."
                  onChange={() =>
                    setData((p) => ({ ...p, consentToShareWithHomes: !p.consentToShareWithHomes }))
                  }
                />
              </div>

              <div className="flex justify-end">
                <Btn onClick={submit} disabled={!canNext || submitting}>
                  {submitting ? "Creating your dashboard..." : "Create my dashboard"}
                </Btn>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
