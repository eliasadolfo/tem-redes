import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  M_FULL,
  WEEKDAY_HEADERS,
  daysInMonth,
  monthLead,
} from "../lib/dates";

export interface CellStyle {
  bg: string;
  fg: string;
}

interface Props {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPickDay: (ms: number) => void;
  onClose: () => void;
  /** Estilo de cada celda según su timestamp (mediodía). */
  cellStyle: (ms: number) => CellStyle;
  helpText: string;
  width?: number;
}

/**
 * Popover de calendario — compartido por Calendario y Métricas.
 * Semana empieza en lunes. Un scrim fijo cierra al hacer clic fuera.
 */
export default function CalendarPopover({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onPickDay,
  onClose,
  cellStyle,
  helpText,
  width = 308,
}: Props) {
  const lead = monthLead(year, month);
  const dim = daysInMonth(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(new Date(year, month, d, 12).getTime());

  const arrowBtn: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 9,
    background: "var(--tem-bg)",
    border: "none",
    display: "grid",
    placeItems: "center",
    color: "var(--tem-ink)",
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 30 }}
      />
      <div
        style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          left: 0,
          width,
          background: "var(--tem-surface)",
          borderRadius: 18,
          padding: 18,
          boxShadow: "var(--sh-popover)",
          zIndex: 31,
        }}
      >
        {/* cabecera */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <button className="press-sm press" style={arrowBtn} onClick={onPrevMonth} aria-label="Mes anterior">
            <ChevronLeft size={18} strokeWidth={2.4} />
          </button>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {M_FULL[month]} {year}
          </div>
          <button className="press-sm press" style={arrowBtn} onClick={onNextMonth} aria-label="Mes siguiente">
            <ChevronRight size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* encabezados de día */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
          {WEEKDAY_HEADERS.map((w) => (
            <div
              key={w}
              style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--tem-handle)" }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* celdas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((ms, i) => {
            if (ms === null) return <div key={"b" + i} style={{ height: 34 }} />;
            const cs = cellStyle(ms);
            return (
              <button
                key={ms}
                onClick={() => onPickDay(ms)}
                className="press-sm"
                style={{
                  height: 34,
                  borderRadius: 9,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  background: cs.bg,
                  color: cs.fg,
                  cursor: "pointer",
                }}
              >
                {new Date(ms).getDate()}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "var(--tem-handle)" }}>{helpText}</div>
      </div>
    </>
  );
}
