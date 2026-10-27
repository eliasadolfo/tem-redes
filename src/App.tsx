import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { StoreProvider, useStore } from "./store";
import { useIsMobile } from "./lib/useIsMobile";
import { hasSupabase, supabase } from "./lib/supabase";
import DesktopApp from "./desktop/DesktopApp";
import MobileApp from "./mobile/MobileApp";
import Toast from "./components/Toast";
import Login from "./auth/Login";

function Shell() {
  const isMobile = useIsMobile();
  const { toast, undo, actions } = useStore();
  return (
    <>
      {isMobile ? <MobileApp /> : <DesktopApp />}
      <Toast message={toast} bottom={isMobile ? 104 : 32} onUndo={undo ? actions.undoLast : null} />
    </>
  );
}

/** H01 — pantalla de carga: el usuario sabe que la app está arrancando. */
function Booting({ label = "Abriendo tu plataforma…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--tem-bg)",
        color: "var(--tem-handle)", fontSize: 14, fontWeight: 500,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="spinner" aria-hidden="true" />
        {label}
      </div>
    </div>
  );
}

/**
 * Puerta de acceso: con Supabase configurado exige sesión (login);
 * sin Supabase (modo mock) entra directo.
 */
/** H09 — sin conexión: qué pasó y cómo seguir, con un botón para reintentar. */
function Offline({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--tem-bg)", padding: 18 }}>
      <div style={{ maxWidth: 380, background: "var(--tem-surface)", borderRadius: 24, padding: 28, boxShadow: "var(--sh-elev)", textAlign: "center" }}>
        <div className="eyebrow">Sin conexión</div>
        <div style={{ marginTop: 10, fontWeight: 700, fontSize: 20, letterSpacing: "-.02em" }}>No pude conectar con tu plataforma</div>
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: "var(--tem-handle)", lineHeight: 1.5 }}>
          Revisa tu internet y vuelve a intentar. Tus propuestas están guardadas; no se perdió nada.
        </div>
        <button
          className="press"
          onClick={onRetry}
          style={{ all: "unset", cursor: "pointer", marginTop: 18, fontSize: 14, fontWeight: 600, background: "var(--tem-orange)", color: "#fff", padding: "12px 20px", borderRadius: 12 }}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

function AuthGate() {
  // undefined = todavía no sabemos; null = sin sesión
  const [session, setSession] = useState<Session | null | undefined>(hasSupabase ? undefined : null);
  const [offline, setOffline] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    setOffline(false);
    // H01 — si en 8 s no hay respuesta, dejamos de "cargar" y decimos qué pasa.
    const timer = setTimeout(() => setSession((s) => (s === undefined ? (setOffline(true), undefined) : s)), 8000);
    supabase.auth
      .getSession()
      .then(({ data }) => {
        clearTimeout(timer);
        setSession(data.session);
      })
      .catch(() => {
        clearTimeout(timer);
        setOffline(true);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [attempt]);

  if (hasSupabase && offline) return <Offline onRetry={() => setAttempt((a) => a + 1)} />;
  if (hasSupabase && session === undefined) return <Booting />;
  if (hasSupabase && !session) return <Login />;

  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

export default function App() {
  return <AuthGate />;
}
