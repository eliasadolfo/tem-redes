import { useState } from "react";
import { useStore } from "../store";
import PieceCard from "../components/PieceCard";
import { STAGES, STAGE_LABEL, parseLine, pieceWhen } from "../lib/stages";
import { noon } from "../lib/dates";
import type { Proposal, Stage } from "../types";

/** Inicio en el teléfono: resumen del tablero, qué toca hoy e idea rápida. */
export default function MobileHome() {
  const { proposals, generating, loading, loadError, actions } = useStore();
  const [line, setLine] = useState("");
  const [tema, setTema] = useState("");
  const active = proposals.filter((p) => p.status !== "rejected");
  const count = (st: Stage) => active.filter((p) => p.stage === st).length;

  const today = noon(Date.now());
  const isToday = (p: Proposal) => {
    const when = pieceWhen(p);
    return when !== null && noon(new Date(when).getTime()) === today;
  };
  const groups: { title: string; items: Proposal[] }[] = [
    { title: "Sale hoy", items: active.filter((p) => p.stage === "listo" && isToday(p)) },
    { title: "Por editar", items: active.filter((p) => p.stage === "editar") },
    { title: "Por grabar", items: active.filter((p) => p.stage === "grabar") },
  ].filter((g) => g.items.length > 0);

  const addIdea = () => {
    const clean = line.trim();
    if (!clean) return;
    const idea = actions.addIdea({ line: parseLine(clean) });
    setLine("");
    actions.flash("Idea anotada", () => actions.reject(idea.id));
  };

  return (
    <div className="pagina">
      <div className="cabecera">
        <div className="cabecera__texto">
          <h1 className="tem-h1">{loadError ? "Inicio" : active.length === 1 ? "1 pieza en curso" : `${active.length} piezas en curso`}</h1>
        </div>
      </div>

      <div className="resumen-etapas">
        {STAGES.map((st) => (
          <div key={st} className="tem-card">
            <p className="tem-metric__label">{STAGE_LABEL[st]}</p>
            {loading ? <div className="skeleton" style={{ height: 28, width: 32, marginTop: 4 }} /> : <p className="tem-metric__valor">{count(st)}</p>}
          </div>
        ))}
      </div>

      <div className="pila seccion">
        <div className="tema-ia">
          <div className="tem-field">
            <label className="tem-label" htmlFor="idea-rapida">Idea nueva</label>
            <input id="idea-rapida" className="tem-input" value={line} onChange={(e) => setLine(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addIdea()} placeholder="Con la *palabra clave*" />
          </div>
          <button className="tem-btn tem-btn--primario" onClick={addIdea} disabled={!line.trim()}>Anotar</button>
        </div>
        <div className="tema-ia">
          <div className="tem-field">
            <label className="tem-label" htmlFor="tema-movil">Tema de la semana</label>
            <input id="tema-movil" className="tem-input" value={tema} onChange={(e) => setTema(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !generating && actions.generateIdeas(tema)} disabled={generating} />
          </div>
          <button className="tem-btn tem-btn--secundario" onClick={() => actions.generateIdeas(tema)} disabled={generating}>
            {generating && <span className="spinner" aria-hidden="true" />}
            {generating ? "Pensando…" : "Generar"}
          </button>
        </div>
      </div>

      <h2 className="tem-title" style={{ margin: "24px 0 12px" }}>Qué toca hoy</h2>
      {loading ? (
        <div className="pila" aria-busy="true">{[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 96 }} />)}</div>
      ) : groups.length === 0 ? (
        <div className="tem-card">
          <div className="vacio" style={{ padding: 0 }}>
            <p style={{ marginTop: 0 }}>Nada urgente. Aquí aparece lo que sale hoy, lo que está por editar y lo que hay que grabar.</p>
          </div>
        </div>
      ) : (
        <div className="pila">
          {groups.map((g) => (
            <div key={g.title} className="pila pila--chica">
              <div className="grupo__cabeza">{g.title}<span>{g.items.length}</span></div>
              {g.items.map((p) => <PieceCard key={p.id} p={p} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
