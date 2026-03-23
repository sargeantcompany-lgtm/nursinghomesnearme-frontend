// src/components/AdminNursingHomes.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { API_BASE, TOKEN_ENV } from "../lib/runtimeConfig";
import AdminTopNav from "./AdminTopNav";

type NursingHomeListItem = {
  id: number;
  name: string;
  facilityRowId?: string | null;
  providerName?: string | null;
  oneLineDescription?: string | null;
  phone?: string | null;
  website?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: string | null;
  primaryImageUrl?: string | null;
  email?: string | null;
  websiteSaysVacancies?: string | null;
  facilityConfirmedVacancies?: string | null;
  websiteCheckedAt?: string | null;
  facilityConfirmedAt?: string | null;
  conflictFlag?: boolean | null;
  lastOutreachSentAt?: string | null;
  lastOutreachReplyAt?: string | null;
  canReceiveWeeklyCheck?: boolean;
};

type NursingHomeListResponse = {
  items: NursingHomeListItem[];
  total: number;
  limit: number;
  offset: number;
  stateCounts: Array<{ state: string; count: number }>;
};

type RoomOption = {
  roomType?: string | null;
  roomName?: string | null;
  bathroomType?: string | null;
  sizeM2?: number | null;
  radMin?: number | null;
  radMax?: number | null;
  dapAmount?: number | null;
  availabilityNote?: string | null;
};

type NursingHome = {
  id: number;

  // core
  name?: string | null;
  oneLineDescription?: string | null;
  description?: string | null;

  addressLine1?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  phone?: string | null;
  website?: string | null;
  governmentListingUrl?: string | null;
  websiteSaysVacancies?: string | null;
  facilityConfirmedVacancies?: string | null;
  websiteCheckedAt?: string | null;
  websiteSourceUrl?: string | null;
  facilityConfirmedAt?: string | null;
  facilityConfirmationSource?: string | null;
  conflictFlag?: boolean | null;
  lastProfileScanAt?: string | null;
  updatedAt?: string | null;

  // admin-only
  email?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  internalNotes?: string | null;
  status?: "ACTIVE" | "INACTIVE" | string;
  activeVacancies?: number | null;
  verifiedAt?: string | null;

  // images
  primaryImageUrl?: string | null;
  galleryImageUrls?: string[] | null;

  // lists
  featureTags?: string[] | null;
  otherTags?: string[] | null;
  languages?: string[] | null;

  // rooms
  roomOptions?: RoomOption[] | null;
};

type RoomOptionRow = {
  roomType: string;
  roomName: string;
  bathroomType: string;
  sizeM2: string;
  radMin: string; // keep as string for input, convert on save
  radMax: string;
  dapAmount: string;
  availabilityNote: string;
};

function emptyRoomOptionRow(): RoomOptionRow {
  return { roomType: "", roomName: "", bathroomType: "", sizeM2: "", radMin: "", radMax: "", dapAmount: "", availabilityNote: "" };
}

function ensureMinimumRoomRows(rows: RoomOptionRow[], minimum = 4): RoomOptionRow[] {
  const next = [...rows];
  while (next.length < minimum) next.push(emptyRoomOptionRow());
  return next;
}

type UpsertForm = {
  // core
  name: string;
  oneLineDescription: string;
  description: string;

  addressLine1: string;
  suburb: string;
  state: string;
  postcode: string;
  latitude: string;
  longitude: string;

  phone: string;
  website: string;
  governmentListingUrl: string;
  websiteSaysVacancies: string;
  facilityConfirmedVacancies: string;
  websiteCheckedAt: string;
  websiteSourceUrl: string;
  facilityConfirmedAt: string;
  facilityConfirmationSource: string;
  conflictFlag: boolean;

  // admin-only
  email: string;
  facebookUrl: string;
  instagramUrl: string;
  internalNotes: string;
  status: "ACTIVE" | "INACTIVE";
  activeVacancies: string; // convert on save
  verifiedAt: string; // ISO local datetime, optional

  // images
  primaryImageUrl: string;
  galleryImageUrlsText: string; // one per line

  // lists
  featureTagsText: string; // one per line
  otherTagsText: string;
  languagesText: string;

  // rooms
  roomOptions: RoomOptionRow[];
};

function linesToList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToLines(list?: string[] | null): string {
  return (list ?? []).filter(Boolean).join("\n");
}

function normalizeIsoLike(raw?: string | null): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/.test(value)) return value;

  const normalised = value
    .replace(" ", "T")
    .replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const parsed = Date.parse(normalised);
  if (Number.isNaN(parsed)) return "";
  return new Date(parsed).toISOString().replace(".000Z", "Z");
}

function toRoomRows(list?: RoomOption[] | null): RoomOptionRow[] {
  const src = list ?? [];
  if (!src.length) return ensureMinimumRoomRows([]);

  return ensureMinimumRoomRows(src.map((r) => ({
    roomType: (r.roomType ?? "") as string,
    roomName: (r.roomName ?? "") as string,
    bathroomType: (r.bathroomType ?? "") as string,
    sizeM2: r.sizeM2 == null ? "" : String(r.sizeM2),
    radMin: r.radMin == null ? "" : String(r.radMin),
    radMax: r.radMax == null ? "" : String(r.radMax),
    dapAmount: r.dapAmount == null ? "" : String(r.dapAmount),
    availabilityNote: (r.availabilityNote ?? "") as string,
  })));
}

