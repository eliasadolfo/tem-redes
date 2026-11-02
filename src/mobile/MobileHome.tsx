import { useState } from "react";
import logoBlack from "../assets/img/logo-tem-black.png";
import { useStore } from "../store";
import PieceCard from "../components/PieceCard";
import { STAGES, STAGE_HELP, STAGE_LABEL, parseLine } from "../lib/stages";
import { DAY_NAMES_FULL } from "../lib/dates";
import { INPUT, BTN_PRIMARY, BTN_SECONDARY } from "../components/stages/ui";
import type { Proposal, Stage } from "../types";

/** Inicio móvil: resumen del tablero + "qué toca hoy" + idea rápida. */
export default function MobileHome() {
  const { proposals, generating, loading, actions } = useStore();
  const [line, setLine] = useState("");
  const [tema, setTema] = useState("");
  const active = proposals.filter((p) => p.status !== "rejected");
  const count = (st: Stage) => active.filter((p) => p.stage === st).length;

  // Qué toca hoy: lo que hay que grabar, lo que sale hoy y lo que está por editar.
  const dow = new Date().getDay();
  const today = dow >= 1 && dow <= 5 ? dow - 1 : -1;
  const toRecord = active.filter((p) => p.stage === "grabar");
  const toPublish = active.filter((p) => p.stage === "listo" && p.day === today);
  const toEdit = active.filter((p) => p.stage === "editar");
  const todayList: { title: string; items: Proposal[] }[] = [
    { title: today >= 0 ? `Sale hoy, ${DAY_NAMES_FULL[today].toLowerCase()}` : "Programado", items: toPublish },
    { title: "Por grabar", items: toRecord },
    { title: "Por editar", items: toEdit },
  ].filter((g) => g.items.length > 0);

  const addIdea = () => {
    const clean = line.trim();
    if (!clean) return;
    const idea = actions.addIdea({ line: parseLine(clean) });
    setLine("");
    actions.flash("Idea anotada", () => actions.reject(idea.id));
  };

  return (
    <div style={{ padding: "6px 18px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src={logoBlack} alt="TEM" style={{ height: 26, width: "auto", objectFit: "contain" }} />
        <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--tem-ink)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 13 }}>
          EA
        </div>
      </div>

      <div className="eyebrow" style={{ marginTop: 20 }}>Línea de producción</div>
      <div style={{ marginTop: 6, fontWeight: 600, fontSize: 26, letterSpacing: "-.02em", lineHeight: 1.08 }}>
        {active.length === 1 ? "1 pieza en curso" : `${active.length} piezas en curso`}
      </div>

      {/* resumen del tablero */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {STAGES.map((st) => (
          <div key={st} title={STAGE_HELP[st]} style={{ background: "var(--tem-surface)", borderRadius: 14, padding: "10px 12px", boxShadow: "var(--sh-card)" }}>
            {loading ? (
              <div className="skeleton" style={{ height: 22, width: 30 }} />
            ) : (
              <div style={{ fontSize: 20, fontWeight: 600, color: count(st) ? "var(--tem-ink)" : "var(--tem-handle)" }}>{count(st)}</div>
            )}
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--tem-handle)" }}>{STAGE_LABEL[st]}</div>
          </div>
        ))}
      </div>

      {/* idea rápida (H07: Enter guarda) */}
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <input
          value={line}
          onChange={(e) => setLine(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addIdea()}
          placeholder="Anota una idea · *palabra clave*"
          aria-label="Idea"
          className="tem-textarea"
          style={{ ...INPUT, background: "var(--tem-surface)", flex: 1 }}
        />
        <button className="press-sm" onClick={addIdea} disabled={!line.trim()} style={{ ...BTN_PRIMARY, padding: "10px 14px", fontSize: 13 }}>
          Anotar
        </button>
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <input
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !generating && actions.generateIdeas(tema)}
          placeholder="Tema de la semana"
          aria-label="Tema de la semana"
          disabled={generating}
          className="tem-textarea"
          style={{ ...INPUT, background: "var(--tem-surface)", flex: 1 }}
        />
        <button className="press-sm" onClick={() => actions.generateIdeas(tema)} disabled={generating} style={{ ...BTN_SECONDARY, padding: "10px 12px", fontSize: 13 }}>
          {generating ? <span className="spinner spinner-sm" aria-hidden="true" /> : null}
          {generating ? "Pensando…" : "Generar ideas"}
        </button>
      </div>

      {/* qué toca hoy */}
      <div style={{ marginTop: 22, fontWeight: 600, fontSize: 17 }}>Qué toca hoy</div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 14 }}>
        {loading ? (
          [0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 18 }} aria-busy="true" />)
        ) : todayList.length === 0 ? (
          <div style={{ background: "var(--tem-surface)", borderRadius: 22, padding: "26px 20px", textAlign: "center", boxShadow: "var(--sh-card)" }}>
            <div style={{ fontWeight: 600, fontSize: 17 }}>Nada urgente</div>
            <div style={{ marginTop: 6, fontWeight: 400, fontSize: 13, color: "var(--tem-handle)", lineHeight: 1.5 }}>
              Aquí aparece lo que sale hoy, lo que hay que grabar y lo que está por editar. Anota una idea o pide ideas al asistente para empezar.
            </div>
          </div>
        ) : (
          todayList.map((g) => (
            <div key={g.title}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--tem-handle)", marginBottom: 8 }}>{g.title} · {g.items.length}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {g.items.map((p) => <PieceCard key={p.id} p={p} showStage />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
