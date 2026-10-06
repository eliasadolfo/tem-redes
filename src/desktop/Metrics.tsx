import { useStore } from "../store";
import { computeMetrics } from "../lib/metrics";
import { M_ABBR, noon } from "../lib/dates";
import { THEMES } from "../data/mock";
import CalendarPopover from "../components/CalendarPopover";
import type { Grain, MetricNet } from "../types";

const NETS: MetricNet[] = ["Todas", "Instagram", "TikTok", "YouTube", "LinkedIn"];
const PRESETS: { label: string; days?: number; months?: number }[] = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
  { label: "12 meses", months: 12 },
];

export default function Metrics() {
  const s = useStore();
  const { actions } = s;
  const m = computeMetrics(s.metricStart, s.metricEnd, s.grain, s.metricNet);

  const startD = new Date(s.metricStart);
  const endD = new Date(s.metricEnd);
  const rangeLabel = `${startD.getDate()} ${M_ABBR[startD.getMonth()]} – ${endD.getDate()} ${M_ABBR[endD.getMonth()]} ${endD.getFullYear()}`;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }}>
      <div className="eyebrow">Rendimiento</div>
      <h1 style={{ margin: "6px 0 20px", fontWeight: 700, fontSize: 30, letterSpacing: "-.02em" }}>Métricas</h1>

      {/* fila de rango */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ position: "relative" }}>
          <button
            className="press"
            onClick={actions.togglePicker}
            style={{
              display: "flex", alignItems: "center", gap: 8, background: "var(--tem-surface)",
              border: "1.5px solid var(--tem-ink)", borderRadius: 12, padding: "10px 16px", cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>{rangeLabel}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tem-handle)" }}>elegir</span>
          </button>
          {s.pickerOpen && (
            <CalendarPopover
              year={s.pickerY}
              month={s.pickerM}
              onPrevMonth={() => actions.pickerNav(-1)}
              onNextMonth={() => actions.pickerNav(1)}
              onPickDay={actions.pickDay}
              onClose={actions.closePicker}
              helpText="Elige la fecha de inicio y la de fin."
              cellStyle={(ms) => {
                const t = noon(ms);
                const isEnd = t === s.metricStart || t === s.metricEnd;
                const inRange = t >= s.metricStart && t <= s.metricEnd;
                if (isEnd) return { bg: "var(--tem-ink)", fg: "#fff" };
                return { bg: inRange ? "rgba(244,124,60,0.24)" : "transparent", fg: "var(--tem-ink)" };
              }}
            />
          )}
        </div>

        {/* toggle días/meses */}
        <div style={{ display: "flex", background: "var(--tem-surface)", border: "1.5px solid var(--tem-ink)", borderRadius: 12, padding: 3 }}>
          {(["días", "meses"] as Grain[]).map((g) => {
            const active = s.grain === g;
            return (
              <button
                key={g}
                className="press"
                onClick={() => actions.setGrain(g)}
                style={{
                  all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 9,
                  background: active ? "var(--tem-ink)" : "transparent", color: active ? "#fff" : "var(--tem-ink)",
                }}
              >
                {g === "días" ? "Días" : "Meses"}
              </button>
            );
          })}
        </div>

        {/* accesos rápidos */}
        <div style={{ display: "flex", gap: 12, marginLeft: 2 }}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className="preset"
              onClick={() => (p.days ? actions.presetDays(p.days) : actions.presetMonths(p.months!))}
              style={{
                all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--tem-handle)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* fila RED: */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".14em", color: "var(--tem-handle)", marginRight: 4 }}>
          RED:
        </span>
        {NETS.map((n) => {
          const active = s.metricNet === n;
          return (
            <button
              key={n}
              className="press"
              onClick={() => actions.setNet(n)}
              style={{
                all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 999,
                border: "1.5px solid var(--tem-ink)",
                background: active ? "var(--tem-ink)" : "var(--tem-surface)", color: active ? "#fff" : "var(--tem-ink)",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* 4 tarjetas globales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {m.stats.map((st) => (
          <div key={st.label} style={{ background: "var(--tem-surface)", borderRadius: 18, padding: 18, boxShadow: "var(--sh-card)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tem-handle)" }}>{st.label}</div>
            <div className="num" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.03em", margin: "6px 0 2px" }}>{st.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tem-orange)" }}>{st.delta}</div>
          </div>
        ))}
      </div>

      {/* evolución del alcance */}
      <div style={{ background: "var(--tem-surface)", borderRadius: 20, padding: 24, boxShadow: "var(--sh-card)", marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Evolución del alcance</div>
        <div style={{ fontSize: 13, color: "var(--tem-handle)", margin: "4px 0 18px" }}>
          {m.netLabel} · alcance {m.chartUnit} · {rangeLabel}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 200 }}>
          {m.bars.map((b, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
              <div
                style={{
                  width: "100%", maxWidth: 40, height: b.h, borderRadius: "8px 8px 0 0",
                  background: b.max ? "var(--tem-orange)" : "rgba(244,124,60,0.5)",
                }}
              />
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--tem-handle)", marginTop: 6, whiteSpace: "nowrap" }}>
                {b.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* por red social */}
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Por red social</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {m.networkStats.map((ns) => (
          <button
            key={ns.net}
            className="press"
            onClick={() => actions.setNet(ns.selected ? "Todas" : (ns.net as MetricNet))}
            style={{
              all: "unset", cursor: "pointer", boxSizing: "border-box", background: "var(--tem-surface)",
              borderRadius: 18, padding: 18, boxShadow: "var(--sh-card)",
              border: `2px solid ${ns.selected ? "var(--tem-orange)" : "transparent"}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tem-handle)" }}>{ns.net}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "6px 0 2px" }}>
              <span className="num" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.02em" }}>{ns.reach}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tem-orange)" }}>{ns.delta}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--tem-handle)" }}>{ns.foll} seguidores</div>
          </button>
        ))}
      </div>

      {/* temas que más interesan */}
      <div style={{ background: "var(--tem-surface)", borderRadius: 20, padding: 24, boxShadow: "var(--sh-card)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Temas que más interesan</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {THEMES.map((t) => (
            <div key={t.name}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tem-handle)" }}>
                  {t.pct} · {t.note}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "var(--tem-bg)", overflow: "hidden" }}>
                <div style={{ width: t.pct, height: "100%", borderRadius: 999, background: "var(--tem-orange)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
