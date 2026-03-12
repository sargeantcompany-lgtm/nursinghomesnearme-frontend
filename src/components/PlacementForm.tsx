import React, { useMemo, useState } from "react";
import { API_BASE } from "../lib/runtimeConfig";

type Timing = "ASAP" | "Next 3 months" | "Next 6 months" | "Currently in hospital";
type CareType = "Permanent" | "Respite" | "Dementia" | "High care";

type FormData = {
  contactName: string;
  email: string;
  phone: string;
  preferredLocation1: string;
  preferredLocation2: string;
  timing: Timing | "";
  careTypes: CareType[];
  consentToShareWithHomes: boolean;
};

const initialData: FormData = {
  contactName: "",
  email: "",
  phone: "",
  preferredLocation1: "",
  preferredLocation2: "",
  timing: "",
  careTypes: [],
  consentToShareWithHomes: false,
};

const WEB3FORMS_ACCESS_KEY = "4d3e088c-c6dd-4f5e-858e-edf38d13214f";

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

const Btn = ({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={[
      "rounded-2xl px-5 py-3 text-sm font-semibold transition",
      disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90",
      variant === "primary"
        ? "bg-[#0D9488] text-white"
        : "bg-[#F5F1E8] text-[#1E3A5F] border border-[#E5E7EB]",
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
  <label className="flex items-center gap-3 p-4 rounded-2xl border border-[#E5E7EB] hover:bg-[#FAFAF7] cursor-pointer">
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="h-4 w-4" />
    <span className="text-[#1F2937]">{label}</span>
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
  <label className="flex items-start gap-3 p-4 rounded-2xl border border-[#E5E7EB] hover:bg-[#FAFAF7] cursor-pointer">
    <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 mt-0.5 flex-shrink-0" />
    <span className="text-[#1F2937]">{label}</span>
  </label>
);

function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            "h-2 flex-1 rounded-full transition-all",
            i < current ? "bg-[#0D9488]" : "bg-[#E5E7EB]",
          ].join(" ")}
        />
      ))}
      <span className="text-xs text-[#64748B] whitespace-nowrap ml-1">
        Step {current} of {total}
      </span>
    </div>
  );
}

