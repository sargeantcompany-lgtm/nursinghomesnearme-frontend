import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/runtimeConfig";

type NursingHomePublicDetails = {
  id: number;
  name: string | null;
  addressLine1: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  website: string | null;
  tags: string | null;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function navTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getIdFromPath(): number | null {
  // expected: /options/:id
  const parts = window.location.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  const n = Number(last);
  return Number.isFinite(n) ? n : null;
}

export default function NursingHomeDetails() {
  const id = useMemo(() => getIdFromPath(), []);
  const [data, setData] = useState<NursingHomePublicDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (id == null) {
      setError("Missing facility id in URL.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/nursing-homes/${id}`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
      }
      const nh = (await res.json()) as NursingHomePublicDetails;
      setData(nh);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tags = useMemo(() => parseTags(data?.tags), [data?.tags]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 18 }}>
      <div style={{ maxWidth: 1050, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navTo("/options")}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "white",
              color: "#0b3b5b",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            ← Back to options
          </button>

          <button
            onClick={() => load()}
            disabled={loading}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #0b3b5b",
              background: "#0b3b5b",
              color: "white",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fee2e2" }}>
            <strong style={{ color: "#991b1b" }}>Error:</strong>{" "}
            <span style={{ color: "#991b1b" }}>{error}</span>
          </div>
        ) : null}

        {!error && !data && loading ? (
          <div style={{ marginTop: 14, color: "#475569" }}>Loading facility…</div>
        ) : null}

        {data ? (
          <div
            style={{
              marginTop: 14,
              background: "white",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            {/* hero image (placeholder until you add real photos) */}
            <div
              style={{
                height: 360,
                background: "linear-gradient(135deg, #0b3b5b 0%, #2aa3df 100%)",
                position: "relative",
              }}
            >
              <img
                src="/nursinghomesnearme-woman.png"
                alt="Facility"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.25,
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: 18,
                  bottom: 18,
                  right: 18,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <img
                  src="/nursing-homes-near-me-logo.png"
                  alt="NHNM"
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "contain",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.92)",
                    padding: 10,
                  }}
                />

                <div style={{ color: "white", minWidth: 260 }}>
                  <div style={{ fontSize: 34, fontWeight: 1000, lineHeight: 1.05 }}>
                    {data.name ?? "Unnamed facility"}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 16, opacity: 0.92 }}>
                    {(data.suburb ?? "").trim()}
                    {(data.suburb && data.state) ? ", " : ""}
                    {(data.state ?? "").trim()}
                    {data.postcode ? `, ${data.postcode}` : ""}
                  </div>
                </div>

                <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                  {data.website ? (
                    <a
                      href={data.website}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.7)",
                        background: "rgba(255,255,255,0.12)",
                        color: "white",
                        fontWeight: 900,
                        textDecoration: "none",
                      }}
                    >
                      Website
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div style={{ padding: 18 }}>
              {tags.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: "#0D9488",
                        border: "1px solid #0D9488",
                        borderRadius: 999,
                        padding: "7px 12px",
                        background: "#ffffff",
                      }}
                    >
                      ✓ {t}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#94a3b8", fontSize: 13 }}>No tags yet</div>
              )}

              <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Info label="Address" value={data.addressLine1 ?? "—"} />
                <Info
                  label="Location"
                  value={`${data.suburb ?? ""}${data.state ? `, ${data.state}` : ""}${data.postcode ? `, ${data.postcode}` : ""}`.trim() || "—"}
                />
              </div>

              <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    const lines = [
                      `${data.name ?? "Facility"}`,
                      `${(data.suburb ?? "").trim()}${data.state ? `, ${data.state}` : ""}${data.postcode ? `, ${data.postcode}` : ""}`.trim(),
                      data.website ?? "",
                      tags.length ? `Tags: ${tags.join(", ")}` : "",
                    ].filter(Boolean);

                    navigator.clipboard.writeText(lines.join("\n")).catch(() => {});
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #0D9488",
                    background: "#0D9488",
                    color: "white",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Copy summary (for email)
                </button>

                <button
                  onClick={() => navTo("/options")}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "white",
                    color: "#0b3b5b",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
              </div>

              <div style={{ marginTop: 10, color: "#64748b", fontSize: 12 }}>
                Public API: <code>/api/nursing-homes/{data.id}</code>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        @media (max-width: 820px) {
          .twoCol { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Info(props: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        background: "#ffffff",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, color: "#334155" }}>{props.label}</div>
      <div style={{ marginTop: 6, fontSize: 14, color: "#0f172a", fontWeight: 700 }}>
        {props.value}
      </div>
    </div>
  );
}
