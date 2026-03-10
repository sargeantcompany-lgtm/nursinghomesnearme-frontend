import { useCallback, useEffect, useState } from "react";
import NursingHomeGrid from "./NursingHomeGrid";
import type { NursingHomeListItem } from "./NursingHomeGrid";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

export default function NursingHomeOptions() {
  const [list, setList] = useState<NursingHomeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/nursing-homes`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
      }
      const data = (await res.json()) as NursingHomeListItem[];
      setList(data ?? []);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  if (error) {
    return (
      <div style={{ padding: 18, fontFamily: "system-ui, Arial" }}>
        <div style={{ padding: 12, borderRadius: 12, background: "#fee2e2" }}>
          <strong style={{ color: "#991b1b" }}>Error:</strong>{" "}
          <span style={{ color: "#991b1b" }}>{error}</span>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #0b3b5b",
            background: "#0b3b5b",
            color: "white",
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Refreshing..." : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* keep the refresh control exactly like before */}
      <div style={{ padding: 18, paddingBottom: 0 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => load()}
            disabled={loading}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #0b3b5b",
              background: "#0b3b5b",
              color: "white",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <NursingHomeGrid
        items={list}
        showFilters={true}
        title="Options"
        subtitle="These are facilities from your database (ACTIVE only). Click More details to view the card."
      />
    </div>
  );
}
