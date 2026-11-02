import { useState, type KeyboardEvent } from "react";
import { Sparkles } from "lucide-react";
import { useStore } from "../store";
import PieceCard from "../components/PieceCard";
import { parseLine } from "../lib/stages";

/** Ideas: entrada rápida (una línea + de dónde salió) y generación con el tema de la semana. */
export default function Ideas() {
  const { proposals, generating, loading, actions } = useStore();
  const ideas = proposals.filter((p) => p.status !== "rejected" && p.stage === "idea");
  const [line, setLine] = useState("");
  const [source, setSource] = useState("");
  const [tema, setTema] = useState("");

  const add = () => {
    const clean = line.trim();
    if (!clean) return;
    const idea = actions.addIdea({ line: parseLine(clean), source: source.trim() });
    setLine("");
    setSource("");
    actions.flash("Idea anotada", () => actions.reject(idea.id));
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") add();
  };

  const field: React.CSSProperties = {
    fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 400, color: "var(--tem-ink)",
    background: "var(--tem-surface)", border: "1px solid var(--tem-border)", borderRadius: 12,
    padding: "11px 14px", outline: "none", minWidth: 0,
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }}>
      <div className="eyebrow">Etapa 1 de 6</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, margin: "6px 0 18px" }}>
        <h1 style={{ margin: 0, fontWeight: 600, fontSize: 30, letterSpacing: "-.02em" }}>
          {ideas.length === 1 ? "1 idea" : `${ideas.length} ideas`} por convertir en guion
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <input
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !generating && actions.generateIdeas(tema)}
            placeholder="Tema de la semana"
            disabled={generating}
            aria-label="Tema de la semana"
            style={{ ...field, width: 200 }}
          />
          <button
            className="press invert-hover"
            onClick={() => actions.generateIdeas(tema)}
            disabled={generating}
            title="El asistente propone ideas nuevas a partir del tema y tus notas"
            style={{
              all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500,
              color: "var(--tem-ink)", border: "1px solid var(--tem-border)", padding: "10px 16px", borderRadius: 12, flexShrink: 0,
            }}
          >
            {generating ? <span className="spinner spinner-sm" aria-hidden="true" /> : <Sparkles size={15} strokeWidth={2.4} />}
            {generating ? "Pensando ideas…" : "Generar ideas"}
          </button>
        </div>
      </div>

      {/* Entrada rápida: una línea + de dónde salió (H07: Enter guarda) */}
      <div style={{ background: "var(--tem-surface)", borderRadius: 20, padding: 16, boxShadow: "var(--sh-card)", display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={line}
          onChange={(e) => setLine(e.target.value)}
          onKeyDown={onKey}
          placeholder="Una idea en una línea · marca la palabra clave entre *asteriscos*"
          aria-label="Idea"
          style={{ ...field, flex: 2, background: "var(--tem-bg)", border: "1px solid transparent" }}
        />
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onKeyDown={onKey}
          placeholder="De dónde salió (opcional)"
          aria-label="Origen de la idea"
          style={{ ...field, flex: 1, background: "var(--tem-bg)", border: "1px solid transparent" }}
        />
        <button
          className="press"
          onClick={add}
          disabled={!line.trim()}
          style={{
            all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 500, background: "var(--tem-ink)", color: "#fff",
            padding: "11px 16px", borderRadius: 999, flexShrink: 0,
          }}
        >
          Anotar idea
        </button>
      </div>

      {generating && (
        <div role="status" style={{ marginTop: 14, background: "var(--tem-surface)", borderRadius: 20, padding: 18, boxShadow: "var(--sh-card)", border: "1.5px dashed var(--tem-orange)", display: "flex", alignItems: "center", gap: 12 }}>
          <span className="spinner" aria-hidden="true" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>El asistente está pensando ideas…</div>
            <div style={{ fontSize: 12, fontWeight: 400, color: "var(--tem-handle)" }}>Suele tardar entre 10 y 20 segundos.</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {loading ? (
          [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 18 }} aria-busy="true" />)
        ) : ideas.length === 0 && !generating ? (
          <div style={{ gridColumn: "1 / -1", background: "var(--tem-surface)", borderRadius: 20, padding: "40px 28px", boxShadow: "var(--sh-card)", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Sin ideas pendientes</div>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 400, color: "var(--tem-handle)", maxWidth: 400, marginInline: "auto", lineHeight: 1.5 }}>
              Anota arriba lo que dijiste hoy, un caso o un dato. O escribe el tema de la semana y pide ideas al asistente.
              Cada idea pasa a Guion con el botón “Pasar a”.
            </div>
          </div>
        ) : (
          ideas.map((p) => <PieceCard key={p.id} p={p} />)
        )}
      </div>
    </div>
  );
}
