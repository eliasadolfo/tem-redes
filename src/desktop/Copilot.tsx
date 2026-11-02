import { useEffect, useState, type KeyboardEvent } from "react";
import { useStore } from "../store";
import { VARIANTS, HANDLE } from "../data/mock";
import { platformsStr } from "../lib/platforms";
import { STAGE_LABEL } from "../lib/stages";
import Card916 from "../components/Card916";
import { downloadPiecePng } from "../lib/exportCard";
import { AdvanceBar, StageHeader, StageSections } from "../components/stages/StageFlow";
import Teleprompter from "../components/Teleprompter";
import type { Proposal, Stage } from "../types";

/** Chips del copiloto por etapa: todos ajustan la pieza (titular, etiqueta, caption, hashtags). */
const CHIPS: Record<Stage, string[]> = {
  idea: ["Hazlo más concreto", "Cambia el gancho", "Tono más directo"],
  guion: ["Cambia el gancho", "Hazlo más corto", "Tono más directo"],
  grabar: ["Hazlo más corto", "Tono más directo"],
  editar: ["Caption más corto", "Cambia los hashtags", "Tono más directo"],
  listo: ["Caption más corto", "Cambia los hashtags"],
  publicado: ["Resume en una línea"],
};
const VARIANT_NAMES = ["Blanca", "Negra", "Azul"];

