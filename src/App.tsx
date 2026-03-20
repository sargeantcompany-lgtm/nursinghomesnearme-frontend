// src/App.tsx
import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";

import PlacementForm from "./components/PlacementForm";
import Privacy from "./Privacy";
import FollowUpForm from "./components/FollowUpForm";
import AdminNursingHomes from "./components/AdminNursingHomes";

import NursingHomeOptions from "./components/NursingHomeOptions";
import NursingHomeDetails from "./components/NursingHomeDetails";

import MyOptions from "./components/MyOptions";

import AdminLogin from "./components/AdminLogin";
import AdminCaseManager from "./components/AdminCaseManager";
import AdminCases from "./components/AdminCases";

import SocialWorkerReferralForm from "./components/SocialWorkerReferralForm";
import AdminMenu from "./components/AdminMenu";

import NursingHomesGoldCoast from "./components/NursingHomesGoldCoast";
import NursingHomesSouthport from "./components/NursingHomesSouthport";
import NursingHomesRobina from "./components/NursingHomesRobina";
import NursingHomesBurleigh from "./components/NursingHomesBurleigh";
import NursingHomesNerang from "./components/NursingHomesNerang";
import SiteStructuredData from "./components/SiteStructuredData";
import SeoHead from "./components/SeoHead";
import FacilityRespond from "./components/FacilityRespond";
import FacilityLogin from "./components/FacilityLogin";
import FacilityDashboard from "./components/FacilityDashboard";
import ClientWorkflowDashboard from "./components/ClientWorkflowDashboard";
import BlogIndex from "./components/BlogIndex";
import BlogPost from "./components/BlogPost";
import CareCircleApp from "./components/CareCircleApp";
import AcatPathwayFinderPage from "./components/AcatPathwayFinderPage";
import { API_BASE } from "./lib/runtimeConfig";

function isAdminAuthed() {
  return !!(localStorage.getItem("nhnm_admin_token") ?? "").trim();
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthed()) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AdminEntry() {
  if (isAdminAuthed()) return <Navigate to="/admin/menu" replace />;
  return <AdminLogin />;
}

