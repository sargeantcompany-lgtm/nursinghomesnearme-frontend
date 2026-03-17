import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/runtimeConfig";

type RoomOptionDto = {
  roomType?: string | null;
  bathroomType?: string | null;
  radMin?: number | null;
  radMax?: number | null;
  availabilityNote?: string | null;
};

type NursingHomePublicDetails = {
  id: number;
  name: string | null;
  status?: string | null;
  providerName?: string | null;
  oneLineDescription?: string | null;
  availabilityStatus?: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  latitude?: number | null;
  longitude?: number | null;
  primaryImageUrl?: string | null;
  addressLine1: string | null;
  addressLine2?: string | null;
  phone?: string | null;
  website: string | null;
  governmentListingUrl?: string | null;
  sourcePrimary?: string | null;
  facilityType?: string | null;
  beds?: number | null;
  description?: string | null;
  lastProfileScanAt?: string | null;
  galleryImageUrls?: string[] | null;
  images?: string[] | null;
  featureTags?: string[] | null;
  otherTags?: string[] | null;
  tags?: string[] | null;
  languages?: string[] | null;
  careTypes?: string[] | null;
  specialties?: string[] | null;
  roomTypes?: string[] | null;
  roomOptions?: RoomOptionDto[] | null;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

function navTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getIdFromPath(): number | null {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  const n = Number(last);
  return Number.isFinite(n) ? n : null;
}

function locationLabel(data: NursingHomePublicDetails | null): string {
  if (!data) return "";
  return `${(data.suburb ?? "").trim()}${data.state ? `, ${data.state}` : ""}${data.postcode ? ` ${data.postcode}` : ""}`.trim();
}

function formatDate(value?: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function availabilityTone(status?: string | null): { label: string; bg: string; color: string } | null {
  switch ((status ?? "").toLowerCase()) {
    case "available":
      return { label: "Vacancy available", bg: "#d1fae5", color: "#065f46" };
    case "waitlist":
      return { label: "Waitlist only", bg: "#ffedd5", color: "#9a3412" };
    case "full":
      return { label: "Currently full", bg: "#fee2e2", color: "#991b1b" };
    default:
      return null;
  }
}

function niceCurrency(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

function uniqueList(list?: string[] | null): string[] {
  return Array.from(new Set((list ?? []).map((item) => (item ?? "").trim()).filter(Boolean)));
}

export default function NursingHomeDetails() {
  const id = useMemo(() => getIdFromPath(), []);
  const [data, setData] = useState<NursingHomePublicDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

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
      setHeroIndex(0);
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

  const images = useMemo(() => {
    if (!data) return [] as string[];
    const combined = [
      data.primaryImageUrl ?? "",
      ...(data.galleryImageUrls ?? []),
      ...(data.images ?? []),
    ];
    return uniqueList(combined);
  }, [data]);

  const tags = useMemo(
    () => uniqueList([...(data?.featureTags ?? []), ...(data?.otherTags ?? []), ...(data?.tags ?? [])]).slice(0, 10),
    [data],
  );
  const careTypes = useMemo(() => uniqueList(data?.careTypes), [data]);
  const specialties = useMemo(() => uniqueList(data?.specialties), [data]);
  const languages = useMemo(() => uniqueList(data?.languages), [data]);
  const roomTypes = useMemo(() => uniqueList(data?.roomTypes), [data]);
  const rooms = useMemo(() => (data?.roomOptions ?? []).filter((room) => room.roomType || room.radMin || room.radMax), [data]);
  const availability = availabilityTone(data?.availabilityStatus);
  const pageLocation = locationLabel(data);
  const heroImage = images[heroIndex] || "";

  return (
    <div style={pageWrap}>
      <div style={bgGlowA} />
      <div style={bgGlowB} />
      <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
        <div style={topBar}>
          <button onClick={() => navTo("/options")} style={ghostButton}>
            Back to options
          </button>
          <button onClick={() => load()} disabled={loading} style={primaryButton}>
            {loading ? "Refreshing..." : "Refresh facility"}
          </button>
        </div>

        {error ? (
          <div style={errorBox}>
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        {!error && !data && loading ? <div style={{ marginTop: 24, color: "#526072" }}>Loading facility…</div> : null}

        {data ? (
          <>
            <section style={heroShell}>
              <div style={heroMedia}>
                {heroImage ? (
                  <img src={heroImage} alt={data.name ?? "Facility"} style={heroImageStyle} />
                ) : (
                  <div style={heroFallback}>
                    <img src="/nursing-homes-near-me-logo.png" alt="Nursing Homes Near Me" style={{ width: 92, height: 92 }} />
                  </div>
                )}
                <div style={heroOverlay} />
                <div style={heroContent}>
                  {availability ? <span style={{ ...pillBase, background: availability.bg, color: availability.color }}>{availability.label}</span> : null}
                  <h1 style={heroTitle}>{data.name ?? "Unnamed facility"}</h1>
                  <div style={heroSubline}>
                    {data.providerName ? <span>{data.providerName}</span> : null}
                    {data.providerName && pageLocation ? <span>•</span> : null}
                    {pageLocation ? <span>{pageLocation}</span> : null}
                  </div>
                  {data.oneLineDescription ? <p style={heroDescription}>{data.oneLineDescription}</p> : null}

                  <div style={heroActions}>
                    {data.website ? (
                      <a href={data.website} target="_blank" rel="noreferrer" style={heroLinkButton}>
                        Visit website
                      </a>
                    ) : null}
                    {data.phone ? <a href={`tel:${data.phone}`} style={heroSubtleButton}>Call facility</a> : null}
                    {data.governmentListingUrl ? (
                      <a href={data.governmentListingUrl} target="_blank" rel="noreferrer" style={heroSubtleButton}>
                        Government listing
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              <div style={heroAside}>
                <div style={statsCard}>
                  <Stat label="Facility type" value={data.facilityType || "Residential aged care"} />
                  <Stat label="Beds" value={data.beds ? `${data.beds}` : "Not listed"} />
                  <Stat label="Last profile update" value={formatDate(data.lastProfileScanAt)} />
                </div>

                {images.length > 1 ? (
                  <div style={thumbRail}>
                    {images.slice(0, 4).map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setHeroIndex(index)}
                        style={{
                          ...thumbButton,
                          borderColor: heroIndex === index ? "#0f766e" : "#d9e2ec",
                        }}
                      >
                        <img src={image} alt={`Facility image ${index + 1}`} style={thumbImage} />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <section style={contentGrid}>
              <div style={{ display: "grid", gap: 18 }}>
                <InfoPanel title="Overview">
                  <p style={bodyText}>
                    {data.description || data.oneLineDescription || "Full facility profile coming soon."}
                  </p>
                </InfoPanel>

                {tags.length ? (
                  <InfoPanel title="Highlights">
                    <div style={tagWrap}>
                      {tags.map((tag) => (
                        <span key={tag} style={softTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </InfoPanel>
                ) : null}

                {(careTypes.length || specialties.length || languages.length) ? (
                  <InfoPanel title="Care fit">
                    <div style={triGrid}>
                      <MiniList title="Care types" items={careTypes} empty="Care types still being added" />
                      <MiniList title="Specialties" items={specialties} empty="Specialties still being added" />
                      <MiniList title="Languages" items={languages} empty="Languages still being added" />
                    </div>
                  </InfoPanel>
                ) : null}

                {(roomTypes.length || rooms.length) ? (
                  <InfoPanel title="Rooms and pricing">
                    {rooms.length ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        {rooms.map((room, index) => {
                          const radMin = niceCurrency(room.radMin);
                          const radMax = niceCurrency(room.radMax);
                          const pricing = radMin && radMax ? `${radMin} – ${radMax}` : radMin || radMax || "Pricing on request";
                          return (
                            <div key={`${room.roomType}-${index}`} style={roomCard}>
                              <div>
                                <div style={roomTitle}>{room.roomType || "Room option"}</div>
                                <div style={roomMeta}>
                                  {[room.bathroomType, pricing, room.availabilityNote].filter(Boolean).join(" • ")}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={tagWrap}>
                        {roomTypes.map((roomType) => (
                          <span key={roomType} style={softTag}>
                            {roomType}
                          </span>
                        ))}
                      </div>
                    )}
                  </InfoPanel>
                ) : null}
              </div>

              <div style={{ display: "grid", gap: 18 }}>
                <InfoPanel title="Contact">
                  <div style={sideStack}>
                    <Fact label="Address" value={[data.addressLine1, data.addressLine2, pageLocation].filter(Boolean).join(", ") || "Not listed"} />
                    <Fact label="Phone" value={data.phone || "Not listed"} />
                    <Fact label="Website" value={data.website || "Not listed"} />
                  </div>
                </InfoPanel>

                <InfoPanel title="Why this page matters">
                  <div style={sideStack}>
                    <Fact label="Source" value={data.sourcePrimary || "Imported facility profile"} />
                    <Fact label="Profile status" value={data.status || "Active"} />
                    <Fact label="Photo count" value={images.length ? `${images.length} linked` : "Still being built"} />
                  </div>
                </InfoPanel>
              </div>
            </section>
          </>
        ) : null}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .facility-hero-shell {
            grid-template-columns: 1fr !important;
          }
          .facility-content-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={panel}>
      <div style={panelTitle}>{title}</div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", fontWeight: 800 }}>{label}</div>
      <div style={{ color: "#0f172a", fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const isLink = value.startsWith("http");
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      {isLink ? (
        <a href={value} target="_blank" rel="noreferrer" style={{ color: "#0b3b5b", fontWeight: 700, wordBreak: "break-word" }}>
          {value}
        </a>
      ) : (
        <div style={{ color: "#0f172a", fontWeight: 700, wordBreak: "break-word" }}>{value}</div>
      )}
    </div>
  );
}

function MiniList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div style={miniCard}>
      <div style={miniCardTitle}>{title}</div>
      {items.length ? (
        <div style={tagWrap}>
          {items.map((item) => (
            <span key={item} style={softTag}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ color: "#94a3b8" }}>{empty}</div>
      )}
    </div>
  );
}

const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fb",
  padding: 18,
  position: "relative",
  overflow: "hidden",
};

const bgGlowA: React.CSSProperties = {
  position: "absolute",
  inset: "0 auto auto -10%",
  width: 460,
  height: 460,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(12,148,136,0.15) 0%, rgba(12,148,136,0) 70%)",
  pointerEvents: "none",
};

const bgGlowB: React.CSSProperties = {
  position: "absolute",
  inset: "20% -6% auto auto",
  width: 420,
  height: 420,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(11,59,91,0.12) 0%, rgba(11,59,91,0) 70%)",
  pointerEvents: "none",
};

const topBar: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: 16,
};

const ghostButton: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #d8e0ea",
  background: "rgba(255,255,255,0.8)",
  color: "#0b3b5b",
  fontWeight: 800,
  cursor: "pointer",
};

const primaryButton: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #0b3b5b",
  background: "#0b3b5b",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const errorBox: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 14,
  background: "#fee2e2",
  color: "#991b1b",
};

const heroShell: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.6fr 0.9fr",
  gap: 18,
  alignItems: "stretch",
};

const heroMedia: React.CSSProperties = {
  position: "relative",
  minHeight: 500,
  borderRadius: 28,
  overflow: "hidden",
  background: "#dbe7f3",
  boxShadow: "0 20px 40px rgba(15, 23, 42, 0.09)",
};

const heroImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const heroFallback: React.CSSProperties = {
  width: "100%",
  height: "100%",
  background: "linear-gradient(140deg, #0b3b5b 0%, #0f766e 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const heroOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(180deg, rgba(8,15,28,0.12) 0%, rgba(8,15,28,0.62) 100%)",
};

const heroContent: React.CSSProperties = {
  position: "absolute",
  left: 28,
  right: 28,
  bottom: 28,
  color: "white",
  display: "grid",
  gap: 12,
};

const pillBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
  padding: "7px 12px",
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 12,
};

const heroTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 42,
  lineHeight: 1.02,
  fontWeight: 950,
  maxWidth: 780,
};

const heroSubline: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  fontSize: 15,
  opacity: 0.96,
};

const heroDescription: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  lineHeight: 1.6,
  maxWidth: 760,
  color: "rgba(255,255,255,0.92)",
};

const heroActions: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const heroLinkButton: React.CSSProperties = {
  padding: "11px 14px",
  borderRadius: 999,
  background: "white",
  color: "#0b3b5b",
  fontWeight: 900,
  textDecoration: "none",
};

const heroSubtleButton: React.CSSProperties = {
  padding: "11px 14px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.14)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.35)",
  fontWeight: 800,
  textDecoration: "none",
};

const heroAside: React.CSSProperties = {
  display: "grid",
  gap: 18,
};

const statsCard: React.CSSProperties = {
  padding: 22,
  borderRadius: 24,
  background: "rgba(255,255,255,0.86)",
  border: "1px solid #dbe3ed",
  boxShadow: "0 16px 30px rgba(15, 23, 42, 0.06)",
  display: "grid",
  gap: 18,
};

const thumbRail: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const thumbButton: React.CSSProperties = {
  padding: 0,
  borderRadius: 18,
  overflow: "hidden",
  border: "2px solid #d9e2ec",
  background: "white",
  cursor: "pointer",
  height: 120,
};

const thumbImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const contentGrid: React.CSSProperties = {
  marginTop: 20,
  display: "grid",
  gridTemplateColumns: "1.45fr 0.9fr",
  gap: 18,
};

const panel: React.CSSProperties = {
  padding: 22,
  borderRadius: 24,
  background: "rgba(255,255,255,0.88)",
  border: "1px solid #dbe3ed",
  boxShadow: "0 16px 30px rgba(15, 23, 42, 0.05)",
};

const panelTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "#10273b",
  marginBottom: 14,
};

const bodyText: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.8,
  color: "#405062",
};

const tagWrap: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const softTag: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  background: "#eef6f5",
  color: "#0f766e",
  fontWeight: 800,
  fontSize: 13,
};

const triGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const miniCard: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "#f8fbfd",
  border: "1px solid #e3ebf3",
};

const miniCardTitle: React.CSSProperties = {
  marginBottom: 10,
  color: "#10273b",
  fontWeight: 900,
};

const roomCard: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "#f8fbfd",
  border: "1px solid #e3ebf3",
};

const roomTitle: React.CSSProperties = {
  color: "#10273b",
  fontWeight: 900,
  marginBottom: 5,
};

const roomMeta: React.CSSProperties = {
  color: "#526072",
  lineHeight: 1.6,
};

const sideStack: React.CSSProperties = {
  display: "grid",
  gap: 14,
};
