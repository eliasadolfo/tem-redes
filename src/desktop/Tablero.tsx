import { useState, type DragEvent } from "react";
import { useStore } from "../store";
import PieceCard from "../components/PieceCard";
import LoteSheet from "../components/LoteSheet";
import { STAGES, STAGE_HELP, STAGE_LABEL } from "../lib/stages";
import type { Stage } from "../types";

/** Tablero: la línea de producción en 6 columnas. Pantalla de entrada. */
export default function Tablero() {
  const { proposals, loading, loadError, actions } = useStore();
  const [over, setOver] = useState<Stage | null>(null);
  const [lote, setLote] = useState(false);
  const active = proposals.filter((p) => p.status !== "rejected");

  const onDrop = (stage: Stage) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/piece-id");
    if (id) actions.setStage(id, stage);
  };

  return (
    <div className="pagina pagina--ancha">
      <div className="cabecera">
        <div className="cabecera__texto">
          <h1 className="tem-h1">Tablero</h1>
          {!loadError && <p className="tem-caption">{active.length === 1 ? "1 pieza en curso" : `${active.length} piezas en curso`}. Arrastra una pieza para moverla.</p>}
        </div>
        <button className="tem-btn tem-btn--secundario" onClick={() => setLote(true)}>Programar en lote</button>
      </div>

      <div className="tablero">
        {STAGES.map((stage) => {
          const items = active.filter((p) => p.stage === stage);
          return (
            <div
              key={stage}
              className={`columna${over === stage ? " columna--sobre" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (over !== stage) setOver(stage);
              }}
              onDragLeave={() => setOver((o) => (o === stage ? null : o))}
              onDrop={onDrop(stage)}
            >
              <div className="columna__cabeza" title={STAGE_HELP[stage]}>
                <span>{STAGE_LABEL[stage]}</span>
                <span>{items.length}</span>
              </div>
              {loading ? (
                <>
                  <div className="skeleton" style={{ height: 96 }} aria-busy="true" />
                  <div className="skeleton" style={{ height: 96 }} aria-busy="true" />
                </>
              ) : items.length === 0 ? (
                <p className="tem-caption columna__vacia">{STAGE_HELP[stage]}</p>
              ) : (
                items.map((p) => <PieceCard key={p.id} p={p} draggable />)
              )}
            </div>
          );
        })}
      </div>
      {lote && <LoteSheet onClose={() => setLote(false)} />}
    </div>
  );
}
