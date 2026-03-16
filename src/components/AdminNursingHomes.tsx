// src/components/AdminNursingHomes.tsx
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { API_BASE, TOKEN_ENV } from "../lib/runtimeConfig";
import AdminTopNav from "./AdminTopNav";

type NursingHomeListItem = {
  id: number;
  name: string;
  oneLineDescription?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: string | null;
  primaryImageUrl?: string | null;
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
  if (!src.length)
    return [{ roomType: "", bathroomType: "", radMin: "", radMax: "", availabilityNote: "" }];

  return src.map((r) => ({
    roomType: (r.roomType ?? "") as string,
    bathroomType: (r.bathroomType ?? "") as string,
    radMin: r.radMin == null ? "" : String(r.radMin),
    radMax: r.radMax == null ? "" : String(r.radMax),
    availabilityNote: (r.availabilityNote ?? "") as string,
  }));
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

    roomOptions: [{ roomType: "", bathroomType: "", radMin: "", radMax: "", availabilityNote: "" }],
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
  const [importingCenters, setImportingCenters] = useState(false);
  const [importingVacancyChecks, setImportingVacancyChecks] = useState(false);
  const [sendingWeeklyCheck, setSendingWeeklyCheck] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const [currentId, setCurrentId] = useState<number | null>(null);
  const [form, setForm] = useState<UpsertForm>(emptyForm());
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
  const filteredList = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return sortedList;
    return sortedList.filter((nh) =>
      [nh.name, nh.suburb ?? "", nh.state ?? "", nh.postcode ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [search, sortedList]);
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

          return {
            name: get("name", "Name", "facility_name", "Facility Name"),
            providerName: get("providerName", "provider_name", "Provider Name"),
            oneLineDescription: get("oneLineDescription", "one_line_description", "One Line Description"),
            description: get("description", "Description"),
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
            primaryImageUrl: get("primaryImageUrl", "primary_image_url", "Primary Image URL"),
            latitude: getNum("latitude", "lat", "Latitude"),
            longitude: getNum("longitude", "lng", "lon", "Longitude"),
            status: get("status", "Status") || "ACTIVE",
            careTypes: parseDelimitedList(get("careTypes", "care_types", "Care Types")),
            specialties: parseDelimitedList(get("specialties", "Specialties")),
            roomTypes: parseDelimitedList(get("roomTypes", "room_types", "Room Types")),
            images: parseDelimitedList(get("images", "Images")),
            lastProfileScanAt: get("lastProfileScanAt", "last_profile_scan_at", "Last Profile Scan At"),
            otherTags: category ? [category] : [],
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

  async function importLocationCenters(file: File) {
    setError("");
    setNotice("");
    setImportingCenters(true);
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
          return {
            suburb: get("suburb", "Suburb"),
            state: get("state", "State"),
            postcode: get("postcode", "Postcode"),
            latitude: getNum("lat", "latitude", "Latitude"),
            longitude: getNum("lng", "lon", "longitude", "Longitude"),
          };
        })
        .filter((x) => x.suburb && x.state && x.postcode && x.latitude != null && x.longitude != null);

      if (!normalized.length) {
        throw new Error("No valid rows found. Required: suburb, state, postcode, lat/lng.");
      }

      const res = await apiFetch<{ created: number; updated: number; skipped: number }>(
        "/api/admin/nursing-homes/import-location-centers",
        {
          method: "POST",
          body: JSON.stringify(normalized),
        },
      );

      setNotice(
        `Suburb geocodes import complete. Created ${res.created}, updated ${res.updated}, skipped ${res.skipped}.`,
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setImportingCenters(false);
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
    loadingList || loadingOne || saving || deleting || uploadingPrimary || uploadingGallery || importingSheet || importingCenters || importingVacancyChecks || sendingWeeklyCheck;

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

            <label style={{ ...secondaryBtn, display: "inline-flex", alignItems: "center", gap: 8 }}>
              {importingSheet ? "Importing..." : "Import Spreadsheet"}
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
              {importingCenters ? "Importing..." : "Import Suburb Geocodes"}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                disabled={disabled || importingCenters}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importLocationCenters(f).catch(() => {});
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

            <a
              href="/facility_profile_import_template.csv"
              target="_blank"
              rel="noreferrer"
              style={{ ...secondaryBtn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              Download CSV Template
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

            <div style={{ marginLeft: "auto", color: "#64748b", fontSize: 13 }}>
              API: {API_BASE}
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap", color: "#334155", fontSize: 14 }}>
            <div><strong>{list.length}</strong> facilities loaded</div>
            <div><strong>{list.length - missingGeoCount}</strong> with geo</div>
            <div><strong>{missingGeoCount}</strong> missing geo</div>
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
              <div style={{ marginTop: 12 }}>
                <div style={labelStyle}>Primary Photo Preview</div>
                <img
                  src={form.primaryImageUrl}
                  alt="Primary"
                  style={{
                    width: "100%",
                    maxWidth: 520,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
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
                        <div style={{ padding: 8, fontSize: 11, color: "#64748b", wordBreak: "break-all" }}>{u}</div>
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
                          disabled={disabled || form.roomOptions.length <= 1}
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
                      { roomType: "", bathroomType: "", radMin: "", radMax: "", availabilityNote: "" },
                    ],
                  }))
                }
                style={secondaryBtn}
              >
                + Add room row
              </button>
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
