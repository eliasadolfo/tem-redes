import { useState, type DragEvent } from "react";
import { useStore } from "../store";
import PieceCard from "../components/PieceCard";
import { STAGES, STAGE_HELP, STAGE_LABEL } from "../lib/stages";
import type { Stage } from "../types";

/** Tablero: la línea de producción en 6 columnas. Pantalla de entrada. */
export default function Tablero() {
  const { proposals, loading, actions } = useStore();
  const [over, setOver] = useState<Stage | null>(null);
  const active = proposals.filter((p) => p.status !== "rejected");

  const onDrop = (stage: Stage) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/piece-id");
    if (id) actions.setStage(id, stage);
  };

  return (
    <div style={{ padding: "32px 28px 32px 40px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="eyebrow">Línea de producción</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, margin: "6px 0 20px" }}>
        <h1 style={{ margin: 0, fontWeight: 600, fontSize: 30, letterSpacing: "-.02em" }}>Tablero</h1>
        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--tem-handle)" }}>
          {active.length} piezas en curso · arrastra o usa “Pasar a” para moverlas
        </span>
      </div>

      <div
        style={{
          display: "grid", gridTemplateColumns: "repeat(6, minmax(190px, 1fr))", gap: 12,
          flex: 1, alignItems: "stretch", overflowX: "auto", paddingBottom: 8,
        }}
      >
        {STAGES.map((stage) => {
          const items = active.filter((p) => p.stage === stage);
          const isOver = over === stage;
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                if (over !== stage) setOver(stage);
              }}
              onDragLeave={() => setOver((o) => (o === stage ? null : o))}
              onDrop={onDrop(stage)}
              style={{
                display: "flex", flexDirection: "column", gap: 10, minWidth: 0,
                borderRadius: 20, padding: 8, transition: "background .16s ease",
                background: isOver ? "rgba(244,124,60,.10)" : "transparent",
                outline: isOver ? "1.5px dashed var(--tem-orange)" : "1.5px dashed transparent",
              }}
            >
              <div
                title={STAGE_HELP[stage]}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 6px" }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {STAGE_LABEL[stage]}
                </span>
                <span
                  style={{
                    fontSize: 11, fontWeight: 600, minWidth: 22, height: 22, padding: "0 7px", borderRadius: 999,
                    display: "grid", placeItems: "center",
                    background: items.length ? "var(--tem-ink)" : "var(--tem-border-muted)",
                    color: items.length ? "#fff" : "var(--tem-handle)",
                  }}
                >
                  {items.length}
                </span>
              </div>

              {loading ? (
                <>
                  <div className="skeleton" style={{ height: 120 }} aria-busy="true" />
                  <div className="skeleton" style={{ height: 120, opacity: 0.6 }} aria-busy="true" />
                </>
              ) : items.length === 0 ? (
                <EmptyColumn stage={stage} />
              ) : (
                items.map((p) => <PieceCard key={p.id} p={p} draggable />)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** H10 — cada columna vacía explica la etapa y cómo llega algo ahí. */
function EmptyColumn({ stage }: { stage: Stage }) {
  const { actions } = useStore();
  return (
    <div
      style={{
        border: "1.5px dashed var(--tem-border-empty)", borderRadius: 16, padding: "16px 14px",
        fontSize: 12, fontWeight: 400, color: "var(--tem-handle)", lineHeight: 1.45, minHeight: 110,
      }}
    >
      {STAGE_HELP[stage]}
      {stage === "idea" && (
        <button
          className="press"
          onClick={() => actions.go("ideas")}
          style={{
            all: "unset", cursor: "pointer", display: "block", marginTop: 10, fontSize: 12, fontWeight: 500,
            color: "var(--tem-ink)", border: "1px solid var(--tem-border)", borderRadius: 10, padding: "7px 11px",
          }}
        >
          Anotar una idea
        </button>
      )}
    </div>
  );
}
