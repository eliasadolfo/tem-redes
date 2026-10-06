// Capa de acceso a datos sobre Supabase.
// Mapea entre las filas de la DB (tem_*) y los tipos del dominio.
// Si no hay Supabase configurado, las funciones devuelven null/no-op y la
// app sigue funcionando con los datos mock locales.

import { supabase } from "./supabase";
import type { Network, Proposal, ProposalStatus, PlatformTag } from "../types";

interface ProposalRow {
  id: string;
  day: number;
  time: string;
  platforms: string[];
  type: string;
  format: string | null;
  duration: string | null;
  eyebrow: string;
  line_pre: string;
  line_key: string;
  line_post: string;
  status: ProposalStatus;
  caption: string;
  tags: string[];
  guion: string[] | null;
}

function rowToProposal(r: ProposalRow): Proposal {
  return {
    id: r.id,
    day: r.day,
    time: r.time,
    platforms: r.platforms as PlatformTag[],
    type: r.type,
    format: (r.format as Proposal["format"]) ?? undefined,
    duration: r.duration ?? undefined,
    eyebrow: r.eyebrow,
    line: { pre: r.line_pre, key: r.line_key, post: r.line_post },
    status: r.status,
    caption: r.caption,
    tags: r.tags ?? [],
    guion: r.guion ?? undefined,
  };
}

export function proposalToRow(p: Proposal): ProposalRow {
  return {
    id: p.id,
    day: p.day,
    time: p.time,
    platforms: p.platforms,
    type: p.type,
    format: p.format ?? null,
    duration: p.duration ?? null,
    eyebrow: p.eyebrow,
    line_pre: p.line.pre,
    line_key: p.line.key,
    line_post: p.line.post,
    status: p.status,
    caption: p.caption,
    tags: p.tags,
    guion: p.guion ?? null,
  };
}

/** Trae todas las propuestas no rechazadas, ordenadas por día. */
export async function fetchProposals(): Promise<Proposal[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tem_proposals")
    .select("*")
    .order("day", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetchProposals:", error.message);
    return null;
  }
  return (data as ProposalRow[]).map(rowToProposal);
}

/** Estado de conexión por red como { [network]: boolean }. */
export async function fetchConnections(): Promise<Record<string, boolean> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("tem_connections").select("network, connected");
  if (error) {
    console.error("fetchConnections:", error.message);
    return null;
  }
  const out: Record<string, boolean> = {};
  for (const row of data as { network: string; connected: boolean }[]) {
    out[row.network] = row.connected;
  }
  return out;
}

/** Actualiza el estado de una propuesta (aprobar / descartar / programar). */
export async function updateProposalStatus(id: string, status: ProposalStatus): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("tem_proposals").update({ status }).eq("id", id);
  if (error) console.error("updateProposalStatus:", error.message);
}

/** Cambia la conexión de una red (conectar / desconectar). */
export async function updateConnection(network: Network, connected: boolean): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("tem_connections")
    .update({ connected })
    .eq("network", network);
  if (error) console.error("updateConnection:", error.message);
}

/** Actualiza campos editables de una pieza (copiloto / caption). */
export async function updateProposalFields(
  id: string,
  fields: Partial<Pick<Proposal, "eyebrow" | "line" | "caption" | "tags">>,
): Promise<void> {
  if (!supabase) return;
  const row: Record<string, unknown> = {};
  if (fields.eyebrow !== undefined) row.eyebrow = fields.eyebrow;
  if (fields.caption !== undefined) row.caption = fields.caption;
  if (fields.tags !== undefined) row.tags = fields.tags;
  if (fields.line) {
    row.line_pre = fields.line.pre;
    row.line_key = fields.line.key;
    row.line_post = fields.line.post;
  }
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("tem_proposals").update(row).eq("id", id);
  if (error) console.error("updateProposalFields:", error.message);
}

/** Inserta propuestas nuevas (p.ej. generadas por la IA). */
export async function insertProposals(proposals: Proposal[]): Promise<void> {
  if (!supabase || proposals.length === 0) return;
  const { error } = await supabase.from("tem_proposals").insert(proposals.map(proposalToRow));
  if (error) console.error("insertProposals:", error.message);
}
