import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { M_FULL, WEEKDAY_HEADERS, daysInMonth, fmtDate, monthLead, noon, type RangePreset } from "../lib/dates";

interface Props {
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
  presets: RangePreset[];
  /** Último día que se puede marcar. */
  max?: number;
}

/** Casillas de inicio y fin, atajos y un calendario donde se marcan las dos fechas. */
export default function RangePicker({ start, end, onChange, presets, max }: Props) {
  const [marking, setMarking] = useState<"inicio" | "fin" | null>(null);
  return (
    <div className="rango">
      <div className="rango__campos">
        <button className="rango__casilla" onClick={() => setMarking("inicio")}><small>Inicio</small>{fmtDate(start)}</button>
        <button className="rango__casilla" onClick={() => setMarking("fin")}><small>Fin</small>{fmtDate(end)}</button>
      </div>
      <div className="filtros" role="group" aria-label="Atajos de fechas">
        {presets.map((p) => {
          const [s, e] = p.range();
          return (
            <button key={p.label} className="filtro" aria-pressed={s === start && e === end} onClick={() => onChange(s, e)}>{p.label}</button>
          );
        })}
      </div>
      {marking && (
        <CalendarSheet
          first={marking}
          start={start}
          end={end}
          max={max}
          onClose={() => setMarking(null)}
          onApply={(s, e) => {
            onChange(s, e);
            setMarking(null);
          }}
        />
      )}
    </div>
  );
}

function CalendarSheet({
  first, start, end, max, onClose, onApply,
}: {
  first: "inicio" | "fin"; start: number; end: number; max?: number; onClose: () => void; onApply: (s: number, e: number) => void;
}) {
  const [from, setFrom] = useState(start);
  const [to, setTo] = useState(end);
  const [turn, setTurn] = useState(first);
  const shown = new Date(first === "inicio" ? start : end);
  const [year, setYear] = useState(shown.getFullYear());
  const [month, setMonth] = useState(shown.getMonth());
  const today = noon(Date.now());

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onEsc, true);
    return () => window.removeEventListener("keydown", onEsc, true);
  }, [onClose]);

  const move = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const pick = (ms: number) => {
    if (turn === "inicio") {
      setFrom(ms);
      if (ms > to) setTo(ms);
      setTurn("fin");
      return;
    }
    // Al marcar el fin queda listo; si quedó antes del inicio, se ordenan solas.
    onApply(Math.min(from, ms), Math.max(from, ms));
  };

  const cells: (number | null)[] = Array.from({ length: monthLead(year, month) }, () => null);
  for (let d = 1; d <= daysInMonth(year, month); d++) cells.push(new Date(year, month, d, 12).getTime());

  return (
    <div className="velo" onClick={onClose}>
      <div className="hoja hoja--chica" role="dialog" aria-modal="true" aria-labelledby="t-rango" onClick={(e) => e.stopPropagation()}>
        <div className="hoja__cuerpo">
          <div>
            <h2 className="tem-title" id="t-rango">{turn === "inicio" ? "Marca el inicio" : "Marca el fin"}</h2>
            <p className="tem-caption" style={{ marginTop: 4 }}>{fmtDate(from)} al {fmtDate(to)}</p>
          </div>
          <div className="cal__mes">
            <button className="icono-btn" onClick={() => move(-1)} aria-label="Mes anterior"><ChevronLeft size={18} strokeWidth={1.5} /></button>
            <span>{M_FULL[month]} {year}</span>
            <button className="icono-btn" onClick={() => move(1)} aria-label="Mes siguiente"><ChevronRight size={18} strokeWidth={1.5} /></button>
          </div>
          <div className="cal__rejilla">
            {WEEKDAY_HEADERS.map((w) => <span key={w} className="cal__cabeza">{w}</span>)}
            {cells.map((ms, i) => {
              if (ms === null) return <span key={`b${i}`} />;
              const edge = ms === from || ms === to;
              const inside = ms > from && ms < to;
              const cls = `cal__dia${edge ? " cal__dia--borde" : inside ? " cal__dia--dentro" : ""}${ms === today ? " cal__dia--hoy" : ""}`;
              return (
                <button key={ms} className={cls} onClick={() => pick(ms)} disabled={max !== undefined && ms > max} aria-label={fmtDate(ms)} aria-pressed={edge}>
                  {new Date(ms).getDate()}
                </button>
              );
            })}
          </div>
        </div>
        <div className="hoja__pie">
          <button className="tem-btn tem-btn--primario" onClick={() => onApply(from, to)}>Aplicar</button>
          <button className="tem-btn tem-btn--secundario" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
