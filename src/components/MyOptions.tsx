import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import NursingHomeGrid from "../components/NursingHomeGrid";
import type { NursingHomeListItem } from "../components/NursingHomeGrid";

type MyOptionsResponse = {
  clientName?: string;
  clientEmail?: string;
  clientSuburb?: string;
  fullList: NursingHomeListItem[];
  shortList: NursingHomeListItem[];
};

function navTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getTokenFromPath(): string {
  return window.location.pathname.replace("/my-options/", "").trim();
}

export default function MyOptions() {
  const token = useMemo(() => getTokenFromPath(), []);
  const [data, setData] = useState<MyOptionsResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<MyOptionsResponse>(`/api/my-options/${token}`)
      .then(setData)
      .catch((e) => setError(e.message || "Failed"));
  }, [token]);

  if (error) return <div style={{ padding: 16 }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 16 }}>Loading your options…</div>;

  return (
    <div>
      {/* Header bar */}
      <div style={{ padding: 18, paddingBottom: 0, background: "#f8fafc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", fontFamily: "system-ui, Arial" }}>
          <button
            onClick={() => navTo("/")}
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
            ← Home
          </button>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#0b3b5b" }}>Your nursing home options</div>
            <div style={{ marginTop: 6, color: "#475569" }}>
              {data.clientName ? <strong>{data.clientName}</strong> : null}
              {data.clientSuburb ? (
                <span>{data.clientName ? " — " : ""}Preferred area: {data.clientSuburb}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Tailored (SHORT) */}
      {data.shortList?.length ? (
        <NursingHomeGrid
          items={data.shortList}
          showFilters={false}
          title="Your tailored options"
          subtitle="These are the tailored facilities we’ve prepared for you."
        />
      ) : null}

      {/* Full (basic) */}
      <NursingHomeGrid
        items={data.fullList ?? []}
        showFilters={false}
        title="Full list (basic)"
        subtitle="This is the full list of options (basic information)."
      />
    </div>
  );
}
