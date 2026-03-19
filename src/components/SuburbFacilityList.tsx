import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/runtimeConfig";

type Facility = {
  id: number;
  name: string;
  suburb: string;
  state: string;
  postcode: string;
  primaryImageUrl: string | null;
  oneLineDescription: string | null;
  tags: string;
};

export default function SuburbFacilityList({ suburb }: { suburb: string }) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/nursing-homes/suburb/${encodeURIComponent(suburb)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFacilities(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [suburb]);

  if (loading) return null;
  if (!facilities.length) return null;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold text-slate-800">
        Aged care facilities in {suburb}
      </h2>
      <p className="mt-1 text-slate-500 text-sm">
        {facilities.length} facilit{facilities.length === 1 ? "y" : "ies"} listed in {suburb}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginTop: 16,
        }}
      >
        {facilities.map((facility) => {
          const tags = facility.tags
            ? facility.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 4)
            : [];

          return (
            <div
              key={facility.id}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Image */}
              <div style={{ height: 180, background: "#0b3b5b", flexShrink: 0 }}>
                {facility.primaryImageUrl ? (
                  <img
                    src={facility.primaryImageUrl}
                    alt={facility.name}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #0b3b5b 0%, #0f766e 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>No image</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {facility.suburb}, {facility.state} {facility.postcode}
                  </p>
                  <h3 style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 700, color: "#0b3b5b", lineHeight: 1.3 }}>
                    {facility.name}
                  </h3>
                </div>

                {facility.oneLineDescription && (
                  <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
                    {facility.oneLineDescription.slice(0, 120)}
                    {facility.oneLineDescription.length > 120 ? "…" : ""}
                  </p>
                )}

                {tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 20,
                          background: "#f0fdf4",
                          color: "#0f766e",
                          fontWeight: 600,
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "auto", paddingTop: 8 }}>
                  <Link
                    to={`/options/${facility.id}`}
                    style={{
                      display: "inline-block",
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: "#0b3b5b",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: "none",
                    }}
                  >
                    View profile
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
