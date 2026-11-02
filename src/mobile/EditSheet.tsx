import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../store";
import { VARIANTS, HANDLE } from "../data/mock";
import Card916 from "../components/Card916";
import { downloadPiecePng } from "../lib/exportCard";
import { AdvanceBar, StageHeader, StageSections } from "../components/stages/StageFlow";

const VARIANT_NAMES = ["Blanca", "Negra", "Azul"];

/** Ficha de la pieza en el teléfono: misma lógica por etapa que en escritorio. */
export default function EditSheet() {
  const s = useStore();
  const { actions } = s;
  const work = s.proposals.find((p) => p.id === s.work);
  const [exporting, setExporting] = useState(false);

  if (!work) return null;

  const cur = VARIANTS[s.variant];

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
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px 10px" }}>
        <button
          className="press-sm"
          onClick={actions.closeWork}
          aria-label="Volver"
          title="Volver. Los cambios ya están guardados."
          style={{
            all: "unset", cursor: "pointer", width: 38, height: 38, flex: "none", borderRadius: 12,
            background: "var(--tem-surface)", border: "1.5px solid var(--tem-ink)", display: "grid", placeItems: "center",
          }}
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StageHeader p={work} compact />
        </div>
      </div>

      {/* contenido scrolleable */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Card916
            eyebrow={work.eyebrow}
            line={work.line}
            bg={cur.bg}
            fg={cur.fg}
            handle={HANDLE}
            width={110}
            style={{ boxShadow: "var(--sh-elev)", transition: "background .3s ease", flex: "none" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {VARIANTS.map((v, i) => (
                <button
                  key={i}
                  className="press-sm"
                  onClick={() => actions.setVariant(i as 0 | 1 | 2)}
                  aria-label={`Estilo ${VARIANT_NAMES[i]}`}
                  aria-pressed={s.variant === i}
                  style={{ all: "unset", cursor: "pointer", width: 28, height: 44, borderRadius: 7, background: v.bg, border: `2px solid ${s.variant === i ? "var(--tem-orange)" : "#D8D8D8"}` }}
                />
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--tem-handle)" }}>Estilo: <b style={{ color: "var(--tem-ink)", fontWeight: 600 }}>{VARIANT_NAMES[s.variant]}</b></div>
            <button
              className="press-sm"
              onClick={() => void exportPng()}
              disabled={exporting}
              style={{
                all: "unset", cursor: "pointer", textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--tem-ink)",
                border: "1.5px solid var(--tem-ink)", padding: "8px 12px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              {exporting && <span className="spinner spinner-sm" aria-hidden="true" />}
              {exporting ? "Creando…" : work.format === "video" ? "Descargar miniatura" : "Descargar imagen"}
            </button>
          </div>
        </div>

        <StageSections p={work} />

        <button
          className="press-sm"
          onClick={() => actions.reject(work.id)}
          title="Quitar esta pieza (puedes deshacerlo)"
          style={{ all: "unset", cursor: "pointer", alignSelf: "center", fontSize: 12, fontWeight: 600, color: "var(--tem-handle)", border: "1.5px solid var(--tem-border-muted)", padding: "9px 14px", borderRadius: 12 }}
        >
          Descartar pieza
        </button>
      </div>

      {/* barra inferior — H08: UNA acción principal, consistente con escritorio */}
      <div style={{ padding: "10px 18px 26px", background: "var(--tem-bg)", borderTop: "1px solid var(--tem-border-muted)" }}>
        <AdvanceBar p={work} stacked />
      </div>
    </div>
  );
}
