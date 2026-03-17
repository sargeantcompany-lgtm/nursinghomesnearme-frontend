import { useMemo, useState } from "react";

export type NursingHomeListItem = {
  id: number;
  name: string | null;
  providerName?: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  phone?: string | null;
  email?: string | null;
  website: string | null;
  tags: string[] | string | null;
  primaryImageUrl?: string | null;
  oneLineDescription?: string | null;
  availabilityStatus?: "available" | "waitlist" | "full" | null;
  careTypes?: string[] | null;
  specialties?: string[] | null;
  beds?: number | null;
};

const AVAILABILITY_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  available: { label: "Vacancy Available", bg: "#16a34a", color: "white" },
  waitlist: { label: "Waitlist Only", bg: "#d97706", color: "white" },
  full: { label: "Currently Full", bg: "#dc2626", color: "white" },
};

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeList(list?: string[] | string | null): string[] {
  if (!list) return [];
  if (Array.isArray(list)) {
    return list.map((item) => (item ?? "").trim()).filter(Boolean).slice(0, 6);
  }
  return parseTags(list).slice(0, 6);
}

function navTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function NursingHomeGrid(props: {
  items: NursingHomeListItem[];
  showFilters?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const { items, showFilters = true, title = "Options", subtitle = "" } = props;

  const [search, setSearch] = useState("");
  const [suburb, setSuburb] = useState("");

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const sub = suburb.trim().toLowerCase();

    return items.filter((x) => {
      const name = (x.name ?? "").toLowerCase();
      const su = (x.suburb ?? "").toLowerCase();
      const st = (x.state ?? "").toLowerCase();
      const pc = (x.postcode ?? "").toLowerCase();
      const tags = normalizeList(x.tags).join(" ").toLowerCase();
      const desc = (x.oneLineDescription ?? "").toLowerCase();

      const matchSearch =
        !s || name.includes(s) || su.includes(s) || st.includes(s) || pc.includes(s) || tags.includes(s) || desc.includes(s);

      const matchSuburb = !sub || su.includes(sub);

      return matchSearch && matchSuburb;
    });
  }, [items, search, suburb]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 18 }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, color: "#0b3b5b", fontSize: 28, fontWeight: 900 }}>{title}</h1>
        </div>

        {subtitle ? <p style={{ marginTop: 8, color: "#334155", lineHeight: 1.6 }}>{subtitle}</p> : null}

        {showFilters ? (
          <div
            style={{
              marginTop: 12,
              padding: 14,
              background: "white",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 6 }}>
                Search (name, suburb, tags)
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. dementia, Southport"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              />
            </label>

            <label style={{ display: "block" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 6 }}>
                Preferred suburb (optional)
              </div>
              <input
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="e.g. Southport"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              />
            </label>
          </div>
        ) : null}

        <div className="nh-grid" style={{ marginTop: 18, display: "grid", gap: 18 }}>
          {filtered.map((nh) => {
            const tagList = [
              ...normalizeList(nh.careTypes),
              ...normalizeList(nh.specialties),
              ...normalizeList(nh.tags),
            ].filter((tag, index, all) => all.indexOf(tag) === index).slice(0, 5);
            const titleText = (nh.name ?? "Unnamed facility").trim();
            const locationText = `${(nh.suburb ?? "").trim()}${nh.state ? `, ${nh.state}` : ""}${nh.postcode ? ` ${nh.postcode}` : ""}`.trim();

            return (
              <article
                key={nh.id}
                style={{
                  background: "white",
                  borderRadius: 16,
                  border: "1px solid #dbe3ed",
                  overflow: "hidden",
                  boxShadow: "0 18px 36px rgba(15, 23, 42, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ position: "relative", height: 214, background: "#dbeafe" }}>
                  {nh.primaryImageUrl ? (
                    <img
                      src={nh.primaryImageUrl}
                      alt={titleText}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(140deg, #0b3b5b 0%, #0f766e 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src="/nursing-homes-near-me-logo.png"
                        alt="Nursing Homes Near Me"
                        style={{ width: 78, height: 78, objectFit: "contain", borderRadius: 10, background: "rgba(255,255,255,0.9)", padding: 10 }}
                      />
                    </div>
                  )}

                  {locationText ? (
                    <div
                      style={{
                        position: "absolute",
                        left: 12,
                        top: 12,
                        background: "rgba(8,15,28,0.74)",
                        color: "white",
                        borderRadius: 999,
                        padding: "6px 11px",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {locationText}
                    </div>
                  ) : null}

                  {nh.availabilityStatus && AVAILABILITY_BADGE[nh.availabilityStatus] ? (
                    <div
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 12,
                        background: AVAILABILITY_BADGE[nh.availabilityStatus].bg,
                        color: AVAILABILITY_BADGE[nh.availabilityStatus].color,
                        borderRadius: 999,
                        padding: "5px 10px",
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.03em",
                        boxShadow: "0 10px 18px rgba(0,0,0,0.08)",
                      }}
                    >
                      {AVAILABILITY_BADGE[nh.availabilityStatus].label}
                    </div>
                  ) : null}
                </div>

                <div style={{ padding: 16, flex: "1 1 auto", display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    {nh.providerName ? (
                      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", fontWeight: 800 }}>
                        {nh.providerName}
                      </div>
                    ) : null}
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: 22, lineHeight: 1.18, color: "#0b3b5b" }}>{titleText}</h3>
                  </div>

                  <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
                    {(nh.oneLineDescription || "Browse full facility details, services, and availability information.").slice(0, 140)}
                  </p>

                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#526072", fontSize: 13, fontWeight: 700 }}>
                    {nh.beds ? <span>{nh.beds} beds</span> : null}
                    {locationText ? <span>{locationText}</span> : null}
                  </div>

                  {tagList.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {tagList.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#0f766e",
                            border: "1px solid #bde7e2",
                            borderRadius: 999,
                            padding: "5px 9px",
                            background: "#eef9f7",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div style={{ padding: 16, display: "grid", gap: 10 }}>
                  {(nh.phone || nh.email || nh.website) ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {nh.phone ? (
                        <a
                          href={`tel:${nh.phone}`}
                          style={{
                            padding: "8px 11px",
                            borderRadius: 999,
                            border: "1px solid #d7e0ea",
                            background: "#f8fbfd",
                            color: "#0b3b5b",
                            textDecoration: "none",
                            fontWeight: 800,
                            fontSize: 12,
                          }}
                        >
                          Call
                        </a>
                      ) : null}
                      {nh.email ? (
                        <a
                          href={`mailto:${nh.email}`}
                          style={{
                            padding: "8px 11px",
                            borderRadius: 999,
                            border: "1px solid #d7e0ea",
                            background: "#f8fbfd",
                            color: "#0b3b5b",
                            textDecoration: "none",
                            fontWeight: 800,
                            fontSize: 12,
                          }}
                        >
                          Email
                        </a>
                      ) : null}
                      {nh.website ? (
                        <a
                          href={nh.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "8px 11px",
                            borderRadius: 999,
                            border: "1px solid #d7e0ea",
                            background: "#f8fbfd",
                            color: "#0b3b5b",
                            textDecoration: "none",
                            fontWeight: 800,
                            fontSize: 12,
                          }}
                        >
                          Website
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    onClick={() => navTo(`/options/${nh.id}`)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 999,
                      border: "1px solid #0b3b5b",
                      background: "#0b3b5b",
                      color: "white",
                      fontWeight: 900,
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    View details
                  </button>

                  {nh.website ? (
                    <a
                      href={nh.website}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "12px 14px",
                        borderRadius: 999,
                        border: "1px solid #cbd5e1",
                        background: "white",
                        color: "#0b3b5b",
                        textDecoration: "none",
                        fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                      Open site
                    </a>
                  ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <style>{`
          .nh-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          @media (max-width: 1024px) {
            .nh-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (max-width: 840px) {
            .nh-grid { grid-template-columns: 1fr; }
          }
          @media (max-width: 760px) {
            .nh-grid > article > div[style*="gridTemplateColumns: 1fr 1fr"],
            div[style*="gridTemplateColumns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
