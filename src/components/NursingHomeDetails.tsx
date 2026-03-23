import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/runtimeConfig";

type RoomOptionDto = {
  roomType?: string | null;
  roomName?: string | null;
  bathroomType?: string | null;
  sizeM2?: number | null;
  radMin?: number | null;
  radMax?: number | null;
  dapAmount?: number | null;
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
  email?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  website: string | null;
  governmentListingUrl?: string | null;
  sourcePrimary?: string | null;
  facilityType?: string | null;
  beds?: number | null;
  abn?: string | null;
  description?: string | null;
  overviewHeading?: string | null;
  providerOverview?: string | null;
  accommodationSummary?: string | null;
  pricingSummary?: string | null;
  heroBadges?: string[] | null;
  servicesIncluded?: string[] | null;
  amenities?: string[] | null;
  alliedHealth?: string[] | null;
  foodHighlights?: string | null;
  visitingHours?: string | null;
  admissionsProcess?: string | null;
  waitingListSummary?: string | null;
  transportNotes?: string | null;
  nearbyHospitals?: string[] | null;
  faqItems?: string[] | null;
  reviewSummary?: string | null;
  reviewCount?: number | null;
  radFrom?: number | null;
  radTo?: number | null;
  dapFrom?: number | null;
  dapTo?: number | null;
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

function cleanText(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/cafÃ©/gi, "cafe")
    .replace(/â€¢/g, "•")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanWebsiteUrl(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return raw.split("?")[0].trim();
  }
}

function cleanDescription(value?: string | null, fallback?: string | null): string {
  const base = cleanText(value) || cleanText(fallback);
  if (!base) return "";
  const trimmed = base
    .replace(/skip to content/gi, "")
    .replace(/search for:/gi, "")
    .replace(/\b(book a tour|menu|careers|contact)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^(search for|skip to content|home\b)/i.test(part));
  return sentences.slice(0, 4).join(" ") || trimmed;
}


