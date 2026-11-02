// Capa de acceso a datos sobre Supabase.
// Mapea entre las filas de la DB (tem_*) y los tipos del dominio.
// Si no hay Supabase configurado, las funciones devuelven null/no-op y la
// app sigue funcionando con los datos mock locales.

import { supabase } from "./supabase";
import type {
  CheckItem,
  ConnectionDetail,
  EditMode,
  Network,
  Proposal,
  ProposalStatus,
  PlatformTag,
  PostResult,
  Results,
  Script,
  Stage,
} from "../types";
import { defaultStage } from "./stages";

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
  // v2 — línea de producción
  stage: Stage | null;
  source: string | null;
  script: Script | null;
  shots: CheckItem[] | null;
  checklist: CheckItem[] | null;
  raw_url: string | null;
  edit_mode: EditMode | null;
  delivery: CheckItem[] | null;
  final_url: string | null;
  thumbnail_url: string | null;
  notes: string | null;
  recorded_at: string | null;
  published_at: string | null;
  results: Results | null;
  posts: Record<string, PostResult> | null;
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
    stage: r.stage ?? defaultStage(r.status),
    source: r.source ?? undefined,
    script: r.script ?? undefined,
    shots: r.shots ?? undefined,
    checklist: r.checklist ?? undefined,
    raw_url: r.raw_url ?? undefined,
    edit_mode: r.edit_mode ?? undefined,
    delivery: r.delivery ?? undefined,
    final_url: r.final_url ?? undefined,
    thumbnail_url: r.thumbnail_url ?? undefined,
    notes: r.notes ?? undefined,
    recorded_at: r.recorded_at ?? undefined,
    published_at: r.published_at ?? undefined,
    results: r.results ?? undefined,
    posts: r.posts ?? undefined,
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
    stage: p.stage,
    source: p.source ?? null,
    script: p.script ?? null,
    shots: p.shots ?? null,
    checklist: p.checklist ?? null,
    raw_url: p.raw_url ?? null,
    edit_mode: p.edit_mode ?? null,
    delivery: p.delivery ?? null,
    final_url: p.final_url ?? null,
    thumbnail_url: p.thumbnail_url ?? null,
    notes: p.notes ?? null,
    recorded_at: p.recorded_at ?? null,
    published_at: p.published_at ?? null,
    results: p.results ?? null,
    posts: p.posts ?? null,
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

/** Conexiones por red con detalle (handle, última revisión, error). */
export async function fetchConnections(): Promise<Record<string, ConnectionDetail> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("tem_connections").select("network, connected, handle, checked_at, error");
  if (error) {
    console.error("fetchConnections:", error.message);
    return null;
  }
  const out: Record<string, ConnectionDetail> = {};
  for (const row of data as { network: string; connected: boolean; handle: string | null; checked_at: string | null; error: string | null }[]) {
    out[row.network] = { connected: row.connected, handle: row.handle ?? "", checked_at: row.checked_at, error: row.error };
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

type EditableKey =
  | "eyebrow" | "line" | "caption" | "tags" | "day" | "time" | "status" | "stage" | "source" | "script"
  | "shots" | "checklist" | "raw_url" | "edit_mode" | "delivery" | "final_url" | "thumbnail_url" | "notes" | "recorded_at"
  | "published_at" | "results" | "platforms" | "posts";

/**
 * Campos de la pieza que se pueden actualizar sueltos (ficha, copiloto, tablero).
 * `undefined` = no tocar; `null` = vaciar (sirve para deshacer).
 */
export type ProposalFields = { [K in EditableKey]?: Proposal[K] | null };

/** Columnas que se copian tal cual (undefined = no tocar; el resto se guarda, null incluido). */
const PLAIN_COLUMNS = [
  "eyebrow", "caption", "tags", "day", "time", "status", "stage", "source", "script", "shots",
  "checklist", "raw_url", "edit_mode", "delivery", "final_url", "thumbnail_url", "notes", "recorded_at", "published_at",
  "results", "platforms", "posts",
] as const;

/** Actualiza campos editables de una pieza (ficha / copiloto / etapa). */
export async function updateProposalFields(id: string, fields: ProposalFields): Promise<void> {
  if (!supabase) return;
  const row: Record<string, unknown> = {};
  for (const k of PLAIN_COLUMNS) {
    const v = fields[k];
    if (v !== undefined) row[k] = v;
  }
  if (fields.line) {
    row.line_pre = fields.line.pre;
    row.line_key = fields.line.key;
    row.line_post = fields.line.post;
  }
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("tem_proposals").update(row).eq("id", id);
  if (error) console.error("updateProposalFields:", error.message);
}

/** Inserta propuestas nuevas (p.ej. generadas por la IA o ideas de Elías). */
export async function insertProposals(proposals: Proposal[]): Promise<void> {
  if (!supabase || proposals.length === 0) return;
  const { error } = await supabase.from("tem_proposals").insert(proposals.map(proposalToRow));
  if (error) console.error("insertProposals:", error.message);
}
