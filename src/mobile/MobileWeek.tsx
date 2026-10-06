import { useStore } from "../store";
import { DAY, DAY_NAMES_FULL, noon, weekRangeLabel } from "../lib/dates";
import type { Proposal } from "../types";

export default function MobileWeek() {
  const s = useStore();
  const { actions } = s;
  const monday = noon(s.calWeekStart);
  const visible = s.proposals.filter((p) => p.status !== "rejected");

  const arrow: React.CSSProperties = {
    all: "unset", cursor: "pointer", width: 38, height: 38, flex: "none", borderRadius: 12,
    display: "grid", placeItems: "center", background: "var(--tem-surface)", border: "1.5px solid var(--tem-ink)",
  };

  return (
    <div style={{ padding: "6px 18px 0" }}>
      <div className="eyebrow">Tu semana</div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <button className="press-sm" style={arrow} onClick={() => actions.calWeekNav(-1)} aria-label="Semana anterior">
          <span style={{ width: 0, height: 0, borderRight: "8px solid var(--tem-ink)", borderTop: "6px solid transparent", borderBottom: "6px solid transparent" }} />
        </button>
        <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 17, letterSpacing: "-.01em" }}>
          {weekRangeLabel(monday)}
        </div>
        <button className="press-sm" style={arrow} onClick={() => actions.calWeekNav(1)} aria-label="Semana siguiente">
          <span style={{ width: 0, height: 0, borderLeft: "8px solid var(--tem-ink)", borderTop: "6px solid transparent", borderBottom: "6px solid transparent" }} />
        </button>
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 18 }}>
        {DAY_NAMES_FULL.map((name, i) => {
          const d = new Date(monday + i * DAY);
          const items = visible.filter((p) => p.day === i);
          return (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tem-handle)", marginBottom: 8 }}>
                {name} {d.getDate()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {items.length === 0 ? (
                  <div style={{ border: "1.5px dashed var(--tem-border-empty)", borderRadius: 16, padding: 14, fontWeight: 500, fontSize: 12, color: "#B8B8B8" }}>
                    Sin publicaciones
                  </div>
                ) : (
                  items.map((p) => <WeekCard key={p.id} p={p} onOpen={() => actions.openWork(p.id)} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekCard({ p, onOpen }: { p: Proposal; onOpen: () => void }) {
  const title = p.line.pre + p.line.key + p.line.post;
  const platStr = p.platforms.join(" · ");

  if (p.status === "scheduled") {
    return (
      <button className="press-sm" onClick={onOpen} style={{ all: "unset", cursor: "pointer", display: "block", background: "var(--tem-ink)", borderRadius: 16, padding: "14px 15px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.55)" }}>
          <span>{platStr}</span>
          <span>{p.time}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, letterSpacing: ".12em", color: "var(--tem-orange)" }}>{p.eyebrow}</div>
        <div style={{ marginTop: 4, fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-.01em" }}>{title}</div>
      </button>
    );
  }

  return (
    <button className="press-sm" onClick={onOpen} style={{ all: "unset", cursor: "pointer", display: "block", background: "var(--tem-surface)", border: "1.5px dashed var(--tem-orange)", borderRadius: 16, padding: "14px 15px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--tem-orange)" }} />
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", color: "var(--tem-orange)" }}>PROPUESTA</span>
        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: "var(--tem-handle)" }}>{platStr}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, letterSpacing: ".12em", color: "var(--tem-orange)", opacity: 0.7 }}>{p.eyebrow}</div>
      <div style={{ marginTop: 4, fontSize: 15, fontWeight: 700, color: "var(--tem-ink)", letterSpacing: "-.01em" }}>{title}</div>
    </button>
  );
}
