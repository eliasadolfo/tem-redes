import { useEffect, useState } from "react";
import { useStore } from "../store";
import { HANDLE, VARIANTS } from "../data/mock";
import { guideFor, pieceFormat } from "../lib/formatos";
import Card916 from "../components/Card916";
import { downloadPiecePng } from "../lib/exportCard";
import { AdvanceBar, StageHeader, StageSections } from "../components/stages/StageFlow";
import Teleprompter from "../components/Teleprompter";
import type { Stage } from "../types";

/** Sugerencias del asistente por etapa: todas ajustan la pieza. */
const CHIPS: Record<Stage, string[]> = {
  idea: ["Hazlo más concreto", "Cambia el gancho"],
  guion: ["Cambia el gancho", "Hazlo más corto"],
  grabar: ["Hazlo más corto"],
  editar: ["Caption más corto", "Cambia los hashtags"],
  listo: ["Caption más corto"],
  publicado: ["Resume en una línea"],
};

/** Ficha de la pieza: asistente a la izquierda, etapas al centro, vista previa a la derecha. */
export default function Copilot() {
  const s = useStore();
  const { actions } = s;
  const work = s.proposals.find((p) => p.id === s.work);
  const [draft, setDraft] = useState("");
  const [exporting, setExporting] = useState(false);
  const [tele, setTele] = useState(false);

  // H03/H07: Esc cierra la ficha sin perder nada; si el teleprompter está abierto, lo cierra a él.
  useEffect(() => {
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !tele) actions.closeWork();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [actions, tele]);

  if (!work) return null;

  const cur = VARIANTS[s.variant];
  const guide = guideFor(pieceFormat(work));
  const horizontal = guide.orientation === "horizontal";

  const exportPng = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const r = await downloadPiecePng(work, cur);
      actions.flash(`Imagen descargada: ${r.width}×${r.height} px`);
    } catch {
      actions.flash("No pude crear la imagen. Vuelve a intentarlo en unos segundos.");
    } finally {
      setExporting(false);
    }
  };

  const send = () => {
    actions.sendChat(draft);
    setDraft("");
  };

  return (
    <div className="ficha">
      <aside className="ficha__lado ficha__lado--chat" aria-label="Asistente">
        <button className="tem-btn tem-btn--texto ficha__volver" onClick={actions.closeWork}>Volver</button>
        <h2 className="tem-title">Asistente</h2>
        <div className="chat">
          {s.chat.map((m, i) => <div key={i} className={`chat__msj${m.role === "user" ? " chat__msj--yo" : ""}`}>{m.text}</div>)}
          {s.chatBusy && <div className="chat__msj tem-muted">Pensando…</div>}
        </div>
        <div className="chips-plantilla">
          {CHIPS[work.stage].map((c) => (
            <button key={c} className="sugerencia" onClick={() => actions.sendChat(c)} disabled={s.chatBusy}>{c}</button>
          ))}
        </div>
        <div className="fila" style={{ flexWrap: "nowrap" }}>
          <input
            className="tem-input crece"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={s.chatBusy}
            placeholder="Pide un ajuste"
            aria-label="Pide un ajuste"
          />
          <button className="tem-btn tem-btn--secundario" onClick={send} disabled={s.chatBusy || !draft.trim()}>Enviar</button>
        </div>
      </aside>

      <div className="ficha__centro">
        <div className="ficha__titulo"><StageHeader p={work} /></div>
        <div className="ficha__scroll">
          <StageSections p={work} slots={{ onTeleprompter: () => setTele(true) }} />
        </div>
        {tele && <Teleprompter p={work} onClose={() => setTele(false)} />}
        <div className="ficha__pie"><AdvanceBar p={work} /></div>
      </div>

      <aside className="ficha__lado ficha__lado--vista" aria-label="Vista previa">
        <Card916 line={work.line} variant={cur} handle={HANDLE} aspect={guide.aspect} />
        {!horizontal && (
          <div className="tem-field">
            <label className="tem-label" htmlFor="estilo">Estilo</label>
            <select id="estilo" className="tem-select" value={s.variant} onChange={(e) => actions.setVariant(Number(e.target.value) as 0 | 1 | 2)}>
              {VARIANTS.map((v, i) => <option key={v.name} value={i}>{v.name}</option>)}
            </select>
          </div>
        )}
        <button className="tem-btn tem-btn--secundario btn-ancho" onClick={() => void exportPng()} disabled={exporting}>
          {exporting && <span className="spinner" aria-hidden="true" />}
          {exporting ? "Creando imagen…" : horizontal ? "Descargar miniatura" : "Descargar imagen"}
        </button>
        <p className="tem-caption">{work.caption || "Sin caption todavía: se escribe en Editar."}</p>
        {work.tags.length > 0 && <p className="tem-caption">{work.tags.join(" ")}</p>}
        <button className="tem-btn tem-btn--peligro btn-ancho" style={{ marginTop: "auto" }} onClick={() => actions.reject(work.id)}>Descartar pieza</button>
      </aside>
    </div>
  );
}
