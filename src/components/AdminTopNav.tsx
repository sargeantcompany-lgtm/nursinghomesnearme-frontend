import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/runtimeConfig";

const links = [
  { to: "/admin/menu", label: "Admin Home" },
  { to: "/admin/nursing-homes", label: "Nursing Homes" },
  { to: "/admin/case-files", label: "Case Files" },
  { to: "/admin/case-manager", label: "Case Manager" },
];

export default function AdminTopNav() {
  const location = useLocation();
  const navigate = useNavigate();

  async function logout() {
    try {
      await fetch(`${API_BASE}/api/admin/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // ignore logout network errors; we still clear the local session marker
    }
    localStorage.removeItem("nhnm_admin_token");
    localStorage.removeItem("nhnm_admin_session");
    navigate("/admin", { replace: true });
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 14,
      }}
    >
      {links.map((link) => {
        const active = location.pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            style={{
              padding: "9px 12px",
              borderRadius: 10,
              border: active ? "1px solid #0b3b5b" : "1px solid #cbd5e1",
              background: active ? "#0b3b5b" : "white",
              color: active ? "white" : "#0b3b5b",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {link.label}
          </Link>
        );
      })}

      <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link
          to="/"
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            background: "white",
            color: "#0b3b5b",
            textDecoration: "none",
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          Back to Site
        </Link>
        <button
          type="button"
          onClick={logout}
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            background: "white",
            color: "#0b3b5b",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
