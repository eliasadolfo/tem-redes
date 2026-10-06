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
  const { toast } = useStore();
  return (
    <>
      {isMobile ? <MobileApp /> : <DesktopApp />}
      <Toast message={toast} bottom={isMobile ? 104 : 32} />
    </>
  );
}

/**
 * Puerta de acceso: con Supabase configurado exige sesión (login);
 * sin Supabase (modo mock) entra directo.
 */
function AuthGate() {
  // undefined = todavía no sabemos; null = sin sesión
  const [session, setSession] = useState<Session | null | undefined>(hasSupabase ? undefined : null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (hasSupabase && session === undefined) return null; // cargando sesión
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
