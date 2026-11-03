import type { CSSProperties, DragEvent } from "react";
import { useStore } from "../store";
import { pieceTitle, platformsStr } from "../lib/platforms";
import { STAGE_LABEL, missingFor, nextStage } from "../lib/stages";
import type { Proposal } from "../types";

interface Props {
  p: Proposal;
  /** Arrastrable (tablero de escritorio). */
  draggable?: boolean;
  style?: CSSProperties;
}

/**
 * Tarjeta única de pieza (H04): la misma en tablero, calendario, ideas y teléfono.
 * Clic abre la ficha. Debajo, lo que falta para avanzar o el paso siguiente.
 */
export default function PieceCard({ p, draggable = false, style }: Props) {
  const { actions } = useStore();
  const next = nextStage(p.stage);
  const missing = next ? missingFor(p, next) : null;
  const scheduled = p.stage === "listo" || p.stage === "publicado";
  const meta = scheduled
    ? [platformsStr(p.platforms) || "Sin redes", p.time].filter(Boolean).join(" · ")
    : [p.script?.format || p.type, p.eyebrow].filter(Boolean).join(" · ");

  const onDragStart = (e: DragEvent<HTMLElement>) => {
    e.dataTransfer.setData("text/piece-id", p.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <article className="pieza" draggable={draggable} onDragStart={draggable ? onDragStart : undefined} style={style}>
      <button className="pieza__abrir" onClick={() => actions.openWork(p.id)}>
        <span className="pieza__titulo">{pieceTitle(p)}</span>
        <span className="tem-caption">{meta}</span>
      </button>
      {next && (missing
        ? <p className="tem-caption">{missing}</p>
        : <button className="tem-btn tem-btn--texto" onClick={() => actions.setStage(p.id, next)}>Pasar a {STAGE_LABEL[next]}</button>
      )}
    </article>
  );
}
