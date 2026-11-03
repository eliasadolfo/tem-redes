import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "../store";
import { DAY, DAY_NAMES_FULL, noon, weekRangeLabel } from "../lib/dates";
import LoteSheet from "../components/LoteSheet";
import PieceCard from "../components/PieceCard";
import { pieceWhen } from "../lib/stages";
import type { Proposal } from "../types";

/** Semana en el teléfono: lo que está en Listo o Publicado. */
export default function MobileWeek() {
  const s = useStore();
  const { actions } = s;
  const [lote, setLote] = useState(false);
  const monday = noon(s.calWeekStart);
  const visible = s.proposals.filter((p) => p.status !== "rejected" && (p.stage === "listo" || p.stage === "publicado"));

  const dayOf = (p: Proposal) => {
    const when = pieceWhen(p);
    return when ? noon(new Date(when).getTime()) : null;
  };
  const undated = visible.filter((p) => dayOf(p) === null);

  return (
    <div className="pagina">
      <div className="cabecera">
        <div className="cabecera__texto">
          <h1 className="tem-h1">Semana</h1>
          <p className="tem-caption">Lo que está en Listo o Publicado.</p>
        </div>
      </div>
      <div className="nav-semana seccion">
        <button className="icono-btn" onClick={() => actions.calWeekNav(-1)} aria-label="Semana anterior"><ChevronLeft size={18} strokeWidth={1.5} /></button>
        <span className="nav-semana__rango">{weekRangeLabel(monday)}</span>
        <button className="icono-btn" onClick={() => actions.calWeekNav(1)} aria-label="Semana siguiente"><ChevronRight size={18} strokeWidth={1.5} /></button>
      </div>
      <button className="tem-btn tem-btn--secundario btn-ancho seccion" onClick={() => setLote(true)}>Programar en lote</button>

      {undated.length > 0 && (
        <section className="sin-fecha" aria-label="Sin fecha">
          <div className="dia__nombre">Sin fecha</div>
          <div className="rejilla-piezas">{undated.map((p) => <PieceCard key={p.id} p={p} />)}</div>
        </section>
      )}

      <div className="semana" style={{ marginTop: 8 }}>
        {DAY_NAMES_FULL.map((name, i) => {
          const ms = monday + i * DAY;
          const items = visible.filter((p) => dayOf(p) === noon(ms));
          return (
            <div key={name} className="dia">
              <div className="dia__nombre">{name} {new Date(ms).getDate()}</div>
              {s.loading ? (
                <div className="skeleton" style={{ height: 70 }} aria-busy="true" />
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
