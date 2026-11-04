import { useState, type KeyboardEvent } from "react";
import { useStore } from "../store";
import PieceCard from "../components/PieceCard";
import FormatPicker, { PieceFormat } from "../components/FormatPicker";
import { parseLine } from "../lib/stages";
import { formatsFor, suggestFormat, themeOf, type Orientation, type RecordFormat } from "../lib/formatos";

/** Ideas: entrada rápida (una línea + de dónde salió) y generación con el tema de la semana. */
export default function Ideas() {
  const { proposals, generating, loading, actions } = useStore();
  const ideas = proposals.filter((p) => p.status !== "rejected" && p.stage === "idea");
  const [line, setLine] = useState("");
  const [source, setSource] = useState("");
  const [tema, setTema] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("vertical");
  const [picked, setPicked] = useState<string | null>(null); // null = sigue la sugerencia

  const title = line.replace(/\*/g, "");
  const theme = themeOf(title);
  const suggestion = suggestFormat(theme, orientation, title);
  const record: RecordFormat = formatsFor(orientation).find((f) => f.key === picked) ?? suggestion.format;

  const add = () => {
    const clean = line.trim();
    if (!clean) return;
    const idea = actions.addIdea({ line: parseLine(clean), source: source.trim(), record });
    setLine("");
    setSource("");
    setPicked(null);
    actions.flash("Idea anotada", () => actions.reject(idea.id));
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") add();
  };

  return (
    <div className="pagina pagina--angosta">
      <div className="cabecera">
        <div className="cabecera__texto">
          <h1 className="tem-h1">Ideas</h1>
          <p className="tem-caption">{ideas.length === 1 ? "1 idea por convertir en guion" : `${ideas.length} ideas por convertir en guion`}</p>
        </div>
      </div>

      <div className="tem-card seccion">
        <div className="nueva-idea">
          <div className="tem-field">
            <label className="tem-label" htmlFor="idea">Idea nueva</label>
            <input id="idea" className="tem-input" value={line} onChange={(e) => setLine(e.target.value)} onKeyDown={onKey} placeholder="Una línea, con la palabra clave entre *asteriscos*" />
          </div>
          <div className="tem-field">
            <label className="tem-label" htmlFor="origen">De dónde salió</label>
            <input id="origen" className="tem-input" value={source} onChange={(e) => setSource(e.target.value)} onKeyDown={onKey} placeholder="Opcional" />
          </div>
          <button className="tem-btn tem-btn--primario" onClick={add} disabled={!line.trim()}>Anotar idea</button>
        </div>
        {line.trim() && <div className="seccion">
          <FormatPicker
            orientation={orientation}
            onOrientation={(o) => {
              setOrientation(o);
              setPicked(null);
            }}
            record={record}
            suggestion={suggestion}
            theme={theme}
            onPick={(r) => setPicked(r.key)}
          />
        </div>}
        <div className="tema-ia">
          <div className="tem-field">
            <label className="tem-label" htmlFor="tema">Tema de la semana</label>
            <input id="tema" className="tem-input" value={tema} onChange={(e) => setTema(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !generating && actions.generateIdeas(tema)} disabled={generating} />
          </div>
          <button className="tem-btn tem-btn--secundario" onClick={() => actions.generateIdeas(tema)} disabled={generating}>
            {generating && <span className="spinner" aria-hidden="true" />}
            {generating ? "Pensando ideas…" : "Generar ideas"}
          </button>
        </div>
        {generating && <p className="tem-help" role="status" style={{ marginTop: 8 }}>Suele tardar entre 10 y 20 segundos.</p>}
      </div>

      <div className="rejilla-piezas">
        {loading ? (
          [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 110 }} aria-busy="true" />)
        ) : ideas.length === 0 && !generating ? (
          <div className="vacio" style={{ gridColumn: "1 / -1", margin: 0 }}>
            <h2 className="tem-title">Sin ideas pendientes</h2>
            <p>Anota lo que dijiste hoy, un caso o un dato, o pide ideas con el tema de la semana.</p>
          </div>
        ) : (
          ideas.map((p) => (
            <PieceCard key={p.id} p={p}>
              <PieceFormat p={p} foldHow />
            </PieceCard>
          ))
        )}
      </div>
    </div>
  );
}
