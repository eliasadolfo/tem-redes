import type { CSSProperties, DragEvent } from "react";
import { ArrowRight } from "lucide-react";
import { useStore } from "../store";
import { PLATFORM_LABEL } from "../lib/platforms";
import { STAGE_LABEL, missingFor, nextStage, stageSummary } from "../lib/stages";
import type { Proposal } from "../types";

interface Props {
  p: Proposal;
  /** Muestra la etapa actual como etiqueta (útil fuera del tablero). */
  showStage?: boolean;
  /** Arrastrable (tablero de escritorio). */
  draggable?: boolean;
  style?: CSSProperties;
}

/**
 * Tarjeta única de pieza (H04): misma en tablero, calendario, ideas y móvil.
 * Clic abre la ficha; "Pasar a →" es la única acción primaria y explica qué
 * falta cuando está bloqueada (H05/H09).
 */
export default function PieceCard({ p, showStage = false, draggable = false, style }: Props) {
  const { actions } = useStore();
  const title = p.line.pre + p.line.key + p.line.post;
  const next = nextStage(p.stage);
  const missing = next ? missingFor(p, next) : null;
  const done = p.stage === "publicado";

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/piece-id", p.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      style={{
        background: done ? "var(--tem-ink)" : "var(--tem-surface)",
        color: done ? "#fff" : "var(--tem-ink)",
        borderRadius: 18,
        padding: "14px 14px 12px",
        boxShadow: "var(--sh-card)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: draggable ? "grab" : "default",
        ...style,
      }}
    >
      <button
        onClick={() => actions.openWork(p.id)}
        title={`Abrir la ficha · ${STAGE_LABEL[p.stage]}`}
        style={{ all: "unset", cursor: "pointer", display: "block", width: "100%", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {p.platforms.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 999,
                border: `1.5px solid ${done ? "rgba(255,255,255,.4)" : "var(--tem-ink)"}`,
              }}
            >
              {PLATFORM_LABEL[t]}
            </span>
          ))}
          {showStage && (
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: "var(--tem-orange)" }}>
              {STAGE_LABEL[p.stage].toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, letterSpacing: ".12em", color: "var(--tem-orange)" }}>
          {p.eyebrow}
        </div>
        <div style={{ marginTop: 3, fontSize: 15, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-.01em" }}>{title}</div>
        <div style={{ marginTop: 5, fontSize: 11, fontWeight: 500, color: done ? "rgba(255,255,255,.6)" : "var(--tem-handle)", lineHeight: 1.35 }}>
          {stageSummary(p, p.stage)}
        </div>
      </button>

      {next && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
          {missing && (
            <span style={{ alignSelf: "stretch", fontSize: 10, fontWeight: 500, color: "var(--tem-handle)", lineHeight: 1.3 }}>
              {missing}
            </span>
          )}
          <button
            className="press"
            onClick={() => actions.setStage(p.id, next)}
            disabled={Boolean(missing)}
            title={missing ?? `Pasar a ${STAGE_LABEL[next]}`}
            style={{
              all: "unset", cursor: "pointer", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 12, fontWeight: 600, background: "var(--tem-orange)", color: "#fff",
              padding: "7px 11px", borderRadius: 10,
            }}
          >
            Pasar a {STAGE_LABEL[next]}
            <ArrowRight size={13} strokeWidth={2.6} />
          </button>
        </div>
      )}
    </div>
  );
}
