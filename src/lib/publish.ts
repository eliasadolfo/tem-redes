// Publicación real en redes vía n8n (las llaves viven en n8n, nunca en la app).
// Contrato del webhook `tem-redes/publicar`: body { token, action, ... } → { ok, ... }.
import { getToken } from "./ai";
import type { Network, PlatformTag, PostResult } from "../types";

export type { PostResult };

const PUBLICAR_URL = import.meta.env.VITE_N8N_PUBLICAR_URL as string | undefined;

export const hasPublishing = Boolean(PUBLICAR_URL);

export interface ConnectionInfo {
  connected: boolean;
  handle: string;
  reauth?: boolean;
}

/** Red de la app → nombre de red canónico (lo que entiende el robot). */
export const TAG_TO_NETWORK: Record<PlatformTag, Network | null> = {
  IG: "Instagram",
  TikTok: "TikTok",
  Shorts: "YouTube",
  YouTube: "YouTube",
  in: "LinkedIn",
  Threads: "Threads",
  Facebook: "Facebook",
  Newsletter: null,
};

/** Clave de cada red en `tem_proposals.posts`. */
export const NETWORK_KEY: Record<Network, string> = {
  Instagram: "instagram",
  TikTok: "tiktok",
  Shorts: "youtube",
  YouTube: "youtube",
  LinkedIn: "linkedin",
  Threads: "threads",
  Facebook: "facebook",
};

async function call<T>(body: Record<string, unknown>, timeoutMs = 600_000): Promise<T> {
  if (!PUBLICAR_URL) throw new Error("La publicación en redes no está configurada (falta VITE_N8N_PUBLICAR_URL).");
  const token = await getToken();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(PUBLICAR_URL, {
      method: "POST",
      // text/plain evita el preflight CORS; n8n parsea el JSON del body.
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ ...body, token }),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json: Record<string, unknown> = {};
    try { json = JSON.parse(text) as Record<string, unknown>; } catch { /* respuesta no JSON */ }
    if (!res.ok || json.ok === false) {
      const msg = (json.message as string) || (json.error as string) || text.slice(0, 200) || `HTTP ${res.status}`;
      throw new Error(msg.replace(/^Error:\s*/, ""));
    }
    return json as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Estado real de cada red (el robot lo revisa y lo guarda en tem_connections). */
export function fetchConnectionStatus(): Promise<{ ok: boolean; needsProfile: boolean; plan: string | null; connections: Record<Network, ConnectionInfo> }> {
  return call({ action: "estado" }, 60_000);
}

/** Link para conectar una red (abre la autorización oficial de esa red). */
export function startConnect(network: Network): Promise<{ ok: boolean; authorize_url: string }> {
  const redirect_url = `${window.location.origin}${window.location.pathname}?conectada=${encodeURIComponent(network)}`;
  return call({ action: "conectar", network, redirect_url }, 60_000);
}

/**
 * Publica (o programa si `when` es una fecha futura ISO) una pieza en sus redes.
 * `trial: true` pide reel de prueba: Instagram lo muestra solo a quienes no te siguen.
 */
export function publishPiece(
  id: string,
  networks: Network[],
  when?: string | null,
  opts?: { trial?: boolean },
): Promise<{ ok: boolean; posts: Record<string, PostResult>; published: boolean; scheduled: boolean }> {
  return call({ action: "publicar", id, networks, when: when ?? null, ...(opts?.trial ? { trial: true } : {}) });
}
