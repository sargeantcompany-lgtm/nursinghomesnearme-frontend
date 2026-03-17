// src/components/AdminNursingHomes.tsx
import { useEffect, useMemo, useState } from "react";
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

type RoomOption = {
  roomType?: string | null;
  bathroomType?: string | null;
  radMin?: number | null;
  radMax?: number | null;
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
  bathroomType: string;
  radMin: string; // keep as string for input, convert on save
  radMax: string;
  availabilityNote: string;
};

function emptyRoomOptionRow(): RoomOptionRow {
  return { roomType: "", bathroomType: "", radMin: "", radMax: "", availabilityNote: "" };
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
  websiteSaysVacancies: string;
  facilityConfirmedVacancies: string;
  websiteCheckedAt: string;
  websiteSourceUrl: string;
  facilityConfirmedAt: string;
  facilityConfirmationSource: string;
  conflictFlag: boolean;

  // admin-only
  email: string;
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

function toRoomRows(list?: RoomOption[] | null): RoomOptionRow[] {
  const src = list ?? [];
  if (!src.length) return ensureMinimumRoomRows([]);

  return ensureMinimumRoomRows(src.map((r) => ({
    roomType: (r.roomType ?? "") as string,
    bathroomType: (r.bathroomType ?? "") as string,
    radMin: r.radMin == null ? "" : String(r.radMin),
    radMax: r.radMax == null ? "" : String(r.radMax),
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
  bathroomType?: string;
  radMin?: number;
  radMax?: number;
  availabilityNote?: string;
}> {
  return rows
    .map((r) => {
      const roomType = r.roomType.trim();
      const bathroomType = r.bathroomType.trim();
      const availabilityNote = r.availabilityNote.trim();

      const radMin = parseOptionalNumber(r.radMin);
      const radMax = parseOptionalNumber(r.radMax);

      const hasAny =
        roomType ||
        bathroomType ||
        availabilityNote ||
        radMin !== undefined ||
        radMax !== undefined;

      if (!hasAny) return null;

      return {
        roomType,
        bathroomType,
        radMin,
        radMax,
        availabilityNote,
      };
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
    websiteSaysVacancies: "unknown",
    facilityConfirmedVacancies: "unknown",
    websiteCheckedAt: "",
    websiteSourceUrl: "",
    facilityConfirmedAt: "",
    facilityConfirmationSource: "",
    conflictFlag: false,

    email: "",
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
  const [token, setToken] = useState<string>(() => {
    const saved = localStorage.getItem("nhnm_admin_token");
    return saved ?? (TOKEN_ENV ?? "");
  });

  const [list, setList] = useState<NursingHomeListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | "NEW">("NEW");

  const [loadingList, setLoadingList] = useState(false);
  const [loadingOne, setLoadingOne] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [importingSheet, setImportingSheet] = useState(false);
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
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanningVacancies, setScanningVacancies] = useState(false);
  const [vacancyScanProgress, setVacancyScanProgress] = useState<{ done: number; total: number } | null>(null);
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
  const stateOptions = useMemo(() => {
    const states = Array.from(new Set(list.map((nh) => (nh.state ?? "").trim()).filter(Boolean))).sort();
    return ["ALL", ...states];
  }, [list]);
  const stateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of list) {
      const key = (item.state ?? "").trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [list]);
  const filteredList = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const inState = stateFilter === "ALL"
      ? sortedList
      : sortedList.filter((nh) => (nh.state ?? "").trim().toUpperCase() === stateFilter.toUpperCase());
    if (!needle) return inState;
    return inState.filter((nh) =>
      [nh.name, nh.suburb ?? "", nh.state ?? "", nh.postcode ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [search, sortedList, stateFilter]);
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

  async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

    if (init?.body && !isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (token.trim()) headers.set("X-Admin-Token", token.trim());

    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return {} as T;
    return (await res.json()) as T;
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
      setScanMessage("Scan complete — review fields below before saving.");
    } catch (e: unknown) {
      setScanMessage(`Scan failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setScanning(false);
    }
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
      body: JSON.stringify({ facilityConfirmedVacancies: confirmed, facilityConfirmedAt: new Date().toISOString() }),
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

  async function refreshList() {
    setError("");
    setNotice("");
    setLoadingList(true);
    try {
      const data = await apiFetch<NursingHomeListItem[]>("/api/admin/nursing-homes");
      setList(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingList(false);
    }
  }

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
        websiteSaysVacancies: (nh.websiteSaysVacancies ?? "unknown") as string,
        facilityConfirmedVacancies: (nh.facilityConfirmedVacancies ?? "unknown") as string,
        websiteCheckedAt: (nh.websiteCheckedAt ?? "") as string,
        websiteSourceUrl: (nh.websiteSourceUrl ?? "") as string,
        facilityConfirmedAt: (nh.facilityConfirmedAt ?? "") as string,
        facilityConfirmationSource: (nh.facilityConfirmationSource ?? "") as string,
        conflictFlag: !!nh.conflictFlag,

        email: (nh.email ?? "") as string,
        internalNotes: (nh.internalNotes ?? "") as string,
        status: nh.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        activeVacancies: nh.activeVacancies == null ? "" : String(nh.activeVacancies),
        verifiedAt: (nh.verifiedAt ?? "") as string,

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
        websiteSaysVacancies: form.websiteSaysVacancies,
        facilityConfirmedVacancies: form.facilityConfirmedVacancies,
        websiteCheckedAt: form.websiteCheckedAt.trim() || null,
        websiteSourceUrl: form.websiteSourceUrl.trim() || null,
        facilityConfirmedAt: form.facilityConfirmedAt.trim() || null,
        facilityConfirmationSource: form.facilityConfirmationSource.trim() || null,
        conflictFlag: form.conflictFlag,

        // admin-only
        email: form.email.trim() || null,
        internalNotes: form.internalNotes.trim() || null,
        status: form.status,
        activeVacancies: parseOptionalNumber(form.activeVacancies),
        verifiedAt: form.verifiedAt.trim() || null,

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

      const res = await apiFetch<{ created: number; updated: number; skipped: number }>(
        "/api/admin/nursing-homes/import",
        {
          method: "POST",
          body: JSON.stringify(normalized),
        },
      );

      setNotice(`Import complete. Created ${res.created}, updated ${res.updated}, skipped ${res.skipped}.`);
      await refreshList();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setImportingSheet(false);
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
    localStorage.setItem("nhnm_admin_token", token);
  }, [token]);

  useEffect(() => {
    refreshList().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            Admin Token
          </label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token here (X-Admin-Token)"
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={() => refreshList()} disabled={disabled} style={primaryBtn}>
              {loadingList ? "Refreshing..." : "Refresh List"}
            </button>

            <button onClick={newFacility} disabled={disabled} style={secondaryBtn}>
              + New Facility
            </button>

            <button onClick={jumpToFacilitiesBoard} disabled={disabled} style={secondaryBtn}>
              View All Facilities
            </button>

            <label style={{ ...secondaryBtn, display: "inline-flex", alignItems: "center", gap: 8 }}>
              {importingSheet ? "Uploading..." : "Upload Facility CSV"}
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

            <div style={{ marginLeft: "auto", color: "#64748b", fontSize: 13 }}>
              API: {API_BASE}
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap", color: "#334155", fontSize: 14 }}>
            <div><strong>{list.length}</strong> facilities loaded</div>
            <div><strong>{list.length - missingGeoCount}</strong> with geo</div>
            <div><strong>{missingGeoCount}</strong> missing geo</div>
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
        </div>

        {/* Vacancy Queue — AI scan results awaiting facility confirmation */}
        {(() => {
          const queueItems = list.filter(
            (nh) => nh.websiteSaysVacancies === "yes" && nh.facilityConfirmedVacancies !== "yes",
          );
          if (!queueItems.length && !vacancyScanResults.length) return null;
          return (
            <div
              style={{
                marginBottom: 24,
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: 14,
                padding: 18,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 18, color: "#14532d", marginBottom: 4 }}>
                Vacancies Found — Confirm with Facility
              </div>
              <div style={{ color: "#166534", fontSize: 13, marginBottom: 14 }}>
                These facilities show vacancies on their website but haven't been confirmed by the facility yet. Call or email each one to confirm, then click "Confirmed".
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {queueItems.map((nh) => {
                  const scanResult = vacancyScanResults.find((r) => r.facilityId === nh.id);
                  return (
                    <div
                      key={nh.id}
                      style={{
                        background: "white",
                        border: "1px solid #bbf7d0",
                        borderRadius: 10,
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontWeight: 700, color: "#0b3b5b", fontSize: 15 }}>{nh.name}</div>
                        <div style={{ color: "#475569", fontSize: 13 }}>
                          {[nh.suburb, nh.state, nh.postcode].filter(Boolean).join(", ")}
                        </div>
                        {scanResult?.vacancySummary && (
                          <div style={{ marginTop: 4, color: "#166534", fontSize: 13, fontStyle: "italic" }}>
                            "{scanResult.vacancySummary}"
                          </div>
                        )}
                        {nh.websiteCheckedAt && (
                          <div style={{ marginTop: 2, color: "#94a3b8", fontSize: 12 }}>
                            Scanned: {new Date(nh.websiteCheckedAt).toLocaleString("en-AU")}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {nh.website && (
                          <a
                            href={nh.website}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "1px solid #cbd5e1",
                              background: "#f8fafc",
                              color: "#0b3b5b",
                              fontWeight: 600,
                              fontSize: 13,
                              textDecoration: "none",
                            }}
                          >
                            View Website
                          </a>
                        )}
                        {nh.phone && (
                          <a
                            href={`tel:${nh.phone}`}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "1px solid #cbd5e1",
                              background: "#f8fafc",
                              color: "#0b3b5b",
                              fontWeight: 600,
                              fontSize: 13,
                              textDecoration: "none",
                            }}
                          >
                            {nh.phone}
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => patchVacancyConfirmation(nh.id, "yes").catch((e) => setError(getErrorMessage(e)))}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "none",
                            background: "#16a34a",
                            color: "white",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          Confirmed
                        </button>
                        <button
                          type="button"
                          onClick={() => patchVacancyConfirmation(nh.id, "no").catch((e) => setError(getErrorMessage(e)))}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "1px solid #fca5a5",
                            background: "white",
                            color: "#991b1b",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          Not available
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

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
                  const count = state === "ALL" ? list.length : stateCounts.get(state) ?? 0;
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
                  {filteredList.slice(0, 120).map((nh) => {
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
                  items={filteredList.slice(0, 120)}
                  onEdit={(id) => {
                    setSelectedId(id);
                    setShowFacilitiesBoard(false);
                  }}
                />
              )}

              {filteredList.length > 120 ? (
                <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                  Showing the first 120 facilities in this view. Use the state filter or search to narrow it further.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div style={gridWrap}>
          {/* LEFT */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 800, marginBottom: 10, color: "#0b3b5b" }}>
              Facilities ({filteredList.length})
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, suburb, state or postcode"
              disabled={disabled}
              style={{ ...inputStyle, marginBottom: 10 }}
            />

            <select
              value={selectedId === "NEW" ? "NEW" : String(selectedId)}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "NEW") newFacility();
                else setSelectedId(Number(v));
              }}
              disabled={disabled}
              style={inputStyle}
            >
              <option value="NEW">+ Create new…</option>
              {filteredList.map((nh) => (
                <option key={nh.id} value={nh.id}>
                  {nh.name}
                  {nh.suburb ? ` — ${nh.suburb}` : ""}
                  {nh.state ? ` (${nh.state})` : ""}
                </option>
              ))}
            </select>

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

            <SectionTitle text="Option List Fields" />
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
              <div />
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

            <SectionTitle text="Facility Details Fields" />
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
              <Field
                label="Website"
                value={form.website}
                onChange={(v) => setForm((p) => ({ ...p, website: v }))}
                disabled={disabled}
              />
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
                {scanMessage && (
                  <p style={{
                    margin: 0,
                    fontSize: 12,
                    color: scanMessage.startsWith("Scan failed") ? "#dc2626" : "#0f766e",
                    fontWeight: 600,
                  }}>
                    {scanMessage}
                  </p>
                )}
              </div>
            </Grid2>

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
              <Field
                label="Website source URL"
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
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
                <thead>
                  <tr>
                    <th style={th}>Room type</th>
                    <th style={th}>Bathroom</th>
                    <th style={th}>RAD min</th>
                    <th style={th}>RAD max</th>
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
                          value={r.radMax}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm((p) => {
                              const next = [...p.roomOptions];
                              next[idx] = { ...next[idx], radMax: v };
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
                label="Email"
                value={form.email}
                onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                disabled={disabled}
              />
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
              <div />
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

              <button onClick={() => refreshList()} disabled={disabled} style={secondaryBtn}>
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
}) {
  const { label, value, onChange, disabled, asSelect, options } = props;

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
        <input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={inputStyle} />
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
