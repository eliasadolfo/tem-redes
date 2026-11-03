import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

/** Pantalla de acceso: un solo usuario (Elías), correo y contraseña. */
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
    // H09: qué pasó y cómo seguir, sin códigos
    if (err) {
      setError(
        /network|fetch/i.test(err.message)
          ? "No hay conexión. Revisa tu internet y vuelve a intentar."
          : "Esa contraseña no coincide con este correo. Revísala e inténtalo de nuevo.",
      );
    }
    setBusy(false);
  };

  return (
    <div className="pantalla-centro">
      <form className="tem-card acceso" onSubmit={submit}>
        <span className="tem-bar__producto">Studio<span className="tem-dot">·</span>TEM</span>
        <h1 className="tem-h1">Entra a tu plataforma</h1>
        <div className="tem-field">
          <label className="tem-label" htmlFor="correo">Correo</label>
          <input id="correo" className="tem-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="tem-field">
          <label className="tem-label" htmlFor="clave">Contraseña</label>
          <input id="clave" className="tem-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
        </div>
        {error && <div className="tem-aviso tem-aviso--error" role="alert">{error}</div>}
        <button type="submit" className="tem-btn tem-btn--primario tem-btn--lg" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
