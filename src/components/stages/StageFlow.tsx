// Cabecera de etapa, acordeón de etapas y barra "Pasar a →" de la ficha.
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { useStore } from "../../store";
import { STAGES, STAGE_HELP, STAGE_LABEL, STAGE_REQUIREMENT, missingFor, nextStage, prevStage, stageIndex, stageSummary } from "../../lib/stages";
import type { Proposal, Stage } from "../../types";
import { EditarPanel, GrabarPanel, GuionPanel, IdeaPanel, ListoPanel, PublicadoPanel } from "./panels";

/** "Etapa N de 6 · Nombre" + barra de progreso (H01: estado siempre visible). */
export function StageHeader({ p, compact = false }: { p: Proposal; compact?: boolean }) {
  const i = stageIndex(p.stage);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span className="eyebrow">Etapa {i + 1} de {STAGES.length}</span>
        <span style={{ fontSize: compact ? 16 : 20, fontWeight: 600, letterSpacing: "-.01em" }}>{STAGE_LABEL[p.stage]}</span>
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 8 }} aria-hidden="true">
        {STAGES.map((st, k) => (
          <span
            key={st}
            title={STAGE_LABEL[st]}
            style={{
              flex: 1, height: 5, borderRadius: 999,
              background: k < i ? "var(--tem-ink)" : k === i ? "var(--tem-orange)" : "var(--tem-border-muted)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Una sección por etapa: la actual abierta, las demás plegadas con resumen.
 * Cualquiera se puede abrir para mirar o editar (nada se bloquea para ver).
 */
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {STAGES.map((st, k) => {
        const isCurrent = st === p.stage;
        const isOpen = open === st;
        const past = k < stageIndex(p.stage);
        return (
          <section
            key={st}
            style={{
              background: "var(--tem-surface)", borderRadius: 18, boxShadow: "var(--sh-card)",
              border: `1.5px solid ${isCurrent ? "var(--tem-orange)" : "transparent"}`, overflow: "hidden",
            }}
          >
            <button
              onClick={() => setOpen(isOpen ? p.stage : st)}
              aria-expanded={isOpen}
              title={STAGE_HELP[st]}
              style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, width: "100%", boxSizing: "border-box", padding: "13px 16px" }}
            >
              <span
                style={{
                  width: 22, height: 22, borderRadius: 999, flex: "none", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600,
                  background: past ? "var(--tem-ink)" : isCurrent ? "var(--tem-orange)" : "var(--tem-border-muted)",
                  color: past || isCurrent ? "#fff" : "var(--tem-handle)",
                }}
              >
                {k + 1}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{STAGE_LABEL[st]}</span>
              {!isOpen && (
                <span style={{ fontSize: 12, fontWeight: 400, color: "var(--tem-handle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                  {stageSummary(p, st)}
                </span>
              )}
              <ChevronDown size={16} strokeWidth={2.4} style={{ marginLeft: "auto", flex: "none", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s ease", color: "var(--tem-handle)" }} />
            </button>
            {isOpen && (
              <div style={{ padding: "2px 16px 16px" }}>
                {!isCurrent && (
                  <div style={{ fontSize: 11, fontWeight: 400, color: "var(--tem-handle)", marginBottom: 12, lineHeight: 1.4 }}>
                    {STAGE_HELP[st]}
                  </div>
                )}
                {panel(st)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/**
 * Barra de acción: UNA primaria ("Pasar a →", o "Programar publicación" al
 * entrar en Listo) que explica qué falta cuando está bloqueada, y una
 * secundaria para volver atrás (H03: siempre se puede).
 */
export function AdvanceBar({ p, stacked = false }: { p: Proposal; stacked?: boolean }) {
  const s = useStore();
  const { actions } = s;
  const next = nextStage(p.stage);
  const prev = prevStage(p.stage);
  const active = p.platforms.filter((t) => !s.pubOff[t]).length;
  const missing = next ? missingFor(p, next, active) : null;

  const primaryLabel = next === "listo" ? "Programar publicación" : next === "publicado" ? "Marcar como publicada" : next ? `Pasar a ${STAGE_LABEL[next]}` : "Ciclo cerrado";
  const onPrimary = () => {
    if (!next) return;
    if (next === "listo") actions.publishNow();
    else actions.setStage(p.id, next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {next && (
        <div style={{ fontSize: 11, fontWeight: 400, lineHeight: 1.4, color: missing ? "var(--tem-orange)" : "var(--tem-handle)" }}>
          {missing ?? `Listo para pasar a ${STAGE_LABEL[next]}: ${STAGE_REQUIREMENT[next]}.`}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: stacked ? "column" : "row", gap: 8 }}>
        {next ? (
          <button
            className="press"
            onClick={onPrimary}
            disabled={Boolean(missing)}
            style={{
              all: "unset", cursor: "pointer", flex: 1, textAlign: "center", fontSize: 14, fontWeight: 500, boxSizing: "border-box",
              background: "var(--tem-ink)", color: "#fff", padding: "12px 18px", borderRadius: 999,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {primaryLabel}
            <ArrowRight size={16} strokeWidth={2.6} />
          </button>
        ) : (
          <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--tem-handle)", padding: 13, textAlign: "center" }}>
            Pieza publicada. Lo que aprendiste puede volver a Ideas.
          </div>
        )}
        {prev && (
          <button
            className="press invert-hover"
            onClick={() => actions.setStage(p.id, prev)}
            title={`Volver a ${STAGE_LABEL[prev]} (se puede deshacer)`}
            style={{
              all: "unset", cursor: "pointer", textAlign: "center", fontSize: 13, fontWeight: 500, color: "var(--tem-ink)", boxSizing: "border-box",
              border: "1px solid var(--tem-border)", padding: "12px 16px", borderRadius: 12, background: "var(--tem-surface)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <ArrowLeft size={15} strokeWidth={2.6} />
            Volver a {STAGE_LABEL[prev]}
          </button>
        )}
      </div>
    </div>
  );
}
