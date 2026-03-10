// src/components/AdminMenu.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/runtimeConfig";

export default function AdminMenu() {
  const navigate = useNavigate();

  const isAuthed = !!(localStorage.getItem("nhnm_admin_token") ?? "").trim();
  React.useEffect(() => {
    if (!isAuthed) navigate("/admin", { replace: true });
  }, [isAuthed, navigate]);

  function logout() {
    localStorage.removeItem("nhnm_admin_token");
    navigate("/admin", { replace: true });
  }

  function go(to: string) {
    navigate(to);
    window.scrollTo(0, 0);
  }

  return (
    <div style={{ minHeight: "100vh", padding: 20, background: "#f8fafc" }}>
      <div style={shell}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, color: "#0b3b5b" }}>Admin</h1>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>
            API: {API_BASE}
          </div>
        </div>

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

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={logout} style={secondaryBtn}>Log out</button>
          <button type="button" onClick={() => go("/")} style={secondaryBtn}>Back to site</button>
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

const secondaryBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#0b3b5b",
  cursor: "pointer",
  fontWeight: 800,
};
