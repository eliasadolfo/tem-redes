import { useStore } from "../store";
import { CONNECTABLE, NET_HANDLES } from "../data/mock";
import { supabase } from "../lib/supabase";
import { changePassword } from "../auth/changePassword";

export default function Profile() {
  const { connections, actions } = useStore();

  return (
    <div style={{ padding: "32px 40px", maxWidth: 720 }}>
      <div className="eyebrow">Ajustes</div>
      <h1 style={{ margin: "6px 0 22px", fontWeight: 700, fontSize: 30, letterSpacing: "-.02em" }}>
        Tu perfil y tus redes
      </h1>

      {/* cabecera de perfil */}
      <div style={{ background: "var(--tem-surface)", borderRadius: 22, padding: 24, boxShadow: "var(--sh-card)", display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 64, height: 64, flex: "none", borderRadius: 999, background: "var(--tem-ink)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 24 }}>
          EA
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 20 }}>Elías Adolfo</div>
          <div style={{ fontWeight: 500, fontSize: 14, color: "var(--tem-handle)" }}>
            Fundador · TEM · Tu Escuela de Marcas
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="press invert-hover"
            onClick={() => void changePassword(actions.flash)}
            style={{ all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, border: "1.5px solid var(--tem-ink)", padding: "11px 18px", borderRadius: 12 }}
          >
            Cambiar contraseña
          </button>
          <button
            className="press"
            onClick={() => void supabase?.auth.signOut()}
            style={{ all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--tem-handle)", border: "1.5px solid var(--tem-border-muted)", padding: "11px 16px", borderRadius: 12 }}
          >
            Salir
          </button>
        </div>
      </div>

      <div style={{ margin: "28px 0 14px", fontWeight: 700, fontSize: 18 }}>Redes conectadas</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {CONNECTABLE.map((net) => {
          const on = !!connections[net];
          const statusColor = on ? "var(--tem-orange)" : "var(--tem-handle)";
          return (
            <div
              key={net}
              style={{ background: "var(--tem-surface)", borderRadius: 18, padding: "18px 20px", boxShadow: "var(--sh-card)", display: "flex", alignItems: "center", gap: 16 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{net}</div>
                <div style={{ fontWeight: 500, fontSize: 13, color: "var(--tem-handle)" }}>
                  {on ? NET_HANDLES[net] : "Sin conectar"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: statusColor }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: statusColor }}>
                  {on ? "Conectada" : "No conectada"}
                </span>
              </div>
              <button
                className="press"
                onClick={() => actions.toggleConn(net)}
                style={{
                  all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "10px 18px", borderRadius: 12,
                  border: `1.5px solid ${on ? "var(--tem-ink)" : "var(--tem-orange)"}`,
                  background: on ? "var(--tem-surface)" : "var(--tem-orange)",
                  color: on ? "var(--tem-ink)" : "#fff",
                }}
              >
                {on ? "Desconectar" : "Conectar"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
