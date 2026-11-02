import { useState } from "react";
import { useStore } from "../store";
import { CONNECTABLE } from "../data/mock";
import { hasPublishing } from "../lib/publish";
import type { Network } from "../types";

/**
 * Redes conectadas (escritorio y móvil). Con publicación configurada, cada
 * "Conectar" abre la autorización oficial de la red (vía Upload-Post) y el
 * estado se lee de verdad. Sin configurar, queda el interruptor manual.
 */
export default function Connections({ compact = false }: { compact?: boolean }) {
  const { connections, connDetails, connChecking, actions } = useStore();
  const [busy, setBusy] = useState<Network | null>(null);

  const connect = async (net: Network) => {
    setBusy(net);
    try {
      await actions.connectNetwork(net);
    } finally {
      setBusy(null);
    }
  };

  const lastCheck = Object.values(connDetails).map((d) => d.checked_at).filter(Boolean).sort().pop();

  return (
    <div>
      <div style={{ margin: compact ? "24px 0 12px" : "28px 0 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontWeight: 600, fontSize: compact ? 17 : 18, flex: 1 }}>Redes conectadas</div>
        {hasPublishing && (
          <button
            className="press invert-hover"
            onClick={() => void actions.refreshConnections()}
            disabled={connChecking}
            title="Consulta el estado real de cada red"
            style={{ all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 500, border: "1px solid var(--tem-border)", padding: "8px 14px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            {connChecking && <span className="spinner" aria-hidden="true" />}
            {connChecking ? "Revisando…" : "Revisar conexiones"}
          </button>
        )}
      </div>
      {hasPublishing && (
        <div style={{ fontSize: 12, fontWeight: 400, color: "var(--tem-handle)", marginBottom: 12, lineHeight: 1.45 }}>
          Conectas cada red una sola vez con tu cuenta oficial; desde entonces la app publica y programa por ti.
          {lastCheck ? ` Última revisión: ${new Date(lastCheck).toLocaleString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.` : ""}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {CONNECTABLE.map((net) => {
          const on = !!connections[net];
          const d = connDetails[net];
          const err = d?.error;
          const statusColor = on && !err ? "var(--tem-orange)" : "var(--tem-handle)";
          const isBusy = busy === net;
          return (
            <div key={net} style={{ background: "var(--tem-surface)", borderRadius: 18, padding: compact ? "16px 18px" : "18px 20px", boxShadow: "var(--sh-card)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: compact ? 15 : 16 }}>{net}</div>
                <div style={{ fontWeight: 400, fontSize: compact ? 12 : 13, color: err ? "var(--tem-orange)" : "var(--tem-handle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {err ? err : on ? (d?.handle || "Conectada") : "Sin conectar"}
                </div>
              </div>
              {!compact && (
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: statusColor }} />
                  <span style={{ fontWeight: 500, fontSize: 13, color: statusColor }}>{on && !err ? "Conectada" : "No conectada"}</span>
                </div>
              )}
              {hasPublishing ? (
                <button
                  className="press"
                  onClick={() => void connect(net)}
                  disabled={isBusy}
                  title={on ? "Vuelve a autorizar esta red" : `Abre la autorización oficial de ${net}`}
                  style={{
                    all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: "9px 16px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 8,
                    border: on && !err ? "1px solid var(--tem-border)" : "none",
                    background: on && !err ? "var(--tem-surface)" : "var(--tem-ink)", color: on && !err ? "var(--tem-ink)" : "#fff",
                  }}
                >
                  {isBusy && <span className="spinner" aria-hidden="true" />}
                  {isBusy ? "Abriendo…" : on && !err ? "Reconectar" : "Conectar"}
                </button>
              ) : (
                <button
                  className="press"
                  onClick={() => actions.toggleConn(net)}
                  title="Marca manual: la publicación automática no está configurada"
                  style={{
                    all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: "9px 16px", borderRadius: 999,
                    border: on ? "1px solid var(--tem-border)" : "none", background: on ? "var(--tem-surface)" : "var(--tem-ink)", color: on ? "var(--tem-ink)" : "#fff",
                  }}
                >
                  {on ? "Desconectar" : "Conectar"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