function parseOptionalNumber(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function parseOptionalFloat(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function parseDelimitedList(raw: string): string[] {
  return raw
    .split(/\r?\n|[|;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function rowsToRoomOptions(
  rows: RoomOptionRow[]
): Array<{
  roomType?: string;
  roomName?: string;
  bathroomType?: string;
  sizeM2?: number;
  radMin?: number;
  radMax?: number;
  dapAmount?: number;
  availabilityNote?: string;
}> {
  return rows
    .map((r) => {
      const roomType = r.roomType.trim();
      const roomName = r.roomName.trim();
      const bathroomType = r.bathroomType.trim();
      const availabilityNote = r.availabilityNote.trim();

      const sizeM2 = parseOptionalFloat(r.sizeM2);
      const radMin = parseOptionalNumber(r.radMin);
      const radMax = parseOptionalNumber(r.radMax);
      const dapAmount = parseOptionalFloat(r.dapAmount);

      const hasAny =
        roomType ||
        roomName ||
        bathroomType ||
        availabilityNote ||
        sizeM2 !== undefined ||
        radMin !== undefined ||
        radMax !== undefined ||
        dapAmount !== undefined;

      if (!hasAny) return null;

      return { roomType, roomName, bathroomType, sizeM2, radMin, radMax, dapAmount, availabilityNote };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
}

function emptyForm(): UpsertForm {
  return {
    name: "",
    oneLineDescription: "",
    description: "",

    addressLine1: "",
    suburb: "",
    state: "QLD",
    postcode: "",
    latitude: "",
    longitude: "",

    phone: "",
    website: "",
    governmentListingUrl: "",
    websiteSaysVacancies: "unknown",
    facilityConfirmedVacancies: "unknown",
    websiteCheckedAt: "",
    websiteSourceUrl: "",
    facilityConfirmedAt: "",
    facilityConfirmationSource: "",
    conflictFlag: false,

    email: "",
    facebookUrl: "",
    instagramUrl: "",
    internalNotes: "",
    status: "ACTIVE",
    activeVacancies: "",
    verifiedAt: "",

    primaryImageUrl: "",
    galleryImageUrlsText: "",

    featureTagsText: "",
    otherTagsText: "",
    languagesText: "",

    roomOptions: ensureMinimumRoomRows([]),
  };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

function appendLines(existingText: string, newUrls: string[]): string {
  const existing = linesToList(existingText);
  const next = [...existing];
  for (const u of newUrls) {
    const t = (u ?? "").trim();
    if (!t) continue;
    if (!next.includes(t)) next.push(t);
  }
  return next.join("\n");
}

function formatDateTime(value?: string | null): string {
  if (!value) return "Not yet recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function facilityPreviewPath(id?: number | null): string {
  return id == null ? "/options" : `/options/${id}`;
}

export default function AdminNursingHomes() {
  const PAGE_SIZE = 10;
  const [token, setToken] = useState<string>(() => {
    const savedToken = localStorage.getItem("nhnm_admin_token");
    const savedSession = localStorage.getItem("nhnm_admin_session");
    return (TOKEN_ENV ?? "").trim() || (savedToken ?? "").trim() || (savedSession ? "cookie-session" : "");
  });

  const [list, setList] = useState<NursingHomeListItem[]>([]);
  const [totalFacilities, setTotalFacilities] = useState(0);
  const [pageOffset, setPageOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<number | "NEW">("NEW");

  const [loadingList, setLoadingList] = useState(false);
  const [loadingOne, setLoadingOne] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [importingSheet, setImportingSheet] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [importingVacancyChecks, setImportingVacancyChecks] = useState(false);
  const [importingPhotoManifest, setImportingPhotoManifest] = useState(false);
  const [sendingWeeklyCheck, setSendingWeeklyCheck] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [showFacilitiesBoard, setShowFacilitiesBoard] = useState(false);
  const [facilitiesBoardView, setFacilitiesBoardView] = useState<"ops" | "cards">("ops");

  const [currentId, setCurrentId] = useState<number | null>(null);
  const [form, setForm] = useState<UpsertForm>(emptyForm());
  const [scanning, setScanning] = useState(false);
  const [gapFilling, setGapFilling] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [roomScanning, setRoomScanning] = useState(false);
  const [roomScanMsg, setRoomScanMsg] = useState<string | null>(null);
  const [photoScanning, setPhotoScanning] = useState(false);
  const [photoScanMsg, setPhotoScanMsg] = useState<string | null>(null);
  const [scanningVacancies, setScanningVacancies] = useState(false);
  const [vacancyScanProgress, setVacancyScanProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkGapFilling, setBulkGapFilling] = useState(false);
  const [vacancyScanResults, setVacancyScanResults] = useState<Array<{ facilityId: number; facilityName: string; websiteSaysVacancies: string; vacancySummary: string | null }>>([]);
  const [currentMeta, setCurrentMeta] = useState<{
    websiteSaysVacancies?: string | null;
    facilityConfirmedVacancies?: string | null;
    websiteCheckedAt?: string | null;
    websiteSourceUrl?: string | null;
    facilityConfirmedAt?: string | null;
    facilityConfirmationSource?: string | null;
    conflictFlag?: boolean | null;
    lastProfileScanAt?: string | null;
    updatedAt?: string | null;
  } | null>(null);

  const sortedList = useMemo(
    () => [...list].sort((a, b) => a.name.localeCompare(b.name)),
    [list]
  );
  const [stateCountsList, setStateCountsList] = useState<Array<{ state: string; count: number }>>([]);
  const stateOptions = useMemo(() => ["ALL", ...stateCountsList.map((item) => item.state).filter(Boolean)], [stateCountsList]);
  const stateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of stateCountsList) {
      counts.set(item.state, item.count);
    }
    return counts;
  }, [stateCountsList]);
  const filteredList = sortedList;
  const missingGeoCount = useMemo(
    () => list.filter((nh) => nh.latitude == null || nh.longitude == null).length,
    [list],
  );
  const vacancyActivity = useMemo(() => {
    if (importingVacancyChecks) {
      return {
        tone: "info" as const,
        title: "Vacancy import running",
        text: "Importing vacancy checks into the database now. Please wait until the import completes before refreshing or sending more actions.",
      };
    }
    if (sendingWeeklyCheck) {
      return {
        tone: "info" as const,
        title: "Weekly vacancy emails sending",
        text:
          selectedId === "NEW"
            ? "Sending the weekly vacancy check to all active facilities now."
            : "Sending the weekly vacancy check for the selected facility now.",
      };
    }
    return {
      tone: "idle" as const,
      title: "Vacancy status ready",
      text: "Use the vacancy import for scanner updates, or send the weekly check email to collect direct facility confirmations.",
    };
  }, [importingVacancyChecks, sendingWeeklyCheck, selectedId]);

  const galleryUrls = useMemo(() => linesToList(form.galleryImageUrlsText), [form.galleryImageUrlsText]);

  function removeGalleryUrl(url: string) {
    setForm((p) => ({
      ...p,
      galleryImageUrlsText: listToLines(linesToList(p.galleryImageUrlsText).filter((item) => item !== url)),
    }));
  }

  function jumpToFacilitiesBoard() {
    setFacilitiesBoardView("ops");
    setShowFacilitiesBoard(true);
  }

  // localFetch: always hits the Node.js server (same origin), ignores API_BASE.
  // Use this for endpoints that only exist in server/index.mjs (e.g. scan-facility, scan-vacancy).
  async function localFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token.trim() && token.trim() !== "cookie-session") headers.set("X-Admin-Token", token.trim());
    const res = await fetch(path, { ...init, headers, credentials: "include" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return {} as T;
    return (await res.json()) as T;
  }
  void localFetch;

  async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

    if (init?.body && !isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (token.trim() && token.trim() !== "cookie-session") headers.set("X-Admin-Token", token.trim());

    const res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include" });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return {} as T;
    return (await res.json()) as T;
  }

  async function refreshList(nextOffset = pageOffset) {
    setError("");
    setNotice("");
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(nextOffset));
      if (search.trim()) params.set("search", search.trim());
      if (stateFilter !== "ALL") params.set("state", stateFilter);

      const data = await apiFetch<NursingHomeListResponse>(`/api/admin/nursing-homes?${params.toString()}`);
      setList(data.items ?? []);
      setTotalFacilities(data.total ?? 0);
      setPageOffset(data.offset ?? nextOffset);
      setStateCountsList(data.stateCounts ?? []);

      // Do not auto-jump to a different item when the selected one scrolls off the page
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingList(false);
    }
  }

  async function handleScan() {
    const url = form.website.trim();
    if (!url) return;
    setScanning(true);
    setScanMessage(null);
    try {
      const data = await apiFetch<Record<string, unknown>>("/api/admin/scan-facility", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      setForm((p) => ({
        ...p,
        name:               String(data.name || p.name),
        oneLineDescription: String(data.oneLineDescription || p.oneLineDescription),
        description:        String(data.description || p.description),
        addressLine1:       String(data.addressLine1 || p.addressLine1),
        suburb:             String(data.suburb || p.suburb),
        state:              String(data.state || p.state),
        postcode:           String(data.postcode || p.postcode),
        phone:              String(data.phone || p.phone),
        email:              String(data.email || p.email),
        facebookUrl:        String(data.facebookUrl || p.facebookUrl),
        instagramUrl:       String(data.instagramUrl || p.instagramUrl),
        featureTagsText:    [
          ...linesToList(p.featureTagsText),
          ...((data.careTypes as string[]) || []),
          ...((data.specialties as string[]) || []),
          ...((data.featureHighlights as string[]) || []),
          ...((data.alliedHealth as string[]) || []),
        ].filter((v, i, a) => v && a.indexOf(v) === i).join("\n"),
        otherTagsText:      [
          ...linesToList(p.otherTagsText),
          ...((data.amenities as string[]) || []),
          ...((data.roomTypes as string[]) || []),
        ].filter((v, i, a) => v && a.indexOf(v) === i).join("\n"),
        languagesText:      [
          ...linesToList(p.languagesText),
          ...((data.languages as string[]) || []),
        ].filter((v, i, a) => v && a.indexOf(v) === i).join("\n"),
        primaryImageUrl:
          String(data.primaryImageUrl || p.primaryImageUrl),
        galleryImageUrlsText: [
          ...linesToList(p.galleryImageUrlsText),
          ...((data.galleryImageUrls as string[]) || []),
        ].filter((v, i, a) => v && a.indexOf(v) === i).join("\n"),
        internalNotes: [
          p.internalNotes,
          data.visitingHours ? `Visiting hours: ${data.visitingHours}` : "",
          data.admissionsProcess ? `Admissions: ${data.admissionsProcess}` : "",
          data.waitingListInfo ? `Waiting list: ${data.waitingListInfo}` : "",
          data.transportNotes ? `Transport: ${data.transportNotes}` : "",
          data.bedsCount ? `Beds: ${data.bedsCount}` : "",
          data.starRating ? `Star rating: ${data.starRating}` : "",
          (data.nearbyHospitals as string[] | undefined)?.length
            ? `Nearby hospitals: ${(data.nearbyHospitals as string[]).join(", ")}`
            : "",
        ].filter(Boolean).join("\n").trim(),
      }));
      const fieldsFound = [data.name, data.description, data.oneLineDescription, data.phone, data.email, data.addressLine1]
        .filter(Boolean).length;
      if (fieldsFound === 0) {
        setScanMessage("Scan returned no data — Firecrawl may not have been able to read this page. Check FIRECRAWL_API_KEY is set in Railway and try again.");
      } else {
        setScanMessage(`Scan complete — ${fieldsFound} field(s) populated. Review below before saving.`);
      }
    } catch (e: unknown) {
      setScanMessage(`Scan failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setScanning(false);
    }
  }

  async function handleGapFill() {
    if (currentId == null) return;
    setGapFilling(true);
    setScanMessage(null);
    try {
      const updated = await apiFetch<Record<string, unknown>>(`/api/admin/nursing-homes/gap-fill/${currentId}`, {
        method: "POST",
      });
      // Refresh form with saved data
      setForm((p) => ({
        ...p,
        description:        String(updated.description || p.description),
        oneLineDescription: String(updated.oneLineDescription || p.oneLineDescription),
        activeVacancies:    updated.activeVacancies != null ? String(updated.activeVacancies) : p.activeVacancies,
        phone:              String(updated.phone || p.phone),
        email:              String(updated.email || p.email),
        internalNotes:      String(updated.internalNotes || p.internalNotes),
      }));
      setScanMessage("Gap-fill complete — blanks filled from MyAgedCare + website and saved.");
    } catch (e: unknown) {
      setScanMessage(`Gap-fill failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGapFilling(false);
    }
  }

  async function handleScanRooms() {
    if (currentId == null) {
      setRoomScanMsg("Save the facility first, then scan rooms.");
      return;
    }
    setRoomScanning(true);
    setRoomScanMsg(null);
    try {
      const result = await apiFetch<{ rooms: Array<{ roomType: string; roomName: string; bathroomType: string; sizeM2: number | null; radMin: number | null; radMax: number | null; dapAmount: number | null; availabilityNote: string }>; scannedUrl: string }>(
        "/api/admin/nursing-homes/scan-rooms",
        { method: "POST", body: JSON.stringify({ facilityId: currentId }) }
      );
      const rooms = result.rooms ?? [];
      if (rooms.length === 0) {
        setRoomScanMsg("No room data found — MyAgedCare may not have room costs listed for this facility.");
        return;
      }
      const newRows = rooms.map((r) => ({
        roomType: r.roomType ?? "",
        roomName: r.roomName ?? "",
        bathroomType: r.bathroomType ?? "",
        sizeM2: r.sizeM2 != null ? String(r.sizeM2) : "",
        radMin: r.radMin != null ? String(r.radMin) : "",
        radMax: r.radMax != null ? String(r.radMax) : "",
        dapAmount: r.dapAmount != null ? String(r.dapAmount) : "",
        availabilityNote: r.availabilityNote ?? "",
      }));
      // Pad to at least 4 rows
      while (newRows.length < 4) newRows.push(emptyRoomOptionRow());
      setForm((p) => ({ ...p, roomOptions: newRows }));
      setRoomScanMsg(`Imported ${rooms.length} room(s) from MyAgedCare. Review and save.`);
    } catch (e: unknown) {
      setRoomScanMsg(`Scan failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRoomScanning(false);
    }
  }

  async function handleScanPhotos() {
    const url = form.website.trim();
    if (!url) {
      setPhotoScanMsg("No website URL set on this facility.");
      return;
    }
    setPhotoScanning(true);
    setPhotoScanMsg(null);
    try {
      const data = await apiFetch<Record<string, unknown>>("/api/admin/nursing-homes/scan-photos", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      const primary = (data.primaryImageUrl as string | undefined)?.trim() ?? "";
      const gallery = (data.galleryImageUrls as string[] | undefined) ?? [];
      let populated = 0;
      setForm((p) => {
        const newPrimary = primary && !p.primaryImageUrl ? primary : p.primaryImageUrl;
        if (primary && !p.primaryImageUrl) populated++;
        const merged = [
          ...linesToList(p.galleryImageUrlsText),
          ...gallery,
        ].filter((v, i, a) => v && a.indexOf(v) === i);
        populated += gallery.filter((u) => !linesToList(p.galleryImageUrlsText).includes(u)).length;
        return { ...p, primaryImageUrl: newPrimary, galleryImageUrlsText: merged.join("\n") };
      });
      setPhotoScanMsg(populated > 0 ? `Found ${populated} photo(s). Review and save.` : "No photos found on this page.");
    } catch (e: unknown) {
      setPhotoScanMsg(`Photo scan failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPhotoScanning(false);
    }
  }

  type GapCandidate = { id: number; name: string; suburb: string; state: string; hasWebsite: boolean; hasGovUrl: boolean; missingFields: string[] };
  type GapResult = { id: number; name: string; status: "filled" | "unchanged" | "error"; missingFields: string[]; error?: string };

  const [gapCandidates, setGapCandidates] = useState<GapCandidate[]>([]);
  const [gapResults, setGapResults] = useState<GapResult[]>([]);
  const [gapCurrentName, setGapCurrentName] = useState("");
  const [showGapPanel, setShowGapPanel] = useState(false);
  const [gapStateFilter, setGapStateFilter] = useState("");
  const gapStopRef = React.useRef(false);

  async function handleLoadGapCandidates() {
    setError("");
    setBulkGapFilling(true);
    try {
      const qs = gapStateFilter ? `?state=${encodeURIComponent(gapStateFilter)}` : "";
      const candidates = await apiFetch<GapCandidate[]>(`/api/admin/nursing-homes/gap-candidates${qs}`);
      setGapCandidates(candidates);
      setGapResults([]);
      setShowGapPanel(true);
    } catch (e: unknown) {
      setError(`Failed to load gap candidates: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBulkGapFilling(false);
    }
  }

  async function handleBulkGapFill() {
    if (!gapCandidates.length) return;
    gapStopRef.current = false;
    setBulkGapFilling(true);
    setGapResults([]);
    setError("");

    for (let i = 0; i < gapCandidates.length; i++) {
      if (gapStopRef.current) break;
      const c = gapCandidates[i];
      setGapCurrentName(`${i + 1}/${gapCandidates.length} — ${c.name}`);
      try {
        await apiFetch(`/api/admin/nursing-homes/gap-fill/${c.id}`, { method: "POST" });
        setGapResults((prev) => [...prev, { id: c.id, name: c.name, status: "filled", missingFields: c.missingFields }]);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("unchanged") || msg.includes("200")) {
          setGapResults((prev) => [...prev, { id: c.id, name: c.name, status: "unchanged", missingFields: c.missingFields }]);
        } else {
          setGapResults((prev) => [...prev, { id: c.id, name: c.name, status: "error", missingFields: c.missingFields, error: msg }]);
        }
      }
      // small delay to respect Firecrawl rate limits
      await new Promise((r) => setTimeout(r, 1500));
    }

    setBulkGapFilling(false);
    setGapCurrentName("");
    await refreshList();
  }

  async function handleScanAllVacancies() {
    const withWebsite = list.filter((nh) => nh.website?.trim());
    if (!withWebsite.length) {
      setNotice("No facilities with a website URL found.");
      return;
    }
    setScanningVacancies(true);
    setVacancyScanProgress({ done: 0, total: withWebsite.length });
    setVacancyScanResults([]);
    const found: typeof vacancyScanResults = [];
    for (let i = 0; i < withWebsite.length; i++) {
      const nh = withWebsite[i];
      try {
        const result = await apiFetch<{ facilityId: number; facilityName: string; websiteSaysVacancies: string; vacancySummary: string | null }>(
          "/api/admin/scan-vacancy",
          { method: "POST", body: JSON.stringify({ facilityId: nh.id }) },
        );
        setList((prev) =>
          prev.map((f) =>
            f.id === nh.id
              ? { ...f, websiteSaysVacancies: result.websiteSaysVacancies, websiteCheckedAt: new Date().toISOString() }
              : f,
          ),
        );
        if (result.websiteSaysVacancies === "yes") {
          found.push(result);
          setVacancyScanResults([...found]);
        }
      } catch {
        // skip failed facilities silently
      }
      setVacancyScanProgress({ done: i + 1, total: withWebsite.length });
    }
    setScanningVacancies(false);
    setNotice(`Vacancy scan complete. ${found.length} facilit${found.length === 1 ? "y" : "ies"} showing vacancies on their website.`);
  }

  async function patchVacancyConfirmation(facilityId: number, confirmed: "yes" | "no") {
    await apiFetch(`/api/admin/nursing-homes/${facilityId}/vacancy`, {
      method: "PATCH",
      body: JSON.stringify({
        facilityConfirmedVacancies: confirmed,
        facilityConfirmedAt: new Date().toISOString(),
        facilityConfirmationSource: "admin_manual",
      }),
    });
    setList((prev) =>
      prev.map((f) =>
        f.id === facilityId ? { ...f, facilityConfirmedVacancies: confirmed, facilityConfirmedAt: new Date().toISOString() } : f,
      ),
    );
    if (confirmed === "yes") {
      setVacancyScanResults((prev) => prev.filter((r) => r.facilityId !== facilityId));
    }
  }
  void patchVacancyConfirmation;

  async function loadOne(id: number) {
    setError("");
    setNotice("");
    setLoadingOne(true);
    try {
      const nh = await apiFetch<NursingHome>(`/api/admin/nursing-homes/${id}`);

      setCurrentId(nh.id);
      setCurrentMeta({
        websiteSaysVacancies: nh.websiteSaysVacancies,
        facilityConfirmedVacancies: nh.facilityConfirmedVacancies,
        websiteCheckedAt: nh.websiteCheckedAt,
        websiteSourceUrl: nh.websiteSourceUrl,
        facilityConfirmedAt: nh.facilityConfirmedAt,
        facilityConfirmationSource: nh.facilityConfirmationSource,
        conflictFlag: nh.conflictFlag,
        lastProfileScanAt: nh.lastProfileScanAt,
        updatedAt: nh.updatedAt,
      });

        setForm({
        name: (nh.name ?? "") as string,
        oneLineDescription: (nh.oneLineDescription ?? "") as string,
        description: (nh.description ?? "") as string,

        addressLine1: (nh.addressLine1 ?? "") as string,
        suburb: (nh.suburb ?? "") as string,
        state: (nh.state ?? "QLD") as string,
        postcode: (nh.postcode ?? "") as string,
        latitude: nh.latitude == null ? "" : String(nh.latitude),
        longitude: nh.longitude == null ? "" : String(nh.longitude),

        phone: (nh.phone ?? "") as string,
        website: (nh.website ?? "") as string,
        governmentListingUrl: (nh.governmentListingUrl ?? "") as string,
        websiteSaysVacancies: (nh.websiteSaysVacancies ?? "unknown") as string,
        facilityConfirmedVacancies: (nh.facilityConfirmedVacancies ?? "unknown") as string,
        websiteCheckedAt: (nh.websiteCheckedAt ?? "") as string,
        websiteSourceUrl: (nh.websiteSourceUrl ?? "") as string,
        facilityConfirmedAt: (nh.facilityConfirmedAt ?? "") as string,
        facilityConfirmationSource: (nh.facilityConfirmationSource ?? "") as string,
        conflictFlag: !!nh.conflictFlag,

        email: (nh.email ?? "") as string,
        facebookUrl: (nh.facebookUrl ?? "") as string,
        instagramUrl: (nh.instagramUrl ?? "") as string,
        internalNotes: (nh.internalNotes ?? "") as string,
        status: nh.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        activeVacancies: nh.activeVacancies == null ? "" : String(nh.activeVacancies),
          verifiedAt: normalizeIsoLike(nh.verifiedAt),

        primaryImageUrl: (nh.primaryImageUrl ?? "") as string,
        galleryImageUrlsText: listToLines(nh.galleryImageUrls),

        featureTagsText: listToLines(nh.featureTags),
        otherTagsText: listToLines(nh.otherTags),
        languagesText: listToLines(nh.languages),

        roomOptions: toRoomRows(nh.roomOptions),
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingOne(false);
    }
  }

  function newFacility() {
    setError("");
    setNotice("");
    setSelectedId("NEW");
    setCurrentId(null);
    setCurrentMeta(null);
    setForm(emptyForm());
  }

  async function save() {
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const payload = {
        // core
        name: form.name.trim(),
        oneLineDescription: form.oneLineDescription.trim() || null,
        description: form.description.trim() || null,

        addressLine1: form.addressLine1.trim() || null,
        suburb: form.suburb.trim(),
        state: form.state.trim(),
        postcode: form.postcode.trim(),
        latitude: parseOptionalFloat(form.latitude),
        longitude: parseOptionalFloat(form.longitude),

        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        governmentListingUrl: form.governmentListingUrl.trim() || null,
        websiteSaysVacancies: form.websiteSaysVacancies,
        facilityConfirmedVacancies: form.facilityConfirmedVacancies,
        websiteCheckedAt: form.websiteCheckedAt.trim() || null,
        websiteSourceUrl: form.websiteSourceUrl.trim() || null,
        facilityConfirmedAt: form.facilityConfirmedAt.trim() || null,
        facilityConfirmationSource: form.facilityConfirmationSource.trim() || null,
        conflictFlag: form.conflictFlag,

        // admin-only
        email: form.email.trim() || null,
        facebookUrl: form.facebookUrl.trim() || null,
        instagramUrl: form.instagramUrl.trim() || null,
        internalNotes: form.internalNotes.trim() || null,
        status: form.status,
        activeVacancies: parseOptionalNumber(form.activeVacancies),
          verifiedAt: normalizeIsoLike(form.verifiedAt) || null,

        // images
        primaryImageUrl: form.primaryImageUrl.trim() || null,
        galleryImageUrls: linesToList(form.galleryImageUrlsText),

        // lists
        featureTags: linesToList(form.featureTagsText),
        otherTags: linesToList(form.otherTagsText),
        languages: linesToList(form.languagesText),

        // rooms
        roomOptions: rowsToRoomOptions(form.roomOptions),
      };

      if (currentId == null) {
        const created = await apiFetch<NursingHome>("/api/admin/nursing-homes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice(`Created: ${created.name} (ID ${created.id})`);
        await refreshList();
        setSelectedId(created.id);
        await loadOne(created.id);
      } else {
        const updated = await apiFetch<NursingHome>(`/api/admin/nursing-homes/${currentId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setNotice(`Updated: ${updated.name} (ID ${updated.id})`);
        await refreshList();
        await loadOne(updated.id);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function importSpreadsheet(file: File) {
    setError("");
    setNotice("");
    setImportingSheet(true);
    try {
      const XLSX = await import("xlsx");
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      const normalized = rows
        .map((r) => {
          const get = (...keys: string[]) => {
            for (const key of keys) {
              const v = r[key];
              if (v != null && String(v).trim()) return String(v).trim();
            }
            return "";
          };
          const getNum = (...keys: string[]) => {
            const txt = get(...keys);
            if (!txt) return null;
            const n = Number(txt);
            return Number.isFinite(n) ? n : null;
          };
          const getFirstEmail = (...keys: string[]) => {
            const raw = get(...keys);
            if (!raw) return "";
            return raw
              .split(/[;,]/)
              .map((x) => x.trim())
              .find((x) => x.includes("@")) ?? "";
          };
          const category = get("category", "Category");
          const featureTags = parseDelimitedList(get("featureTags", "feature_tags", "Feature Tags"));
          const otherTags = parseDelimitedList(get("otherTags", "other_tags", "Other Tags"));
          const languages = parseDelimitedList(get("languages", "Languages"));
          const roomTypes = parseDelimitedList(get("roomTypes", "room_types", "room_options", "Room Types", "Room Options"));
          const galleryImages = parseDelimitedList(
            get("galleryImageUrls", "gallery_image_urls", "gallery_images", "Gallery Image URLs"),
          );

          return {
            name: get("name", "Name", "facility_name", "Facility Name"),
            providerName: get("providerName", "provider_name", "Provider Name"),
            oneLineDescription: get("oneLineDescription", "one_line_description", "One Line Description"),
            description: get("description", "long_description", "Description", "Long Description"),
            addressLine1: get("addressLine1", "address_line", "address", "Address", "street_address"),
            addressLine2: get("addressLine2", "address_line_2", "Address Line 2"),
            suburb: get("suburb", "Suburb"),
            state: get("state", "State"),
            postcode: get("postcode", "Postcode", "post_code"),
            phone: get("phone", "Phone"),
            website: get("website", "Website", "source_url", "Source URL"),
            email: getFirstEmail("email", "Email"),
            facebookUrl: get("facebookUrl", "facebook_url", "Facebook URL"),
            instagramUrl: get("instagramUrl", "instagram_url", "Instagram URL"),
            governmentListingUrl: get("governmentListingUrl", "government_listing_url", "Government Listing URL"),
            sourcePrimary: get("sourcePrimary", "source_primary", "Source Primary"),
            facilityType: get("facilityType", "facility_type", "Facility Type"),
            beds: getNum("beds", "Beds"),
            primaryImageUrl: get("primaryImageUrl", "primary_image_url", "primary_photo_url", "Primary Image URL"),
            latitude: getNum("latitude", "lat", "Latitude"),
            longitude: getNum("longitude", "lng", "lon", "Longitude"),
            status: get("status", "Status") || "ACTIVE",
            websiteSaysVacancies: get("websiteSaysVacancies", "website_says_vacancies", "Website Says Vacancies"),
            facilityConfirmedVacancies: get(
              "facilityConfirmedVacancies",
              "facility_confirmed_vacancies",
              "Facility Confirmed Vacancies",
            ),
            websiteCheckedAt: get("websiteCheckedAt", "website_checked_at", "Website Checked At"),
            facilityConfirmedAt: get("facilityConfirmedAt", "facility_confirmed_at", "Facility Confirmed At"),
            websiteSourceUrl: get("websiteSourceUrl", "website_source_url", "Website Source URL"),
            facilityConfirmationSource: get(
              "facilityConfirmationSource",
              "facility_confirmation_source",
              "Facility Confirmation Source",
            ),
            conflictFlag: ["true", "yes", "1"].includes(
              get("conflictFlag", "conflict_flag", "Conflict Flag").toLowerCase(),
            ),
            careTypes: parseDelimitedList(get("careTypes", "care_types", "Care Types")),
            specialties: featureTags,
            roomTypes,
            images: parseDelimitedList(get("images", "Images")).length
              ? parseDelimitedList(get("images", "Images"))
              : galleryImages,
            galleryImageUrls: galleryImages,
            lastProfileScanAt: get("lastProfileScanAt", "last_profile_scan_at", "verified_at", "Last Profile Scan At"),
            languages,
            otherTags: [...(category ? [category] : []), ...otherTags],
            internalNotes: get("internalNotes", "internal_notes", "Internal Notes"),
            activeVacancies: getNum("activeVacancies", "active_vacancies", "Active Vacancies"),
            verifiedAt: get("verifiedAt", "verified_at", "Verified At"),
            facilityRowId: get("facilityRowId", "facility_row_id", "Facility Row ID"),
            primaryPhotoId: get("primaryPhotoId", "primary_photo_id", "Primary Photo ID"),
            primaryPhotoLocalPath: get("primaryPhotoLocalPath", "primary_photo_local_path", "Primary Photo Local Path"),
            galleryPhotoIds: parseDelimitedList(get("galleryPhotoIds", "gallery_photo_ids", "Gallery Photo IDs")),
            galleryPhotoLocalPaths: parseDelimitedList(
              get("galleryPhotoLocalPaths", "gallery_photo_local_paths", "Gallery Photo Local Paths"),
            ),
          };
        })
        .filter((x) => x.name && x.suburb && x.state && x.postcode);

      if (!normalized.length) {
        throw new Error("No valid rows found. Required: name, suburb, state, postcode.");
      }

      const BATCH_SIZE = 50;
      let created = 0, updated = 0, skipped = 0;
      const batches = Math.ceil(normalized.length / BATCH_SIZE);

      for (let i = 0; i < batches; i++) {
        const batch = normalized.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        setImportProgress(`Batch ${i + 1} of ${batches} (${Math.min((i + 1) * BATCH_SIZE, normalized.length)}/${normalized.length} rows)…`);
        const res = await apiFetch<{ created: number; updated: number; skipped: number }>(
          "/api/admin/nursing-homes/import",
          {
            method: "POST",
            body: JSON.stringify(batch),
          },
        );
        created += res.created;
        updated += res.updated;
        skipped += res.skipped;
      }

      setImportProgress("");
      setNotice(`Import complete. Created ${created}, updated ${updated}, skipped ${skipped}.`);
      await refreshList();
    } catch (e) {
      setError(getErrorMessage(e));
      setImportProgress("");
    } finally {
      setImportingSheet(false);
    }
  }

  async function exportAllCsv() {
    setError("");
    setNotice("Preparing export…");
    try {
      const data = await apiFetch<Record<string, unknown>[]>("/api/admin/nursing-homes/export");
      const XLSX = await import("xlsx");
      const listToCell = (v: unknown) =>
        Array.isArray(v) ? (v as string[]).join("|") : (v == null ? "" : String(v));
      const rows = data.map((f) => ({
        name: f.name ?? "",
        facilityRowId: f.facilityRowId ?? "",
        slug: f.slug ?? "",
        abn: f.abn ?? "",
        providerName: f.providerName ?? "",
        oneLineDescription: f.oneLineDescription ?? "",
        description: f.description ?? "",
        overviewHeading: f.overviewHeading ?? "",
        providerOverview: f.providerOverview ?? "",
        accommodationSummary: f.accommodationSummary ?? "",
        pricingSummary: f.pricingSummary ?? "",
        radFrom: f.radFrom ?? "",
        radTo: f.radTo ?? "",
        dapFrom: f.dapFrom ?? "",
        dapTo: f.dapTo ?? "",
        staffingSummary: f.staffingSummary ?? "",
        foodHighlights: f.foodHighlights ?? "",
        visitingHours: f.visitingHours ?? "",
        admissionsProcess: f.admissionsProcess ?? "",
        waitingListSummary: f.waitingListSummary ?? "",
        transportNotes: f.transportNotes ?? "",
        reviewSummary: f.reviewSummary ?? "",
        reviewCount: f.reviewCount ?? "",
        addressLine1: f.addressLine1 ?? "",
        addressLine2: f.addressLine2 ?? "",
        suburb: f.suburb ?? "",
        state: f.state ?? "",
        postcode: f.postcode ?? "",
        phone: f.phone ?? "",
        email: f.email ?? "",
        facebookUrl: f.facebookUrl ?? "",
        instagramUrl: f.instagramUrl ?? "",
        website: f.website ?? "",
        governmentListingUrl: f.governmentListingUrl ?? "",
        sourcePrimary: f.sourcePrimary ?? "",
        facilityType: f.facilityType ?? "",
        beds: f.beds ?? "",
        latitude: f.latitude ?? "",
        longitude: f.longitude ?? "",
        status: f.status ?? "",
        activeVacancies: f.activeVacancies ?? "",
        primaryImageUrl: f.primaryImageUrl ?? "",
        galleryImageUrls: listToCell(f.galleryImageUrls),
        featureTags: listToCell(f.featureTags),
        otherTags: listToCell(f.otherTags),
        languages: listToCell(f.languages),
        careTypes: listToCell(f.careTypes),
        specialties: listToCell(f.specialties),
        roomTypes: listToCell(f.roomTypes),
        amenities: listToCell(f.amenities),
        alliedHealth: listToCell(f.alliedHealth),
        heroBadges: listToCell(f.heroBadges),
        servicesIncluded: listToCell(f.servicesIncluded),
        nearbyHospitals: listToCell(f.nearbyHospitals),
        faqItems: listToCell(f.faqItems),
        internalNotes: f.internalNotes ?? "",
        websiteSaysVacancies: f.websiteSaysVacancies ?? "",
        facilityConfirmedVacancies: f.facilityConfirmedVacancies ?? "",
        websiteCheckedAt: f.websiteCheckedAt ?? "",
        facilityConfirmedAt: f.facilityConfirmedAt ?? "",
        websiteSourceUrl: f.websiteSourceUrl ?? "",
        facilityConfirmationSource: f.facilityConfirmationSource ?? "",
        conflictFlag: f.conflictFlag ? "true" : "",
        lastProfileScanAt: f.lastProfileScanAt ?? "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Facilities");
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `nursing-homes-export-${date}.csv`, { bookType: "csv" });
      setNotice(`Export complete — ${rows.length} facilities downloaded.`);
    } catch (e) {
      setError(getErrorMessage(e));
      setNotice("");
    }
  }

  async function deleteAllFacilities() {
    const answer = window.prompt(
      `⚠️ This will permanently delete ALL facilities from the database.\n\nType DELETE to confirm:`
    );
    if (answer?.trim() !== "DELETE") {
      setNotice("Delete cancelled.");
      return;
    }
    setError("");
    setNotice("Deleting all facilities…");
    try {
      const res = await apiFetch<{ deleted: number }>("/api/admin/nursing-homes/delete-all", {
        method: "DELETE",
        headers: { "X-Confirm-Delete-All": "DELETE_ALL_FACILITIES" },
      });
      setNotice(`Deleted ${res.deleted} facilities.`);
      setSelectedId("NEW");
      setCurrentId(null);
      setCurrentMeta(null);
      setForm(emptyForm());
      await refreshList();
    } catch (e) {
      setError(getErrorMessage(e));
      setNotice("");
    }
  }

  async function importVacancyChecks(file: File) {
    setError("");
    setNotice("");
    setImportingVacancyChecks(true);
    try {
      const XLSX = await import("xlsx");
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      const normalized = rows
        .map((r) => {
          const get = (...keys: string[]) => {
            for (const key of keys) {
              const v = r[key];
              if (v != null && String(v).trim()) return String(v).trim();
            }
            return "";
          };
          const getNum = (...keys: string[]) => {
            const txt = get(...keys);
            if (!txt) return null;
            const n = Number(txt);
            return Number.isFinite(n) ? n : null;
          };
          const getBool = (...keys: string[]) => {
            const txt = get(...keys).toLowerCase();
            if (!txt) return false;
            return txt === "true" || txt === "yes" || txt === "1";
          };

          return {
            facilityId: getNum("facility_id", "facilityId", "Facility ID"),
            facilityName: get("facility_name", "facilityName", "Facility Name", "name", "Name"),
            suburb: get("suburb", "Suburb"),
            postcode: get("postcode", "Postcode"),
            website: get("website", "Website"),
            governmentListingUrl: get("government_listing_url", "governmentListingUrl", "Government Listing URL"),
            checkedAt: get("checked_at", "checkedAt", "Checked At"),
            sourceType: get("source_type", "sourceType", "Source Type"),
            sourceUrl: get("source_url", "sourceUrl", "Source URL"),
            websiteSaysVacancies: get("website_says_vacancies", "websiteSaysVacancies", "Website Says Vacancies"),
            facilityConfirmedVacancies: get("facility_confirmed_vacancies", "facilityConfirmedVacancies", "Facility Confirmed Vacancies"),
            websiteCheckedAt: get("website_checked_at", "websiteCheckedAt", "Website Checked At"),
            websiteSourceUrl: get("website_source_url", "websiteSourceUrl", "Website Source URL"),
            facilityConfirmedAt: get("facility_confirmed_at", "facilityConfirmedAt", "Facility Confirmed At"),
            facilityConfirmationSource: get("facility_confirmation_source", "facilityConfirmationSource", "Facility Confirmation Source"),
            vacancyStatus: get("vacancy_status", "vacancyStatus", "Vacancy Status"),
            vacancySummary: get("vacancy_summary", "vacancySummary", "Vacancy Summary"),
            waitlistStatus: get("waitlist_status", "waitlistStatus", "Waitlist Status"),
            admissionsStatus: get("admissions_status", "admissionsStatus", "Admissions Status"),
            contactCta: get("contact_cta", "contactCta", "Contact CTA"),
            confidence: get("confidence", "Confidence"),
            rawTextExcerpt: get("raw_text_excerpt", "rawTextExcerpt", "Raw Text Excerpt"),
            conflictFlag: getBool("conflict_flag", "conflictFlag", "Conflict Flag"),
            needsManualReview: getBool("needs_manual_review", "needsManualReview", "Needs Manual Review"),
          };
        })
        .filter((x) => x.facilityId != null || x.website || x.governmentListingUrl || (x.facilityName && x.suburb && x.postcode));

      if (!normalized.length) {
        throw new Error("No valid rows found. Need facility_id, website, government_listing_url, or name+suburb+postcode.");
      }

      const res = await apiFetch<{ created: number; updated: number; skipped: number }>(
        "/api/admin/nursing-homes/import-vacancy-checks",
        {
          method: "POST",
          body: JSON.stringify(normalized),
        },
      );

      setNotice(`Vacancy import complete. Created ${res.created}, updated ${res.updated}, skipped ${res.skipped}.`);
      await refreshList();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setImportingVacancyChecks(false);
    }
  }

  async function importPhotoManifest(file: File) {
    setError("");
    setNotice("");
    setImportingPhotoManifest(true);
    try {
      const XLSX = await import("xlsx");
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      const normalized = rows
        .map((r) => {
          const get = (...keys: string[]) => {
            for (const key of keys) {
              const v = r[key];
              if (v != null && String(v).trim()) return String(v).trim();
            }
            return "";
          };
          const getBool = (...keys: string[]) => {
            const txt = get(...keys).toLowerCase();
            return txt === "true" || txt === "yes" || txt === "1";
          };

          return {
            facilityRowId: get("facilityRowId", "facility_row_id", "Facility Row ID"),
            facilityName: get("facilityName", "facility_name", "Facility Name"),
            photoId: get("photoId", "photo_id", "Photo ID"),
            isPrimary: getBool("isPrimary", "is_primary", "Is Primary"),
            sourceUrl: get("sourceUrl", "source_url", "Source URL"),
            localPath: get("localPath", "local_path", "Local Path"),
            fileName: get("fileName", "file_name", "File Name"),
            contentType: get("contentType", "content_type", "Content Type"),
            downloadStatus: get("downloadStatus", "download_status", "Download Status"),
          };
        })
        .filter((x) => x.facilityRowId || x.facilityName);

      if (!normalized.length) {
        throw new Error("No valid photo manifest rows found. Required: facility_row_id or facility_name.");
      }

      const res = await apiFetch<{ created: number; updated: number; skipped: number }>(
        "/api/admin/nursing-homes/import-photo-manifest",
        {
          method: "POST",
          body: JSON.stringify(normalized),
        },
      );

      setNotice(`Photo manifest import complete. Updated ${res.updated}, skipped ${res.skipped}.`);
      await refreshList();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setImportingPhotoManifest(false);
    }
  }

  async function sendWeeklyVacancyCheck() {
    setError("");
    setNotice("");
    setSendingWeeklyCheck(true);
    try {
      const payload =
        selectedId === "NEW"
          ? {}
          : { facilityIds: [Number(selectedId)] };

      const res = await apiFetch<{ sent: number; skipped: number }>(
        "/api/admin/facility-outreach/send-weekly",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      setNotice(`Weekly vacancy check sent to ${res.sent} facility(s). Skipped ${res.skipped}.`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSendingWeeklyCheck(false);
    }
  }

  async function uploadOnePhoto(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);

    const res = await apiFetch<{ url: string }>("/api/admin/uploads", {
      method: "POST",
      body: fd,
    });

    if (!res?.url) throw new Error("Upload succeeded but no url returned");
    return res.url;
  }

  async function removeFacility() {
    if (currentId == null) return;
    const ok = window.confirm("Delete this nursing home? This cannot be undone.");
    if (!ok) return;

    setError("");
    setNotice("");
    setDeleting(true);
    try {
      await apiFetch<void>(`/api/admin/nursing-homes/${currentId}`, { method: "DELETE" });
      setNotice("Facility deleted.");
      newFacility();
      await refreshList();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  async function uploadPrimaryPhoto(file: File) {
    setError("");
    setNotice("");
    setUploadingPrimary(true);
    try {
      const url = await uploadOnePhoto(file);
      setForm((p) => ({ ...p, primaryImageUrl: url }));
      setNotice("Primary photo uploaded and set.");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setUploadingPrimary(false);
    }
  }

  async function uploadGalleryPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;

    setError("");
    setNotice("");
    setUploadingGallery(true);

    try {
      const toUpload = Array.from(files);
      const uploaded: string[] = [];

      for (const f of toUpload) {
        const url = await uploadOnePhoto(f);
        uploaded.push(url);
      }

      setForm((p) => ({
        ...p,
        galleryImageUrlsText: appendLines(p.galleryImageUrlsText, uploaded),
      }));

      setNotice(`Uploaded ${uploaded.length} gallery image(s) and added URLs.`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setUploadingGallery(false);
    }
  }

  useEffect(() => {
    setPageOffset(0);
    refreshList(0).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, stateFilter]);

  useEffect(() => {
    if (selectedId === "NEW") return;
    loadOne(selectedId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const disabled =
    loadingList || loadingOne || saving || deleting || uploadingPrimary || uploadingGallery || importingSheet || importingVacancyChecks || importingPhotoManifest || sendingWeeklyCheck;

  return (
    <div style={{ minHeight: "100vh", padding: 20, background: "#f8fafc" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ margin: 0, color: "#0b3b5b" }}>Admin: Nursing Homes</h1>
        <p style={{ marginTop: 8, color: "#334155" }}>
          Add / update facilities in your database (matches the new “options list + details” spec).
        </p>

        <AdminTopNav />

        <div style={topCard}>
          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
            Admin Override Token
          </label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Optional: paste a dev override token"
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={() => refreshList(pageOffset)} disabled={disabled} style={primaryBtn}>
              {loadingList ? "Refreshing..." : "Refresh List"}
            </button>

            <button onClick={newFacility} disabled={disabled} style={secondaryBtn}>
              + New Facility
            </button>

            <button onClick={jumpToFacilitiesBoard} disabled={disabled} style={secondaryBtn}>
              View All Facilities
            </button>

            <label style={{ ...secondaryBtn, display: "inline-flex", alignItems: "center", gap: 8 }}>
              {importingSheet ? (importProgress || "Uploading...") : "Upload Facility CSV"}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                disabled={disabled || importingSheet}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importSpreadsheet(f).catch(() => {});
                  e.currentTarget.value = "";
                }}
              />
            </label>

            <label style={{ ...secondaryBtn, display: "inline-flex", alignItems: "center", gap: 8 }}>
              {importingVacancyChecks ? "Importing..." : "Import Vacancy Checks"}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                disabled={disabled || importingVacancyChecks}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importVacancyChecks(f).catch(() => {});
                  e.currentTarget.value = "";
                }}
              />
            </label>

            <label style={{ ...secondaryBtn, display: "inline-flex", alignItems: "center", gap: 8 }}>
              {importingPhotoManifest ? "Uploading..." : "Upload Photo Manifest"}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                disabled={disabled || importingPhotoManifest}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importPhotoManifest(f).catch(() => {});
                  e.currentTarget.value = "";
                }}
              />
            </label>

            <a
              href="/facility_full_card_scanner_template.csv"
              target="_blank"
              rel="noreferrer"
              style={{ ...secondaryBtn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              Download Full Card Template
            </a>

            <a
              href="/facility_vacancy_checks_template.csv"
              target="_blank"
              rel="noreferrer"
              style={{ ...secondaryBtn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              Download Vacancy Template
            </a>

            <button
              onClick={() => exportAllCsv()}
              disabled={disabled}
              style={{ ...secondaryBtn, background: "#0f766e", color: "#fff", borderColor: "#0f766e" }}
            >
              ⬇ Export All as CSV
            </button>

            <button
              onClick={() => deleteAllFacilities()}
              disabled={disabled}
              style={{ ...secondaryBtn, background: "#991b1b", color: "#fff", borderColor: "#991b1b" }}
            >
              🗑 Delete All Facilities
            </button>

            <button onClick={() => sendWeeklyVacancyCheck()} disabled={disabled} style={secondaryBtn}>
              {sendingWeeklyCheck
                ? "Sending..."
                : selectedId === "NEW"
                  ? "Send Weekly Check to All"
                  : "Send Weekly Check to Selected"}
            </button>

            <button
              onClick={() => handleScanAllVacancies()}
              disabled={disabled || scanningVacancies}
              style={{
                ...secondaryBtn,
                background: scanningVacancies ? "#94a3b8" : "#0f766e",
                color: "white",
                border: "none",
                fontWeight: 700,
              }}
            >
              {scanningVacancies
                ? `Scanning… ${vacancyScanProgress ? `${vacancyScanProgress.done}/${vacancyScanProgress.total}` : ""}`
                : "Scan All Vacancies (AI)"}
            </button>

            <select
              value={gapStateFilter}
              onChange={(e) => { setGapStateFilter(e.target.value); setShowGapPanel(false); setGapCandidates([]); setGapResults([]); }}
              disabled={disabled || bulkGapFilling}
              style={{ ...secondaryBtn, padding: "6px 10px", fontSize: 13 }}
            >
              <option value="">All states</option>
              {["QLD","NSW","VIC","SA","WA","TAS","ACT","NT"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={showGapPanel && gapCandidates.length > 0 ? handleBulkGapFill : handleLoadGapCandidates}
              disabled={disabled || bulkGapFilling}
              style={{
                ...secondaryBtn,
                background: bulkGapFilling ? "#94a3b8" : "#0369a1",
                color: "white",
                border: "none",
                fontWeight: 700,
              }}
            >
              {bulkGapFilling
                ? `Scanning… ${gapCurrentName}`
                : showGapPanel && gapCandidates.length > 0
                ? `▶ Start gap-fill (${gapCandidates.length} facilities)`
                : gapStateFilter ? `Bulk Gap-Fill (${gapStateFilter})` : "Bulk Gap-Fill"}
            </button>
            {bulkGapFilling && (
              <button
                onClick={() => { gapStopRef.current = true; }}
                style={{ ...secondaryBtn, color: "#991b1b", borderColor: "#fecaca" }}
              >
                Stop
              </button>
            )}

            <div style={{ marginLeft: "auto", color: "#64748b", fontSize: 13 }}>
              API: {API_BASE}
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap", color: "#334155", fontSize: 14 }}>
            <div><strong>{totalFacilities}</strong> facilities matched</div>
            <div><strong>{list.length - missingGeoCount}</strong> with geo on this page</div>
            <div><strong>{missingGeoCount}</strong> missing geo on this page</div>
          </div>

          <div style={{ marginTop: 10, color: "#64748b", fontSize: 13 }}>
            Upload order for each region: <strong>1.</strong> facility CSV, <strong>2.</strong> photo manifest, <strong>3.</strong> vacancy checks.
          </div>

          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              border: vacancyActivity.tone === "info" ? "1px solid #bfdbfe" : "1px solid #dbeafe",
              background: vacancyActivity.tone === "info" ? "#eff6ff" : "#f8fbff",
            }}
          >
            <div style={{ fontWeight: 800, color: "#0b3b5b" }}>{vacancyActivity.title}</div>
            <div style={{ marginTop: 4, color: "#475569", fontSize: 13 }}>{vacancyActivity.text}</div>
          </div>

          {error ? <Alert color="#991b1b" bg="#fee2e2" title="Error" text={error} /> : null}
          {notice ? <Alert color="#166534" bg="#dcfce7" title="OK" text={notice} /> : null}

          {/* Gap-fill panel */}
          {showGapPanel && (
            <div style={{ marginTop: 16, border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ background: "#0b3b5b", color: "#fff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>
                  Gap-Fill Queue — {gapCandidates.length} facilities need data
                </span>
                <button
                  onClick={() => { setShowGapPanel(false); setGapCandidates([]); setGapResults([]); }}
                  style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}
                >×</button>
              </div>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#475569" }}>Facility</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#475569" }}>Missing</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#475569" }}>Sources</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#475569" }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gapCandidates.map((c, i) => {
                      const result = gapResults.find((r) => r.id === c.id);
                      const isCurrent = bulkGapFilling && !result && gapCurrentName.includes(c.name);
                      return (
                        <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                          <td style={{ padding: "8px 12px", color: "#0f172a" }}>
                            <button
                              onClick={() => setSelectedId(c.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#0369a1", fontWeight: 600, padding: 0, textAlign: "left" }}
                            >
                              {c.name}
                            </button>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.suburb}, {c.state}</div>
                          </td>
                          <td style={{ padding: "8px 12px", color: "#64748b", fontSize: 12 }}>
                            {c.missingFields.join(", ")}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <div style={{ display: "flex", gap: 4 }}>
                              {c.hasGovUrl && <span style={{ background: "#dbeafe", color: "#1e40af", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>Gov</span>}
                              {c.hasWebsite && <span style={{ background: "#dcfce7", color: "#166534", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>Web</span>}
                              {!c.hasGovUrl && !c.hasWebsite && <span style={{ color: "#94a3b8", fontSize: 11 }}>No URLs</span>}
                            </div>
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            {result?.status === "filled" && <span style={{ color: "#166534", fontWeight: 700 }}>✓ Filled</span>}
                            {result?.status === "unchanged" && <span style={{ color: "#92400e" }}>— No change</span>}
                            {result?.status === "error" && <span style={{ color: "#991b1b", fontSize: 12 }} title={result.error}>✗ Error</span>}
                            {isCurrent && <span style={{ color: "#0369a1" }}>⟳ Scanning…</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {gapResults.length > 0 && (
                <div style={{ padding: "10px 16px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", fontSize: 13, color: "#475569" }}>
                  {gapResults.filter((r) => r.status === "filled").length} filled ·{" "}
                  {gapResults.filter((r) => r.status === "unchanged").length} unchanged ·{" "}
                  {gapResults.filter((r) => r.status === "error").length} errors
                  {!bulkGapFilling && gapResults.length === gapCandidates.length && (
                    <span style={{ marginLeft: 12, color: "#166534", fontWeight: 700 }}>Complete</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vacancy confirmation queue removed — will be rebuilt as part of three-source vacancy model */}

        {showFacilitiesBoard ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              zIndex: 1000,
              padding: 24,
              overflowY: "auto",
            }}
            onClick={() => setShowFacilitiesBoard(false)}
          >
            <div
              id="facility-operations-board"
              style={{
                maxWidth: 1200,
                margin: "0 auto",
                background: "white",
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                padding: 18,
                boxShadow: "0 24px 80px rgba(15, 23, 42, 0.22)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 800, color: "#0b3b5b", fontSize: 22 }}>All Facilities</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  Switch between the operations board and the public small-card gallery.
                </div>
                <button type="button" onClick={() => setShowFacilitiesBoard(false)} style={{ ...secondaryBtn, marginLeft: "auto" }}>
                  Close
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setFacilitiesBoardView("ops")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: facilitiesBoardView === "ops" ? "1px solid #0b3b5b" : "1px solid #cbd5e1",
                    background: facilitiesBoardView === "ops" ? "#0b3b5b" : "white",
                    color: facilitiesBoardView === "ops" ? "white" : "#0b3b5b",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Operations Board
                </button>
                <button
                  type="button"
                  onClick={() => setFacilitiesBoardView("cards")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: facilitiesBoardView === "cards" ? "1px solid #0b3b5b" : "1px solid #cbd5e1",
                    background: facilitiesBoardView === "cards" ? "#0b3b5b" : "white",
                    color: facilitiesBoardView === "cards" ? "white" : "#0b3b5b",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Small Card Gallery
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {stateOptions.map((state) => {
                  const active = stateFilter === state;
                  const count = state === "ALL" ? stateCountsList.reduce((sum, item) => sum + item.count, 0) : stateCounts.get(state) ?? 0;
                  return (
                    <button
                      key={state}
                      type="button"
                      onClick={() => setStateFilter(state)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: active ? "1px solid #0b3b5b" : "1px solid #cbd5e1",
                        background: active ? "#0b3b5b" : "white",
                        color: active ? "white" : "#0b3b5b",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {state} ({count})
                    </button>
                  );
                })}
              </div>

              {facilitiesBoardView === "ops" ? (
                <div
                  style={{
                    marginTop: 14,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 12,
                  }}
                >
                  {filteredList.map((nh) => {
                    const outreachStatus = !nh.canReceiveWeeklyCheck
                      ? "Missing facility email"
                      : nh.lastOutreachSentAt
                        ? nh.lastOutreachReplyAt
                          ? "Weekly check sent and replied"
                          : "Weekly check sent, waiting reply"
                        : "Ready for weekly check";
                    return (
                      <button
                        key={`board-${nh.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedId(nh.id);
                          setShowFacilitiesBoard(false);
                        }}
                        style={{
                          textAlign: "left",
                          padding: 14,
                          borderRadius: 14,
                          border: selectedId === nh.id ? "1px solid #0b3b5b" : "1px solid #e5e7eb",
                          background: selectedId === nh.id ? "#eff6ff" : "white",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{nh.name}</div>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: 999,
                              background: nh.conflictFlag ? "#fee2e2" : "#dcfce7",
                              color: nh.conflictFlag ? "#991b1b" : "#166534",
                              fontSize: 12,
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {nh.conflictFlag ? "Conflict" : "Stable"}
                          </span>
                        </div>
                        <div style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>
                          {[nh.suburb, nh.state, nh.postcode].filter(Boolean).join(", ")}
                        </div>
                        {nh.providerName ? (
                          <div style={{ marginTop: 6, fontSize: 12, color: "#334155" }}>
                            <strong>Provider:</strong> {nh.providerName}
                          </div>
                        ) : null}
                        {nh.oneLineDescription ? (
                          <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>
                            {nh.oneLineDescription}
                          </div>
                        ) : null}
                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <a
                            href={facilityPreviewPath(nh.id)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              ...secondaryBtn,
                              padding: "6px 10px",
                              fontSize: 12,
                              textDecoration: "none",
                            }}
                          >
                            Preview full card
                          </a>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                          <StatusChip
                            tone={nh.canReceiveWeeklyCheck ? "green" : "red"}
                            text={nh.canReceiveWeeklyCheck ? "Email ready" : "No email"}
                          />
                          <StatusChip tone="blue" text={`Website scan: ${nh.websiteSaysVacancies ?? "unknown"}`} />
                          <StatusChip tone="blue" text={`Facility reply: ${nh.facilityConfirmedVacancies ?? "unknown"}`} />
                        </div>
                        <div style={{ marginTop: 10, fontSize: 12, color: "#334155" }}>
                          <div><strong>Website:</strong> {nh.website || "Missing"}</div>
                          <div><strong>Email:</strong> {nh.email || "Missing"}</div>
                          <div><strong>Phone:</strong> {nh.phone || "Missing"}</div>
                          <div><strong>Facility row:</strong> {nh.facilityRowId || "Not linked"}</div>
                          <div><strong>Weekly check:</strong> {outreachStatus}</div>
                          <div><strong>Last sent:</strong> {formatDateTime(nh.lastOutreachSentAt)}</div>
                          <div><strong>Last reply:</strong> {formatDateTime(nh.lastOutreachReplyAt)}</div>
                          <div><strong>Website checked:</strong> {formatDateTime(nh.websiteCheckedAt)}</div>
                          <div><strong>Facility confirmed:</strong> {formatDateTime(nh.facilityConfirmedAt)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <SmallCardGallery
                  items={filteredList}
                  onEdit={(id) => {
                    setSelectedId(id);
                    setShowFacilitiesBoard(false);
                  }}
                />
              )}

              <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => refreshList(Math.max(0, pageOffset - PAGE_SIZE))}
                  disabled={disabled || pageOffset === 0}
                  style={secondaryBtn}
                >
                  Previous 10
                </button>
                <button
                  type="button"
                  onClick={() => refreshList(pageOffset + PAGE_SIZE)}
                  disabled={disabled || pageOffset + PAGE_SIZE >= totalFacilities}
                  style={secondaryBtn}
                >
                  Next 10
                </button>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  Showing {totalFacilities === 0 ? 0 : pageOffset + 1} to {Math.min(pageOffset + list.length, totalFacilities)} of {totalFacilities}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div style={gridWrap}>
          {/* LEFT */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 800, marginBottom: 10, color: "#0b3b5b" }}>
              Facilities ({filteredList.length})
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, facility, state or postcode"
                disabled={disabled}
                style={inputStyle}
              />
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                disabled={disabled}
                style={inputStyle}
              >
                {stateOptions.map((state) => (
                  <option key={state} value={state}>
                    {state === "ALL" ? "All states" : state}
                  </option>
                ))}
              </select>
              <button type="button" onClick={newFacility} disabled={disabled} style={secondaryBtn}>
                + Create new
              </button>
            </div>

            <div style={{ marginTop: 12, maxHeight: 420, overflow: "auto", display: "grid", gap: 8 }}>
              {filteredList.map((nh) => {
                const isActive = selectedId !== "NEW" && selectedId === nh.id;
                const hasGeo = nh.latitude != null && nh.longitude != null;
                return (
                  <button
                    key={nh.id}
                    type="button"
                    onClick={() => setSelectedId(nh.id)}
                    disabled={disabled}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderRadius: 10,
                      border: isActive ? "1px solid #0b3b5b" : "1px solid #e5e7eb",
                      background: isActive ? "#eff6ff" : "white",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>{nh.name}</div>
                    <div style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>
                      {[nh.suburb, nh.state, nh.postcode].filter(Boolean).join(", ")}
                    </div>
                    <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: hasGeo ? "#dcfce7" : "#fee2e2",
                          color: hasGeo ? "#166534" : "#991b1b",
                          fontWeight: 700,
                        }}
                      >
                        {hasGeo ? "Geo ready" : "Missing geo"}
                      </span>
                      {hasGeo ? (
                        <span style={{ color: "#334155" }}>
                          {Number(nh.latitude).toFixed(4)}, {Number(nh.longitude).toFixed(4)}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => refreshList(Math.max(0, pageOffset - PAGE_SIZE))}
                disabled={disabled || pageOffset === 0}
                style={secondaryBtn}
              >
                Previous 10
              </button>
              <button
                type="button"
                onClick={() => refreshList(pageOffset + PAGE_SIZE)}
                disabled={disabled || pageOffset + PAGE_SIZE >= totalFacilities}
                style={secondaryBtn}
              >
                Next 10
              </button>
              <div style={{ color: "#64748b", fontSize: 13 }}>
                Showing {totalFacilities === 0 ? 0 : pageOffset + 1} to {Math.min(pageOffset + list.length, totalFacilities)} of {totalFacilities}
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: "#64748b" }}>
              Pick a facility from the list, review the geo and details, then edit on the right and hit <b>Save</b>.
            </div>
          </div>

          {/* RIGHT */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 800, color: "#0b3b5b" }}>
                {currentId == null ? "Create Facility" : `Edit Facility (ID ${currentId})`}
              </div>
              {loadingOne ? <span style={{ color: "#64748b" }}>Loading…</span> : null}
            </div>

            {currentId != null ? (
              <div style={{ marginTop: 10, marginBottom: 2, display: "flex", justifyContent: "flex-end" }}>
                <a
                  href={facilityPreviewPath(currentId)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...secondaryBtn,
                    textDecoration: "none",
                  }}
                >
                  Preview Full Card
                </a>
              </div>
            ) : null}

            <SectionTitle text="Core Facility Details" />
            <Grid2>
              <Field
                label="Name *"
                value={form.name}
                onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                disabled={disabled}
              />
              <Field
                label="Status"
                value={form.status}
                onChange={(v) =>
                  setForm((p) => ({ ...p, status: v === "INACTIVE" ? "INACTIVE" : "ACTIVE" }))
                }
                disabled={disabled}
                asSelect
                options={[
                  { value: "ACTIVE", label: "ACTIVE" },
                  { value: "INACTIVE", label: "INACTIVE" },
                ]}
              />
              <Field
                label="One-line description"
                value={form.oneLineDescription}
                onChange={(v) => setForm((p) => ({ ...p, oneLineDescription: v }))}
                disabled={disabled}
              />
              <Field
                label="Address"
                value={form.addressLine1}
                onChange={(v) => setForm((p) => ({ ...p, addressLine1: v }))}
                disabled={disabled}
              />
              <div>
                <Field
                  label="Website"
                  value={form.website}
                  onChange={(v) => setForm((p) => ({ ...p, website: v }))}
                  disabled={disabled}
                />
                {form.website.trim() && (
                  <a href={form.website.trim()} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#0369a1", textDecoration: "none", marginTop: 4, display: "inline-block" }}>Open ↗</a>
                )}
              </div>
              <div>
                <Field
                  label="Government listing"
                  value={form.governmentListingUrl}
                  onChange={(v) => setForm((p) => ({ ...p, governmentListingUrl: v }))}
                  disabled={disabled}
                />
                {form.governmentListingUrl.trim() && (
                  <a href={form.governmentListingUrl.trim()} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#0369a1", textDecoration: "none", marginTop: 4, display: "inline-block" }}>Open ↗</a>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "flex-end" }}>
                {form.website.trim() && (
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={scanning || disabled}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: scanning ? "#94a3b8" : "#0f766e",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: scanning ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {scanning ? "Scanning…" : "AI Scan Website"}
                  </button>
                )}
                {currentId != null && (
                  <button
                    type="button"
                    onClick={handleGapFill}
                    disabled={gapFilling || disabled}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: gapFilling ? "#94a3b8" : "#0369a1",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: gapFilling ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {gapFilling ? "Filling…" : "Fill Gaps (Gov)"}
                  </button>
                )}
                {scanMessage && (
                  <p style={{
                    margin: 0,
                    fontSize: 12,
                    color: scanMessage?.startsWith("Scan failed") || scanMessage?.startsWith("Gap-fill failed") ? "#dc2626" : "#0f766e",
                    fontWeight: 600,
                  }}>
                    {scanMessage}
                  </p>
                )}
              </div>
              <Field
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                disabled={disabled}
              />
              <Field
                label="Email"
                value={form.email}
                onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                disabled={disabled}
              />
              <Field
                label="Facebook URL"
                value={form.facebookUrl}
                onChange={(v) => setForm((p) => ({ ...p, facebookUrl: v }))}
                disabled={disabled}
                placeholder="https://www.facebook.com/facilityname"
              />
              <Field
                label="Instagram URL"
                value={form.instagramUrl}
                onChange={(v) => setForm((p) => ({ ...p, instagramUrl: v }))}
                disabled={disabled}
                placeholder="https://www.instagram.com/facilityname"
              />
              <Field
                label="Suburb *"
                value={form.suburb}
                onChange={(v) => setForm((p) => ({ ...p, suburb: v }))}
                disabled={disabled}
              />
              <Field
                label="State *"
                value={form.state}
                onChange={(v) => setForm((p) => ({ ...p, state: v }))}
                disabled={disabled}
              />
              <Field
                label="Postcode *"
                value={form.postcode}
                onChange={(v) => setForm((p) => ({ ...p, postcode: v }))}
                disabled={disabled}
              />
              <Field
                label="Latitude"
                value={form.latitude}
                onChange={(v) => setForm((p) => ({ ...p, latitude: v }))}
                disabled={disabled}
              />
              <Field
                label="Longitude"
                value={form.longitude}
                onChange={(v) => setForm((p) => ({ ...p, longitude: v }))}
                disabled={disabled}
              />
              <div />

              <Field
                label="Primary Photo URL"
                value={form.primaryImageUrl}
                onChange={(v) => setForm((p) => ({ ...p, primaryImageUrl: v }))}
                disabled={disabled}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button
                  type="button"
                  onClick={handleScanPhotos}
                  disabled={photoScanning || disabled || !form.website.trim()}
                  style={{ ...secondaryBtn, background: "#0b3b5b", color: "#fff", borderColor: "#0b3b5b" }}
                >
                  {photoScanning ? "Scanning for photos…" : "📷 Scan website for photos"}
                </button>
                {photoScanMsg && (
                  <span style={{ fontSize: 13, color: photoScanMsg.includes("failed") || photoScanMsg.includes("No photos") ? "#991b1b" : "#166534" }}>
                    {photoScanMsg}
                  </span>
                )}
              </div>

              <label style={{ display: "block" }}>
                <div style={labelStyle}>Upload Primary Photo</div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={disabled}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadPrimaryPhoto(f).catch(() => {});
                    e.currentTarget.value = "";
                  }}
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                  {uploadingPrimary ? "Uploading..." : "Select JPG/PNG/WebP"}
                </div>
              </label>
            </Grid2>

            {form.primaryImageUrl ? (
              <div style={{ marginTop: 12, maxWidth: 320 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <div style={labelStyle}>Primary Photo Preview</div>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, primaryImageUrl: "" }))}
                    style={secondaryBtn}
                    disabled={disabled}
                  >
                    Clear primary photo
                  </button>
                </div>
                <img
                  src={form.primaryImageUrl}
                  alt="Primary"
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    maxHeight: 220,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            ) : null}

            {currentId != null && currentMeta ? (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #dbeafe",
                  background: "#f8fbff",
                }}
              >
                <div style={{ fontWeight: 800, color: "#0b3b5b", marginBottom: 10 }}>
                  Vacancy Status Snapshot
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 10,
                    fontSize: 13,
                    color: "#334155",
                  }}
                >
                  <MetaLine label="Website says vacancies" value={currentMeta.websiteSaysVacancies ?? "unknown"} />
                  <MetaLine
                    label="Facility confirmed"
                    value={currentMeta.facilityConfirmedVacancies ?? "unknown"}
                  />
                  <MetaLine
                    label="Last website check"
                    value={formatDateTime(currentMeta.websiteCheckedAt)}
                  />
                  <MetaLine
                    label="Last facility confirmation"
                    value={formatDateTime(currentMeta.facilityConfirmedAt)}
                  />
                  <MetaLine
                    label="Website source"
                    value={currentMeta.websiteSourceUrl ?? "Not yet recorded"}
                  />
                  <MetaLine
                    label="Confirmation source"
                    value={currentMeta.facilityConfirmationSource ?? "Not yet recorded"}
                  />
                  <MetaLine
                    label="Last profile scan"
                    value={formatDateTime(currentMeta.lastProfileScanAt)}
                  />
                  <MetaLine label="Facility record updated" value={formatDateTime(currentMeta.updatedAt)} />
                </div>
                <div style={{ marginTop: 10, fontSize: 12 }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: currentMeta.conflictFlag ? "#fee2e2" : "#dcfce7",
                      color: currentMeta.conflictFlag ? "#991b1b" : "#166534",
                      fontWeight: 800,
                    }}
                  >
                    {currentMeta.conflictFlag ? "Conflict between website and facility reply" : "No conflict flagged"}
                  </span>
                </div>
              </div>
            ) : null}

            {false ? (<>
            <SectionTitle text="Website Scan Tools" />
            <Grid2>
              <Field
                label="Address"
                value={form.addressLine1}
                onChange={(v) => setForm((p) => ({ ...p, addressLine1: v }))}
                disabled={disabled}
              />
              <Field
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                disabled={disabled}
              />
              <div>
                <Field
                  label="Website"
                  value={form.website}
                  onChange={(v) => setForm((p) => ({ ...p, website: v }))}
                  disabled={disabled}
                />
                {form.website.trim() && (
                  <a href={form.website.trim()} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#0369a1", textDecoration: "none", marginTop: 4, display: "inline-block" }}>Open ↗</a>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "flex-end" }}>
                {form.website.trim() && (
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={scanning || disabled}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: scanning ? "#94a3b8" : "#0f766e",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: scanning ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {scanning ? "Scanning…" : "AI Scan Website"}
                  </button>
                )}
                {currentId != null && (
                  <button
                    type="button"
                    onClick={handleGapFill}
                    disabled={gapFilling || disabled}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: gapFilling ? "#94a3b8" : "#0369a1",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: gapFilling ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {gapFilling ? "Filling…" : "Fill Gaps (Gov)"}
                  </button>
                )}
                {scanMessage && (
                  <p style={{
                    margin: 0,
                    fontSize: 12,
                    color: scanMessage?.startsWith("Scan failed") || scanMessage?.startsWith("Gap-fill failed") ? "#dc2626" : "#0f766e",
                    fontWeight: 600,
                  }}>
                    {scanMessage}
                  </p>
                )}
              </div>
            </Grid2>

            </>) : null}
            <SectionTitle text="Vacancies Section" />
            <Grid2>
              <SelectInput
                label="Website says vacancies"
                value={form.websiteSaysVacancies}
                onChange={(v) => setForm((p) => ({ ...p, websiteSaysVacancies: v }))}
                disabled={disabled}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "unknown", label: "Unknown" },
                ]}
              />
              <SelectInput
                label="Facility confirmed vacancies"
                value={form.facilityConfirmedVacancies}
                onChange={(v) => setForm((p) => ({ ...p, facilityConfirmedVacancies: v }))}
                disabled={disabled}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "unknown", label: "Unknown" },
                ]}
              />
              <Field
                label="Website checked at (ISO)"
                value={form.websiteCheckedAt}
                onChange={(v) => setForm((p) => ({ ...p, websiteCheckedAt: v }))}
                disabled={disabled}
              />
              <Field
                label="Facility confirmed at (ISO)"
                value={form.facilityConfirmedAt}
                onChange={(v) => setForm((p) => ({ ...p, facilityConfirmedAt: v }))}
                disabled={disabled}
              />
              <label style={{ display: "block" }}>
                <div style={labelStyle}>Conflict flag</div>
                <select
                  value={form.conflictFlag ? "true" : "false"}
                  onChange={(e) => setForm((p) => ({ ...p, conflictFlag: e.target.value === "true" }))}
                  disabled={disabled}
                  style={inputStyle}
                >
                  <option value="false">No conflict</option>
                  <option value="true">Conflict flagged</option>
                </select>
              </label>
              <div />
            </Grid2>

            <div style={{ marginTop: 12 }}>
              <TextArea
                label="Gallery Image URLs (one per line)"
                value={form.galleryImageUrlsText}
                onChange={(v) => setForm((p) => ({ ...p, galleryImageUrlsText: v }))}
                disabled={disabled}
                rows={5}
              />

              <div style={{ marginTop: 10 }}>
                <label style={{ display: "block" }}>
                  <div style={labelStyle}>Upload Gallery Photos (adds URLs above)</div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    disabled={disabled}
                    onChange={(e) => {
                      uploadGalleryPhotos(e.target.files).catch(() => {});
                      e.currentTarget.value = "";
                    }}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                    {uploadingGallery ? "Uploading..." : "Select multiple JPG/PNG/WebP"}
                  </div>
                </label>
              </div>

              {galleryUrls.length ? (
                <div style={{ marginTop: 12 }}>
                  <div style={labelStyle}>Gallery Preview</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {galleryUrls.map((u, idx) => (
                      <div key={`${u}-${idx}`} style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                        <img
                          src={u}
                          alt={`Gallery ${idx + 1}`}
                          style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                          onError={(e) => {
                            // hide broken images
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div style={{ padding: 8, display: "grid", gap: 8 }}>
                          <div style={{ fontSize: 11, color: "#64748b", wordBreak: "break-all" }}>{u}</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => setForm((p) => ({ ...p, primaryImageUrl: u }))}
                              style={secondaryBtn}
                              disabled={disabled}
                            >
                              Set as primary
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGalleryUrl(u)}
                              style={{ ...secondaryBtn, color: "#991b1b", borderColor: "#fecaca", background: "#fff7f7" }}
                              disabled={disabled}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 12 }}>
              <TextArea
                label="Long Description"
                value={form.description}
                onChange={(v) => setForm((p) => ({ ...p, description: v }))}
                disabled={disabled}
                rows={7}
              />
            </div>

            <SectionTitle text="Tags + Languages (one per line)" />
            <Grid2>
              <TextArea
                label="Feature Tags"
                value={form.featureTagsText}
                onChange={(v) => setForm((p) => ({ ...p, featureTagsText: v }))}
                disabled={disabled}
                rows={6}
              />
              <TextArea
                label="Other Tags"
                value={form.otherTagsText}
                onChange={(v) => setForm((p) => ({ ...p, otherTagsText: v }))}
                disabled={disabled}
                rows={6}
              />
            </Grid2>

            <div style={{ marginTop: 12 }}>
              <TextArea
                label="Languages"
                value={form.languagesText}
                onChange={(v) => setForm((p) => ({ ...p, languagesText: v }))}
                disabled={disabled}
                rows={5}
              />
            </div>

            <SectionTitle text="Room Options (RAD table)" />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={disabled || roomScanning}
                onClick={handleScanRooms}
                style={{ ...secondaryBtn, background: "#0b3b5b", color: "#fff", borderColor: "#0b3b5b" }}
              >
                {roomScanning ? "Scanning MyAgedCare…" : "🔍 Scan rooms from MyAgedCare"}
              </button>
              {form.governmentListingUrl.trim() && (
                <a href={form.governmentListingUrl.trim()} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#0369a1", textDecoration: "none", whiteSpace: "nowrap" }}>Open gov page ↗</a>
              )}
              {roomScanMsg && (
                <span style={{ fontSize: 13, color: roomScanMsg.includes("failed") || roomScanMsg.includes("No room") ? "#991b1b" : "#166534" }}>
                  {roomScanMsg}
                </span>
              )}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
                <thead>
                  <tr>
                    <th style={th}>Type</th>
                    <th style={th}>Room name</th>
                    <th style={th}>Bathroom</th>
                    <th style={th}>Size m²</th>
                    <th style={th}>RAD min</th>
                    <th style={th}>DAP $/day</th>
                    <th style={th}>Availability note</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.roomOptions.map((r, idx) => (
                    <tr key={idx}>
                      <td style={td}>
                        <input
                          value={r.roomType}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((p) => {
                              const next = [...p.roomOptions];
                              next[idx] = { ...next[idx], roomType: v };
                              return { ...p, roomOptions: next };
                            });
                          }}
                          disabled={disabled}
                          style={miniInput}
                          placeholder="Single / Shared"
                        />
                      </td>
                      <td style={td}>
                        <input
                          value={r.roomName}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((p) => {
                              const next = [...p.roomOptions];
                              next[idx] = { ...next[idx], roomName: v };
                              return { ...p, roomOptions: next };
                            });
                          }}
                          disabled={disabled}
                          style={{ ...miniInput, minWidth: 160 }}
                          placeholder="e.g. Boronia Wing"
                        />
                      </td>
                      <td style={td}>
                        <input
                          value={r.bathroomType}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((p) => {
                              const next = [...p.roomOptions];
                              next[idx] = { ...next[idx], bathroomType: v };
                              return { ...p, roomOptions: next };
                            });
                          }}
                          disabled={disabled}
                          style={miniInput}
                        />
                      </td>
                      <td style={td}>
                        <input
                          value={r.sizeM2}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((p) => {
                              const next = [...p.roomOptions];
                              next[idx] = { ...next[idx], sizeM2: v };
                              return { ...p, roomOptions: next };
                            });
                          }}
                          disabled={disabled}
                          inputMode="decimal"
                          style={miniInput}
                        />
                      </td>
                      <td style={td}>
                        <input
                          value={r.radMin}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((p) => {
                              const next = [...p.roomOptions];
                              next[idx] = { ...next[idx], radMin: v };
                              return { ...p, roomOptions: next };
                            });
                          }}
                          disabled={disabled}
                          inputMode="numeric"
                          style={miniInput}
                        />
                      </td>
                      <td style={td}>
                        <input
                          value={r.dapAmount}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((p) => {
                              const next = [...p.roomOptions];
                              next[idx] = { ...next[idx], dapAmount: v };
                              return { ...p, roomOptions: next };
                            });
                          }}
                          disabled={disabled}
                          inputMode="decimal"
                          style={miniInput}
                        />
                      </td>
                      <td style={td}>
                        <input
                          value={r.availabilityNote}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((p) => {
                              const next = [...p.roomOptions];
                              next[idx] = { ...next[idx], availabilityNote: v };
                              return { ...p, roomOptions: next };
                            });
                          }}
                          disabled={disabled}
                          style={miniInput}
                        />
                      </td>
                      <td style={td}>
                        <button
                          type="button"
                          disabled={disabled || form.roomOptions.length <= 4}
                          onClick={() => {
                            setForm((p) => ({
                              ...p,
                              roomOptions: p.roomOptions.filter((_, i) => i !== idx),
                            }));
                          }}
                          style={dangerBtn}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    roomOptions: [
                      ...p.roomOptions,
                      emptyRoomOptionRow(),
                    ],
                  }))
                }
                style={secondaryBtn}
              >
                + Add room row
              </button>
            </div>

            <SectionTitle text="Live Public Card Preview" />
            <div style={{ marginTop: 10 }}>
              <PreviewFacilityCard form={form} currentId={currentId} />
            </div>

            <SectionTitle text="Admin-only (not shown to families)" />
            <Grid2>
              <Field
                label="Active Vacancies (number)"
                value={form.activeVacancies}
                onChange={(v) => setForm((p) => ({ ...p, activeVacancies: v }))}
                disabled={disabled}
              />
              <Field
                label="Verified At (ISO, optional)"
                value={form.verifiedAt}
                onChange={(v) => setForm((p) => ({ ...p, verifiedAt: v }))}
                disabled={disabled}
              />
              <Field
                label="Scan source URL"
                value={form.websiteSourceUrl}
                onChange={(v) => setForm((p) => ({ ...p, websiteSourceUrl: v }))}
                disabled={disabled}
              />
              <Field
                label="Facility confirmation source"
                value={form.facilityConfirmationSource}
                onChange={(v) => setForm((p) => ({ ...p, facilityConfirmationSource: v }))}
                disabled={disabled}
              />
            </Grid2>

            <div style={{ marginTop: 12 }}>
              <TextArea
                label="Internal Notes"
                value={form.internalNotes}
                onChange={(v) => setForm((p) => ({ ...p, internalNotes: v }))}
                disabled={disabled}
                rows={5}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <button
                onClick={() => save()}
                disabled={
                  disabled ||
                  !form.name.trim() ||
                  !form.suburb.trim() ||
                  !form.state.trim() ||
                  !form.postcode.trim()
                }
                style={saveBtn(
                  disabled ||
                    !form.name.trim() ||
                    !form.suburb.trim() ||
                    !form.state.trim() ||
                    !form.postcode.trim()
                )}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button onClick={() => refreshList(pageOffset)} disabled={disabled} style={secondaryBtn}>
                Refresh
              </button>

              {currentId != null ? (
                <button
                  onClick={() => removeFacility()}
                  disabled={disabled}
                  style={dangerBtn}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              ) : null}
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              Uses: <code>/api/admin/nursing-homes</code> and <code>/api/admin/uploads</code> with{" "}
              <code>X-Admin-Token</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- small components ---------- */

function SectionTitle({ text }: { text: string }) {
  return (
    <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 800, color: "#0b3b5b" }}>
      {text}
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>{label}</div>
      <div style={{ color: "#475569", wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

function StatusChip({ tone, text }: { tone: "green" | "red" | "blue"; text: string }) {
  const styles =
    tone === "green"
      ? { background: "#dcfce7", color: "#166534" }
      : tone === "red"
        ? { background: "#fee2e2", color: "#991b1b" }
        : { background: "#dbeafe", color: "#1d4ed8" };

  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        ...styles,
      }}
    >
      {text}
    </span>
  );
}

function PreviewFacilityCard({ form, currentId }: { form: UpsertForm; currentId: number | null }) {
  const previewTags = [
    ...linesToList(form.featureTagsText),
    ...linesToList(form.otherTagsText),
    ...linesToList(form.languagesText),
  ]
    .filter((tag, index, list) => list.indexOf(tag) === index)
    .slice(0, 6);

  const previewRooms = form.roomOptions
    .filter((room) => room.roomType.trim() || room.radMin.trim() || room.radMax.trim() || room.availabilityNote.trim())
    .slice(0, 3);

  const location = [form.suburb.trim(), form.state.trim(), form.postcode.trim()].filter(Boolean).join(", ");
  const vacancyLabel =
    form.websiteSaysVacancies === "yes"
      ? "Vacancy available"
      : form.websiteSaysVacancies === "no"
        ? "Currently full"
        : "Availability updating";
  const vacancyTone =
    form.websiteSaysVacancies === "yes"
      ? { background: "#dcfce7", color: "#166534" }
      : form.websiteSaysVacancies === "no"
        ? { background: "#fee2e2", color: "#991b1b" }
        : { background: "#dbeafe", color: "#1d4ed8" };

  return (
    <div
      style={{
        border: "1px solid #dbe3ed",
        borderRadius: 18,
        overflow: "hidden",
        background: "white",
        boxShadow: "0 18px 36px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div style={{ position: "relative", height: 240, background: "#dbeafe" }}>
        {form.primaryImageUrl.trim() ? (
          <img
            src={form.primaryImageUrl.trim()}
            alt={form.name.trim() || "Facility preview"}
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
              style={{
                width: 86,
                height: 86,
                objectFit: "contain",
                borderRadius: 12,
                background: "rgba(255,255,255,0.92)",
                padding: 10,
              }}
            />
          </div>
        )}

        {location ? (
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 14,
              background: "rgba(8,15,28,0.74)",
              color: "white",
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {location}
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            right: 14,
            top: 14,
            borderRadius: 999,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 800,
            ...vacancyTone,
          }}
        >
          {vacancyLabel}
        </div>
      </div>

      <div style={{ padding: 18, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 4 }}>
          {form.status ? (
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", fontWeight: 800 }}>
              {form.status}
            </div>
          ) : null}
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: 26, lineHeight: 1.18, color: "#0b3b5b" }}>
            {form.name.trim() || "Facility name preview"}
          </h3>
          {form.website.trim() ? (
            <div style={{ fontSize: 13, color: "#475569", wordBreak: "break-word" }}>{form.website.trim()}</div>
          ) : null}
        </div>

        <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.7 }}>
          {(form.oneLineDescription.trim() ||
            "This is the live public card preview. As you fill out the nursing home details, this updates automatically.").slice(0, 220)}
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#526072", fontSize: 13, fontWeight: 700 }}>
          {form.activeVacancies.trim() ? <span>{form.activeVacancies.trim()} vacancies</span> : null}
          {location ? <span>{location}</span> : null}
        </div>

        {previewTags.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {previewTags.map((tag) => (
              <span
                key={tag}
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
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {(form.phone.trim() || form.email.trim() || form.website.trim() || currentId != null) ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {form.phone.trim() ? (
              <a href={`tel:${form.phone.trim()}`} style={previewActionPill}>
                Call
              </a>
            ) : null}
            {form.email.trim() ? (
              <a href={`mailto:${form.email.trim()}`} style={previewActionPill}>
                Email
              </a>
            ) : null}
            {form.website.trim() ? (
              <a href={form.website.trim()} target="_blank" rel="noreferrer" style={previewActionPill}>
                Website
              </a>
            ) : null}
            {currentId != null ? (
              <a href={facilityPreviewPath(currentId)} target="_blank" rel="noreferrer" style={previewActionPillStrong}>
                Open full preview
              </a>
            ) : null}
          </div>
        ) : null}

        {previewRooms.length ? (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              background: "#f8fafc",
              padding: 14,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 800, color: "#0b3b5b" }}>Room snapshot</div>
            {previewRooms.map((room, index) => {
              const price = [room.radMin.trim(), room.radMax.trim()].filter(Boolean).join(" - ");
              return (
                <div key={`${room.roomType}-${index}`} style={{ fontSize: 13, color: "#334155" }}>
                  <div style={{ fontWeight: 700 }}>{room.roomType.trim() || `Room option ${index + 1}`}</div>
                  <div>
                    {[room.bathroomType.trim(), price ? `RAD ${price}` : "", room.availabilityNote.trim()]
                      .filter(Boolean)
                      .join(" · ") || "Room details to be added"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SmallCardGallery({
  items,
  onEdit,
}: {
  items: NursingHomeListItem[];
  onEdit: (id: number) => void;
}) {
  return (
    <div
      style={{
        marginTop: 14,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
      }}
    >
      {items.map((nh) => {
        const locationText = [nh.suburb, nh.state, nh.postcode].filter(Boolean).join(", ");
        const vacancyLabel =
          nh.websiteSaysVacancies === "yes"
            ? "Vacancy available"
            : nh.websiteSaysVacancies === "no"
              ? "Currently full"
              : "Availability updating";
        const vacancyTone =
          nh.websiteSaysVacancies === "yes"
            ? { background: "#dcfce7", color: "#166534" }
            : nh.websiteSaysVacancies === "no"
              ? { background: "#fee2e2", color: "#991b1b" }
              : { background: "#dbeafe", color: "#1d4ed8" };

        return (
          <article
            key={`gallery-${nh.id}`}
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
                  alt={nh.name ?? "Facility"}
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
                    style={{
                      width: 78,
                      height: 78,
                      objectFit: "contain",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.9)",
                      padding: 10,
                    }}
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

              <div
                style={{
                  position: "absolute",
                  right: 12,
                  top: 12,
                  borderRadius: 999,
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  boxShadow: "0 10px 18px rgba(0,0,0,0.08)",
                  ...vacancyTone,
                }}
              >
                {vacancyLabel}
              </div>
            </div>

            <div style={{ padding: 16, display: "grid", gap: 10, flex: "1 1 auto" }}>
              <div style={{ display: "grid", gap: 4 }}>
                {nh.providerName ? (
                  <div
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#64748b",
                      fontWeight: 800,
                    }}
                  >
                    {nh.providerName}
                  </div>
                ) : null}
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: 22, lineHeight: 1.18, color: "#0b3b5b" }}>
                  {nh.name ?? "Unnamed facility"}
                </h3>
              </div>

              <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
                {(nh.oneLineDescription || "Previewing the customer-facing small facility card.").slice(0, 140)}
              </p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {nh.phone ? <a href={`tel:${nh.phone}`} style={previewActionPill}>Call</a> : null}
                {nh.email ? <a href={`mailto:${nh.email}`} style={previewActionPill}>Email</a> : null}
                {nh.website ? (
                  <a href={nh.website} target="_blank" rel="noreferrer" style={previewActionPill}>
                    Website
                  </a>
                ) : null}
              </div>
            </div>

            <div style={{ padding: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => onEdit(nh.id)} style={secondaryBtn}>
                Edit facility
              </button>
              <a href={facilityPreviewPath(nh.id)} target="_blank" rel="noreferrer" style={previewActionPillStrong}>
                Open full preview
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Grid2({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Alert(props: { color: string; bg: string; title: string; text: string }) {
  return (
    <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: props.bg }}>
      <strong style={{ color: props.color }}>{props.title}:</strong>{" "}
      <span style={{ color: props.color }}>{props.text}</span>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  asSelect?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  const { label, value, onChange, disabled, asSelect, options, placeholder } = props;

  return (
    <label style={{ display: "block" }}>
      <div style={labelStyle}>{label}</div>
      {asSelect ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={inputStyle}>
          {(options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={inputStyle} placeholder={placeholder} />
      )}
    </label>
  );
}

function SelectInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={labelStyle}>{props.label}</div>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
        style={inputStyle}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  rows?: number;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={labelStyle}>{props.label}</div>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
        rows={props.rows ?? 6}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #cbd5e1",
          fontSize: 14,
          resize: "vertical",
        }}
      />
    </label>
  );
}

/* ---------- styles ---------- */

const topCard: CSSProperties = {
  marginTop: 14,
  padding: 14,
  background: "white",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
};

const gridWrap: CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "340px 1fr",
  gap: 14,
};

const cardStyle: CSSProperties = {
  padding: 14,
  background: "white",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#334155",
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14,
};

const miniInput: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 13,
};

const primaryBtn: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #0b3b5b",
  background: "#0b3b5b",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryBtn: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#0b3b5b",
  cursor: "pointer",
  fontWeight: 700,
};

const previewActionPill: CSSProperties = {
  padding: "8px 11px",
  borderRadius: 999,
  border: "1px solid #d7e0ea",
  background: "#f8fbfd",
  color: "#0b3b5b",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 12,
};

const previewActionPillStrong: CSSProperties = {
  ...previewActionPill,
  background: "#0b3b5b",
  border: "1px solid #0b3b5b",
  color: "white",
};

const dangerBtn: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #fecaca",
  background: "#fee2e2",
  color: "#991b1b",
  cursor: "pointer",
  fontWeight: 800,
};

const saveBtn = (disabled: boolean): CSSProperties => ({
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #0D9488",
  background: "#0D9488",
  color: "white",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 800,
  opacity: disabled ? 0.6 : 1,
});

const th: CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  color: "#334155",
  padding: "8px 6px",
  borderBottom: "1px solid #e5e7eb",
};

const td: CSSProperties = {
  padding: "8px 6px",
  borderBottom: "1px solid #f1f5f9",
};
