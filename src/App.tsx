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
import SiteStructuredData from "./components/SiteStructuredData";
import SeoHead from "./components/SeoHead";
import FacilityRespond from "./components/FacilityRespond";
import FacilityLogin from "./components/FacilityLogin";
import FacilityDashboard from "./components/FacilityDashboard";
import ClientWorkflowDashboard from "./components/ClientWorkflowDashboard";
import BlogIndex from "./components/BlogIndex";
import BlogPost from "./components/BlogPost";
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
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
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
    max-width: 1100px;
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
  .videoWrap {
    display: flex;
    justify-content: center;
    margin: 22px 0 22px;
  }
  .heroVideo {
    width: 100%;
    max-width: 900px;
    border-radius: 12px;
    background: #000;
  }
  .formGap { height: 28px; }
  .stepsRow {
    display: flex;
    width: 100%;
    gap: 0;
    margin-top: 0;
    align-items: flex-start;
  }
  .stepItem {
    flex: 1 1 0;
    display: flex;
    justify-content: center;
  }
  .stepImg {
    width: 92%;
    max-width: 520px;
    height: auto;
    display: block;
  }
  .stepImg--border {
    border: 3px solid var(--green);
    border-radius: 18px;
    padding: 10px;
    background: #ffffff;
    box-sizing: border-box;
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
    .videoWrap { margin: 18px 0 18px; }
    .heroVideo { max-width: 100%; }
    .formGap { height: 18px; }
    .stepsRow { flex-direction: column; gap: 18px; }
    .stepItem { justify-content: center; }
    .stepImg { width: 100%; max-width: 520px; }
    .stepImg--border { padding: 8px; }
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
    <header style={{ padding: "16px 24px", backgroundColor: "#0b3b5b", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: 900, letterSpacing: 0.2 }}>
        Nursing Homes Near Me
      </Link>
      <HeaderLinksMenu showHome={showHome} onAdmin={onAdmin} />
    </header>
  );
}

/* ========================= HOME PAGE ========================= */

function HomePage() {
  const navigate = useNavigate();

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

        <section className="underHeroWrap" aria-label="Introduction">
          <h1 className="underHeroH1">Nursing Homes Near Me</h1>
          <p className="underHeroLead">Free, independent placement support to help you find the best available option.</p>
          <p className="underHeroP">
            Aged care can be a hard landscape to navigate. We provide a completely free, independent placement
            service focused on the best available outcome for you or your loved one. It's not about settling for
            "anything available" — it's about finding the best fit that exists right now, and exploring every option.
          </p>
        </section>

        <div className="videoWrap">
          <video controls playsInline preload="metadata" poster="/video-thumb.png" className="heroVideo">
            <source src="/videos/nhnm-intro.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <PlacementForm />

        <div className="formGap" />

        <div className="stepsRow">
          <div className="stepItem">
            <img src="/step-1.png" alt="Step One" className="stepImg stepImg--border" />
          </div>
          <div className="stepItem">
            <img src="/step-2.png" alt="Step Two" className="stepImg stepImg--border" />
          </div>
          <div className="stepItem">
            <img src="/step-3.png" alt="Step Three" className="stepImg stepImg--border" />
          </div>
        </div>

        <section className="extrasCard" aria-label="Extra support services">
          <h2 className="extrasTitle">Extra support services</h2>
          <p className="extrasText">
            Moving into aged care often involves more than just finding the right facility. We can also help connect
            you with trusted local services to make the transition smoother — downsizing and decluttering, aged-care
            removalists, packing and unpacking, furniture delivery and storage, exit cleaning, gardening and lawn
            maintenance, handyman repairs, home styling, building and pest inspections, plus real estate support,
            property appraisals, conveyancers, and solicitors (Power of Attorney, wills, and estate planning). We
            can also assist with antique collectors, auctioneers, and valuers if needed.
          </p>
        </section>

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
