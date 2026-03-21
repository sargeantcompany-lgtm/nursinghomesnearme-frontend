// src/components/AdminMenu.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/runtimeConfig";
import AdminTopNav from "./AdminTopNav";
import SeoHead from "./SeoHead";

export default function AdminMenu() {
  const navigate = useNavigate();

  const isAuthed =
    !!(localStorage.getItem("nhnm_admin_token") ?? "").trim() ||
    !!(localStorage.getItem("nhnm_admin_session") ?? "").trim();
  React.useEffect(() => {
    if (!isAuthed) navigate("/admin", { replace: true });
  }, [isAuthed, navigate]);

  function go(to: string) {
    navigate(to);
    window.scrollTo(0, 0);
  }

  return (
    <div style={{ minHeight: "100vh", padding: 20, background: "#f8fafc" }}>
      <SeoHead title="Admin" description="" canonicalUrl="" robots="noindex,nofollow" />
      <div style={shell}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, color: "#0b3b5b" }}>Admin</h1>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>
            API: {API_BASE}
          </div>
        </div>

        <AdminTopNav />

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <button type="button" onClick={() => go("/admin/case-manager")} style={linkCardBtn}>
            Case Manager (Add Homes + Send Lists)
          </button>

          <button type="button" onClick={() => go("/admin/case-files")} style={linkCardBtn}>
            Case Files (Full Case Details)
          </button>

          <button type="button" onClick={() => go("/admin/nursing-homes")} style={linkCardBtn}>
            Nursing Homes
          </button>

        </div>
      </div>
    </div>
  );
}

const shell: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
};

const linkCardBtn: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: 14,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  color: "#0b3b5b",
  fontWeight: 900,
  background: "#ffffff",
  cursor: "pointer",
};