function pickBestImages(data: NursingHomePublicDetails | null): string[] {
  if (!data) return [];
  const combined = uniqueList([
    data.primaryImageUrl ?? "",
    ...(data.galleryImageUrls ?? []),
    ...(data.images ?? []),
  ]);
  const score = (url: string) => (url.toLowerCase().includes("logo") ? 0 : 1);
  return [...combined].sort((a, b) => score(b) - score(a));
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

  const images = useMemo(() => pickBestImages(data), [data]);

  const tags = useMemo(
    () =>
      uniqueList([
        ...(data?.heroBadges ?? []),
        ...(data?.featureTags ?? []),
        ...(data?.amenities ?? []).slice(0, 4),
      ]).slice(0, 10),
    [data],
  );
  const heroBadges = useMemo(() => uniqueList(data?.heroBadges).slice(0, 4), [data]);
  const careTypes = useMemo(() => uniqueList(data?.careTypes), [data]);
  const specialties = useMemo(() => uniqueList(data?.specialties), [data]);
  const languages = useMemo(() => uniqueList(data?.languages), [data]);
  const amenities = useMemo(() => uniqueList(data?.amenities), [data]);
  const servicesIncluded = useMemo(() => uniqueList(data?.servicesIncluded), [data]);
  const alliedHealth = useMemo(() => uniqueList(data?.alliedHealth), [data]);
  const nearbyHospitals = useMemo(() => uniqueList(data?.nearbyHospitals), [data]);
  const faqItems = useMemo(() => uniqueList(data?.faqItems), [data]);
  const rooms = useMemo(() => (data?.roomOptions ?? []).filter((room) => room.roomType || room.radMin || room.radMax), [data]);
  const availability = availabilityTone(data?.availabilityStatus);
  const pageLocation = locationLabel(data);
  const heroImage = images[heroIndex] || "";
  const cleanProvider = cleanText(data?.providerName);
  const cleanOneLine = cleanDescription(data?.oneLineDescription);
  const overviewHeading = cleanText(data?.overviewHeading) || "Overview";
  const cleanOverview = cleanDescription(data?.oneLineDescription, data?.providerOverview) || "Full facility profile coming soon.";
  const cleanLongOverview = cleanDescription(data?.description);
  const cleanAccommodationSummary = cleanDescription(data?.accommodationSummary);
  const cleanPricingSummary = cleanDescription(data?.pricingSummary);
  const cleanFoodHighlights = cleanDescription(data?.foodHighlights);
  const cleanVisitingHours = cleanText(data?.visitingHours);
  const cleanAdmissionsProcess = cleanDescription(data?.admissionsProcess);
  const cleanWaitingListSummary = cleanDescription(data?.waitingListSummary);
  const cleanTransportNotes = cleanDescription(data?.transportNotes);
  const cleanReviewSummary = cleanDescription(data?.reviewSummary);
  const cleanWebsite = cleanWebsiteUrl(data?.website);
  const cleanGovernmentListing = cleanWebsiteUrl(data?.governmentListingUrl);
  const fallbackRad = data?.radFrom != null || data?.radTo != null
    ? [niceCurrency(data?.radFrom), niceCurrency(data?.radTo)].filter(Boolean).join(" – ")
    : "";
  const fallbackDap = data?.dapFrom != null || data?.dapTo != null
    ? [niceCurrency(data?.dapFrom), niceCurrency(data?.dapTo)].filter(Boolean).join(" – ")
    : "";

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
                    {cleanProvider ? <span>{cleanProvider}</span> : null}
                    {data.providerName && pageLocation ? <span>•</span> : null}
                    {pageLocation ? <span>{pageLocation}</span> : null}
                  </div>
                  {heroBadges.length ? (
                    <div style={{ ...tagWrap, marginTop: 14 }}>
                      {heroBadges.map((badge) => (
                        <span key={badge} style={{ ...softTag, background: "rgba(255,255,255,0.18)", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {cleanOneLine ? <p style={heroDescription}>{cleanOneLine}</p> : null}

                  <div style={heroActions}>
                    {cleanWebsite ? (
                      <a href={cleanWebsite} target="_blank" rel="noreferrer" style={heroLinkButton}>
                        Visit website
                      </a>
                    ) : null}
                    {data.phone ? <a href={`tel:${data.phone}`} style={heroSubtleButton}>Call facility</a> : null}
                    {data.email ? <a href={`mailto:${data.email}`} style={heroSubtleButton}>Email facility</a> : null}
                    {cleanGovernmentListing ? (
                      <a href={cleanGovernmentListing} target="_blank" rel="noreferrer" style={heroSubtleButton}>
                        Government listing
                      </a>
                    ) : null}
                    {data.facebookUrl ? (
                      <a href={data.facebookUrl} target="_blank" rel="noreferrer" style={{ ...heroSubtleButton, background: "#1877F2", color: "#fff", borderColor: "#1877F2" }}>
                        Facebook
                      </a>
                    ) : null}
                    {data.instagramUrl ? (
                      <a href={data.instagramUrl} target="_blank" rel="noreferrer" style={{ ...heroSubtleButton, background: "#E1306C", color: "#fff", borderColor: "#E1306C" }}>
                        Instagram
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              <div style={heroAside}>
                <div style={statsCard}>
                  <img src="/nursing-homes-near-me-logo.png" alt="Nursing Homes Near Me" style={{ width: 200, height: "auto", marginBottom: 8 }} />
                  <Stat label="Facility type" value={data.facilityType || "Residential aged care"} />
                  <Stat label="Beds" value={data.beds ? `${data.beds}` : "Not listed"} />
                  <Stat label="Info last updated" value={formatDate(data.lastProfileScanAt)} />
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
                        <img
                          src={image}
                          alt=""
                          style={thumbImage}
                          onError={(e) => {
                            const btn = (e.currentTarget as HTMLImageElement).closest("button");
                            if (btn) btn.style.display = "none";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            {(fallbackRad || fallbackDap || rooms.length > 0) ? (
              <div style={{ marginTop: 18, borderRadius: 24, background: "rgba(255,255,255,0.92)", border: "1px solid #dbe3ed", boxShadow: "0 8px 24px rgba(15,23,42,0.07)", overflow: "hidden" }}>
                {/* Header bar */}
                <div style={{ padding: "18px 24px", background: "linear-gradient(135deg, #0b3b5b 0%, #0f766e 100%)", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <div style={{ color: "white", fontWeight: 900, fontSize: 18 }}>Rooms and costs</div>
                  {fallbackRad ? <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>RAD: <strong>{fallbackRad}</strong></div> : null}
                  {fallbackDap ? <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>DAP: <strong>{fallbackDap}</strong></div> : null}
                </div>
                {/* Column headers */}
                {rooms.length > 0 ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 110px 80px 90px 110px", gap: 0, padding: "10px 24px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                      {["Type", "Room name", "Bathroom", "Size", "DAP/day", "Availability"].map((h) => (
                        <div key={h} style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748b" }}>{h}</div>
                      ))}
                    </div>
                    {rooms.map((room, index) => (
                      <div key={`row-${index}`} style={{ display: "grid", gridTemplateColumns: "90px 1fr 110px 80px 90px 110px", gap: 0, padding: "14px 24px", borderBottom: index < rooms.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center", background: index % 2 === 0 ? "white" : "#fafbfc" }}>
                        <div>
                          {room.roomType ? <span style={{ padding: "3px 10px", borderRadius: 999, background: room.roomType === "Single" ? "#eef6f5" : "#eff6ff", color: room.roomType === "Single" ? "#0f766e" : "#1d4ed8", fontWeight: 800, fontSize: 12 }}>{room.roomType}</span> : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}
                        </div>
                        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                          {room.roomName || <span style={{ color: "#94a3b8", fontStyle: "italic", fontWeight: 400 }}>Not confirmed</span>}
                        </div>
                        <div style={{ fontSize: 13, color: "#405062" }}>{room.bathroomType || "—"}</div>
                        <div style={{ fontSize: 13, color: "#405062" }}>{room.sizeM2 ? `${room.sizeM2}m²` : "—"}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0b3b5b" }}>{room.dapAmount != null ? `$${room.dapAmount}` : "—"}</div>
                        <div>
                          {room.availabilityNote
                            ? <span style={{ padding: "3px 10px", borderRadius: 999, background: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: 12 }}>{room.availabilityNote}</span>
                            : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}
                        </div>
                      </div>
                    ))}
                  </>
                ) : null}
              </div>
            ) : null}

            <section style={contentGrid}>
              <div style={{ display: "grid", gap: 18 }}>
                  <InfoPanel title={overviewHeading}>
                    <p style={bodyText}>
                      {cleanOverview}
                    </p>
                  </InfoPanel>

                  {cleanLongOverview && cleanLongOverview !== cleanOverview ? (
                    <InfoPanel title="About">
                      <p style={bodyText}>{cleanLongOverview}</p>
                    </InfoPanel>
                  ) : null}

                {(cleanAccommodationSummary || cleanPricingSummary) ? (
                  <InfoPanel title="Accommodation">
                    <div style={{ display: "grid", gap: 14 }}>
                      {cleanAccommodationSummary ? <p style={bodyText}>{cleanAccommodationSummary}</p> : null}
                      {cleanPricingSummary ? <p style={bodyText}>{cleanPricingSummary}</p> : null}
                    </div>
                  </InfoPanel>
                ) : null}

                  {tags.length ? (
                    <InfoPanel title="Highlights and features">
                      <div style={tagWrap}>
                        {tags.map((tag, i) => (
                          <span key={tag} style={{ ...softTag, background: i % 3 === 0 ? "#eef6f5" : i % 3 === 1 ? "#eff6ff" : "#fef3c7", color: i % 3 === 0 ? "#0f766e" : i % 3 === 1 ? "#1d4ed8" : "#92400e", fontWeight: 800 }}>
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

                {(amenities.length || servicesIncluded.length || alliedHealth.length) ? (
                  <InfoPanel title="Services and amenities">
                    <div style={triGrid}>
                      <MiniList title="Amenities" items={amenities} empty="Amenities still being added" />
                      <MiniList title="Services included" items={servicesIncluded} empty="Services still being added" />
                      <MiniList title="Allied health" items={alliedHealth} empty="Allied health still being added" />
                    </div>
                  </InfoPanel>
                ) : null}


                {cleanFoodHighlights ? (
                  <div style={{ padding: 22, borderRadius: 24, background: "linear-gradient(135deg, #fef9ec 0%, #fff7e6 100%)", border: "1px solid #fde68a", boxShadow: "0 4px 16px rgba(245,158,11,0.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 24 }}>🍽️</span>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#92400e" }}>Dining & food</div>
                    </div>
                    <p style={{ ...bodyText, color: "#78350f" }}>{cleanFoodHighlights}</p>
                  </div>
                ) : null}

                {(cleanVisitingHours || cleanAdmissionsProcess || cleanWaitingListSummary || cleanTransportNotes || nearbyHospitals.length || faqItems.length || cleanReviewSummary) ? (
                  <InfoPanel title="More details">
                    <div style={{ display: "grid", gap: 14 }}>
                      {cleanVisitingHours ? <Fact label="Visiting hours" value={cleanVisitingHours} /> : null}
                      {cleanAdmissionsProcess ? <Fact label="Admissions" value={cleanAdmissionsProcess} /> : null}
                      {cleanWaitingListSummary ? <Fact label="Waitlist" value={cleanWaitingListSummary} /> : null}
                      {cleanTransportNotes ? <Fact label="Transport" value={cleanTransportNotes} /> : null}
                      {nearbyHospitals.length ? <Fact label="Nearby hospitals" value={nearbyHospitals.join(", ")} /> : null}
                      {faqItems.length ? <Fact label="FAQs" value={faqItems.join(" • ")} /> : null}
                      {cleanReviewSummary ? <Fact label="Reviews" value={cleanReviewSummary} /> : null}
                    </div>
                  </InfoPanel>
                ) : null}
              </div>

              <div style={{ display: "grid", gap: 18 }}>
                <div style={{ padding: "16px 18px", borderRadius: 20, background: "rgba(255,255,255,0.88)", border: "1px solid #dbe3ed", boxShadow: "0 4px 12px rgba(15,23,42,0.05)" }}>
                  <div style={{ fontWeight: 900, fontSize: 15, color: "#10273b", marginBottom: 10 }}>Contact</div>
                  <div style={{ display: "grid", gap: 6, fontSize: 13, color: "#405062", marginBottom: 12 }}>
                    {[data.addressLine1, data.addressLine2, pageLocation].filter(Boolean).length > 0 ? (
                      <div>📍 {[data.addressLine1, data.addressLine2, pageLocation].filter(Boolean).join(", ")}</div>
                    ) : null}
                    {data.phone ? <div>📞 <a href={`tel:${data.phone}`} style={{ color: "#0b3b5b", fontWeight: 700, textDecoration: "none" }}>{data.phone}</a></div> : null}
                    {data.email ? <div>✉️ <a href={`mailto:${data.email}`} style={{ color: "#0b3b5b", fontWeight: 700, textDecoration: "none" }}>{data.email}</a></div> : null}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {data.phone ? <a href={`tel:${data.phone}`} style={contactPill}>Call now</a> : null}
                    {data.email ? <a href={`mailto:${data.email}`} style={contactPill}>Email</a> : null}
                    {cleanWebsite ? <a href={cleanWebsite} target="_blank" rel="noreferrer" style={contactPill}>Website</a> : null}
                    {data.facebookUrl ? <a href={data.facebookUrl} target="_blank" rel="noreferrer" style={{ ...contactPill, background: "#1877F2", color: "#fff", borderColor: "#1877F2" }}>Facebook</a> : null}
                    {data.instagramUrl ? <a href={data.instagramUrl} target="_blank" rel="noreferrer" style={{ ...contactPill, background: "#E1306C", color: "#fff", borderColor: "#E1306C" }}>Instagram</a> : null}
                  </div>
                </div>

                {(data.abn || data.reviewCount != null || data.lastProfileScanAt || data.sourcePrimary) ? (
                  <InfoPanel title="Profile details">
                    <div style={sideStack}>
                      {data.sourcePrimary ? <Fact label="Source" value={data.sourcePrimary} /> : null}
                      {data.status ? <Fact label="Profile status" value={data.status} /> : null}
                      {data.lastProfileScanAt ? <Fact label="Info last updated" value={formatDate(data.lastProfileScanAt)} /> : null}
                      {data.abn ? <Fact label="ABN" value={data.abn} /> : null}
                      {data.reviewCount != null ? <Fact label="Review count" value={String(data.reviewCount)} /> : null}
                    </div>
                  </InfoPanel>
                ) : null}
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

const contactPill: React.CSSProperties = {
  padding: "10px 13px",
  borderRadius: 999,
  border: "1px solid #d7e0ea",
  background: "#f8fbfd",
  color: "#0b3b5b",
  textDecoration: "none",
  fontWeight: 800,
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

const sideStack: React.CSSProperties = {
  display: "grid",
  gap: 14,
};