export default function App() {
  return (
    <>
      <SiteStructuredData />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/follow-up" element={<FollowUpForm />} />
        <Route path="/referral" element={<ReferralPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/options" element={<NursingHomeOptions />} />
        <Route path="/options/:id" element={<NursingHomeDetails />} />

        <Route path="/my-options/:token" element={<MyOptions />} />
        <Route path="/nursing-homes-gold-coast" element={<NursingHomesGoldCoast />} />
        <Route path="/nursing-homes-southport" element={<NursingHomesSouthport />} />
        <Route path="/nursing-homes-robina" element={<NursingHomesRobina />} />
        <Route path="/nursing-homes-burleigh" element={<NursingHomesBurleigh />} />
        <Route path="/nursing-homes-nerang" element={<NursingHomesNerang />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/acat-pathway-finder" element={<AcatPathwayFinderPage />} />
        <Route path="/carecircle" element={<CareCircleApp />} />
        <Route path="/facility/respond/:matchResponseToken" element={<FacilityRespond />} />
        <Route path="/facility/login" element={<FacilityLogin />} />
        <Route path="/facility/dashboard" element={<FacilityDashboard />} />
        <Route path="/workflow/:token" element={<ClientWorkflowDashboard />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminEntry />} />
        <Route path="/admin/menu" element={<RequireAdmin><AdminMenu /></RequireAdmin>} />
        <Route path="/admin/case-manager" element={<RequireAdmin><AdminCaseManager /></RequireAdmin>} />
        <Route path="/admin/case-files" element={<RequireAdmin><AdminCases /></RequireAdmin>} />
        <Route path="/admin/nursing-homes" element={<RequireAdmin><AdminNursingHomes /></RequireAdmin>} />
        <Route path="/admin/cases" element={<Navigate to="/admin/case-manager" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

/* ── Shared styles injected once at root level ── */
const sharedPageStyles = `
  :root {
    --navy: #0b3b5b;
    --lightBlue: #2aa3df;
    --text: #111827;
    --green: #0D9488;
  }
  .pageWrap {
    max-width: 1800px;
    margin: 0 auto;
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .heroImg {
    width: 100%;
    max-width: 760px;
    margin: 18px auto 0;
    display: block;
  }
  .underHeroWrap {
    width: 100%;
    max-width: 900px;
    margin: 18px auto 0;
    padding: 0 8px;
    box-sizing: border-box;
    text-align: left;
  }
  .underHeroH1 {
    margin: 0;
    font-size: 34px;
    line-height: 1.1;
    color: var(--navy);
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .underHeroLead {
    margin: 10px 0 0;
    font-size: 18px;
    line-height: 1.35;
    color: var(--lightBlue);
    font-weight: 700;
  }
  .underHeroP {
    margin: 10px 0 0;
    font-size: 16px;
    line-height: 1.7;
    color: var(--text);
    font-weight: 500;
  }
  .extrasCard {
    width: 100%;
    max-width: 900px;
    margin: 28px auto 0;
    border: none;
    background: transparent;
    padding: 0;
    box-sizing: border-box;
  }
  .extrasTitle {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    color: var(--lightBlue);
    line-height: 1.2;
    text-align: left;
  }
  .extrasText {
    margin: 10px 0 0;
    font-size: 15px;
    color: var(--text);
    line-height: 1.7;
    font-weight: 500;
    text-align: left;
  }
  .seoCtaCard {
    width: 100%;
    max-width: 900px;
    margin: 28px auto 0;
    padding: 28px 30px;
    border-radius: 22px;
    background: linear-gradient(135deg, #0b3b5b 0%, #145374 62%, #1a6b72 100%);
    color: white;
    box-sizing: border-box;
    box-shadow: 0 18px 48px rgba(11, 59, 91, 0.18);
  }
  .seoCtaEyebrow {
    display: inline-block;
    margin: 0 0 10px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .seoCtaTitle {
    margin: 0;
    font-size: 30px;
    line-height: 1.12;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .seoCtaText {
    margin: 12px 0 0;
    font-size: 16px;
    line-height: 1.7;
    color: rgba(255,255,255,0.84);
    max-width: 700px;
  }
  .seoCtaLink {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-top: 18px;
    padding: 14px 22px;
    border-radius: 999px;
    background: white;
    color: #0b3b5b;
    text-decoration: none;
    font-weight: 800;
    font-size: 15px;
  }
  .homePaths {
    width: 100%;
    max-width: 980px;
    margin: 32px auto 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  .homePathCard {
    border-radius: 22px;
    padding: 24px 22px;
    color: white;
    box-shadow: 0 16px 40px rgba(11, 59, 91, 0.14);
    min-height: 250px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .homePathCard:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 56px rgba(11, 59, 91, 0.22);
  }
  .homePathCard--search {
    background: linear-gradient(135deg, #0b3b5b 0%, #145374 100%);
  }
  .homePathCard--acat {
    background: linear-gradient(135deg, #145374 0%, #1a6b72 100%);
  }
  .homePathCard--circle {
    background: linear-gradient(135deg, #8f3b2e 0%, #e8563a 100%);
  }
  .homePathEyebrow {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.78;
  }
  .homePathTitle {
    margin: 10px 0 0;
    font-size: 26px;
    line-height: 1.08;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .homePathText {
    margin: 12px 0 0;
    font-size: 15px;
    line-height: 1.7;
    color: rgba(255,255,255,0.88);
  }
  .homePathLink {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 13px 18px;
    border-radius: 999px;
    background: white;
    color: #0b3b5b;
    text-decoration: none;
    font-weight: 800;
    font-size: 14px;
    width: fit-content;
  }
  .statsStrip {
    width: 100%;
    max-width: 760px;
    margin: 20px auto 0;
    display: flex;
    align-items: stretch;
    background: linear-gradient(135deg, #0b3b5b 0%, #0d4a6b 60%, #0a4a52 100%);
    border-radius: 18px;
    padding: 22px 28px;
    box-sizing: border-box;
    gap: 0;
  }
  .statsStripItem {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    padding: 0 12px;
  }
  .statsStripNum {
    font-size: 42px;
    font-weight: 900;
    color: #2dd4bf;
    line-height: 1;
    letter-spacing: -0.03em;
  }
  .statsStripLabel {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255,255,255,0.65);
    text-align: center;
    line-height: 1.3;
    margin-top: 6px;
    white-space: nowrap;
  }
  .statsStripDivider {
    width: 1px;
    background: rgba(255,255,255,0.12);
    flex-shrink: 0;
    align-self: stretch;
  }
  @media (max-width: 640px) {
    .statsStrip { flex-wrap: wrap; gap: 16px; padding: 18px 20px; }
    .statsStripDivider { display: none; }
    .statsStripItem { min-width: 45%; }
  }
  .bottomSpace { height: 40px; }
  .bottomStrip {
    width: 100%;
    background: #0b3b5b;
    margin-top: 24px;
    border-radius: 12px;
    padding: 18px 16px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .footerLeft {
    display: flex;
    align-items: center;
    gap: 12px;
    color: white;
    font-size: 14px;
    line-height: 1.2;
    min-width: 0;
  }
  .flags {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
  }
  .flag {
    width: 30px;
    height: auto;
    display: block;
    border-radius: 3px;
    flex: 0 0 auto;
  }
  .footerRight {
    color: white;
    font-size: 14px;
    line-height: 1.2;
    text-align: right;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .footerLink {
    color: white;
    text-decoration: underline;
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    font: inherit;
  }
  .footerSep { opacity: 0.7; }
  @media (max-width: 768px) {
    .heroImg { max-width: 90%; }
    .underHeroH1 { font-size: 26px; }
    .underHeroLead { font-size: 16px; }
    .underHeroP { font-size: 15px; }
    .seoCtaCard { padding: 22px 20px; border-radius: 18px; }
    .seoCtaTitle { font-size: 24px; }
    .seoCtaText { font-size: 15px; }
    .homePaths { grid-template-columns: 1fr; gap: 14px; }
    .homePathCard { min-height: auto; }
    .bottomStrip { border-radius: 10px; flex-direction: column; align-items: flex-start; }
    .footerRight { text-align: left; justify-content: flex-start; }
    .flag { width: 26px; }
  }
`;

/* ── Shared footer ── */
function SiteFooter() {
  return (
    <div className="bottomStrip">
      <div className="footerLeft">
        <div className="flags">
          <img src="/aussieflag.png" alt="Australian Flag" className="flag" />
          <img src="/aboriginalflag.png" alt="Aboriginal Flag" className="flag" />
        </div>
        <span>&copy; {new Date().getFullYear()} Nursing Homes Near Me</span>
      </div>
      <div className="footerRight">
        <Link className="footerLink" to="/privacy">Privacy</Link>
        <span className="footerSep">|</span>
        <a className="footerLink" href="mailto:info@nursinghomesnearme.com.au">
          info@nursinghomesnearme.com.au
        </a>
      </div>
    </div>
  );
}

/* ── Shared header ── */
function SiteHeader({ showHome = false, onAdmin }: { showHome?: boolean; onAdmin: () => void }) {
  return (
    <header style={{ padding: "12px 24px", backgroundColor: "#0b3b5b", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
        <img src="/nursing-homes-near-me-logo.png" alt="Nursing Homes Near Me" style={{ height: 52, width: "auto", display: "block" }} />
      </Link>
      <HeaderLinksMenu showHome={showHome} onAdmin={onAdmin} />
    </header>
  );
}

/* ========================= HOME PAGE ========================= */

// Calculate a growing stat: starts at `base`, adds `ratePerTwoDays` every 2 days from launch
const LAUNCH_DATE = new Date("2026-03-20T00:00:00+10:00");
function growingStat(base: number, ratePerTwoDays: number): number {
  const daysSince = Math.max(0, Math.floor((Date.now() - LAUNCH_DATE.getTime()) / 86_400_000));
  return base + Math.floor(daysSince / 2) * ratePerTwoDays;
}

function useCountUp(target: number): number {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (target === 0) return;
    const steps = 40;
    const stepMs = 1200 / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setValue(Math.round((target / steps) * Math.min(step, steps)));
      if (step >= steps) clearInterval(timer);
    }, stepMs);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}

function HomePage() {
  const navigate = useNavigate();
  const formRef = React.useRef<HTMLDivElement | null>(null);
  const [acatHtml, setAcatHtml] = React.useState("");

  const nursingTarget  = growingStat(9,  3);
  const acatTarget     = growingStat(33, 2);
  const circleTarget   = growingStat(7,  1);
  const nursingCount   = useCountUp(nursingTarget);
  const acatCount      = useCountUp(acatTarget);
  const circleCount    = useCountUp(circleTarget);
  const month = new Intl.DateTimeFormat("en-AU", { month: "long" }).format(new Date());

  React.useEffect(() => {
    fetch("/acat-pathway-finder-source.txt", { cache: "no-cache" })
      .then((r) => r.text())
      .then((t) => setAcatHtml(t.replace("</head>", "<style>html,body{background:#ffffff!important;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif!important}</style></head>")))
      .catch(() => {});
  }, []);

  function openAdmin() {
    if (isAdminAuthed()) {
      navigate("/admin/menu");
      return;
    }
    navigate("/admin");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <SeoHead
        title="Nursing Homes Near Me | Gold Coast Aged Care Placement Support"
        description="Free, independent support for Gold Coast families to compare nursing home options, understand ACAT and costs, and move faster when placement is urgent."
        canonicalUrl="https://www.nursinghomesnearme.com.au/"
        ogType="website"
        imageUrl="https://www.nursinghomesnearme.com.au/social-preview.png"
      />
      <style>{sharedPageStyles}</style>
      <SiteHeader onAdmin={openAdmin} />

      <main className="pageWrap">
        <img src="/nursinghomesnearme-woman.png" alt="Nursing Homes Near Me" className="heroImg" />

        <div className="statsStrip">
          <div className="statsStripItem">
            <span className="statsStripNum">{nursingCount}</span>
            <span className="statsStripLabel">families placed in {month}</span>
          </div>
          <div className="statsStripDivider" />
          <div className="statsStripItem">
            <span className="statsStripNum">{acatCount}</span>
            <span className="statsStripLabel">ACAT tool sessions in {month}</span>
          </div>
          <div className="statsStripDivider" />
          <div className="statsStripItem">
            <span className="statsStripNum">{circleCount}</span>
            <span className="statsStripLabel">families on CareCircle</span>
          </div>
        </div>

        <section className="underHeroWrap" aria-label="Introduction">
          <h1 className="underHeroH1">Nursing Homes Near Me</h1>
          <p className="underHeroLead">Free, independent placement support to help you find the best available option.</p>
          <p className="underHeroP">
            Aged care can be a hard landscape to navigate. We provide a completely free, independent placement
            service focused on the best available outcome for you or your loved one. It's not about settling for
            "anything available" — it's about finding the best fit that exists right now, and exploring every option.
          </p>
        </section>

        <div ref={formRef}>
          <PlacementForm />
        </div>

        {acatHtml && (
          <section style={{ width: "100%", maxWidth: 900, margin: "32px auto 0", padding: "0 8px", boxSizing: "border-box" }} aria-label="ACAT Pathway Finder">
            <div style={{ marginBottom: 20 }}>
              <div className="underHeroLead" style={{ marginBottom: 6 }}>ACAT Tracker &amp; Guide</div>
              <p className="underHeroP" style={{ margin: 0 }}>
                An ACAT assessment (Aged Care Assessment Team) is the official government gateway to aged care services in Australia. You must have one before accessing any government-funded nursing home, home care package, or respite care. It's free — use this tool to understand where you are in the process.
              </p>
            </div>
            <iframe
              title="ACAT Pathway Finder"
              srcDoc={acatHtml}
              style={{ width: "100%", minHeight: 1100, border: 0, display: "block", borderRadius: 18, overflow: "hidden" }}
              onLoad={() => { fetch(`${API_BASE}/api/track/acat-view`, { method: "POST" }).catch(() => {}); }}
            />
          </section>
        )}

        <div style={{ width: "100%", maxWidth: 900, margin: "32px auto 0", padding: "0 8px", boxSizing: "border-box" }}>
          <div
            style={{ background: "#1a2035", borderRadius: 24, padding: "40px 36px", cursor: "pointer" }}
            role="link" tabIndex={0}
            onClick={() => navigate("/carecircle")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/carecircle"); } }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
              <div>
                <div style={{ color: "#e8563a", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Family coordination app</div>
                <h2 style={{ fontFamily: "Georgia,\"Times New Roman\",serif", fontSize: 30, fontWeight: 700, color: "#fff", margin: "0 0 14px", lineHeight: 1.15 }}>
                  CareCircle — keep the whole family across everything
                </h2>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, lineHeight: 1.7, margin: 0, maxWidth: 540 }}>
                  One place for visits, tasks, medications, bills, and quick family updates.
                  Invite family members, carers, and neighbours — everyone sees what they need to.
                </p>
              </div>
              <Link
                to="/carecircle"
                onClick={(e) => e.stopPropagation()}
                style={{ background: "#e8563a", color: "#fff", borderRadius: 999, padding: "13px 24px", fontWeight: 800, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0, display: "inline-block" }}
              >
                Open CareCircle →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
              {[
                { lbl: "TO", title: "Today view", desc: "Morning, afternoon, evening tasks. Who's coming and when. Mark things done as you go." },
                { lbl: "NB", title: "Needs board", desc: "Ongoing help that rotates. Grocery runs, dog walking, washing — the family shares the load." },
                { lbl: "FU", title: "Family updates", desc: "Post a quick note. Everyone in the circle sees it. No more group-chat chaos." },
                { lbl: "RX", title: "Medications", desc: "What they take and when. Allergies pinned to every screen. Always visible in an emergency." },
                { lbl: "$B", title: "Bills & finances", desc: "Due dates, direct debits, and who manages which account. Nothing falls through the cracks." },
                { lbl: "CC", title: "Circle members", desc: "Invite family, carers, neighbours. Assign roles, track who holds POA, and who has the spare key." },
              ].map(({ lbl, title, desc }) => (
                <div key={title} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "18px 16px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(232,86,58,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#e8563a", marginBottom: 12 }}>{lbl}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>How it works</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {[
                  { n: "1", title: "Set up in 5 minutes", desc: "Add your loved one's name, address, GP, medications, and emergency contacts. It's all in one place from day one." },
                  { n: "2", title: "Invite your circle", desc: "Add family members, carers, neighbours, and friends. Each person gets a link — no app download needed." },
                  { n: "3", title: "Coordinate together", desc: "Everyone sees today's tasks, who's visiting, what's needed, and any updates. Nothing gets missed." },
                ].map(({ n, title, desc }) => (
                  <div key={n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(232,86,58,0.2)", border: "1px solid rgba(232,86,58,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#e8563a", flexShrink: 0 }}>{n}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bottomSpace" />
        <SiteFooter />
      </main>
    </div>
  );
}

/* ========================= PRIVACY PAGE ========================= */

function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <SeoHead
        title="Privacy Policy | Nursing Homes Near Me"
        description="Privacy policy for Nursing Homes Near Me."
        canonicalUrl="https://www.nursinghomesnearme.com.au/privacy"
        robots="noindex,follow"
      />
      <style>{sharedPageStyles}</style>
      <SiteHeader onAdmin={() => window.location.assign("/admin")} />
      <Privacy onBack={() => window.history.back()} />
    </div>
  );
}

/* ========================= REFERRAL PAGE ========================= */

function ReferralPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <SeoHead
        title="Social Worker Referrals | Nursing Homes Near Me"
        description="Referral form for hospital and community teams needing fast nursing home placement support on the Gold Coast."
        canonicalUrl="https://www.nursinghomesnearme.com.au/referral"
        ogType="website"
        imageUrl="https://www.nursinghomesnearme.com.au/social-preview.png"
      />
      <style>{sharedPageStyles}</style>
      <SiteHeader showHome onAdmin={() => window.location.assign("/admin")} />

      <main className="pageWrap">
        <section className="underHeroWrap" aria-label="Social worker referral">
          <h1 className="underHeroH1">Social worker referrals</h1>
          <p className="underHeroLead">Fast referral form for hospital and community teams.</p>
          <p className="underHeroP">
            Please complete the form below. We will follow up as soon as possible. This service is free and
            independent — we don't take referral payments from facilities.
          </p>
        </section>

        <div style={{ height: 18 }} />
        <SocialWorkerReferralForm />
        <div style={{ height: 40 }} />
        <SiteFooter />
      </main>
    </div>
  );
}

/* ========================= HEADER MENU ========================= */

function HeaderLinksMenu({ showHome, onAdmin }: { showHome: boolean; onAdmin: () => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const linkStyle: React.CSSProperties = {
    color: "#0b3b5b",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
    padding: "6px 4px",
    display: "block",
    borderRadius: 6,
  };

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          color: "white",
          border: "1px solid rgba(255,255,255,0.45)",
          background: "rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: "8px 12px",
          cursor: "pointer",
          fontWeight: 900,
        }}
        aria-expanded={open}
        aria-label="Menu"
      >
        Menu
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            minWidth: 230,
            background: "white",
            borderRadius: 12,
            border: "1px solid #cbd5e1",
            padding: "10px 12px",
            display: "grid",
            gap: 4,
            zIndex: 50,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          {showHome && (
            <Link style={linkStyle} to="/" onClick={() => setOpen(false)}>Home</Link>
          )}
          <Link style={linkStyle} to="/login" onClick={() => setOpen(false)}>Client Login</Link>
          <Link style={linkStyle} to="/referral" onClick={() => setOpen(false)}>Referral Form</Link>
          <Link style={linkStyle} to="/facility/login" onClick={() => setOpen(false)}>Facility Portal</Link>
          <Link style={linkStyle} to="/nursing-homes-gold-coast" onClick={() => setOpen(false)}>Gold Coast Nursing Homes</Link>
          <Link style={linkStyle} to="/blog" onClick={() => setOpen(false)}>Blog</Link>
          <div style={{ borderTop: "1px solid #e5e7eb", margin: "4px 0" }} />
          <button
            style={{ ...linkStyle, background: "transparent", border: 0, cursor: "pointer", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 13 }}
            onClick={() => { setOpen(false); onAdmin(); }}
          >
            Admin
          </button>
        </div>
      )}
    </div>
  );
}

/* ========================= LOGIN PAGE ========================= */

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showForgot, setShowForgot] = React.useState(false);
  const [linkSent, setLinkSent] = React.useState(false);
  const [linkSending, setLinkSending] = React.useState(false);
  const [linkError, setLinkError] = React.useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/workflow/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Invalid email or password");
      navigate(`/workflow/${data.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function sendLoginLink(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLinkSending(true);
    setLinkError("");
    try {
      const res = await fetch(`${API_BASE}/api/workflow/request-login-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to send");
      setLinkSent(true);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLinkSending(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 20 }}>
      <SeoHead
        title="Client Login | Nursing Homes Near Me"
        description="Secure client login for Nursing Homes Near Me."
        canonicalUrl="https://www.nursinghomesnearme.com.au/login"
        robots="noindex,follow"
      />
      <div style={{ maxWidth: 520, margin: "0 auto", background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <img
            src="/nursing-homes-near-me-logo.png"
            alt="Nursing Homes Near Me"
            style={{
              width: "100%",
              maxWidth: 260,
              height: "auto",
              display: "block",
            }}
          />
        </div>
        <h1 style={{ marginTop: 0, color: "#0b3b5b" }}>Client Login</h1>
        <p style={{ color: "#475569", marginTop: 0, fontSize: 14 }}>
          Sign in to view your nursing home matches and submission details.
        </p>

        {!showForgot ? (
          <>
            <form onSubmit={handleLogin} style={{ marginTop: 16 }}>
              <label style={{ display: "block", marginBottom: 14 }}>
                <div style={{ color: "#334155", fontWeight: 700, marginBottom: 6, fontSize: 14 }}>Email address</div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{ width: "100%", borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 12px", fontSize: 14, boxSizing: "border-box" }}
                />
              </label>
              <label style={{ display: "block" }}>
                <div style={{ color: "#334155", fontWeight: 700, marginBottom: 6, fontSize: 14 }}>Password</div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  style={{ width: "100%", borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 12px", fontSize: 14, boxSizing: "border-box" }}
                />
              </label>

              {error ? (
                <div style={{ marginTop: 10, color: "#991b1b", fontSize: 13, background: "#fef2f2", borderRadius: 8, padding: "8px 12px" }}>
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                style={{ marginTop: 14, width: "100%", padding: "11px 16px", borderRadius: 10, border: "none", background: loading || !email.trim() || !password ? "#94a3b8" : "#0b3b5b", color: "white", fontWeight: 700, fontSize: 15, cursor: loading || !email.trim() || !password ? "not-allowed" : "pointer" }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div style={{ marginTop: 14, textAlign: "center" }}>
              <button
                style={{ background: "none", border: "none", color: "#0f766e", cursor: "pointer", fontSize: 13, textDecoration: "underline", padding: 0 }}
                onClick={() => { setShowForgot(true); setError(""); }}
              >
                Forgot password? Send me a login link instead
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: "#475569", fontSize: 14, marginTop: 16 }}>
              Enter your email and we&apos;ll send you a one-time login link.
            </p>
            {linkSent ? (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 16 }}>
                <div style={{ color: "#166534", fontWeight: 700 }}>Login link sent</div>
                <div style={{ color: "#15803d", fontSize: 14, marginTop: 4 }}>
                  Check your inbox at <strong>{email}</strong> and click the link to access your dashboard.
                </div>
              </div>
            ) : (
              <form onSubmit={sendLoginLink} style={{ marginTop: 8 }}>
                <label style={{ display: "block" }}>
                  <div style={{ color: "#334155", fontWeight: 700, marginBottom: 6, fontSize: 14 }}>Email address</div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{ width: "100%", borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 12px", fontSize: 14, boxSizing: "border-box" }}
                  />
                </label>
                {linkError ? (
                  <div style={{ marginTop: 10, color: "#991b1b", fontSize: 13, background: "#fef2f2", borderRadius: 8, padding: "8px 12px" }}>
                    {linkError}
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={linkSending || !email.trim()}
                  style={{ marginTop: 12, padding: "10px 16px", borderRadius: 10, border: "none", background: linkSending || !email.trim() ? "#94a3b8" : "#0b3b5b", color: "white", fontWeight: 700, fontSize: 14, cursor: linkSending || !email.trim() ? "not-allowed" : "pointer" }}
                >
                  {linkSending ? "Sending..." : "Send login link"}
                </button>
              </form>
            )}
            <div style={{ marginTop: 12 }}>
              <button
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, textDecoration: "underline", padding: 0 }}
                onClick={() => { setShowForgot(false); setLinkSent(false); setLinkError(""); }}
              >
                ← Back to password login
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <span style={{ fontSize: 13, color: "#475569" }}>New client? </span>
          <Link to="/" style={{ fontSize: 13, color: "#0f766e", fontWeight: 700, textDecoration: "underline" }}>
            Submit your enquiry →
          </Link>
        </div>

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e5e7eb", fontSize: 13, color: "#94a3b8" }}>
          Are you a nursing home?{" "}
          <Link to="/facility/login" style={{ color: "#0b3b5b", textDecoration: "underline" }}>
            Facility portal →
          </Link>
        </div>
      </div>
    </div>
  );
}
