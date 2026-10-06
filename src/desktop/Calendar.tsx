import { useState } from "react";
import { useStore } from "../store";
import {
  DAY,
  WK_ABBR,
  noon,
  weekRangeLabel,
} from "../lib/dates";
import CalendarPopover from "../components/CalendarPopover";
import type { PlatformTag, Proposal } from "../types";

const TODAY = new Date(2026, 6, 23, 12).getTime();
const PLAT_FILTERS: (PlatformTag | "Todas")[] = ["Todas", "IG", "TikTok", "Shorts", "YouTube", "in"];
const PLAT_FILTER_LABEL: Record<string, string> = {
  Todas: "Todas", IG: "IG", TikTok: "TikTok", Shorts: "Shorts", YouTube: "YouTube", in: "LinkedIn",
};

export default function Calendar() {
  const s = useStore();
  const { actions } = s;
  const [platFilter, setPlatFilter] = useState<PlatformTag | "Todas">("Todas");

  const monday = noon(s.calWeekStart);
  const visible = s.proposals.filter(
    (p) => p.status !== "rejected" && (platFilter === "Todas" || p.platforms.includes(platFilter)),
  );

  const arrowBtn: React.CSSProperties = {
    width: 38, height: 38, borderRadius: 12, background: "var(--tem-surface)",
    border: "1.5px solid var(--tem-ink)", display: "grid", placeItems: "center", cursor: "pointer",
  };

  return (
    <div style={{ padding: "32px 40px" }}>
      <div className="eyebrow">Tu semana</div>

      {/* fila de controles */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          <button className="press" style={arrowBtn} onClick={() => actions.calWeekNav(-1)} aria-label="Semana anterior">
            <Triangle dir="left" />
          </button>
          <button className="press" style={arrowBtn} onClick={() => actions.calWeekNav(1)} aria-label="Semana siguiente">
            <Triangle dir="right" />
          </button>
          <div style={{ position: "relative" }}>
            <button
              className="press"
              onClick={actions.toggleCalPicker}
              style={{
                display: "flex", alignItems: "center", gap: 8, background: "var(--tem-surface)",
                border: "1.5px solid var(--tem-ink)", borderRadius: 12, padding: "10px 16px", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>{weekRangeLabel(monday)}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tem-handle)" }}>elegir</span>
            </button>
            {s.calPickerOpen && (
              <CalendarPopover
                year={s.calPickerY}
                month={s.calPickerM}
                onPrevMonth={() => actions.calPickerNav(-1)}
                onNextMonth={() => actions.calPickerNav(1)}
                onPickDay={actions.calPickDay}
                onClose={actions.closeCalPicker}
                helpText="Elige un día para ver esa semana."
                cellStyle={(ms) => {
                  const inWeek = ms >= monday && ms <= monday + 6 * DAY;
                  if (ms === TODAY) return { bg: "var(--tem-ink)", fg: "#fff" };
                  return { bg: inWeek ? "rgba(244,124,60,0.24)" : "transparent", fg: "var(--tem-ink)" };
                }}
              />
            )}
          </div>
        </div>

        {/* filtros de plataforma */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          {PLAT_FILTERS.map((f) => {
            const active = platFilter === f;
            return (
              <button
                key={f}
                className="press"
                onClick={() => setPlatFilter(f)}
                style={{
                  border: "1.5px solid var(--tem-ink)", borderRadius: 999, padding: "7px 14px",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: active ? "var(--tem-ink)" : "var(--tem-surface)",
                  color: active ? "#fff" : "var(--tem-ink)",
                }}
              >
                {PLAT_FILTER_LABEL[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* rejilla semanal */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginTop: 24 }}>
        {WK_ABBR.map((wk, i) => {
          const d = new Date(monday + i * DAY);
          const items = visible.filter((p) => p.day === i);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tem-handle)", padding: "0 2px" }}>
                {wk} {d.getDate()}
              </div>
              {items.length === 0 ? (
                <EmptySlot />
              ) : (
                items.map((p) => <PieceCard key={p.id} p={p} onOpen={() => actions.openWork(p.id)} />)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Triangle({ dir }: { dir: "left" | "right" }) {
  return (
    <span
      style={{
        width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent",
        [dir === "left" ? "borderRight" : "borderLeft"]: "7px solid var(--tem-ink)",
      }}
    />
  );
}

function EmptySlot() {
  return (
    <div
      style={{
        border: "1.5px dashed var(--tem-border-empty)", borderRadius: 16, padding: "14px 15px",
        fontSize: 12, fontWeight: 500, color: "#B8B8B8", minHeight: 64, display: "grid", placeItems: "center",
      }}
    >
      Sin publicaciones
    </div>
  );
}

function PieceCard({ p, onOpen }: { p: Proposal; onOpen: () => void }) {
  const scheduled = p.status === "scheduled";
  const platStr = p.platforms.join(" · ");
  const title = p.line.pre + p.line.key + p.line.post;

  if (scheduled) {
    return (
      <button
        className="press"
        onClick={onOpen}
        style={{
          all: "unset", cursor: "pointer", boxSizing: "border-box",
          background: "var(--tem-ink)", borderRadius: 16, padding: "14px 15px", display: "block",
        }}
      >
        <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)", marginBottom: 8 }}>
          {platStr}{p.time ? " · " + p.time : ""}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", color: "var(--tem-orange)" }}>
          {p.eyebrow}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 4, lineHeight: 1.2 }}>{title}</div>
      </button>
    );
  }

  return (
    <button
      className="press"
      onClick={onOpen}
      style={{
        all: "unset", cursor: "pointer", boxSizing: "border-box",
        background: "var(--tem-surface)", border: "1.5px dashed var(--tem-orange)",
        borderRadius: 16, padding: "14px 15px", display: "block",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--tem-orange)" }} />
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", color: "var(--tem-orange)" }}>
          PROPUESTA
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tem-ink)", lineHeight: 1.2 }}>{title}</div>
    </button>
  );
}
