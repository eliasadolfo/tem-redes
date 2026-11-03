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
      <Toast message={toast} bottom={isMobile ? 84 : 24} onUndo={undo ? actions.undoLast : null} />
    </>
  );
}

/** H01: la app dice que está arrancando. */
function Booting() {
  return (
    <div className="pantalla-centro tem-muted tem-small" role="status" aria-live="polite">
      <div className="fila">
        <span className="spinner" aria-hidden="true" />
        Abriendo tu plataforma…
      </div>
    </div>
  );
}

/** H09: sin conexión. Qué pasó y cómo seguir, con un botón para reintentar. */
function Offline({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="pantalla-centro">
      <div className="tem-card pila" style={{ maxWidth: 400 }}>
        <h1 className="tem-title">No pude conectar con tu plataforma</h1>
        <p className="tem-small tem-muted">Revisa tu internet y vuelve a intentar. Tus piezas están guardadas; no se perdió nada.</p>
        <button className="tem-btn tem-btn--primario" onClick={onRetry}>Reintentar</button>
      </div>
    </div>
  );
}

/** Con Supabase configurado exige sesión; sin Supabase corre en modo demostración. */
function AuthGate() {
  // undefined = todavía no sabemos; null = sin sesión
  const [session, setSession] = useState<Session | null | undefined>(hasSupabase ? undefined : null);
  const [offline, setOffline] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    setOffline(false);
    // H01: si en 8 s no hay respuesta, dejamos de "cargar" y decimos qué pasa.
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
