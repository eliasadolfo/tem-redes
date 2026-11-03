import { useState } from "react";
import { GENERAL_RULES, durationLabel, type FormatGuide as Guide, type MockLayer } from "../lib/formatos";

/**
 * Hoja de rodaje del formato: maqueta de la pieza terminada (zonas seguras y dónde
 * cae cada capa) más las directrices de la Oficina de Contenido. Se lee, no se edita.
 */
export default function FormatGuide({ g }: { g: Guide }) {
  const [layer, setLayer] = useState<MockLayer | null>(null);
  const rows: [string, string][] = [
    ["Encuadre", g.frame],
    ["Luz", g.light],
    ["Audio", g.audio],
    ["Ritmo", g.pace],
    ["Texto en pantalla", g.onScreen],
  ];
  return (
    <div className="guia">
      <p className="tem-small tem-muted">{[g.aspect, g.duration ? durationLabel(g) : g.extent, g.resolution].filter(Boolean).join(" · ")}</p>

      <div className="guia__maqueta">
        <Mock g={g} active={layer} onPick={setLayer} />
        <div className="guia__capas">
          {g.layers.map((l) => {
            const on = layer?.name === l.name;
            return (
              <button key={l.name} className="guia__capa" onClick={() => setLayer(on ? null : l)} aria-pressed={on}>
                <span className="medio">{l.name}{l.when ? `: ${l.when}` : ""}</span>
                <small>{l.style}</small>
              </button>
            );
          })}
          {g.safe.top + g.safe.bottom > 0 && (
            <p className="tem-caption" style={{ padding: "6px 8px" }}>
              Zonas grises: nada importante ahí. Arriba {g.safe.top} px, abajo {g.safe.bottom} px, lados {g.safe.left} y {g.safe.right} px.
            </p>
          )}
        </div>
      </div>

      <dl className="guia__datos">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <div className="grupo__cabeza" style={{ marginBottom: 6 }}>No hacer</div>
        <ul className="guia__lista">{g.avoid.map((t) => <li key={t}>{t}</li>)}</ul>
      </div>

      {g.thumbnail && <p className="tem-small"><span className="medio">Portada: </span>{g.thumbnail}</p>}

      <details>
        <summary>Reglas de siempre ({GENERAL_RULES.length})</summary>
        <ul className="guia__lista" style={{ marginTop: 8 }}>{GENERAL_RULES.map((t) => <li key={t}>{t}</li>)}</ul>
      </details>
    </div>
  );
}

/** Lienzo a escala con zonas seguras en gris y cada capa como un recuadro. */
function Mock({ g, active, onPick }: { g: Guide; active: MockLayer | null; onPick: (l: MockLayer | null) => void }) {
  const width = g.orientation === "horizontal" ? 300 : 180;
  const height = Math.round((width * g.canvas.h) / g.canvas.w);
  const pct = (px: number, total: number) => `${(px / total) * 100}%`;
  return (
    <div className="maqueta" style={{ width, height }} aria-label={`Maqueta ${g.aspect}`}>
      {g.safe.top > 0 && <div className="maqueta__zona" style={{ left: 0, right: 0, top: 0, height: pct(g.safe.top, g.canvas.h) }} />}
      {g.safe.bottom > 0 && <div className="maqueta__zona" style={{ left: 0, right: 0, bottom: 0, height: pct(g.safe.bottom, g.canvas.h) }} />}
      {g.safe.left > 0 && <div className="maqueta__zona" style={{ top: 0, bottom: 0, left: 0, width: pct(g.safe.left, g.canvas.w) }} />}
      {g.safe.right > 0 && <div className="maqueta__zona" style={{ top: 0, bottom: 0, right: 0, width: pct(g.safe.right, g.canvas.w) }} />}
      {g.layers.map((l) => {
        const full = l.x[0] === 0 && l.x[1] === 100 && l.y[1] - l.y[0] >= 50;
        const on = active?.name === l.name;
        return (
          <button
            key={l.name}
            className={`maqueta__capa${full ? " maqueta__capa--fondo" : ""}`}
            onClick={() => onPick(on ? null : l)}
            aria-pressed={on}
            title={`${l.name}: ${l.style}`}
            style={{ left: `${l.x[0]}%`, top: `${l.y[0]}%`, width: `${l.x[1] - l.x[0]}%`, height: `${l.y[1] - l.y[0]}%` }}
          >
            {l.name}
          </button>
        );
      })}
      {g.layers.length === 0 && <div className="maqueta__nada">Sin maqueta: no se graba video</div>}
    </div>
  );
}
