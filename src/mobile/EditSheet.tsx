import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../store";
import { VARIANTS, HANDLE } from "../data/mock";
import { DAY_NAMES_FULL } from "../lib/dates";
import { PLATFORM_LABEL } from "../lib/platforms";
import Card916 from "../components/Card916";
import { downloadPiecePng } from "../lib/exportCard";

const VARIANT_NAMES = ["Blanca", "Negra", "Azul"];

/** Sheet "Editar y publicar" — cubre la pantalla del teléfono. */
export default function EditSheet() {
  const s = useStore();
  const { actions } = s;
  const work = s.proposals.find((p) => p.id === s.work);
  const [exporting, setExporting] = useState(false);

  // Caption editable con guardado automático (igual que en escritorio)
  const [caption, setCaption] = useState(work?.caption ?? "");
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setCaption(work?.caption ?? "");
  }, [work?.id, work?.caption]);

  if (!work) return null;

  const cur = VARIANTS[s.variant];
  const activeCount = work.platforms.filter((t) => !s.pubOff[t]).length;

  const onCaptionChange = (value: string) => {
    setCaption(value);
    if (capTimer.current) clearTimeout(capTimer.current);
    capTimer.current = setTimeout(() => actions.updateCaption(work.id, value), 600);
  };

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

  return (
    <div
      style={{
        position: "absolute", inset: 0, zIndex: 40, background: "var(--tem-bg)",
        display: "flex", flexDirection: "column", animation: "sheetUp .3s var(--ease-spring)",
      }}
    >
      {/* cabecera */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
        <button
          className="press-sm"
          onClick={actions.closeWork}
          aria-label="Volver"
          style={{
            all: "unset", cursor: "pointer", width: 38, height: 38, borderRadius: 12,
            background: "var(--tem-surface)", border: "1.5px solid var(--tem-ink)", display: "grid", placeItems: "center",
          }}
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
        </button>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Editar y publicar</div>
      </div>

      {/* contenido scrolleable */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 18px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <Card916
          eyebrow={work.eyebrow}
          line={work.line}
          bg={cur.bg}
          fg={cur.fg}
          handle={HANDLE}
          width={172}
          style={{ boxShadow: "var(--sh-elev)", transition: "background .3s ease" }}
        />

        {/* variantes — H06: con nombre */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {VARIANTS.map((v, i) => (
            <button
              key={i}
              className="press-sm"
              onClick={() => actions.setVariant(i as 0 | 1 | 2)}
              aria-label={`Estilo ${VARIANT_NAMES[i]}`}
              aria-pressed={s.variant === i}
              style={{
                all: "unset", cursor: "pointer", width: 34, height: 54, borderRadius: 8,
                background: v.bg, border: `2px solid ${s.variant === i ? "var(--tem-orange)" : "#D8D8D8"}`,
              }}
            />
          ))}
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--tem-handle)", marginLeft: 4 }}>
            Estilo: <b style={{ color: "var(--tem-ink)", fontWeight: 600 }}>{VARIANT_NAMES[s.variant]}</b>
          </span>
        </div>

        {/* programar — H05: selectores, nunca texto libre */}
        <div style={{ alignSelf: "stretch" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "var(--tem-handle)", marginBottom: 8 }}>
            PROGRAMAR
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={work.day}
              onChange={(e) => actions.updateSchedule(work.id, { day: Number(e.target.value) })}
              aria-label="Día de publicación"
              style={{
                flex: 1, minWidth: 0, fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 600, color: "var(--tem-ink)",
                background: "var(--tem-surface)", border: "1.5px solid var(--tem-ink)", borderRadius: 12, padding: "11px 12px",
              }}
            >
              {DAY_NAMES_FULL.map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </select>
            <input
              type="time"
              value={work.time}
              onChange={(e) => actions.updateSchedule(work.id, { time: e.target.value })}
              aria-label="Hora de publicación"
              style={{
                width: 118, fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 600, color: "var(--tem-ink)",
                background: "var(--tem-surface)", border: "1.5px solid var(--tem-ink)", borderRadius: 12, padding: "10px 12px",
              }}
            />
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "var(--tem-handle)" }}>
            {work.time ? `Sale el ${DAY_NAMES_FULL[work.day].toLowerCase()} a las ${work.time}.` : "Sin hora: el asistente sugiere la mejor."}
          </div>
        </div>

        {/* caption */}
        <div style={{ alignSelf: "stretch" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "var(--tem-handle)" }}>CAPTION</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tem-orange)" }}>se guarda solo</span>
          </div>
          <textarea
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            className="tem-textarea"
            style={{
              width: "100%", boxSizing: "border-box", minHeight: 80, resize: "vertical",
              background: "var(--tem-surface)", border: "1.5px solid transparent", borderRadius: 12, padding: 12,
              fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 14, lineHeight: 1.5, color: "var(--tem-ink)", outline: "none",
            }}
          />
        </div>

        {/* publicar en */}
        <div style={{ alignSelf: "stretch" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "var(--tem-handle)", marginBottom: 8 }}>
            PUBLICAR EN
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {work.platforms.map((t) => {
              const on = !s.pubOff[t];
              return (
                <button
                  key={t}
                  className="press-sm"
                  onClick={() => actions.togglePub(t)}
                  aria-pressed={on}
                  style={{
                    all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "8px 15px", borderRadius: 999,
                    border: `1.5px solid ${on ? "var(--tem-orange)" : "var(--tem-ink)"}`,
                    background: on ? "var(--tem-orange)" : "var(--tem-surface)", color: on ? "#fff" : "var(--tem-ink)",
                  }}
                >
                  {PLATFORM_LABEL[t]}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: activeCount === 0 ? "var(--tem-orange)" : "var(--tem-handle)" }}>
            {activeCount === 0 ? "Activa al menos una red para poder programar." : "Toca una red para quitarla o volver a incluirla."}
          </div>
        </div>
      </div>

      {/* descargar imagen — secundaria, con estado de carga */}
      <div style={{ padding: "0 18px" }}>
        <button
          className="press-sm"
          onClick={() => void exportPng()}
          disabled={exporting}
          style={{
            all: "unset", cursor: "pointer", boxSizing: "border-box", width: "100%", textAlign: "center",
            fontSize: 14, fontWeight: 600, color: "var(--tem-ink)", border: "1.5px solid var(--tem-ink)",
            padding: 12, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {exporting && <span className="spinner spinner-sm" aria-hidden="true" />}
          {exporting ? "Creando imagen…" : work.format === "video" ? "Descargar miniatura" : "Descargar imagen"}
        </button>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--tem-handle)", textAlign: "center" }}>
          Por ahora publicas tú: descarga la imagen y copia el caption.
        </div>
      </div>

      {/* barra inferior — H08: UNA acción principal, consistente con escritorio */}
      <div style={{ display: "flex", gap: 10, padding: "12px 18px 26px", background: "var(--tem-bg)" }}>
        <button
          className="press"
          onClick={actions.publishNow}
          disabled={activeCount === 0}
          style={{
            all: "unset", cursor: "pointer", flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600,
            background: "var(--tem-orange)", color: "#fff", padding: 15, borderRadius: 14,
          }}
        >
          Programar publicación
        </button>
        <button
          className="press"
          onClick={() => actions.reject(work.id)}
          title="Quitar esta propuesta (puedes deshacerlo)"
          style={{
            all: "unset", cursor: "pointer", textAlign: "center", fontSize: 15, fontWeight: 600, color: "var(--tem-handle)",
            border: "1.5px solid var(--tem-border-muted)", padding: "15px 18px", borderRadius: 14,
          }}
        >
          Descartar
        </button>
      </div>
    </div>
  );
}
