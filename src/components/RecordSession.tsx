import { useState } from "react";
import { useStore } from "../store";
import { PLATFORM_LABEL } from "../lib/platforms";
import Teleprompter from "./Teleprompter";
import { BTN_PRIMARY, BTN_SECONDARY, INPUT, Label } from "./stages/ui";
import { EDIT_MODES, durationLabel, guideFor } from "../lib/formatos";
import { deliveryStatus } from "../lib/stages";
import type { EditMode, Proposal } from "../types";

/**
 * Sesión de grabación: las piezas en Grabar, en lote (H07). Cada una abre el
 * teleprompter; "Grabada ✓" pide el link del bruto y la pasa a Editar.
 * Mismo componente en escritorio y móvil.
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
  const toFinishGuide = toFinish ? guideFor(toFinish.script?.format) : null;

  const pad = mobile ? "6px 18px 0" : "32px 40px";

  return (
    <div style={{ padding: pad, maxWidth: mobile ? undefined : 820 }}>
      <div className="eyebrow">Etapa 3 de 6</div>
      <h1 style={{ margin: "6px 0 4px", fontWeight: 700, fontSize: mobile ? 24 : 30, letterSpacing: "-.02em" }}>
        {items.length === 0 ? "Nada por grabar" : items.length === 1 ? "1 pieza por grabar" : `${items.length} piezas por grabar`}
      </h1>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--tem-handle)", lineHeight: 1.45, marginBottom: 18 }}>
        Grábalas en una sola sesión: abre el teleprompter, marca las tomas y toca “Grabada” al terminar.
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-busy="true">
          {[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 20 }} />)}
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: "var(--tem-surface)", borderRadius: 20, padding: "36px 24px", boxShadow: "var(--sh-card)", textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Sin piezas en Grabar</div>
          <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: "var(--tem-handle)", maxWidth: 380, marginInline: "auto", lineHeight: 1.5 }}>
            Las piezas llegan aquí cuando el guion tiene gancho, desarrollo y al menos una toma. Termina un guion y pásalo a Grabar.
          </div>
          <button className="press invert-hover" onClick={() => (mobile ? actions.setTab("inicio") : actions.go("tablero"))} style={{ ...BTN_SECONDARY, marginTop: 16 }}>
            Ir al tablero
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((p) => (
            <SessionCard key={p.id} p={p} onOpen={() => setOpen(p.id)} onDone={() => startFinish(p)} />
          ))}
        </div>
      )}

      {current && <Teleprompter p={current} onClose={() => setOpen(null)} onDone={() => startFinish(current)} />}

      {/* Grabada ✓ → link del bruto → Editar */}
      {toFinish && (
        <div role="dialog" aria-label="Pieza grabada" style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(17,17,17,.45)", display: "grid", placeItems: "center", padding: 18 }} onClick={() => setFinishing(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "var(--tem-surface)", borderRadius: 22, padding: 22, boxShadow: "var(--sh-elev)" }}>
            <div className="eyebrow">Grabada</div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" }}>{toFinish.line.pre}{toFinish.line.key}{toFinish.line.post}</div>
            <div style={{ marginTop: 14 }}>
              <Label>Link del bruto</Label>
              <input
                autoFocus
                value={rawUrl}
                onChange={(e) => setRawUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmFinish()}
                placeholder="https://drive.google.com/… (puedes pegarlo después)"
                aria-label="Link del bruto"
                className="tem-textarea"
                style={INPUT}
              />
            </div>
            {toFinishGuide?.isVideo && (
              <div style={{ marginTop: 14 }}>
                <Label>Modo de edición</Label>
                <div style={{ display: "flex", gap: 6 }}>
                  {EDIT_MODES.map((m) => {
                    const on = mode === m.key;
                    return (
                      <button key={m.key} className="press-sm" onClick={() => setMode(on ? null : m.key)} aria-pressed={on} title={m.help} style={{
                        all: "unset", cursor: "pointer", flex: 1, textAlign: "center", padding: "8px 6px", borderRadius: 10, fontSize: 12, fontWeight: 600, boxSizing: "border-box",
                        border: `1.5px solid ${on ? "var(--tem-orange)" : "var(--tem-ink)"}`, background: on ? "var(--tem-orange)" : "transparent", color: on ? "#fff" : "var(--tem-ink)",
                      }}>
                        {m.key} · {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ marginTop: 14, fontSize: 11, fontWeight: 500, lineHeight: 1.45, color: pending.length ? "var(--tem-orange)" : "var(--tem-handle)" }}>
              {pending.length === 0
                ? "Entrega completa: se marcan las tomas y la pieza pasa a Editar. Se puede deshacer."
                : `Se guarda lo grabado, pero sigue en Grabar hasta completar la entrega: ${pending.map((d) => d.text.toLowerCase()).join(", ")}.`}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="press" onClick={confirmFinish} style={{ ...BTN_PRIMARY, flex: 1 }}>{pending.length === 0 ? "Pasar a Editar" : "Guardar lo grabado"}</button>
              <button className="press invert-hover" onClick={() => setFinishing(null)} style={BTN_SECONDARY}>Todavía no</button>
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
  const dur = p.script?.duration_s;
  const g = guideFor(p.script?.format);
  const d = deliveryStatus(p);
  const ok = d.filter((x) => x.done).length;
  return (
    <div style={{ background: "var(--tem-surface)", borderRadius: 20, padding: 18, boxShadow: "var(--sh-card)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {p.platforms.map((t) => (
          <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 999, border: "1.5px solid var(--tem-ink)" }}>{PLATFORM_LABEL[t]}</span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--tem-handle)" }}>
          {p.script?.format ?? p.type}{dur ? ` · ${dur < 120 ? `${dur} s` : `${Math.round(dur / 60)} min`}` : ""}
        </span>
      </div>
      <button onClick={() => actions.openWork(p.id)} title="Abrir la ficha" style={{ all: "unset", cursor: "pointer", fontSize: 18, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-.01em" }}>
        {p.line.pre}{p.line.key}{p.line.post}
      </button>
      {p.script?.hook && (
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--tem-handle)", lineHeight: 1.4 }}>{p.script.hook}</div>
      )}
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--tem-handle)", lineHeight: 1.4 }}>
        {g.aspect}{g.duration ? ` · ${durationLabel(g)}` : ""} · {g.frame.split(".")[0]}.
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: ok === d.length ? "var(--tem-orange)" : "var(--tem-handle)" }}>
        {shots.length ? `${done} de ${shots.length} tomas grabadas` : "Sin lista de tomas"}
        {` · entrega ${ok} de ${d.length}`}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="press invert-hover" onClick={onOpen} style={{ ...BTN_SECONDARY, flex: 1 }}>Abrir teleprompter</button>
        <button className="press" onClick={onDone} style={{ ...BTN_PRIMARY, flex: 1, padding: "9px 14px", fontSize: 13 }}>Grabada ✓</button>
      </div>
    </div>
  );
}
