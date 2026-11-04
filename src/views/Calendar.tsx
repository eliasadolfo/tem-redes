import { useMemo, useState } from "react";
import { useStore } from "../store";
import { DAY, WK_ABBR, fmtDate, mondayOf, nextDays, noon, type RangePreset } from "../lib/dates";
import { PLATFORM_LABEL, PUBLISH_TAGS } from "../lib/platforms";
import { pieceWhen } from "../lib/stages";
import LoteSheet from "../components/LoteSheet";
import PieceCard from "../components/PieceCard";
import RangePicker from "../components/RangePicker";
import type { PlatformTag, Proposal } from "../types";

const FILTERS: (PlatformTag | "Todas")[] = ["Todas", ...PUBLISH_TAGS];

const PRESETS: RangePreset[] = [
  {
    label: "Esta semana",
    range: () => {
      const monday = mondayOf(Date.now());
      return [monday, noon(monday + 6 * DAY)];
    },
  },
  nextDays(30),
  nextDays(90),
];

const dayOf = (p: Proposal) => {
  const when = pieceWhen(p);
  return when ? noon(new Date(when).getTime()) : null;
};

/** Lo programado y publicado entre dos fechas. Mismo componente en escritorio y teléfono. */
export default function Calendar() {
  const s = useStore();
  const { actions, calStart, calEnd } = s;
  const [platFilter, setPlatFilter] = useState<PlatformTag | "Todas">("Todas");
  const [lote, setLote] = useState(false);

  const visible = s.proposals.filter(
    (p) =>
      p.status !== "rejected" &&
      (p.stage === "listo" || p.stage === "publicado") &&
      (platFilter === "Todas" || p.platforms.includes(platFilter)),
  );
  const undated = visible.filter((p) => dayOf(p) === null);
  const today = noon(Date.now());

  // Días del rango, alineados a la semana con huecos al comienzo.
  const days = useMemo(() => {
    const list: number[] = [];
    for (let ms = calStart; ms <= calEnd; ms = noon(ms + DAY)) list.push(ms);
    return list;
  }, [calStart, calEnd]);
  const lead = (new Date(calStart).getDay() + 6) % 7;
  const inRange = visible.filter((p) => {
    const d = dayOf(p);
    return d !== null && d >= calStart && d <= calEnd;
  });

  return (
    <div className="pagina">
      <div className="cabecera">
        <div className="cabecera__texto">
          <h1 className="tem-h1">Calendario</h1>
          <p className="tem-caption">
            {inRange.length === 1 ? "1 pieza" : `${inRange.length} piezas`} entre {fmtDate(calStart)} y {fmtDate(calEnd)}.
          </p>
        </div>
        <button className="tem-btn tem-btn--secundario" onClick={() => setLote(true)}>Programar en lote</button>
      </div>

      <RangePicker start={calStart} end={calEnd} onChange={actions.setCalRange} presets={PRESETS} />

      <div className="filtros" role="group" aria-label="Filtrar por red">
        {FILTERS.map((f) => (
          <button key={f} className="filtro" aria-pressed={platFilter === f} onClick={() => setPlatFilter(f)}>
            {f === "Todas" ? "Todas" : PLATFORM_LABEL[f]}
          </button>
        ))}
      </div>

      {undated.length > 0 && (
        <section className="sin-fecha" aria-label="Sin fecha">
          <div className="dia__nombre">Sin fecha</div>
          <div className="rejilla-piezas">{undated.map((p) => <PieceCard key={p.id} p={p} />)}</div>
        </section>
      )}

      {!s.loading && inRange.length === 0 && <p className="tem-small tem-muted vacio-rango">No hay piezas en este rango.</p>}

      <div className="semana">
        {Array.from({ length: lead }, (_, i) => <div key={`h${i}`} className="dia dia--vacio" aria-hidden="true" />)}
        {days.map((ms) => {
          const d = new Date(ms);
          const items = visible.filter((p) => dayOf(p) === ms);
          return (
            <div key={ms} className={`dia${items.length === 0 && !s.loading ? " dia--vacio" : ""}`}>
              <div className={`dia__nombre${ms === today ? " dia__nombre--hoy" : ""}`}>{WK_ABBR[(d.getDay() + 6) % 7]} {d.getDate()}</div>
              {s.loading ? (
                <div className="skeleton" style={{ height: 96 }} aria-busy="true" />
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
