import logoBlack from "../assets/img/logo-tem-black.png";
import { useStore } from "../store";
import type { DesktopView } from "../types";

const NAV: { key: DesktopView; label: string }[] = [
  { key: "calendar", label: "Calendario" },
  { key: "inbox", label: "Propuestas" },
  { key: "library", label: "Biblioteca" },
  { key: "metrics", label: "Métricas" },
  { key: "newsletter", label: "Newsletter" },
  { key: "settings", label: "Perfil" },
];

export default function Sidebar() {
  const { view, work, proposals, actions } = useStore();
  const pending = proposals.filter((p) => p.status === "proposal").length;
  const activeKey = work ? null : view;

  return (
    <aside
      style={{
        width: 230,
        flexShrink: 0,
        background: "var(--tem-surface)",
        borderRight: "1px solid rgba(17,17,17,.06)",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      <img
        src={logoBlack}
        alt="TEM — Tu Escuela de Marcas"
        style={{ height: 28, width: "auto", objectFit: "contain", alignSelf: "flex-start", marginBottom: 22, marginLeft: 6 }}
      />

      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map((item) => {
          const active = activeKey === item.key;
          return (
            <button
              key={item.key}
              className="press"
              onClick={() => actions.go(item.key)}
              style={{
                all: "unset",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: 12,
                background: active ? "var(--tem-ink)" : "transparent",
                color: active ? "#fff" : "var(--tem-ink)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span>{item.label}</span>
              {item.key === "inbox" && pending > 0 && (
                <span
                  style={{
                    background: "var(--tem-orange)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 999,
                    minWidth: 20,
                    height: 20,
                    padding: "0 6px",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* pie: avatar + nombre */}
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: "8px 6px" }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            background: "var(--tem-ink)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          EA
        </div>
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Elías Adolfo</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--tem-handle)" }}>Fundador</div>
        </div>
      </div>
    </aside>
  );
}
