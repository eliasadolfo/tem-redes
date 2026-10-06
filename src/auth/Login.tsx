import { useState, type FormEvent } from "react";
import logoBlack from "../assets/img/logo-tem-black.png";
import { supabase } from "../lib/supabase";

/** Pantalla de acceso — un solo usuario (Elías). Email + contraseña. */
export default function Login() {
  const [email, setEmail] = useState("elias@tuescuelademarcas.cl");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError("Correo o contraseña incorrectos.");
    setBusy(false);
  };

  const input: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 500,
    color: "var(--tem-ink)", background: "var(--tem-bg)", border: "1.5px solid transparent", borderRadius: 12,
    padding: "13px 14px", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--tem-bg)", padding: 18 }}>
      <form
        onSubmit={submit}
        style={{
          width: "100%", maxWidth: 380, background: "var(--tem-surface)", borderRadius: 24, padding: 32,
          boxShadow: "var(--sh-elev)", display: "flex", flexDirection: "column", gap: 14,
          animation: "sheetUp .3s var(--ease-spring)",
        }}
      >
        <img src={logoBlack} alt="TEM" style={{ height: 28, width: "auto", objectFit: "contain", alignSelf: "flex-start" }} />
        <div className="eyebrow" style={{ marginTop: 10 }}>Acceso</div>
        <h1 style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 26, letterSpacing: "-.02em", lineHeight: 1.1 }}>
          Entra a tu plataforma
        </h1>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "var(--tem-handle)" }}>CORREO</span>
          <input
            className="tem-textarea"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
            required
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", color: "var(--tem-handle)" }}>CONTRASEÑA</span>
          <input
            className="tem-textarea"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
            required
            autoFocus
          />
        </label>

        {error && (
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tem-orange)" }}>{error}</div>
        )}

        <button
          type="submit"
          className="press"
          disabled={busy}
          style={{
            all: "unset", cursor: "pointer", boxSizing: "border-box", marginTop: 6, textAlign: "center", fontSize: 15,
            fontWeight: 600, background: "var(--tem-orange)", color: "#fff", padding: 14, borderRadius: 12,
          }}
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--tem-handle)", textAlign: "center" }}>
          Plataforma privada de Tu Escuela de Marcas. ¡Hagamos que pase!
        </div>
      </form>
    </div>
  );
}
