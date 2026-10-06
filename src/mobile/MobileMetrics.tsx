import { useStore } from "../store";
import { computeMetrics } from "../lib/metrics";
import { M_ABBR, noon } from "../lib/dates";
import { THEMES } from "../data/mock";
import CalendarPopover from "../components/CalendarPopover";
import type { MetricNet } from "../types";

const NETS: MetricNet[] = ["Todas", "Instagram", "TikTok", "YouTube", "LinkedIn"];

export default function MobileMetrics() {
  const s = useStore();
  const { actions } = s;
  const m = computeMetrics(s.metricStart, s.metricEnd, s.grain, s.metricNet);

  const startD = new Date(s.metricStart);
  const endD = new Date(s.metricEnd);
  const rangeLabel = `${startD.getDate()} ${M_ABBR[startD.getMonth()]} – ${endD.getDate()} ${M_ABBR[endD.getMonth()]} ${endD.getFullYear()}`;

  return (
    <div style={{ padding: "6px 18px 0" }}>
      <div className="eyebrow">Rendimiento</div>
      <div style={{ marginTop: 6, fontWeight: 700, fontSize: 24, letterSpacing: "-.02em" }}>Métricas</div>

      {/* rango */}
      <div style={{ position: "relative", marginTop: 14 }}>
        <button
          className="press-sm"
          onClick={actions.togglePicker}
          style={{
            all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13,
            padding: "10px 14px", borderRadius: 12, border: "1.5px solid var(--tem-ink)", background: "var(--tem-surface)",
          }}
        >
          <span>{rangeLabel}</span>
          <span style={{ fontWeight: 600, fontSize: 11, color: "var(--tem-handle)" }}>elegir</span>
        </button>
        {s.pickerOpen && (
          <CalendarPopover
            year={s.pickerY}
            month={s.pickerM}
            width={300}
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

      {/* chips de red con scroll horizontal */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 14, paddingBottom: 4 }}>
        {NETS.map((n) => {
          const active = s.metricNet === n;
          return (
            <button
              key={n}
              className="press-sm"
              onClick={() => actions.setNet(n)}
              style={{
                all: "unset", cursor: "pointer", flex: "none", fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 999,
                border: "1.5px solid var(--tem-ink)", background: active ? "var(--tem-ink)" : "var(--tem-surface)", color: active ? "#fff" : "var(--tem-ink)",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* tarjetas 2x2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        {m.stats.map((st) => (
          <div key={st.label} style={{ background: "var(--tem-surface)", borderRadius: 18, padding: 16, boxShadow: "var(--sh-card)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tem-handle)" }}>{st.label}</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.03em", margin: "6px 0 2px" }}>{st.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--tem-orange)" }}>{st.delta}</div>
          </div>
        ))}
      </div>

      {/* gráfico */}
      <div style={{ background: "var(--tem-surface)", borderRadius: 20, padding: 18, boxShadow: "var(--sh-card)", marginTop: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Evolución del alcance</div>
        <div style={{ fontSize: 12, color: "var(--tem-handle)", margin: "4px 0 14px" }}>
          {m.netLabel} · alcance {m.chartUnit}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 130 }}>
          {m.bars.map((b, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", maxWidth: 22, height: b.h, borderRadius: "8px 8px 0 0", background: b.max ? "var(--tem-orange)" : "rgba(244,124,60,0.5)" }} />
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--tem-handle)", marginTop: 5, whiteSpace: "nowrap" }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* temas */}
      <div style={{ background: "var(--tem-surface)", borderRadius: 20, padding: 18, boxShadow: "var(--sh-card)", marginTop: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Temas que más interesan</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {THEMES.map((t) => (
            <div key={t.name}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tem-handle)" }}>{t.pct}</span>
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
