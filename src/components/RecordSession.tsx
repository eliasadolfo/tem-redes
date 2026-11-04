import { useState } from "react";
import { useStore } from "../store";
import { pieceTitle, platformsStr } from "../lib/platforms";
import Teleprompter from "./Teleprompter";
import { EDIT_MODES, durationLabel, guideFor, pieceFormat } from "../lib/formatos";
import { deliveryStatus } from "../lib/stages";
import type { EditMode, Proposal } from "../types";

/**
 * Sesión de grabación: las piezas en Grabar, en lote (H07). Cada una abre el
 * teleprompter; "Grabada" pide el link del bruto y la pasa a Editar.
 * El mismo componente en escritorio y teléfono.
 */
export default function RecordSession({ mobile = false }: { mobile?: boolean }) {
  const { proposals, loading, actions } = useStore();
  const items = proposals.filter((p) => p.status !== "rejected" && p.stage === "grabar");
  const [open, setOpen] = useState<string | null>(null);
  const [finishing, setFinishing] = useState<string | null>(null);
  const [rawUrl, setRawUrl] = useState("");
  const [mode, setMode] = useState<EditMode | null>(null);

  const current = items.find((p) => p.id === open) ?? null;
  const toFinish = items.find((p) => p.id === finishing) ?? null;

  const startFinish = (p: Proposal) => {
    setOpen(null);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    setRawUrl(p.raw_url ?? "");
    setMode(p.edit_mode ?? null);
    setFinishing(p.id);
  };

  const confirmFinish = () => {
    if (!toFinish) return;
    actions.finishRecording(toFinish.id, rawUrl, mode);
    setFinishing(null);
  };

  // Qué faltaría para pasar a Editar con lo que hay en el diálogo (H05: avisar antes de bloquear).
  const preview: Proposal | null = toFinish
    ? { ...toFinish, raw_url: rawUrl.trim() || undefined, edit_mode: mode ?? undefined, shots: (toFinish.shots ?? []).map((s) => ({ ...s, done: true })) }
    : null;
  const pending = preview ? deliveryStatus(preview).filter((d) => !d.done) : [];
  const toFinishGuide = toFinish ? guideFor(pieceFormat(toFinish)) : null;

  return (
    <div className="pagina pagina--angosta">
      <div className="cabecera">
        <div className="cabecera__texto">
          <h1 className="tem-h1">Teleprompter</h1>
          <p className="tem-caption">
            {items.length === 0 ? "Nada por grabar." : items.length === 1 ? "1 pieza por grabar." : `${items.length} piezas por grabar.`} Abre el teleprompter, marca las tomas y toca Grabada al terminar.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="pila" aria-busy="true">
          {[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="tem-card">
          <div className="vacio">
            <h2 className="tem-title">Sin piezas en Grabar</h2>
            <p>Llegan aquí cuando el guion tiene gancho, desarrollo y al menos una toma.</p>
            <button className="tem-btn tem-btn--secundario" onClick={() => (mobile ? actions.setTab("inicio") : actions.go("tablero"))}>Ir al inicio</button>
          </div>
        </div>
      ) : (
        <div className="pila" style={{ gap: 12 }}>
          {items.map((p) => <SessionCard key={p.id} p={p} onOpen={() => setOpen(p.id)} onDone={() => startFinish(p)} />)}
        </div>
      )}

      {current && <Teleprompter p={current} onClose={() => setOpen(null)} onDone={() => startFinish(current)} />}

      {toFinish && (
        <div className="velo" onClick={() => setFinishing(null)}>
          <div className="hoja hoja--chica" role="dialog" aria-modal="true" aria-labelledby="t-grabada" onClick={(e) => e.stopPropagation()}>
            <div className="hoja__cuerpo">
              <h2 className="tem-title" id="t-grabada">{pieceTitle(toFinish)}</h2>
              <div className="tem-field">
                <label className="tem-label" htmlFor="bruto">Link del bruto</label>
                <input id="bruto" autoFocus className="tem-input" value={rawUrl} onChange={(e) => setRawUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmFinish()} placeholder="https://drive.google.com/…" />
                <span className="tem-help">Puedes pegarlo después.</span>
              </div>
              {toFinishGuide?.editMode && (
                <div className="tem-field">
                  <span className="tem-label">Modo de edición</span>
                  <div className="opciones">
                    {EDIT_MODES.map((m) => (
                      <button key={m.key} className="opcion opcion--bloque" aria-pressed={mode === m.key} onClick={() => setMode(mode === m.key ? null : m.key)}>{m.key} · {m.name}</button>
                    ))}
                  </div>
                </div>
              )}
              <p className="tem-help">
                {pending.length === 0
                  ? "Entrega completa: la pieza pasa a Editar. Se puede deshacer."
                  : `Se guarda lo grabado y sigue en Grabar hasta completar: ${pending.map((d) => d.text.toLowerCase()).join(", ")}.`}
              </p>
            </div>
            <div className="hoja__pie">
              <button className="tem-btn tem-btn--primario" onClick={confirmFinish}>{pending.length === 0 ? "Pasar a Editar" : "Guardar lo grabado"}</button>
              <button className="tem-btn tem-btn--secundario" onClick={() => setFinishing(null)}>Todavía no</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ p, onOpen, onDone }: { p: Proposal; onOpen: () => void; onDone: () => void }) {
  const { actions } = useStore();
  const shots = p.shots ?? [];
  const done = shots.filter((s) => s.done).length;
  const g = guideFor(pieceFormat(p));
  const d = deliveryStatus(p);
  const ok = d.filter((x) => x.done).length;
  const dur = p.script?.duration_s;
  return (
    <article className="tem-card sesion">
      <button className="sesion__titulo" onClick={() => actions.openWork(p.id)}>{pieceTitle(p)}</button>
      <p className="tem-caption">{[p.script?.format || p.type, dur ? `${dur} s` : durationLabel(g), g.aspect, platformsStr(p.platforms)].filter(Boolean).join(" · ")}</p>
      {p.script?.hook && <p className="tem-small preline">{p.script.hook}</p>}
      <p className="tem-caption">{shots.length ? `${done} de ${shots.length} tomas` : "Sin tomas"} · entrega {ok} de {d.length}</p>
      <div className="sesion__botones">
        <button className="tem-btn tem-btn--secundario" onClick={onOpen}>Abrir teleprompter</button>
        <button className="tem-btn tem-btn--primario" onClick={onDone}>Grabada</button>
      </div>
    </article>
  );
}
