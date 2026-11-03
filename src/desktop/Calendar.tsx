import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "../store";
import { DAY, WK_ABBR, mondayOf, noon, weekRangeLabel } from "../lib/dates";
import { PLATFORM_LABEL, PUBLISH_TAGS } from "../lib/platforms";
import LoteSheet from "../components/LoteSheet";
import PieceCard from "../components/PieceCard";
import { pieceWhen } from "../lib/stages";
import type { PlatformTag, Proposal } from "../types";

const FILTERS: (PlatformTag | "Todas")[] = ["Todas", ...PUBLISH_TAGS];

export default function Calendar() {
  const s = useStore();
  const { actions } = s;
  const [platFilter, setPlatFilter] = useState<PlatformTag | "Todas">("Todas");
  const [lote, setLote] = useState(false);

  const monday = noon(s.calWeekStart);
  const today = noon(Date.now());
  const isThisWeek = mondayOf(today) === monday;
  // Solo lo programado: piezas en Listo o Publicado (lo demás vive en el tablero).
  const visible = s.proposals.filter(
    (p) =>
      p.status !== "rejected" &&
      (p.stage === "listo" || p.stage === "publicado") &&
      (platFilter === "Todas" || p.platforms.includes(platFilter)),
  );

  const dayOf = (p: Proposal) => {
    const when = pieceWhen(p);
    return when ? noon(new Date(when).getTime()) : null;
  };
  const undated = visible.filter((p) => dayOf(p) === null);

  return (
    <div className="pagina">
      <div className="cabecera">
        <div className="cabecera__texto">
          <h1 className="tem-h1">Calendario</h1>
          <p className="tem-caption">Lo que está en Listo o Publicado.</p>
        </div>
        <button className="tem-btn tem-btn--secundario" onClick={() => setLote(true)}>Programar en lote</button>
      </div>

      <div className="fila fila--entre" style={{ marginBottom: 16 }}>
        <div className="nav-semana">
          <button className="icono-btn" onClick={() => actions.calWeekNav(-1)} aria-label="Semana anterior"><ChevronLeft size={18} strokeWidth={1.5} /></button>
          <span className="nav-semana__rango">{weekRangeLabel(monday)}</span>
          <button className="icono-btn" onClick={() => actions.calWeekNav(1)} aria-label="Semana siguiente"><ChevronRight size={18} strokeWidth={1.5} /></button>
          {!isThisWeek && <button className="tem-btn tem-btn--texto" onClick={actions.calToday}>Esta semana</button>}
        </div>
        <div className="filtros" style={{ marginBottom: 0 }} role="group" aria-label="Filtrar por red">
          {FILTERS.map((f) => (
            <button key={f} className="filtro" aria-pressed={platFilter === f} onClick={() => setPlatFilter(f)}>
              {f === "Todas" ? "Todas" : PLATFORM_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {undated.length > 0 && (
        <section className="sin-fecha" aria-label="Sin fecha">
          <div className="dia__nombre">Sin fecha</div>
          <div className="rejilla-piezas">{undated.map((p) => <PieceCard key={p.id} p={p} />)}</div>
        </section>
      )}

      <div className="semana">
        {WK_ABBR.map((wk, i) => {
          const ms = monday + i * DAY;
          const items = visible.filter((p) => dayOf(p) === noon(ms));
          return (
            <div key={wk} className="dia">
              <div className={`dia__nombre${noon(ms) === today ? " dia__nombre--hoy" : ""}`}>{wk} {new Date(ms).getDate()}</div>
              {s.loading ? (
                <div className="skeleton" style={{ height: 96 }} aria-busy="true" />
              ) : items.length === 0 ? (
                <p className="tem-caption dia__vacio">Libre</p>
              ) : (
                items.map((p) => <PieceCard key={p.id} p={p} />)
              )}
            </div>
          );
        })}
      </div>
      {lote && <LoteSheet onClose={() => setLote(false)} />}
    </div>
  );
}
