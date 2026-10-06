import { ArrowLeft } from "lucide-react";
import { useStore } from "../store";
import { VARIANTS, HANDLE } from "../data/mock";
import { platformsStr } from "../lib/platforms";
import Card916 from "../components/Card916";

/** Sheet "Editar y publicar" — cubre la pantalla del teléfono. */
export default function EditSheet() {
  const s = useStore();
  const { actions } = s;
  const work = s.proposals.find((p) => p.id === s.work);
  if (!work) return null;

  const cur = VARIANTS[s.variant];

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

        {/* variantes */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {VARIANTS.map((v, i) => (
            <button
              key={i}
              className="press-sm"
              onClick={() => actions.setVariant(i as 0 | 1 | 2)}
              aria-label={`Variante ${i + 1}`}
              style={{
                all: "unset", cursor: "pointer", width: 34, height: 54, borderRadius: 8,
                background: v.bg, border: `2px solid ${s.variant === i ? "var(--tem-orange)" : "#D8D8D8"}`,
              }}
            />
          ))}
        </div>

        {/* caption */}
        <div style={{ alignSelf: "stretch" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "var(--tem-handle)", marginBottom: 8 }}>
            CAPTION
          </div>
          <textarea
            defaultValue={work.caption}
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
                  style={{
                    all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "8px 15px", borderRadius: 999,
                    border: `1.5px solid ${on ? "var(--tem-orange)" : "var(--tem-ink)"}`,
                    background: on ? "var(--tem-orange)" : "var(--tem-surface)", color: on ? "#fff" : "var(--tem-ink)",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--tem-handle)" }}>{platformsStr(work.platforms)}</div>
        </div>
      </div>

      {/* barra inferior fija */}
      <div style={{ display: "flex", gap: 10, padding: "12px 18px 26px", background: "var(--tem-bg)" }}>
        <button
          className="press"
          onClick={actions.publishNow}
          style={{
            all: "unset", cursor: "pointer", flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600,
            background: "var(--tem-orange)", color: "#fff", padding: 15, borderRadius: 14,
          }}
        >
          Publicar ahora
        </button>
        <button
          className="press"
          onClick={() => actions.approve(work.id)}
          style={{
            all: "unset", cursor: "pointer", textAlign: "center", fontSize: 15, fontWeight: 600, color: "var(--tem-ink)",
            border: "1.5px solid var(--tem-ink)", padding: "15px 20px", borderRadius: 14,
          }}
        >
          Aprobar y programar
        </button>
      </div>
    </div>
  );
}
