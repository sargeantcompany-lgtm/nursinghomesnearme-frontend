import React from "react";
import SeoHead from "./SeoHead";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#faf6ef",
  fontFamily: "'Inter', sans-serif",
  color: "#0f172a",
};

const hero: React.CSSProperties = {
  background: "#0b3b5b",
  color: "#fff",
  padding: "56px 20px 48px",
  textAlign: "center",
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(24px, 4vw, 40px)",
  fontWeight: 900,
  margin: "0 0 12px",
  letterSpacing: "-0.5px",
};

const heroSub: React.CSSProperties = {
  fontSize: 17,
  opacity: 0.85,
  maxWidth: 640,
  margin: "0 auto",
  lineHeight: 1.6,
};

const updated: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(255,255,255,0.15)",
  borderRadius: 999,
  padding: "4px 14px",
  fontSize: 13,
  marginTop: 18,
};

const wrap: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "40px 20px 80px",
};

const section: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  padding: "32px 28px",
  marginBottom: 24,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "#0b3b5b",
  margin: "0 0 6px",
};

const sectionIntro: React.CSSProperties = {
  fontSize: 15,
  color: "#475569",
  marginBottom: 20,
  lineHeight: 1.65,
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

const th: React.CSSProperties = {
  background: "#f1f5f9",
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: 700,
  color: "#334155",
  borderBottom: "2px solid #e2e8f0",
};

const td: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid #f1f5f9",
  color: "#1e293b",
  verticalAlign: "top",
};

const tdAlt: React.CSSProperties = {
  ...td,
  background: "#fafbfc",
};

const highlight: React.CSSProperties = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 12,
  padding: "16px 20px",
  marginBottom: 16,
  display: "flex",
  gap: 14,
  alignItems: "flex-start",
};

const highlightIcon: React.CSSProperties = {
  fontSize: 22,
  flexShrink: 0,
  marginTop: 2,
};

const highlightText: React.CSSProperties = {
  fontSize: 14,
  color: "#1e3a5f",
  lineHeight: 1.65,
};

const pill: React.CSSProperties = {
  display: "inline-block",
  background: "#dbeafe",
  color: "#1e40af",
  borderRadius: 999,
  padding: "3px 12px",
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 10,
};

const faqItem: React.CSSProperties = {
  borderBottom: "1px solid #f1f5f9",
  paddingBottom: 18,
  marginBottom: 18,
};

const faqQ: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
  color: "#0b3b5b",
  marginBottom: 6,
};

const faqA: React.CSSProperties = {
  fontSize: 14,
  color: "#475569",
  lineHeight: 1.7,
};

const ctaBox: React.CSSProperties = {
  background: "#0b3b5b",
  borderRadius: 16,
  padding: "36px 28px",
  textAlign: "center",
  color: "#fff",
  marginTop: 32,
};

const ctaBtn: React.CSSProperties = {
  display: "inline-block",
  background: "#fff",
  color: "#0b3b5b",
  fontWeight: 800,
  borderRadius: 999,
  padding: "14px 32px",
  fontSize: 16,
  textDecoration: "none",
  marginTop: 18,
  cursor: "pointer",
};

type RowProps = { cells: string[]; alt?: boolean };
function TR({ cells, alt }: RowProps) {
  const style = alt ? tdAlt : td;
  return (
    <tr>
      {cells.map((c, i) => (
        <td key={i} style={style} dangerouslySetInnerHTML={{ __html: c }} />
      ))}
    </tr>
  );
}

