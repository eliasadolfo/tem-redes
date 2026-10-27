import { useState } from "react";
import logoBlack from "../assets/img/logo-tem-black.png";
import { useStore } from "../store";
import { PLATFORM_LABEL } from "../lib/platforms";
import type { Proposal } from "../types";

export default function MobileHome() {
  const { proposals, generating, loading, actions } = useStore();
  const [tema, setTema] = useState("");
  const pending = proposals.filter((p) => p.status === "proposal");
  const scheduled = proposals.filter((p) => p.status === "scheduled").length;

  return (
    <div style={{ padding: "6px 18px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src={logoBlack} alt="TEM" style={{ height: 26, width: "auto", objectFit: "contain" }} />
        <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--tem-ink)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>
          EA
        </div>
      </div>

      <div className="eyebrow" style={{ marginTop: 20 }}>Tu asistente</div>
      <div style={{ marginTop: 6, fontWeight: 700, fontSize: 26, letterSpacing: "-.02em", lineHeight: 1.08 }}>
        Preparé {pending.length} comunicaciones para hoy
      </div>
      <div style={{ marginTop: 6, fontWeight: 500, fontSize: 13, color: "var(--tem-handle)" }}>
        Revísalas, edita y aprueba. {scheduled} ya están programadas esta semana.
      </div>
      <input
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        placeholder="Tema de la semana (opcional)"
        disabled={generating}
        style={{
          boxSizing: "border-box", marginTop: 14, width: "100%", fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500,
          color: "var(--tem-ink)", background: "var(--tem-surface)", border: "1.5px solid var(--tem-border-muted)",
          borderRadius: 12, padding: "12px 14px", outline: "none",
        }}
      />
      <button
        className="press-sm"
        onClick={() => actions.generate({ tema })}
        disabled={generating}
        style={{
          all: "unset", cursor: "pointer", boxSizing: "border-box", marginTop: 14, width: "100%", textAlign: "center",
          fontSize: 14, fontWeight: 600, background: "var(--tem-orange)", color: "#fff", padding: 13, borderRadius: 12,
        }}
      >
        {generating ? "El asistente está escribiendo…" : "Generar propuestas nuevas"}
      </button>

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* H01 — la IA trabajando se ve en el lugar donde aparecerán las piezas */}
        {generating && (
          <div role="status" style={{ background: "var(--tem-surface)", borderRadius: 22, padding: 16, boxShadow: "var(--sh-card)", border: "1.5px dashed var(--tem-orange)", display: "flex", alignItems: "center", gap: 12 }}>
            <span className="spinner" aria-hidden="true" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Redactando 5 propuestas nuevas…</div>
              <div style={{ fontSize: 12, color: "var(--tem-handle)" }}>Suele tardar entre 10 y 20 segundos.</div>
            </div>
          </div>
        )}
        {loading ? (
          [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 170, borderRadius: 22 }} aria-busy="true" />)
        ) : pending.length === 0 && !generating ? (
          <div style={{ background: "var(--tem-surface)", borderRadius: 22, padding: "30px 20px", textAlign: "center", boxShadow: "var(--sh-card)" }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Todo revisado</div>
            <div style={{ marginTop: 6, fontWeight: 500, fontSize: 13, color: "var(--tem-handle)", lineHeight: 1.5 }}>
              Aquí aparecen las propuestas del asistente. Pídele una tanda nueva con el botón de arriba.
            </div>
          </div>
        ) : (
          pending.map((p) => <HomeCard key={p.id} p={p} />)
        )}
      </div>
    </div>
  );
}

function HomeCard({ p }: { p: Proposal }) {
  const { actions } = useStore();
  const title = p.line.pre + p.line.key + p.line.post;
  return (
    <div style={{ background: "var(--tem-surface)", borderRadius: 22, padding: 16, boxShadow: "var(--sh-card)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {p.platforms.map((pl) => (
          <span key={pl} style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", border: "1.5px solid var(--tem-ink)", borderRadius: 999 }}>
            {PLATFORM_LABEL[pl]}
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: "var(--tem-orange)" }}>
          {p.eyebrow}
        </span>
      </div>
      <div style={{ marginTop: 12, fontWeight: 700, fontSize: 19, letterSpacing: "-.01em", lineHeight: 1.15 }}>{title}</div>
      <div style={{ marginTop: 6, fontWeight: 500, fontSize: 12, lineHeight: 1.45, color: "var(--tem-handle)" }}>{p.caption}</div>
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <button
          className="press-sm"
          onClick={() => actions.approve(p.id)}
          style={{ all: "unset", cursor: "pointer", flex: 1, textAlign: "center", fontSize: 13, fontWeight: 600, padding: 11, borderRadius: 12, background: "var(--tem-orange)", color: "#fff" }}
        >
          Aprobar
        </button>
        <button
          className="press-sm"
          onClick={() => actions.openWork(p.id)}
          style={{ all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--tem-ink)" }}
        >
          Editar
        </button>
        <button
          className="press-sm"
          onClick={() => actions.reject(p.id)}
          aria-label="Descartar propuesta"
          title="Quitar de la bandeja (puedes deshacerlo)"
          style={{ all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "11px 14px", borderRadius: 12, border: "1.5px solid var(--tem-border-muted)", color: "var(--tem-handle)" }}
        >
          Descartar
        </button>
      </div>
    </div>
  );
}
