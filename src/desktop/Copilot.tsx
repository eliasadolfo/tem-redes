import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useStore } from "../store";
import { VARIANTS, HANDLE } from "../data/mock";
import { DAY_NAMES_FULL } from "../lib/dates";
import { platformsStr } from "../lib/platforms";
import Card916 from "../components/Card916";
import { downloadPiecePng } from "../lib/exportCard";

const WORK_CHIPS = ["Hazlo más corto", "Cambia el gancho", "Tono más directo"];

export default function Copilot() {
  const s = useStore();
  const { actions } = s;
  const work = s.proposals.find((p) => p.id === s.work);
  const [draft, setDraft] = useState("");

  // Caption editable: estado local + guardado con debounce
  const [caption, setCaption] = useState(work?.caption ?? "");
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setCaption(work?.caption ?? "");
  }, [work?.id, work?.caption]);
  const onCaptionChange = (value: string) => {
    setCaption(value);
    if (!work) return;
    if (capTimer.current) clearTimeout(capTimer.current);
    capTimer.current = setTimeout(() => actions.updateCaption(work.id, value), 600);
  };

  if (!work) return null;

  const cur = VARIANTS[s.variant];
  const isVideo = work.format === "video";
  const schedule = work.time
    ? `${DAY_NAMES_FULL[work.day]} · ${work.time}`
    : `${DAY_NAMES_FULL[work.day]} · sugerir hora`;

  const send = () => {
    actions.sendChat(draft);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") send();
  };

  return (
    <div style={{ display: "flex", height: "100vh", animation: "sheetUp .32s var(--ease-spring) both" }}>
      {/* ---- Izquierda: chat ---- */}
      <aside
        style={{
          width: 322, flexShrink: 0, background: "var(--tem-surface)",
          borderRight: "1px solid var(--tem-hairline)", padding: "22px 20px",
          display: "flex", flexDirection: "column", gap: 12,
        }}
      >
        <button
          className="press"
          onClick={actions.closeWork}
          style={{ all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--tem-handle)" }}
        >
          ← Volver
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--tem-orange)" }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Asistente</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 2 }}>
          {s.chat.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "ai" ? "flex-start" : "flex-end",
                maxWidth: "88%",
                background: m.role === "ai" ? "var(--tem-bg)" : "var(--tem-ink)",
                color: m.role === "ai" ? "var(--tem-ink)" : "#fff",
                borderRadius: m.role === "ai" ? "15px 15px 15px 4px" : "15px 15px 4px 15px",
                padding: "11px 13px",
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.45,
              }}
            >
              {m.text}
            </div>
          ))}
          {s.chatBusy && (
            <div
              style={{
                alignSelf: "flex-start", background: "var(--tem-bg)", borderRadius: "15px 15px 15px 4px",
                padding: "11px 13px", fontSize: 13, fontWeight: 500, color: "var(--tem-handle)",
              }}
            >
              Pensando…
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {WORK_CHIPS.map((c) => (
            <button
              key={c}
              className="press"
              onClick={() => actions.sendChat(c)}
              style={{
                all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 500, padding: "7px 11px",
                border: "1.5px solid var(--tem-ink)", borderRadius: 999,
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <ChatInput draft={draft} setDraft={setDraft} onKey={onKey} onSend={send} busy={s.chatBusy} />
      </aside>

      {/* ---- Centro: preview ---- */}
      <div
        style={{
          flex: 1, padding: 26, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 16, minWidth: 0, overflowY: "auto",
        }}
      >
        <div style={{ alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {work.type} · {platformsStr(work.platforms)}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {work.platforms.map((p) => (
              <span
                key={p}
                style={{
                  fontSize: 11, fontWeight: 600, padding: "4px 10px",
                  border: "1.5px solid var(--tem-ink)", borderRadius: 999, background: "var(--tem-surface)",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {isVideo ? (
          <VideoPreview cur={cur} work={work} />
        ) : (
          <Card916
            eyebrow={work.eyebrow}
            line={work.line}
            bg={cur.bg}
            fg={cur.fg}
            handle={HANDLE}
            width={236}
            style={{ boxShadow: "var(--sh-elev)", transition: "background .3s ease" }}
          />
        )}

        {/* variantes */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {VARIANTS.map((v, i) => (
            <button
              key={i}
              className="press"
              onClick={() => actions.setVariant(i as 0 | 1 | 2)}
              aria-label={`Variante ${i + 1}`}
              style={{
                all: "unset", cursor: "pointer", width: 40, height: 64, borderRadius: 9,
                background: v.bg, border: `2px solid ${s.variant === i ? "var(--tem-orange)" : "#D8D8D8"}`,
              }}
            />
          ))}
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--tem-handle)", marginLeft: 4 }}>
            3 variantes
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
          <button
            className="press"
            onClick={() => actions.approve(work.id)}
            style={{
              all: "unset", cursor: "pointer", fontSize: 14, fontWeight: 600, background: "var(--tem-orange)",
              color: "#fff", padding: "13px 26px", borderRadius: 14,
            }}
          >
            Aprobar y programar
          </button>
          <button
            className="press invert-hover"
            onClick={() => actions.reject(work.id)}
            style={{
              all: "unset", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--tem-ink)",
              border: "1.5px solid var(--tem-ink)", padding: "13px 22px", borderRadius: 14, background: "var(--tem-surface)",
            }}
          >
            Descartar
          </button>
        </div>
      </div>

      {/* ---- Derecha: metadatos ---- */}
      <aside
        style={{
          width: 250, flexShrink: 0, background: "var(--tem-surface)",
          borderLeft: "1px solid var(--tem-hairline)", padding: "22px 18px",
          display: "flex", flexDirection: "column", gap: 16, overflowY: "auto",
        }}
      >
        <div>
          <MetaLabel>Programar</MetaLabel>
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: "1.5px solid var(--tem-ink)", borderRadius: 12, padding: "11px 13px",
              fontSize: 13, fontWeight: 600,
            }}
          >
            {schedule}
            <span style={{ color: "var(--tem-orange)" }}>editar</span>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "var(--tem-handle)" }}>
              CAPTION
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tem-orange)" }}>editable</span>
          </div>
          <textarea
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            className="tem-textarea"
            style={{
              width: "100%", boxSizing: "border-box", minHeight: 88, resize: "vertical",
              background: "var(--tem-bg)", border: "1.5px solid transparent", borderRadius: 12, padding: 12,
              fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 13, lineHeight: 1.5, color: "var(--tem-ink)",
              outline: "none",
            }}
          />
        </div>

        <div>
          <MetaLabel>Hashtags</MetaLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {work.tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 12, fontWeight: 500, color: "var(--tem-orange)",
                  background: "var(--tem-bg)", padding: "5px 10px", borderRadius: 999,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <MetaLabel>Publicar en</MetaLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {work.platforms.map((t) => {
              const on = !s.pubOff[t];
              return (
                <button
                  key={t}
                  className="press-sm"
                  onClick={() => actions.togglePub(t)}
                  style={{
                    all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "7px 13px",
                    borderRadius: 999, transition: "transform .14s var(--ease-spring)",
                    border: `1.5px solid ${on ? "var(--tem-orange)" : "var(--tem-ink)"}`,
                    background: on ? "var(--tem-orange)" : "var(--tem-surface)",
                    color: on ? "#fff" : "var(--tem-ink)",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, fontWeight: 500, color: "var(--tem-handle)" }}>
            Toca para activar o desactivar cada red.
          </div>
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 9 }}>
          <button
            className="press invert-hover"
            onClick={() =>
              downloadPiecePng(work, cur)
                .then((r) => actions.flash(`Imagen lista · ${r.width}×${r.height}`))
                .catch(() => actions.flash("No pude generar la imagen"))
            }
            style={{
              all: "unset", cursor: "pointer", textAlign: "center", fontSize: 13, fontWeight: 600,
              color: "var(--tem-ink)", border: "1.5px solid var(--tem-ink)", padding: 11, borderRadius: 12,
            }}
          >
            {isVideo ? "Descargar miniatura" : "Descargar imagen"}
          </button>
          <button
            className="press"
            onClick={actions.publishNow}
            style={{
              all: "unset", cursor: "pointer", textAlign: "center", fontSize: 14, fontWeight: 600,
              background: "var(--tem-orange)", color: "#fff", padding: 13, borderRadius: 12,
            }}
          >
            Publicar ahora
          </button>
          <button
            className="press invert-hover"
            onClick={() => actions.flash("Editor manual — próximamente")}
            style={{
              all: "unset", cursor: "pointer", textAlign: "center", fontSize: 13, fontWeight: 600,
              color: "var(--tem-ink)", border: "1.5px solid var(--tem-ink)", padding: 11, borderRadius: 12,
            }}
          >
            Abrir editor manual
          </button>
        </div>
      </aside>
    </div>
  );
}

function MetaLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 11, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase",
        color: "var(--tem-handle)", marginBottom: 8,
      }}
    >
      {children}
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
        placeholder={busy ? "Aplicando el ajuste…" : "Escribe un ajuste…"}
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

function VideoPreview({ cur, work }: { cur: { bg: string; fg: string }; work: import("../types").Proposal }) {
  return (
    <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          position: "relative", aspectRatio: "16 / 9", borderRadius: 20, overflow: "hidden",
          background: cur.bg, boxShadow: "0 2px 4px rgba(17,17,17,.05), 0 16px 40px rgba(17,17,17,.12)",
          padding: 24, display: "flex", flexDirection: "column", transition: "background .3s ease",
          fontFamily: "var(--font-brand)",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 11, letterSpacing: ".25em", color: "var(--tem-orange)" }}>MINIATURA</div>
        <div style={{ marginTop: 12, fontWeight: 900, fontSize: 26, lineHeight: 1.05, letterSpacing: "-.02em", color: cur.fg }}>
          {work.line.pre}
          <span style={{ color: "var(--tem-orange)" }}>{work.line.key}</span>
          {work.line.post}
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--tem-orange)", display: "grid", placeItems: "center" }}>
            <span style={{ width: 0, height: 0, borderLeft: "14px solid #fff", borderTop: "9px solid transparent", borderBottom: "9px solid transparent", marginLeft: 3 }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 13, background: "rgba(17,17,17,.7)", color: "#fff", padding: "3px 9px", borderRadius: 7 }}>
            {work.duration}
          </span>
        </div>
      </div>

      <div style={{ background: "var(--tem-surface)", borderRadius: 16, padding: "16px 18px", boxShadow: "var(--sh-card)", fontFamily: "var(--font-ui)" }}>
        <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".14em", color: "var(--tem-handle)", marginBottom: 11 }}>GUIÓN</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {(work.guion ?? []).map((g, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ width: 22, height: 22, flex: "none", borderRadius: 999, background: "var(--tem-bg)", color: "var(--tem-ink)", fontWeight: 700, fontSize: 11, display: "grid", placeItems: "center" }}>
                {i + 1}
              </span>
              <span style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.35, color: "var(--tem-ink)" }}>{g}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
