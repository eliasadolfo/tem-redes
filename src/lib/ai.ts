// Generación de propuestas con Claude, vía webhook de n8n.
// La llave de Anthropic vive en n8n (credencial "Anthropic account");
// el navegador nunca la ve.

import type { Proposal } from "../types";
import { supabase } from "./supabase";

/** Token de la sesión actual: los webhooks lo verifican contra Supabase Auth. */
async function getToken(): Promise<string> {
  if (!supabase) return "";
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

const WEBHOOK_URL = import.meta.env.VITE_N8N_GENERAR_URL as string | undefined;

export const hasAI = Boolean(WEBHOOK_URL);

export interface GenerateOptions {
  count?: number; // 1-10
  tema?: string; // foco de la semana
  contexto?: string; // notas extra de Elías
  existentes?: string[]; // titulares ya existentes, para no repetir
}

interface GenerateResponse {
  ok: boolean;
  count: number;
  proposals: Proposal[];
}

/** Pide a Claude N propuestas nuevas en la voz de TEM. Lanza error si falla. */
export async function generateProposals(opts: GenerateOptions = {}): Promise<Proposal[]> {
  if (!WEBHOOK_URL) throw new Error("Falta VITE_N8N_GENERAR_URL en .env");
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    // text/plain evita el preflight CORS; n8n igual parsea el JSON del body.
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({
      token: await getToken(),
      count: opts.count ?? 5,
      tema: opts.tema ?? "",
      contexto: opts.contexto ?? "",
      existentes: opts.existentes ?? [],
    }),
  });
  if (!res.ok) throw new Error(`Webhook respondió ${res.status}`);
  const data = (await res.json()) as GenerateResponse;
  if (!data.ok || !Array.isArray(data.proposals)) {
    throw new Error("Respuesta inesperada del generador");
  }
  return data.proposals;
}

/* -------------------------------------------------------------------------- */
/*  Copiloto: ajustar una pieza con una instrucción                            */
/* -------------------------------------------------------------------------- */

const ADJUST_URL = import.meta.env.VITE_N8N_AJUSTAR_URL as string | undefined;

/** Campos de la pieza que el copiloto puede modificar. */
export type PieceEdit = Pick<Proposal, "eyebrow" | "line" | "caption" | "tags">;

interface AdjustResponse {
  ok: boolean;
  reply: string;
  piece: PieceEdit;
}

/** Pide a Claude que aplique `instruction` sobre la pieza. Devuelve respuesta + campos nuevos. */
export async function adjustPiece(
  piece: Proposal,
  instruction: string,
): Promise<{ reply: string; piece: PieceEdit }> {
  if (!ADJUST_URL) throw new Error("Falta VITE_N8N_AJUSTAR_URL en .env");
  const res = await fetch(ADJUST_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({
      piece: {
        eyebrow: piece.eyebrow,
        line: piece.line,
        caption: piece.caption,
        tags: piece.tags,
        platforms: piece.platforms,
        type: piece.type,
      },
      instruction,
      token: await getToken(),
    }),
  });
  if (!res.ok) throw new Error(`Webhook respondió ${res.status}`);
  const data = (await res.json()) as AdjustResponse;
  if (!data.ok || !data.piece) throw new Error("Respuesta inesperada del copiloto");
  return { reply: data.reply, piece: data.piece };
}
