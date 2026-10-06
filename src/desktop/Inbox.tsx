import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useStore } from "../store";
import { platformsStr } from "../lib/platforms";
import type { Proposal } from "../types";

export default function Inbox() {
  const { proposals, generating, actions } = useStore();
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
            <Sparkles size={16} strokeWidth={2.4} />
            {generating ? "Generando…" : "Generar propuestas"}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState />
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
              {t}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", color: "var(--tem-orange)" }}>
          {p.eyebrow}
        </span>
      </div>

      <button
        onClick={() => actions.openWork(p.id)}
        style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.01em", margin: "12px 0 8px", lineHeight: 1.2 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--tem-handle)", lineHeight: 1.4 }}>
          {p.caption}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--tem-handle)" }}>{platformsStr(p.platforms)}</div>
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
          style={{
            all: "unset", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--tem-handle)",
            border: "1.5px solid var(--tem-border-muted)", padding: "11px 16px", borderRadius: 12,
          }}
        >
          ✕ Descartar
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: "var(--tem-surface)", borderRadius: 22, padding: "48px 32px", boxShadow: "var(--sh-card)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700 }}>Todo revisado</div>
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: "var(--tem-handle)" }}>
        No hay propuestas pendientes. ¡Hagamos que pase!
      </div>
    </div>
  );
}
