// Métricas reales: `tem_metrics` trae una foto por publicación y día. Aquí se queda
// la foto más reciente de cada publicación y se agrupa por pieza y por red. Tolera
// columnas nuevas y valores vacíos; nunca completa un dato que no existe.

import { pieceTitle } from "./platforms";
import type { MetricNet, Network, Proposal } from "../types";

/** Bajo este alcance la tasa no dice mucho: esas filas van al final. */
export const MIN_REACH = 100;

export interface MetricRow {
  id: string;
  platform: string; // red canónica: "Instagram", "Threads"…
  proposal_id: string | null;
  external_id: string | null;
  permalink: string | null;
  origin_code: string | null;
  hook: string | null;
  notes: string | null;
  is_test: boolean;
  published_at: string | null;
  captured_at: string | null;
  views: number | null;
  reach: number | null;
  saves: number | null;
  shares: number | null;
}

export interface MetricGroup {
  key: string;
  title: string;
  /** Para abrir la ficha, si la métrica ya está ligada a una pieza. */
  proposalId: string | null;
  permalink: string | null;
  nets: string[];
  posts: number;
  isTest: boolean;
  views: number | null;
  reach: number | null;
  saves: number | null;
  shares: number | null;
  /** Guardados + compartidos por 1.000 de alcance; null si no hay alcance. */
  rate: number | null;
}

const NET_NAME: Record<string, Network> = {
  instagram: "Instagram", ig: "Instagram",
  facebook: "Facebook", fb: "Facebook",
  threads: "Threads",
  tiktok: "TikTok",
  youtube: "YouTube", shorts: "YouTube",
  linkedin: "LinkedIn", in: "LinkedIn",
};

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

/** De una fila cruda a lo que usa la pantalla; lo demás se ignora. */
export function toMetricRow(raw: Record<string, unknown>): MetricRow {
  const platform = String(raw.platform ?? "").trim();
  return {
    id: String(raw.id ?? ""),
    platform: NET_NAME[platform.toLowerCase()] ?? (platform || "Sin red"),
    proposal_id: str(raw.proposal_id),
    external_id: str(raw.external_id),
    permalink: str(raw.permalink),
    origin_code: str(raw.origin_code),
    hook: str(raw.hook),
    notes: str(raw.notes),
    is_test: raw.is_test === true,
    published_at: str(raw.published_at),
    captured_at: str(raw.captured_at) ?? str(raw.captured_day),
    views: num(raw.views),
    reach: num(raw.reach),
    saves: num(raw.saves),
    shares: num(raw.shares),
  };
}

/** La foto más reciente de cada publicación. */
export function latestPerPost(rows: MetricRow[]): MetricRow[] {
  const best = new Map<string, MetricRow>();
  for (const r of rows) {
    const k = `${r.platform}|${r.external_id ?? r.permalink ?? r.proposal_id ?? r.id}`;
    const cur = best.get(k);
    if (!cur || (r.captured_at ?? "") > (cur.captured_at ?? "")) best.set(k, r);
  }
  return [...best.values()];
}

/** Suma que respeta el vacío: si nadie trae el dato, es null, no 0. */
function sum(rows: MetricRow[], f: (r: MetricRow) => number | null): number | null {
  const vals = rows.map(f).filter((v): v is number => v !== null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
}

export function rateOf(saves: number | null, shares: number | null, reach: number | null): number | null {
  if (!reach || reach <= 0 || (saves === null && shares === null)) return null;
  return (((saves ?? 0) + (shares ?? 0)) / reach) * 1000;
}

function group(key: string, title: string, rows: MetricRow[]): MetricGroup {
  const reach = sum(rows, (r) => r.reach);
  const saves = sum(rows, (r) => r.saves);
  const shares = sum(rows, (r) => r.shares);
  return {
    key, title, reach, saves, shares,
    proposalId: rows[0].proposal_id,
    permalink: rows.find((r) => r.permalink)?.permalink ?? null,
    nets: [...new Set(rows.map((r) => r.platform))],
    posts: rows.length,
    isTest: rows.every((r) => r.is_test),
    views: sum(rows, (r) => r.views),
    rate: rateOf(saves, shares, reach),
  };
}

/** Primero lo que funciona con alcance suficiente; lo de poco alcance o sin dato, al final. */
export function rankGroups(list: MetricGroup[]): MetricGroup[] {
  const tier = (g: MetricGroup) => (g.rate === null ? 2 : (g.reach ?? 0) < MIN_REACH ? 1 : 0);
  return [...list].sort((a, b) => tier(a) - tier(b) || (b.rate ?? -1) - (a.rate ?? -1) || (b.reach ?? 0) - (a.reach ?? 0));
}

export interface MetricsView {
  rows: MetricRow[]; // ya filtradas por red
  pieces: MetricGroup[];
  networks: MetricGroup[];
  total: { reach: number | null; rate: number | null; pieces: number };
  best: MetricGroup | null;
  lastCapture: string | null;
}

/** Arma la pantalla: quita lo descartado, deja la última foto y ordena. */
export function buildMetrics(all: MetricRow[], proposals: Proposal[], net: MetricNet): MetricsView {
  const byId = new Map(proposals.map((p) => [p.id, p]));
  const live = latestPerPost(all).filter((r) => !r.proposal_id || byId.get(r.proposal_id)?.status !== "rejected");
  const rows = net === "Todas" ? live : live.filter((r) => r.platform === net);

  const perPiece = new Map<string, MetricRow[]>();
  for (const r of rows) {
    const k = r.proposal_id ?? `post:${r.platform}:${r.external_id ?? r.permalink ?? r.id}`;
    perPiece.set(k, [...(perPiece.get(k) ?? []), r]);
  }
  const pieces = rankGroups(
    [...perPiece.entries()].map(([k, list]) => {
      const p = list[0].proposal_id ? byId.get(list[0].proposal_id) : undefined;
      const title = (p && pieceTitle(p)) || list[0].notes || list[0].hook || list[0].origin_code || "Publicación sin nombre";
      return group(k, title, list);
    }),
  );

  const perNet = new Map<string, MetricRow[]>();
  for (const r of live) perNet.set(r.platform, [...(perNet.get(r.platform) ?? []), r]);
  const networks = rankGroups([...perNet.entries()].map(([k, list]) => group(k, k, list)));

  const reach = sum(rows, (r) => r.reach);
  const best = pieces.find((g) => g.rate !== null && (g.reach ?? 0) >= MIN_REACH) ?? null;
  return {
    rows, pieces, networks, best,
    total: { reach, rate: rateOf(sum(rows, (r) => r.saves), sum(rows, (r) => r.shares), reach), pieces: pieces.length },
    lastCapture: rows.map((r) => r.captured_at ?? "").sort().pop() || null,
  };
}

const NF = new Intl.NumberFormat("es-CL");
export const fmtInt = (n: number | null) => (n === null ? "—" : NF.format(Math.round(n)));
export const fmtRate = (n: number | null) => (n === null ? "—" : n.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
