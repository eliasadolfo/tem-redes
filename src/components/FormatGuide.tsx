import { useState } from "react";
import { GENERAL_RULES, durationLabel, type FormatGuide as Guide, type MockLayer } from "../lib/formatos";

/**
 * Hoja de rodaje del formato: maqueta de la pieza terminada (zonas seguras y
 * dónde cae cada capa) + directrices de la Oficina de Contenido. Se lee, no se
 * edita: así quien graba sabe para qué encuadre está grabando (H06: reconocer).
 */
export default function FormatGuide({ g, compact = false }: { g: Guide; compact?: boolean }) {
  const [layer, setLayer] = useState<MockLayer | null>(null);
  const rows: [string, string][] = [
    ["Encuadre", g.frame],
    ["Luz", g.light],
    ["Audio", g.audio],
    ["Ritmo", g.pace],
    ["Texto en pantalla", g.onScreen],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 12, fontWeight: 500, alignItems: "baseline" }}>
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.01em" }}>{g.name}</span>
        <span style={{ color: "var(--tem-handle)" }}>{g.aspect}</span>
        {g.duration && <span style={{ color: "var(--tem-orange)" }}>{durationLabel(g)}</span>}
        {!g.duration && g.extent && <span style={{ color: "var(--tem-orange)" }}>{g.extent}</span>}
      </div>
      <div style={{ fontSize: 11, fontWeight: 400, color: "var(--tem-handle)" }}>{g.resolution}</div>

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: compact ? "wrap" : "nowrap" }}>
        <Mock g={g} active={layer} onPick={setLayer} />
        <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".01em", color: "var(--tem-handle)" }}>Así queda la pieza</div>
          {g.layers.map((l) => {
            const on = layer?.name === l.name;
            return (
              <button
                key={l.name}
                className="press-sm"
                onClick={() => setLayer(on ? null : l)}
                aria-pressed={on}
                style={{
                  all: "unset", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2, padding: "6px 8px", borderRadius: 10,
                  background: on ? "var(--tem-bg)" : "transparent", border: `1.5px solid ${on ? "var(--tem-orange)" : "transparent"}`,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 500 }}>{l.name}{l.when ? <span style={{ fontWeight: 400, color: "var(--tem-handle)" }}> · {l.when}</span> : null}</span>
                <span style={{ fontSize: 11, fontWeight: 400, lineHeight: 1.35, color: on ? "var(--tem-ink)" : "var(--tem-handle)" }}>{l.style}</span>
              </button>
            );
          })}
          {g.layers.length === 0 && <div style={{ fontSize: 12, fontWeight: 400, color: "var(--tem-handle)" }}>{g.frame}</div>}
          {g.safe.top + g.safe.bottom > 0 && (
            <div style={{ fontSize: 11, fontWeight: 400, color: "var(--tem-handle)", lineHeight: 1.4 }}>
              Zonas rayadas: nada importante ahí (interfaz de la red). Arriba {g.safe.top} px, abajo {g.safe.bottom} px, lados {g.safe.left}/{g.safe.right} px.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ background: "var(--tem-bg)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".01em", color: "var(--tem-handle)", marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.45 }}>{v}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".01em", color: "var(--tem-orange)", marginBottom: 6 }}>No hacer</div>
        <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>
          {g.avoid.map((t) => <li key={t} style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.4 }}>{t}</li>)}
        </ul>
      </div>

      {g.thumbnail && (
        <div style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.45 }}>
          <span style={{ fontWeight: 500 }}>Miniatura / portada: </span>{g.thumbnail}
        </div>
      )}

      <details>
        <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 500, color: "var(--tem-handle)" }}>Reglas de siempre ({GENERAL_RULES.length})</summary>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
          {GENERAL_RULES.map((t) => <li key={t} style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.4 }}>{t}</li>)}
        </ul>
      </details>
    </div>
  );
}

/** Maqueta: lienzo a escala con zonas seguras rayadas y cada capa como un recuadro. */
function Mock({ g, active, onPick }: { g: Guide; active: MockLayer | null; onPick: (l: MockLayer | null) => void }) {
  const horizontal = g.orientation === "horizontal";
  const width = horizontal ? 300 : 180;
  const height = Math.round((width * g.canvas.h) / g.canvas.w);
  const pct = (px: number, total: number) => `${(px / total) * 100}%`;
  const hatch = "repeating-linear-gradient(135deg, rgba(244,124,60,.4) 0 2px, transparent 2px 9px)";
  const dark = g.key !== "newsletter";
  return (
    <div
      aria-label={`Maqueta ${g.aspect}`}
      style={{
        position: "relative", width, height, flex: "none", maxWidth: "100%", borderRadius: 14, overflow: "hidden",
        background: dark ? "#111" : "var(--tem-bg)", border: "1px solid var(--tem-border)", boxSizing: "border-box",
      }}
    >
      {/* zonas seguras */}
      {g.safe.top > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: pct(g.safe.top, g.canvas.h), background: hatch }} />}
      {g.safe.bottom > 0 && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: pct(g.safe.bottom, g.canvas.h), background: hatch }} />}
      {g.safe.left > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: pct(g.safe.left, g.canvas.w), background: hatch }} />}
      {g.safe.right > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: pct(g.safe.right, g.canvas.w), background: hatch }} />}

      {/* capas, de fondo a frente */}
      {g.layers.map((l) => {
        const full = l.x[0] === 0 && l.x[1] === 100 && l.y[1] - l.y[0] >= 50;
        const on = active?.name === l.name;
        return (
          <button
            key={l.name}
            onClick={() => onPick(on ? null : l)}
            title={`${l.name}: ${l.style}`}
            aria-label={l.name}
            style={{
              all: "unset", cursor: "pointer", position: "absolute", boxSizing: "border-box",
              left: `${l.x[0]}%`, top: `${l.y[0]}%`, width: `${l.x[1] - l.x[0]}%`, height: `${l.y[1] - l.y[0]}%`,
              border: full ? "1.5px dashed rgba(255,255,255,.45)" : `1.5px solid ${on ? "#fff" : "var(--tem-orange)"}`,
              background: on ? "rgba(244,124,60,.45)" : full ? "transparent" : "rgba(244,124,60,.22)",
              borderRadius: 4, display: "flex", alignItems: full ? "flex-end" : "center", justifyContent: full ? "center" : "flex-start",
              padding: 3, fontSize: 9, fontWeight: 500, letterSpacing: ".04em", color: dark || full ? "#fff" : "var(--tem-ink)",
              lineHeight: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            }}
          >
            {l.name}
          </button>
        );
      })}
      {g.layers.length === 0 && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 500, color: "var(--tem-handle)", textAlign: "center", padding: 10 }}>
          Sin maqueta: no se graba video
        </div>
      )}
    </div>
  );
}
