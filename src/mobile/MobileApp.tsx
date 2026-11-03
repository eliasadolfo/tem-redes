import { BarChart3, CalendarDays, Home, Video } from "lucide-react";
import type { ComponentType, MouseEvent } from "react";
import { useStore } from "../store";
import type { MobileTab } from "../types";
import EditSheet from "./EditSheet";
import MobileHome from "./MobileHome";
import MobileWeek from "./MobileWeek";
import Metrics from "../views/Metrics";
import Profile from "../views/Profile";
import RecordSession from "../components/RecordSession";
import { LoadError } from "../desktop/DesktopApp";

const TABS: { key: MobileTab; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { key: "inicio", label: "Inicio", icon: Home },
  { key: "grabar", label: "Grabar", icon: Video },
  { key: "semana", label: "Semana", icon: CalendarDays },
  { key: "metricas", label: "Métricas", icon: BarChart3 },
];

export default function MobileApp() {
  const { tab, work, loadError, actions } = useStore();

  const toProfile = (e: MouseEvent) => {
    e.preventDefault();
    actions.setTab("perfil");
  };

  return (
    <div className="movil">
      <header className="tem-bar">
        <span className="tem-bar__producto">Studio<span className="tem-dot">·</span>TEM</span>
        <nav className="tem-nav bar-der" aria-label="Cuenta">
          <a href="#perfil" onClick={toProfile} aria-current={tab === "perfil" ? "page" : undefined}>Perfil</a>
        </nav>
      </header>

      <div className="movil__scroll">
        {loadError && <LoadError />}
        {tab === "inicio" && <MobileHome />}
        {tab === "grabar" && <RecordSession mobile />}
        {tab === "semana" && <MobileWeek />}
        {tab === "metricas" && <Metrics />}
        {tab === "perfil" && <Profile />}
      </div>

      <nav className="tabs" aria-label="Secciones">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} className="tab" onClick={() => actions.setTab(key)} aria-current={tab === key ? "page" : undefined}>
            <Icon size={22} strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </nav>

      {work && <EditSheet />}
    </div>
  );
}