export default function AgedCareFeesPage() {
  return (
    <div style={page}>
      <SeoHead
        title="Aged Care Fees & Charges Explained 2026 | Nursing Homes Near Me"
        description="Complete guide to residential aged care fees in Australia — basic daily fee, RAD, DAP, means-tested contributions and the new 2025 reforms. Current figures updated March 2026."
        canonicalUrl="https://www.nursinghomesnearme.com.au/aged-care-fees-and-charges"
        ogType="article"
        imageUrl="https://www.nursinghomesnearme.com.au/social-preview.png"
      />

      <div style={hero}>
        <h1 style={heroTitle}>Aged Care Fees &amp; Charges Explained</h1>
        <p style={heroSub}>
          A plain-English guide to every fee you may pay when entering a residential aged care home in Australia — with current dollar amounts.
        </p>
        <span style={updated}>Updated March 2026 · Effective from 1 November 2025</span>
      </div>

      <div style={wrap}>

        {/* Overview */}
        <div style={section}>
          <div style={pill}>Overview</div>
          <h2 style={sectionTitle}>What fees will I pay?</h2>
          <p style={sectionIntro}>
            Residential aged care fees in Australia changed significantly on <strong>1 November 2025</strong>. There are now up to four types of fees depending on your financial situation. Everyone pays the Basic Daily Fee. Accommodation costs depend on your assets. Care contributions depend on your income and assets.
          </p>

          <div style={highlight}>
            <span style={highlightIcon}>💡</span>
            <div style={highlightText}>
              <strong>New rules from 1 November 2025:</strong> Providers can now retain up to 2% of your RAD per year (max 10% over 5 years). DAPs are indexed twice yearly. New lifetime caps apply to care contributions.
            </div>
          </div>

          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Fee type</th>
                <th style={th}>Who pays it</th>
                <th style={th}>Current amount</th>
              </tr>
            </thead>
            <tbody>
              <TR cells={["Basic Daily Fee", "Everyone", "$65.55/day (~$23,926/year)"]} />
              <TR cells={["Hotelling Contribution", "Means-tested residents (new framework)", "Up to $22.15/day"]} alt />
              <TR cells={["Non-Clinical Care Contribution", "Means-tested residents (new framework)", "Up to $105.30/day"]} />
              <TR cells={["Accommodation (RAD or DAP)", "Residents above asset threshold", "Set by facility, approved by Govt"]} alt />
              <TR cells={["Extra Service Fee", "Optional — premium facilities only", "Set by facility"]} />
            </tbody>
          </table>
        </div>

        {/* Basic Daily Fee */}
        <div style={section}>
          <div style={pill}>Fee 1</div>
          <h2 style={sectionTitle}>Basic Daily Fee</h2>
          <p style={sectionIntro}>
            The Basic Daily Fee covers everyday living costs — meals, laundry, cleaning, utilities and basic care. <strong>Every resident pays this</strong>, regardless of income or assets. It is set by the Australian Government at 85% of the single basic Age Pension and is indexed twice yearly (March and September).
          </p>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Amount</th>
                <th style={th}>Annual equivalent</th>
                <th style={th}>Remote supplement</th>
              </tr>
            </thead>
            <tbody>
              <TR cells={["$65.55 per day", "~$23,926 per year", "+$1.06/day additional"]} />
            </tbody>
          </table>
        </div>

        {/* Accommodation */}
        <div style={section}>
          <div style={pill}>Fee 2</div>
          <h2 style={sectionTitle}>Accommodation Costs — RAD &amp; DAP</h2>
          <p style={sectionIntro}>
            Accommodation costs cover your room. You can pay as a lump sum (RAD), a daily fee (DAP), or a combination of both. The amount is set by the facility and published on My Aged Care. If your assets are below the threshold, the government pays your accommodation costs.
          </p>

          <div style={highlight}>
            <span style={highlightIcon}>🏠</span>
            <div style={highlightText}>
              <strong>New from 1 November 2025:</strong> Providers can retain up to 2% of your RAD per year for up to 5 years — meaning up to 10% may be deducted before refund. The balance is still refunded when you leave or pass away.
            </div>
          </div>

          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Type</th>
                <th style={th}>What it is</th>
                <th style={th}>Current figures</th>
              </tr>
            </thead>
            <tbody>
              <TR cells={[
                "RAD (Refundable Accommodation Deposit)",
                "Lump sum paid upfront. Refunded (less any retention) when you leave.",
                "National average ~$573,000. Max without Govt approval: $758,627"
              ]} />
              <TR cells={[
                "DAP (Daily Accommodation Payment)",
                "Daily fee instead of lump sum. Calculated using the MPIR.",
                "MPIR: 7.65% p.a. (Jan–Mar 2026)<br/>Example: $500,000 RAD × 7.65% ÷ 365 = <strong>$104.79/day</strong>"
              ]} alt />
              <TR cells={[
                "Combination",
                "Pay part RAD upfront, remainder as DAP.",
                "DAP reduces proportionally to the RAD paid"
              ]} />
            </tbody>
          </table>

          <div style={{ marginTop: 18, ...highlight, background: "#f0fdf4", borderColor: "#bbf7d0" }}>
            <span style={highlightIcon}>✅</span>
            <div style={{ ...highlightText, color: "#14532d" }}>
              <strong>Government-supported residents:</strong> If your annual income is below <strong>$34,762</strong> and assessable assets below <strong>$63,000</strong>, the government pays your full accommodation costs — you pay no RAD or DAP.
            </div>
          </div>
        </div>

        {/* Means-Tested Contributions */}
        <div style={section}>
          <div style={pill}>Fee 3 — New Framework (from 1 Nov 2025)</div>
          <h2 style={sectionTitle}>Means-Tested Care Contributions</h2>
          <p style={sectionIntro}>
            For residents entering care from 1 November 2025, the old "means-tested care fee" is replaced by two separate contributions. How much you pay depends on your income and assets as assessed by Services Australia.
          </p>

          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Contribution</th>
                <th style={th}>What it covers</th>
                <th style={th}>Maximum daily rate</th>
              </tr>
            </thead>
            <tbody>
              <TR cells={["Hotelling Contribution", "Food, cleaning, utilities — the 'hotel-style' services", "$22.15/day"]} />
              <TR cells={["Non-Clinical Care Contribution", "Personal care, lifestyle activities, allied health", "$105.30/day"]} alt />
            </tbody>
          </table>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0b3b5b", margin: "24px 0 10px" }}>Lifetime &amp; time caps</h3>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Cap type</th>
                <th style={th}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <TR cells={["Non-clinical care — 4-year time cap", "1,460 cumulative days"]} />
              <TR cells={["Lifetime cap (new residents)", "$135,318.69"]} alt />
              <TR cells={["Lifetime cap (grandfathered — pre Sep 2024 HCP recipients)", "$84,571.66"]} />
            </tbody>
          </table>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0b3b5b", margin: "24px 0 10px" }}>Income &amp; asset thresholds</h3>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Threshold</th>
                <th style={th}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <TR cells={["Income free area — single", "$34,762/year"]} />
              <TR cells={["Income free area — couple (illness separated)", "$34,034/year"]} alt />
              <TR cells={["Income free area — couple (living together)", "$26,871/year"]} />
              <TR cells={["Asset-free threshold", "$63,000"]} alt />
              <TR cells={["First asset threshold", "$210,555.20"]} />
              <TR cells={["Second asset threshold", "$252,000"]} alt />
              <TR cells={["Home exemption cap (per person)", "$210,555.20"]} />
            </tbody>
          </table>
        </div>

        {/* Old framework */}
        <div style={section}>
          <div style={pill}>Pre-November 2025 Residents</div>
          <h2 style={sectionTitle}>Means-Tested Care Fee (Old Framework)</h2>
          <p style={sectionIntro}>
            Residents who entered care <strong>before 1 November 2025</strong> remain on the previous means-tested care fee structure. These residents are protected under "no worse off" provisions.
          </p>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Cap type</th>
                <th style={th}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <TR cells={["Annual cap", "$35,238.11"]} />
              <TR cells={["Lifetime cap", "$84,571.66"]} alt />
            </tbody>
          </table>
        </div>

        {/* Transition Care */}
        <div style={section}>
          <div style={pill}>Short-term care</div>
          <h2 style={sectionTitle}>Transition Care Program</h2>
          <p style={sectionIntro}>
            Transition Care is short-term support (up to 12 weeks) for people leaving hospital who are not yet ready to go home or into permanent aged care. It is government-funded with a small daily contribution.
          </p>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Setting</th>
                <th style={th}>Maximum daily fee</th>
              </tr>
            </thead>
            <tbody>
              <TR cells={["At home / community setting", "$13.49/day"]} />
              <TR cells={["In a residential aged care facility", "$65.55/day"]} alt />
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div style={section}>
          <div style={pill}>FAQ</div>
          <h2 style={sectionTitle}>Common questions</h2>
          <div style={{ marginTop: 20 }}>

            <div style={faqItem}>
              <p style={faqQ}>What is the MPIR and how does it affect my DAP?</p>
              <p style={faqA}>The Maximum Permissible Interest Rate (MPIR) is set by the government each quarter and used to calculate your Daily Accommodation Payment. For January–March 2026 it is <strong>7.65% per annum</strong>. To calculate a DAP: divide your RAD by 365, then multiply by the MPIR. Example: $500,000 × 7.65% ÷ 365 = $104.79/day.</p>
            </div>

            <div style={faqItem}>
              <p style={faqQ}>Do I get my RAD back?</p>
              <p style={faqA}>Yes — the RAD is refundable. Under the new rules (from 1 November 2025), providers may retain up to 2% per year for up to 5 years (max 10%). The remaining balance is refunded to you or your estate when you leave the facility or pass away.</p>
            </div>

            <div style={faqItem}>
              <p style={faqQ}>What if I can't afford the RAD?</p>
              <p style={faqA}>You can pay as a DAP (daily fee) instead, or a combination. If your assessable assets are below $63,000 and income below $34,762/year, the government pays your full accommodation costs — you pay nothing for accommodation.</p>
            </div>

            <div style={faqItem}>
              <p style={faqQ}>Does my home count as an asset?</p>
              <p style={faqA}>Your home is excluded from the asset assessment for the first two years if a spouse, dependent child, or carer is still living in it. After that it may be included up to the home exemption cap of $210,555.20 per person.</p>
            </div>

            <div style={faqItem}>
              <p style={faqQ}>How do I find out exactly what I'll pay?</p>
              <p style={faqA}>Services Australia conducts a means assessment (income and assets test) and issues a letter confirming your fees. You can request this before you enter care. Call Services Australia on 1800 227 475 or apply through MyGov.</p>
            </div>

            <div style={{ ...faqItem, borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>
              <p style={faqQ}>What is an ACAT assessment and do I need one?</p>
              <p style={faqA}>Yes. An Aged Care Assessment Team (ACAT) assessment is required before you can access government-funded residential aged care. It determines what level of care you need. The assessment is free and can be requested by your GP or hospital.</p>
            </div>

          </div>
        </div>

        {/* CTA */}
        <div style={ctaBox}>
          <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 900 }}>Not sure what you'll pay?</h2>
          <p style={{ opacity: 0.85, fontSize: 15, margin: 0, lineHeight: 1.6 }}>
            Our team helps Gold Coast families understand aged care costs and find the right home. Free, independent, no obligation.
          </p>
          <a href="/" style={ctaBtn}>Talk to our team →</a>
        </div>

        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 32, textAlign: "center", lineHeight: 1.6 }}>
          Source: Australian Government Department of Health and Aged Care. Figures current as at 1 November 2025 / January 2026. This page is for general information only and does not constitute financial advice. Fees are subject to change — always verify with Services Australia or a registered aged care financial adviser.
        </p>
      </div>
    </div>
  );
}
