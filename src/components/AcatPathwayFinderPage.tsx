import React from "react";
import SeoHead from "./SeoHead";

export default function AcatPathwayFinderPage() {
  const [html, setHtml] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/acat-pathway-finder-source.txt", { cache: "no-cache" });
        const text = await res.text();
        if (!res.ok) throw new Error(`Failed to load ACAT tool (${res.status})`);
        if (!cancelled) setHtml(text);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load ACAT tool");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#faf6ef" }}>
      <SeoHead
        title="ACAT Assessment Guide 2026 | Free Pathway Finder for Australian Families"
        description="Free ACAT pathway finder for Australian families. Real wait times by state, funding amounts, phone scripts and next steps."
        canonicalUrl="https://www.nursinghomesnearme.com.au/acat-pathway-finder"
        ogType="website"
        imageUrl="https://www.nursinghomesnearme.com.au/social-preview.png"
      />
      {error ? (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px", color: "#991b1b" }}>
          <h1 style={{ marginTop: 0, color: "#0b3b5b" }}>ACAT Pathway Finder</h1>
          <p>{error}</p>
        </div>
      ) : null}
      {!error ? (
        <iframe
          title="ACAT Pathway Finder"
          srcDoc={html}
          style={{ width: "100%", minHeight: "100vh", border: 0, display: "block" }}
        />
      ) : null}
    </div>
  );
}
