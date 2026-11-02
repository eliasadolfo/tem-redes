import { useStore } from "../store";

export default function Newsletter() {
  const { actions } = useStore();

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        <div className="eyebrow">Newsletter</div>
        <h1 style={{ margin: "6px 0 22px", fontWeight: 600, fontSize: 30, letterSpacing: "-.02em" }}>
          Carta de la semana
        </h1>

        <div style={{ background: "var(--tem-surface)", borderRadius: 24, padding: 34, boxShadow: "var(--sh-card)", maxWidth: 640 }}>
          <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: ".06em", color: "var(--tem-handle)" }}>ASUNTO</div>
          <div style={{ margin: "8px 0 26px", fontWeight: 600, fontSize: 26, letterSpacing: "-.02em", lineHeight: 1.1 }}>
            Lo que aprendí <span style={{ color: "var(--tem-orange)" }}>registrando 5 marcas</span>
          </div>
          <div style={{ fontWeight: 400, fontSize: 15, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0 }}>Hola, soy Elías.</p>
            <p style={{ margin: 0 }}>
              La primera marca que registré me tomó <b style={{ fontWeight: 600 }}>9 meses</b> y muchos errores. La
              quinta, <b style={{ fontWeight: 600 }}>90 días</b>. Hoy te cuento los 3 atajos que hubiera querido saber
              desde el día uno.
            </p>
            <div style={{ height: 12, background: "var(--tem-bg)", borderRadius: 6, width: "100%" }} />
            <div style={{ height: 12, background: "var(--tem-bg)", borderRadius: 6, width: "86%" }} />
            <div style={{ height: 12, background: "var(--tem-bg)", borderRadius: 6, width: "92%" }} />
          </div>
        </div>
      </div>

      {/* copiloto de la newsletter */}
      <aside
        style={{
          width: 270, flexShrink: 0, background: "var(--tem-surface)", borderLeft: "1px solid var(--tem-hairline)",
          padding: "24px 20px", display: "flex", flexDirection: "column", gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--tem-orange)" }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>Asistente</span>
        </div>
        <div style={{ background: "var(--tem-bg)", borderRadius: "16px 16px 16px 5px", padding: "13px 14px", fontSize: 13, fontWeight: 400, lineHeight: 1.45 }}>
          Redacté un borrador con tu voz de fundador. ¿Lo hago más corto o agrego un CTA a registrar?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["Más corta", "Agregar CTA"].map((c) => (
            <button
              key={c}
              className="press invert-hover"
              onClick={() => actions.flash("Ajuste aplicado al borrador")}
              style={{
                all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: "10px 13px",
                border: "1px solid var(--tem-border)", borderRadius: 999, textAlign: "center",
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          className="press"
          onClick={() => actions.flash("Newsletter programada")}
          style={{
            all: "unset", cursor: "pointer", marginTop: "auto", textAlign: "center", fontSize: 14, fontWeight: 500,
            background: "var(--tem-ink)", color: "#fff", padding: 12, borderRadius: 999,
          }}
        >
          Aprobar y programar envío
        </button>
      </aside>
    </div>
  );
}
