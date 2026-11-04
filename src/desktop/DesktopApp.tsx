import type { MouseEvent } from "react";
import { useStore } from "../store";
import Tablero from "./Tablero";
import Ideas from "./Ideas";
import Calendar from "../views/Calendar";
import Copilot from "./Copilot";
import Library from "./Library";
import Metrics from "../views/Metrics";
import Profile from "../views/Profile";
import RecordSession from "../components/RecordSession";
import type { DesktopView } from "../types";

const NAV: { key: DesktopView; label: string }[] = [
  { key: "tablero", label: "Tablero" },
  { key: "ideas", label: "Ideas" },
  { key: "grabar", label: "Teleprompter" },
  { key: "calendar", label: "Calendario" },
  { key: "library", label: "Biblioteca" },
  { key: "metrics", label: "Métricas" },
];

export default function DesktopApp() {
  const { view, work, proposals, loadError, actions } = useStore();
  const toRecord = proposals.filter((p) => p.status !== "rejected" && p.stage === "grabar").length;

  const go = (key: DesktopView) => (e: MouseEvent) => {
    e.preventDefault();
    actions.go(key);
  };

  let content;
  if (work) content = <Copilot />;
  else if (view === "tablero") content = <Tablero />;
  else if (view === "ideas") content = <Ideas />;
  else if (view === "grabar") content = <RecordSession />;
  else if (view === "calendar") content = <Calendar />;
  else if (view === "library") content = <Library />;
  else if (view === "metrics") content = <Metrics />;
  else content = <Profile />;

  return (
    <div className="marco">
      <header className="tem-bar">
        <span className="tem-bar__producto">Studio<span className="tem-dot">·</span>TEM</span>
        <nav className="tem-nav" aria-label="Secciones">
          {NAV.map((n) => (
            <a key={n.key} href={`#${n.key}`} onClick={go(n.key)} aria-current={!work && view === n.key ? "page" : undefined}>
              {n.label}
              {n.key === "grabar" && toRecord > 0 && <span className="tem-nav__numero">{toRecord}</span>}
            </a>
          ))}
        </nav>
        <nav className="tem-nav bar-der" aria-label="Cuenta">
          <a href="#perfil" onClick={go("settings")} aria-current={!work && view === "settings" ? "page" : undefined}>Perfil</a>
        </nav>
      </header>
      <main className="marco__cuerpo">
        {loadError && <LoadError />}
        {content}
      </main>
    </div>
  );
}

export function LoadError() {
  const { actions } = useStore();
  return (
    <div className="tem-aviso tem-aviso--error aviso-carga" role="alert">
      <span>No pude leer tus piezas. Revisa tu conexión y vuelve a intentar.</span>
      <button className="tem-btn tem-btn--texto btn-chico" onClick={() => void actions.reload()}>Reintentar</button>
    </div>
  );
}
