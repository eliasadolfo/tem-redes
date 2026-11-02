import { Home, Video, CalendarDays, BarChart3, User } from "lucide-react";
import type { ComponentType } from "react";
import { useStore } from "../store";
import type { MobileTab } from "../types";
import EditSheet from "./EditSheet";
import MobileHome from "./MobileHome";
import MobileWeek from "./MobileWeek";
import MobileMetrics from "./MobileMetrics";
import MobileProfile from "./MobileProfile";
import RecordSession from "../components/RecordSession";

const TABS: { key: MobileTab; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { key: "inicio", label: "Inicio", icon: Home },
  { key: "grabar", label: "Grabar", icon: Video },
  { key: "semana", label: "Semana", icon: CalendarDays },
  { key: "metricas", label: "Métricas", icon: BarChart3 },
  { key: "perfil", label: "Perfil", icon: User },
];

export default function MobileApp() {
  const { tab, work, proposals, actions } = useStore();
  const toRecord = proposals.filter((p) => p.status !== "rejected" && p.stage === "grabar").length;

  return (
    <div style={{ position: "relative", minHeight: "100vh", height: "100vh", overflow: "hidden", background: "var(--tem-bg)" }}>
      {/* área de scroll */}
      <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden", padding: "52px 0 96px" }}>
        {tab === "inicio" && <MobileHome />}
        {tab === "grabar" && <RecordSession mobile />}
        {tab === "semana" && <MobileWeek />}
        {tab === "metricas" && <MobileMetrics />}
        {tab === "perfil" && <MobileProfile />}
      </div>

      {/* tab bar inferior */}
      <nav
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, display: "flex",
          background: "rgba(255,255,255,.86)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(17,17,17,.06)", padding: "9px 10px 30px",
        }}
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              className="press-sm"
              onClick={() => actions.setTab(key)}
              style={{
                all: "unset", cursor: "pointer", flex: 1, display: "flex", flexDirection: "column", position: "relative",
                alignItems: "center", gap: 4, color: active ? "var(--tem-orange)" : "var(--tem-handle)",
              }}
            >
              <Icon size={24} strokeWidth={2.4} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
              {key === "grabar" && toRecord > 0 && (
                <span
                  aria-label={`${toRecord} por grabar`}
                  style={{
                    position: "absolute", top: -4, right: "calc(50% - 22px)", minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999,
                    background: "var(--tem-orange)", color: "#fff", fontSize: 10, fontWeight: 600, display: "grid", placeItems: "center",
                  }}
                >
                  {toRecord}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ficha de la pieza */}
      {work && <EditSheet />}
    </div>
  );
}
