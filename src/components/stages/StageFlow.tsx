// Cabecera de la pieza, etapas plegables y barra para avanzar.
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useStore } from "../../store";
import { pieceTitle, platformsStr } from "../../lib/platforms";
import { STAGES, STAGE_HELP, STAGE_LABEL, STAGE_REQUIREMENT, missingFor, nextStage, prevStage, stageIndex, stageSummary } from "../../lib/stages";
import type { Proposal, Stage } from "../../types";
import { EditarPanel, GrabarPanel, GuionPanel, IdeaPanel, ListoPanel, PublicadoPanel } from "./panels";

/** Título de la pieza y en qué etapa va (H01: estado siempre visible). */
export function StageHeader({ p, compact = false }: { p: Proposal; compact?: boolean }) {
  const meta = [p.script?.format || p.type, platformsStr(p.platforms)].filter(Boolean).join(" · ");
  return (
    <div style={{ minWidth: 0 }}>
      <h1 className={compact ? "tem-title rompe" : "tem-h1 rompe"}>{pieceTitle(p)}</h1>
      <p className="tem-caption" style={{ marginTop: 6 }}>
        Etapa {stageIndex(p.stage) + 1} de {STAGES.length}: {STAGE_LABEL[p.stage]}. {meta}. Todo se guarda solo.
      </p>
    </div>
  );
}

/** Una sección por etapa: la actual abierta, las demás plegadas con su resumen. */
export function StageSections({ p, slots }: { p: Proposal; slots?: { onTeleprompter?: () => void } }) {
  const [open, setOpen] = useState<Stage>(p.stage);
  useEffect(() => setOpen(p.stage), [p.stage, p.id]);

  const panel = (st: Stage) => {
    switch (st) {
      case "idea": return <IdeaPanel p={p} />;
      case "guion": return <GuionPanel p={p} />;
      case "grabar": return <GrabarPanel p={p} onTeleprompter={slots?.onTeleprompter} />;
      case "editar": return <EditarPanel p={p} />;
      case "listo": return <ListoPanel p={p} />;
      case "publicado": return <PublicadoPanel p={p} />;
    }
  };

  return (
    <div className="etapas">
      {STAGES.map((st, k) => {
        const isOpen = open === st;
        return (
          <section key={st} className="etapa">
            <button className="etapa__boton" onClick={() => setOpen(isOpen ? p.stage : st)} aria-expanded={isOpen}>
              <span className="etapa__numero">{k + 1}</span>
              <span className="etapa__nombre">{STAGE_LABEL[st]}</span>
              {!isOpen && <span className="etapa__resumen">{stageSummary(p, st)}</span>}
              <ChevronDown size={18} strokeWidth={1.5} className="etapa__flecha" aria-hidden="true" />
            </button>
            {isOpen && (
              <div className="etapa__panel">
                {st !== p.stage && <p className="tem-caption" style={{ marginBottom: 12 }}>{STAGE_HELP[st]}</p>}
                {panel(st)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** Una acción principal para avanzar, que explica qué falta, y una para volver (H03). */
export function AdvanceBar({ p }: { p: Proposal }) {
  const { actions } = useStore();
  const next = nextStage(p.stage);
  const prev = prevStage(p.stage);
  const missing = next ? missingFor(p, next) : null;
  return (
    <>
      <p className="tem-help">
        {next ? (missing ?? `Para pasar a ${STAGE_LABEL[next]}: ${STAGE_REQUIREMENT[next]}.`) : "Pieza publicada. Lo que aprendiste vuelve a Ideas."}
      </p>
      <div className="fila" style={{ flexWrap: "nowrap" }}>
        {next && (
          <button className="tem-btn tem-btn--primario crece" onClick={() => actions.setStage(p.id, next)} disabled={Boolean(missing)}>
            {next === "publicado" ? "Marcar como publicada" : `Pasar a ${STAGE_LABEL[next]}`}
          </button>
        )}
        {prev && <button className="tem-btn tem-btn--secundario" onClick={() => actions.setStage(p.id, prev)}>Volver a {STAGE_LABEL[prev]}</button>}
      </div>
    </>
  );
}