export default function PlacementForm() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [data, setData] = useState<FormData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSending, setLoginSending] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [dashboardEmailTriggered, setDashboardEmailTriggered] = useState(false);

  const preferredLocations = useMemo(
    () => [data.preferredLocation1, data.preferredLocation2].map((x) => x.trim()).filter(Boolean),
    [data.preferredLocation1, data.preferredLocation2],
  );

  const canNext = useMemo(() => {
    if (step === 1) {
      return data.contactName.trim().length >= 2 && isValidEmail(data.email) && preferredLocations.length >= 1;
    }
    if (step === 2) return data.timing !== "" && data.careTypes.length > 0;
    if (step === 3) return data.consentToShareWithHomes;
    return true;
  }, [step, data, preferredLocations.length]);

  function toggleCareType(t: CareType) {
    setData((prev) => ({
      ...prev,
      careTypes: prev.careTypes.includes(t) ? prev.careTypes.filter((x) => x !== t) : [...prev.careTypes, t],
    }));
  }

  async function submit() {
    if (!canNext || submitting) return;

    setSubmitting(true);
    setLoginMessage("");
    setDashboardEmailTriggered(false);

    try {
      const payload = {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `New Placement Enquiry - ${data.contactName}`,
        from_name: "NursingHomesNearMe.com.au",
        replyto: data.email,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        preferredLocations,
        timing: data.timing,
        careTypes: data.careTypes.join(", "),
        consentToShareWithHomes: "Yes",
        botcheck: "",
      };

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Submission failed");

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 10000);
      let workflowTriggered = false;

      try {
        const wRes = await fetch(`${API_BASE}/api/workflow/placement-intake`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactName: data.contactName,
            email: data.email,
            phone: data.phone,
            suburb: preferredLocations[0] ?? "",
            preferredLocations,
            timing: data.timing,
            careTypes: data.careTypes,
            consentToShare: data.consentToShareWithHomes,
          }),
          signal: controller.signal,
        });
        const wJson = wRes.ok ? await wRes.json() : null;
        if (!wRes.ok) {
          throw new Error("Dashboard email setup failed");
        }
        if (wJson?.clientToken) {
          localStorage.setItem("nhnm_workflow_token", wJson.clientToken);
        }
        workflowTriggered = true;
      } catch {
        setLoginMessage("Your enquiry was received, but the dashboard email could not be sent automatically. You can resend it below.");
      } finally {
        window.clearTimeout(timer);
      }

      setDashboardEmailTriggered(workflowTriggered);
      setSubmitted(true);
      setStep(4);
      setLoginEmail(data.email.trim());
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
      const res = await fetch(`${API_BASE}/api/workflow/request-login-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const msg = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(msg?.message || "Failed to send login email");
      setDashboardEmailTriggered(true);
      setLoginMessage("Login link sent - check your inbox.");
    } catch (e) {
      setLoginMessage(e instanceof Error ? e.message : "Failed to send login email");
    } finally {
      setLoginSending(false);
    }
  }

  if (step === 4 && submitted) {
    const workflowToken = localStorage.getItem("nhnm_workflow_token");

    return (
      <div className="bg-white px-2 py-2">
        <div className="max-w-4xl mx-auto w-full">
          <Card>
            <div className="text-[#0D9488] font-bold text-lg mb-2">Enquiry received</div>
            <H2>We'll be in touch shortly</H2>
            <p className="text-[#475569] leading-relaxed">
              We've received your details and will reach out with options. In the meantime, you can access your
              client dashboard to add more information and track progress.
            </p>

            <div className="mt-4 text-sm text-[#334155]">
              {dashboardEmailTriggered
                ? "Your dashboard access email has been sent."
                : "If you don't receive your dashboard access email, you can resend it below."}
            </div>

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
                {loginSending ? "Sending..." : dashboardEmailTriggered ? "Resend my dashboard link" : "Email me my dashboard link"}
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

            {loginMessage ? <div className="mt-3 text-sm text-[#334155]">{loginMessage}</div> : null}

            <div className="mt-6">
              <Btn
                variant="secondary"
                onClick={() => {
                  setStep(1);
                  setData(initialData);
                  setSubmitted(false);
                  setLoginEmail("");
                  setLoginMessage("");
                  setDashboardEmailTriggered(false);
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
        <Steps current={step} total={totalSteps} />

        {step > 1 && (
          <div className="mb-4">
            <Btn variant="secondary" onClick={() => setStep((s) => Math.max(1, s - 1))}>
              &larr; Back
            </Btn>
          </div>
        )}

        <Card>
          {step === 1 && (
            <>
              <H2>Find care options near you</H2>
              <p className="text-sm text-[#475569] mb-5 leading-relaxed">
                Free and independent - we don't charge families or take referral payments from facilities.
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
                  {data.email.length > 0 && !isValidEmail(data.email) && (
                    <div className="text-sm text-[#B91C1C] mt-1">Please enter a valid email.</div>
                  )}
                </div>

                <div>
                  <Label>Phone number (optional)</Label>
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

                <div className="pt-1 border-t border-[#E5E7EB]">
                  <p className="text-xs text-[#94A3B8] mt-3">
                    Looking for a job in aged care? Please contact facilities directly or visit a job board - this form is for families seeking placement.
                  </p>
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

              <div className="mb-5">
                <Label>When is placement needed?</Label>
                <div className="grid gap-3">
                  {(["ASAP", "Currently in hospital", "Next 3 months", "Next 6 months"] as Timing[]).map((t) => (
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

              <div>
                <Label>Type of care needed (tick all that apply)</Label>
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

              <div className="flex justify-end mt-6">
                <Btn onClick={() => setStep(3)} disabled={!canNext}>
                  Next &rarr;
                </Btn>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <H2>Almost done</H2>
              <p className="text-sm text-[#475569] mb-5 leading-relaxed">
                We'll send you a list of matching nursing homes and follow up to discuss options. We never
                share your information without your consent.
              </p>

              <div className="mb-5">
                <Check
                  checked={data.consentToShareWithHomes}
                  label="I consent to my contact details being shared with nursing homes that are matched for me, so they can follow up directly."
                  onChange={() =>
                    setData((p) => ({ ...p, consentToShareWithHomes: !p.consentToShareWithHomes }))
                  }
                />
              </div>

              <div className="bg-[#FAFAF7] border border-[#E5E7EB] rounded-2xl p-4 mb-5">
                <div className="text-xs font-bold tracking-wide text-[#0D9488] mb-1">YOUR SUMMARY</div>
                <div className="text-sm text-[#334155] space-y-1">
                  <div><span className="font-semibold">Name:</span> {data.contactName}</div>
                  <div><span className="font-semibold">Suburb:</span> {preferredLocations.join(", ")}</div>
                  <div><span className="font-semibold">Timing:</span> {data.timing}</div>
                  <div><span className="font-semibold">Care type:</span> {data.careTypes.join(", ")}</div>
                </div>
              </div>

              <div className="flex justify-end">
                <Btn onClick={submit} disabled={!canNext || submitting}>
                  {submitting ? "Submitting..." : "Submit enquiry"}
                </Btn>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
