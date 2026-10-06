import { useStore } from "../store";
import { CONNECTABLE, NET_HANDLES } from "../data/mock";
import { supabase } from "../lib/supabase";
import { changePassword } from "../auth/changePassword";

export default function MobileProfile() {
  const { connections, actions } = useStore();

  return (
    <div style={{ padding: "6px 18px 0" }}>
      <div className="eyebrow">Ajustes</div>
      <div style={{ marginTop: 6, fontWeight: 700, fontSize: 24, letterSpacing: "-.02em" }}>Tu perfil</div>

      {/* cabecera */}
      <div style={{ marginTop: 16, background: "var(--tem-surface)", borderRadius: 22, padding: 20, boxShadow: "var(--sh-card)", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 54, height: 54, flex: "none", borderRadius: 999, background: "var(--tem-ink)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 20 }}>
          EA
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Elías Adolfo</div>
          <div style={{ fontWeight: 500, fontSize: 13, color: "var(--tem-handle)" }}>Fundador · @tuescuelademarcas</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          className="press-sm"
          onClick={() => void changePassword(actions.flash)}
          style={{ all: "unset", cursor: "pointer", flex: 1, textAlign: "center", fontSize: 13, fontWeight: 600, border: "1.5px solid var(--tem-ink)", padding: 11, borderRadius: 12 }}
        >
          Cambiar contraseña
        </button>
        <button
          className="press-sm"
          onClick={() => void supabase?.auth.signOut()}
          style={{ all: "unset", cursor: "pointer", textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--tem-handle)", border: "1.5px solid var(--tem-border-muted)", padding: "11px 16px", borderRadius: 12 }}
        >
          Salir
        </button>
      </div>

      <div style={{ margin: "24px 0 12px", fontWeight: 700, fontSize: 17 }}>Redes conectadas</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {CONNECTABLE.map((net) => {
          const on = !!connections[net];
          const statusColor = on ? "var(--tem-orange)" : "var(--tem-handle)";
          return (
            <div key={net} style={{ background: "var(--tem-surface)", borderRadius: 18, padding: "16px 18px", boxShadow: "var(--sh-card)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{net}</div>
                <div style={{ fontWeight: 500, fontSize: 12, color: statusColor }}>{on ? NET_HANDLES[net] : "Sin conectar"}</div>
              </div>
              <button
                className="press-sm"
                onClick={() => actions.toggleConn(net)}
                style={{
                  all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 12,
                  border: `1.5px solid ${on ? "var(--tem-ink)" : "var(--tem-orange)"}`,
                  background: on ? "var(--tem-surface)" : "var(--tem-orange)", color: on ? "var(--tem-ink)" : "#fff",
                }}
              >
                {on ? "Desconectar" : "Conectar"}
              </button>
            </div>
          );
        })}
      </div>

      {/* bloque newsletter */}
      <div style={{ marginTop: 24, background: "var(--tem-ink)", borderRadius: 22, padding: 22, color: "#fff" }}>
        <div className="eyebrow">Newsletter</div>
        <div style={{ marginTop: 8, fontWeight: 700, fontSize: 18 }}>Carta de la semana</div>
        <div style={{ marginTop: 6, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.6)" }}>
          Un borrador con tu voz de fundador, listo para revisar.
        </div>
        <button
          className="press-sm"
          onClick={() => actions.flash("Abriendo borrador…")}
          style={{ all: "unset", cursor: "pointer", marginTop: 14, display: "inline-block", fontSize: 14, fontWeight: 600, background: "var(--tem-orange)", color: "#fff", padding: "11px 18px", borderRadius: 12 }}
        >
          Ver borrador de esta semana
        </button>
      </div>
    </div>
  );
}