/** Ficha de la pieza: copiloto a la izquierda, etapas al centro, vista previa a la derecha. */
export default function Copilot() {
  const s = useStore();
  const { actions } = s;
  const work = s.proposals.find((p) => p.id === s.work);
  const [draft, setDraft] = useState("");
  const [exporting, setExporting] = useState(false);
  const [tele, setTele] = useState(false);

  // H03/H07 — Esc cierra la ficha sin perder nada (todo se guarda solo);
  // si el teleprompter está abierto, Esc lo cierra a él.
  useEffect(() => {
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !tele) actions.closeWork();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [actions, tele]);

  if (!work) return null;

  const cur = VARIANTS[s.variant];
  const isVideo = work.format === "video";

  const exportPng = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const r = await downloadPiecePng(work, cur);
      actions.flash(`Imagen descargada · ${r.width}×${r.height} px`);
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
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") send();
  };

  return (
    <div style={{ display: "flex", height: "100vh", animation: "sheetUp .32s var(--ease-spring) both" }}>
      {/* ---- Izquierda: copiloto ---- */}
      <aside
        style={{
          width: 300, flexShrink: 0, background: "var(--tem-surface)",
          borderRight: "1px solid var(--tem-hairline)", padding: "22px 20px",
          display: "flex", flexDirection: "column", gap: 12,
        }}
      >
        <button
          className="press"
          onClick={actions.closeWork}
          title="Volver al tablero (Esc). Los cambios ya están guardados."
          style={{ all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--tem-handle)" }}
        >
          ← Volver
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--tem-orange)" }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Asistente</span>
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--tem-handle)" }}>{STAGE_LABEL[work.stage]}</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 2 }}>
          {s.chat.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "ai" ? "flex-start" : "flex-end",
                maxWidth: "90%",
                background: m.role === "ai" ? "var(--tem-bg)" : "var(--tem-ink)",
                color: m.role === "ai" ? "var(--tem-ink)" : "#fff",
                borderRadius: m.role === "ai" ? "15px 15px 15px 4px" : "15px 15px 4px 15px",
                padding: "11px 13px", fontSize: 13, fontWeight: 500, lineHeight: 1.45, whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>
          ))}
          {s.chatBusy && (
            <div style={{ alignSelf: "flex-start", background: "var(--tem-bg)", borderRadius: "15px 15px 15px 4px", padding: "11px 13px", fontSize: 13, fontWeight: 500, color: "var(--tem-handle)" }}>
              Pensando…
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {CHIPS[work.stage].map((c) => (
            <button
              key={c}
              className="press"
              onClick={() => actions.sendChat(c)}
              disabled={s.chatBusy}
              style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 500, padding: "7px 11px", border: "1.5px solid var(--tem-ink)", borderRadius: 999 }}
            >
              {c}
            </button>
          ))}
        </div>

        <ChatInput draft={draft} setDraft={setDraft} onKey={onKey} onSend={send} busy={s.chatBusy} />
      </aside>

      {/* ---- Centro: etapas ---- */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px 28px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <StageHeader p={work} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--tem-handle)", textAlign: "right", flexShrink: 0, paddingTop: 4 }}>
            {work.type} · {platformsStr(work.platforms)}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 28px 20px" }}>
          <StageSections p={work} slots={{ onTeleprompter: () => setTele(true) }} />
        </div>
        {tele && <Teleprompter p={work} onClose={() => setTele(false)} />}
        <div style={{ padding: "12px 28px 20px", borderTop: "1px solid var(--tem-border-muted)", background: "var(--tem-bg)" }}>
          <AdvanceBar p={work} />
        </div>
      </div>

      {/* ---- Derecha: vista previa ---- */}
      <aside
        style={{
          width: 270, flexShrink: 0, background: "var(--tem-surface)",
          borderLeft: "1px solid var(--tem-hairline)", padding: "22px 18px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 14, overflowY: "auto",
        }}
      >
        {isVideo ? (
          <VideoPreview cur={cur} work={work} />
        ) : (
          <Card916
            eyebrow={work.eyebrow}
            line={work.line}
            bg={cur.bg}
            fg={cur.fg}
            handle={HANDLE}
            width={200}
            style={{ boxShadow: "var(--sh-elev)", transition: "background .3s ease" }}
          />
        )}

        {/* variantes — H06: ícono + etiqueta, no hay que adivinar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {VARIANTS.map((v, i) => (
            <button
              key={i}
              className="press"
              onClick={() => actions.setVariant(i as 0 | 1 | 2)}
              aria-label={`Estilo ${VARIANT_NAMES[i]}`}
              aria-pressed={s.variant === i}
              title={`Estilo ${VARIANT_NAMES[i]}`}
              style={{
                all: "unset", cursor: "pointer", width: 34, height: 54, borderRadius: 8,
                background: v.bg, border: `2px solid ${s.variant === i ? "var(--tem-orange)" : "#D8D8D8"}`,
              }}
            />
          ))}
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--tem-handle)", marginLeft: 4 }}>
            <b style={{ color: "var(--tem-ink)", fontWeight: 600 }}>{VARIANT_NAMES[s.variant]}</b>
          </span>
        </div>

        <button
          className="press invert-hover"
          onClick={() => void exportPng()}
          disabled={exporting}
          style={{
            all: "unset", cursor: "pointer", textAlign: "center", fontSize: 13, fontWeight: 600, width: "100%", boxSizing: "border-box",
            color: "var(--tem-ink)", border: "1.5px solid var(--tem-ink)", padding: 11, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {exporting && <span className="spinner spinner-sm" aria-hidden="true" />}
          {exporting ? "Creando imagen…" : isVideo ? "Descargar miniatura" : "Descargar imagen"}
        </button>

        <div style={{ width: "100%", fontSize: 12, fontWeight: 500, color: "var(--tem-handle)", lineHeight: 1.5 }}>
          {work.caption || "Sin caption todavía: se escribe en Editar."}
        </div>
        {work.tags.length > 0 && (
          <div style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {work.tags.map((t) => (
              <span key={t} style={{ fontSize: 11, fontWeight: 500, color: "var(--tem-orange)", background: "var(--tem-bg)", padding: "4px 9px", borderRadius: 999 }}>{t}</span>
            ))}
          </div>
        )}

        <button
          className="press"
          onClick={() => actions.reject(work.id)}
          title="Quitar esta pieza de la línea (se puede deshacer)"
          style={{
            all: "unset", cursor: "pointer", marginTop: "auto", fontSize: 12, fontWeight: 600, color: "var(--tem-handle)",
            border: "1.5px solid var(--tem-border-muted)", padding: "9px 14px", borderRadius: 12,
          }}
        >
          Descartar pieza
        </button>
      </aside>
    </div>
  );
}

function ChatInput({
  draft, setDraft, onKey, onSend, busy = false,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
  busy?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--tem-bg)", borderRadius: 14, padding: "6px 6px 6px 14px", opacity: busy ? 0.6 : 1 }}>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        disabled={busy}
        placeholder={busy ? "Aplicando el ajuste…" : "Pide un ajuste…"}
        style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontWeight: 500, fontSize: 13, color: "var(--tem-ink)" }}
      />
      <button
        className="press"
        onClick={onSend}
        style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 600, background: "var(--tem-orange)", color: "#fff", padding: "8px 14px", borderRadius: 10 }}
      >
        Enviar
      </button>
    </div>
  );
}

function VideoPreview({ cur, work }: { cur: { bg: string; fg: string }; work: Proposal }) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          position: "relative", aspectRatio: "16 / 9", borderRadius: 16, overflow: "hidden",
          background: cur.bg, boxShadow: "var(--sh-elev)",
          padding: 16, display: "flex", flexDirection: "column", transition: "background .3s ease",
          fontFamily: "var(--font-brand)",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 9, letterSpacing: ".25em", color: "var(--tem-orange)" }}>MINIATURA</div>
        <div style={{ marginTop: 8, fontWeight: 900, fontSize: 17, lineHeight: 1.05, letterSpacing: "-.02em", color: cur.fg }}>
          {work.line.pre}
          <span style={{ color: "var(--tem-orange)" }}>{work.line.key}</span>
          {work.line.post}
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ width: 30, height: 30, borderRadius: 999, background: "var(--tem-orange)", display: "grid", placeItems: "center" }}>
            <span style={{ width: 0, height: 0, borderLeft: "10px solid #fff", borderTop: "6px solid transparent", borderBottom: "6px solid transparent", marginLeft: 2 }} />
          </div>
          {work.duration && (
            <span style={{ fontWeight: 600, fontSize: 11, background: "rgba(17,17,17,.7)", color: "#fff", padding: "2px 7px", borderRadius: 6, fontFamily: "var(--font-ui)" }}>
              {work.duration}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
