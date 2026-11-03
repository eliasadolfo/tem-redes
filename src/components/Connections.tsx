import { useState } from "react";
import { useStore } from "../store";
import { hasPublishing } from "../lib/publish";
import { CONNECTABLE } from "../lib/platforms";
import type { Network } from "../types";

/** Redes conectadas. Conectar abre la autorización oficial de la red; el estado se lee de verdad. */
export default function Connections() {
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
    <section className="tem-card" aria-labelledby="t-redes">
      <div className="tarjeta-cabeza">
        <h2 className="tem-title" id="t-redes">Redes conectadas</h2>
        {hasPublishing && (
          <button className="tem-btn tem-btn--texto btn-chico" onClick={() => void actions.refreshConnections()} disabled={connChecking}>
            {connChecking && <span className="spinner" aria-hidden="true" />}
            {connChecking ? "Revisando…" : "Revisar conexiones"}
          </button>
        )}
      </div>
      <p className="tem-caption" style={{ marginBottom: 8 }}>
        {hasPublishing
          ? `Cada red se conecta una vez con tu cuenta oficial.${lastCheck ? ` Última revisión: ${new Date(lastCheck).toLocaleString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.` : ""}`
          : "La publicación no está configurada en este entorno."}
      </p>
      <div className="redes-lista">
        {CONNECTABLE.map((net) => {
          const on = Boolean(connections[net]);
          const d = connDetails[net];
          const err = d?.error;
          return (
            <div key={net} className="red">
              <div className="red__nombre">
                <div className="medio">{net}</div>
                {on && !err && d?.handle && <div className="tem-caption">{d.handle}</div>}
                {err && <div className="tem-caption">{err}</div>}
              </div>
              {err ? <span className="tem-tag tem-tag--error">Revisar</span> : on ? <span className="tem-tag tem-tag--ok">Conectada</span> : <span className="tem-tag">Sin conectar</span>}
              {hasPublishing && (
                <button className="tem-btn tem-btn--secundario btn-chico" onClick={() => void connect(net)} disabled={busy === net}>
                  {busy === net ? "Abriendo…" : on && !err ? "Reconectar" : "Conectar"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
