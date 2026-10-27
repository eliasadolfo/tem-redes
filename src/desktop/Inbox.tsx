import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useStore } from "../store";
import { PLATFORM_LABEL } from "../lib/platforms";
import type { Proposal } from "../types";

export default function Inbox() {
  const { proposals, generating, loading, actions } = useStore();
  const items = proposals.filter((p) => p.status === "proposal");
  const [tema, setTema] = useState("");

  return (
    <div style={{ padding: "32px 40px", maxWidth: 820 }}>
      <div className="eyebrow">Bandeja</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, margin: "6px 0 22px" }}>
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: 30, letterSpacing: "-.02em" }}>
          {items.length} propuestas por revisar
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <input
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !generating && actions.generate({ tema })}
            placeholder="Tema de la semana (opcional)"
            disabled={generating}
            style={{
              width: 220, fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500, color: "var(--tem-ink)",
              background: "var(--tem-surface)", border: "1.5px solid var(--tem-border-muted)", borderRadius: 12,
              padding: "11px 14px", outline: "none",
            }}
          />
          <button
            className="press"
            onClick={() => actions.generate({ tema })}
            disabled={generating}
            style={{
              all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              fontSize: 14, fontWeight: 600, background: "var(--tem-orange)", color: "#fff",
              padding: "12px 18px", borderRadius: 12, flexShrink: 0,
            }}
          >
            {generating ? <span className="spinner spinner-sm spinner-light" aria-hidden="true" /> : <Sparkles size={16} strokeWidth={2.4} />}
            {generating ? "El asistente está escribiendo…" : "Generar propuestas"}
          </button>
        </div>
      </div>

      {/* H01 — mientras la IA trabaja, se ve dónde van a aparecer las piezas */}
      {generating && (
        <div
          role="status"
          style={{
            background: "var(--tem-surface)", borderRadius: 22, padding: 22, boxShadow: "var(--sh-card)",
            border: "1.5px dashed var(--tem-orange)", marginBottom: 14, display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <span className="spinner" aria-hidden="true" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Redactando 5 propuestas nuevas…</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--tem-handle)" }}>Suele tardar entre 10 y 20 segundos.</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }} aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 22 }} />)}
        </div>
      ) : items.length === 0 && !generating ? (
        <EmptyState onGenerate={() => actions.generate({ tema })} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((p) => (
            <InboxCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function InboxCard({ p }: { p: Proposal }) {
  const { actions } = useStore();
  const title = p.line.pre + p.line.key + p.line.post;

  return (
    <div style={{ background: "var(--tem-surface)", borderRadius: 22, padding: 22, boxShadow: "var(--sh-card)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {p.platforms.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 11, fontWeight: 600, padding: "4px 10px",
                border: "1.5px solid var(--tem-ink)", borderRadius: 999,
              }}
            >
              {PLATFORM_LABEL[t]}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", color: "var(--tem-orange)" }}>
          {p.eyebrow}
        </span>
      </div>

      <button
        onClick={() => actions.openWork(p.id)}
        title="Abrir en el copiloto para editar"
        style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.01em", margin: "12px 0 8px", lineHeight: 1.2 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--tem-handle)", lineHeight: 1.4 }}>
          {p.caption}
        </div>
      </button>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          className="press"
          onClick={() => actions.approve(p.id)}
          style={{
            all: "unset", cursor: "pointer", flex: 1, textAlign: "center", fontSize: 14, fontWeight: 600,
            background: "var(--tem-orange)", color: "#fff", padding: "11px", borderRadius: 12,
          }}
        >
          Aprobar
        </button>
        <button
          className="press invert-hover"
          onClick={() => actions.openWork(p.id)}
          style={{
            all: "unset", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--tem-ink)",
            border: "1.5px solid var(--tem-ink)", padding: "11px 22px", borderRadius: 12,
          }}
        >
          Editar
        </button>
        <button
          className="press"
          onClick={() => actions.reject(p.id)}
          title="Quitar de la bandeja (puedes deshacerlo)"
          style={{
            all: "unset", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--tem-handle)",
            border: "1.5px solid var(--tem-border-muted)", padding: "11px 16px", borderRadius: 12,
          }}
        >
          Descartar
        </button>
      </div>
    </div>
  );
}

/** H10 — estado vacío que explica qué va aquí y cómo empezar. */
function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div
      style={{
        background: "var(--tem-surface)", borderRadius: 22, padding: "48px 32px", boxShadow: "var(--sh-card)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700 }}>Todo revisado</div>
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: "var(--tem-handle)", maxWidth: 380, marginInline: "auto", lineHeight: 1.5 }}>
        Aquí aparecen las propuestas que redacta el asistente. Pídele una tanda nueva con el tema de la semana y
        apruébalas, edítalas o descártalas.
      </div>
      <button
        className="press"
        onClick={onGenerate}
        style={{
          all: "unset", cursor: "pointer", marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8,
          fontSize: 14, fontWeight: 600, background: "var(--tem-orange)", color: "#fff", padding: "12px 18px", borderRadius: 12,
        }}
      >
        <Sparkles size={16} strokeWidth={2.4} />
        Generar propuestas
      </button>
    </div>
  );
}
