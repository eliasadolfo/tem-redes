import { useStore } from "../store";
import Connections from "../components/Connections";
import { supabase } from "../lib/supabase";
import { changePassword } from "../auth/changePassword";

export default function Profile() {
  const { actions } = useStore();

  return (
    <div style={{ padding: "32px 40px", maxWidth: 720 }}>
      <div className="eyebrow">Ajustes</div>
      <h1 style={{ margin: "6px 0 22px", fontWeight: 600, fontSize: 30, letterSpacing: "-.02em" }}>
        Tu perfil y tus redes
      </h1>

      {/* cabecera de perfil */}
      <div style={{ background: "var(--tem-surface)", borderRadius: 22, padding: 24, boxShadow: "var(--sh-card)", display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 64, height: 64, flex: "none", borderRadius: 999, background: "var(--tem-ink)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 24 }}>
          EA
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 20 }}>Elías Adolfo</div>
          <div style={{ fontWeight: 400, fontSize: 14, color: "var(--tem-handle)" }}>
            Fundador · TEM · Tu Escuela de Marcas
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="press invert-hover"
            onClick={() => void changePassword(actions.flash)}
            style={{ all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 500, border: "1px solid var(--tem-border)", padding: "11px 18px", borderRadius: 12 }}
          >
            Cambiar contraseña
          </button>
          <button
            className="press"
            onClick={() => void supabase?.auth.signOut()}
            style={{ all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "var(--tem-handle)", border: "1px solid var(--tem-border)", padding: "11px 16px", borderRadius: 12 }}
          >
            Salir
          </button>
        </div>
      </div>

      <Connections />
    </div>
  );
}
