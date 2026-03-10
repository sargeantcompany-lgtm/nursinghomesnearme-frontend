type PrivacyProps = {
  onBack: () => void;
};

export default function Privacy({ onBack }: PrivacyProps) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Top bar */}
      <header
        style={{
          padding: "16px 24px",
          backgroundColor: "#0b3b5b",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "28px 16px 60px" }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            color: "#0b3b5b",
            textDecoration: "underline",
            cursor: "pointer",
            padding: 0,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          ← Back
        </button>

        <h1 style={{ fontSize: 28, margin: "0 0 10px" }}>Privacy Policy</h1>
        <p style={{ marginTop: 0, color: "#475569" }}>Last updated: 19 January 2026</p>

        <p>
          Nursing Homes Near Me (“we”, “us”, “our”) respects your privacy. This Privacy Policy explains
          how we collect, use, store and share your personal information when you use our website and services.
        </p>

        <h2 style={{ marginTop: 28 }}>1) What we collect</h2>
        <p>When you submit a form, call us, email us, or otherwise contact us, we may collect:</p>
        <ul>
          <li>Your name and contact details (email, phone)</li>
          <li>Your suburb/postcode and preferred location(s)</li>
          <li>Information about care needs (e.g. respite/permanent care, dementia support, level of assistance needed)</li>
          <li>Budget or price range (if provided)</li>
          <li>Any other details you choose to share that help us assist you</li>
        </ul>
        <p>
          We may also collect basic website usage data (for example: pages visited and device/browser information)
          to help improve the website.
        </p>

        <h2 style={{ marginTop: 28 }}>2) Why we collect it</h2>
        <p>We collect and use your information to:</p>
        <ul>
          <li>Provide you with nursing home options in your local area</li>
          <li>Contact you to clarify care needs and preferences</li>
          <li>Help you narrow options based on availability, suitability and budget</li>
          <li>Send you information, reports, or recommendations you request</li>
          <li>Improve our service and website experience</li>
          <li>Meet legal and regulatory obligations (where applicable)</li>
        </ul>

        <h2 style={{ marginTop: 28 }}>3) Related services we may help with (with your permission)</h2>
        <p>
          With your permission, we may also use your information to help connect you with services commonly needed
          during an aged-care transition, such as:
        </p>
        <ul>
          <li>selling a home / property appraisal support</li>
          <li>moving / removals and storage</li>
          <li>cleaning, maintenance, or preparation services</li>
          <li>insurance or other practical support services</li>
        </ul>
        <p>
          We only use and share your information for these related services <b>with your permission</b>, and we only
          share what is reasonably necessary to assist you.
        </p>

        <h2 style={{ marginTop: 28 }}>4) How we share your information</h2>
        <p>We <b>do not sell</b> your personal information.</p>
        <p>We may share your information with third parties only when you give permission, including:</p>
        <ul>
          <li>Aged care providers / nursing homes (to confirm suitability, availability, and help progress enquiries)</li>
          <li>Service providers you permit us to connect you with (e.g. removals, property support, insurance)</li>
        </ul>
        <p>
          Your permission may be given by selecting an option in our forms, or by confirming verbally or in writing
          during follow-up contact. You can withdraw permission at any time (see “Your choices” below).
        </p>

        <h2 style={{ marginTop: 28 }}>5) Where your information is stored</h2>
        <p>We store and process your information <b>in Australia</b>.</p>

        <h2 style={{ marginTop: 28 }}>6) How we keep information secure</h2>
        <p>
          We take reasonable steps to protect your information from misuse, loss, unauthorised access, modification,
          or disclosure, including administrative and technical safeguards.
        </p>
        <p>No method of transmission or storage is 100% secure, but we work to maintain appropriate protections.</p>

        <h2 style={{ marginTop: 28 }}>7) How long we keep information</h2>
        <p>
          We keep personal information only as long as needed to provide the service you requested, meet legal obligations,
          resolve disputes, and enforce our agreements. When no longer needed, we take reasonable steps to delete or de-identify it.
        </p>

        <h2 style={{ marginTop: 28 }}>8) Your choices and access</h2>
        <ul>
          <li>Ask what personal information we hold about you</li>
          <li>Request correction of incorrect information</li>
          <li>Request deletion of your information (unless we are required to keep it by law)</li>
          <li>Withdraw permission for us to share your information with third parties</li>
        </ul>
        <p>
          Contact us at:{" "}
          <a href="mailto:info@nursinghomesnearme.com.au">info@nursinghomesnearme.com.au</a>
        </p>

        <h2 style={{ marginTop: 28 }}>9) Cookies and analytics</h2>
        <p>
          We may use cookies or similar technologies to understand site traffic and improve the website.
          You can control cookies through your browser settings.
        </p>

        <h2 style={{ marginTop: 28 }}>10) Third-party links</h2>
        <p>Our website may contain links to third-party websites. We’re not responsible for their privacy practices.</p>

        <h2 style={{ marginTop: 28 }}>11) Changes to this policy</h2>
        <p>We may update this Privacy Policy from time to time. The updated version will be posted on this page.</p>

        <h2 style={{ marginTop: 28 }}>12) Contact</h2>
        <p>
          Nursing Homes Near Me<br />
          Email: <a href="mailto:info@nursinghomesnearme.com.au">info@nursinghomesnearme.com.au</a>
        </p>
      </main>
    </div>
  );
}
