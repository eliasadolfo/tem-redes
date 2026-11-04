// Métricas reales: `tem_metrics` trae una foto por publicación y día. Aquí se queda
// la foto más reciente de cada publicación y se agrupa por pieza y por red. Tolera
// columnas nuevas y valores vacíos; nunca completa un dato que no existe.

import { DAY, M_ABBR, fmtDayMonth, noon } from "./dates";
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
  /** Fecha de publicación más antigua del grupo (ISO). */
  date: string | null;
  /** Un link por publicación real. */
  links: { net: string; url: string }[];
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

const stamp = (r: MetricRow) => (r.captured_at ? Date.parse(r.captured_at) || 0 : 0);

/** La foto más reciente de cada publicación: sumar filas contaría cada post una vez por día. */
export function latestPerPost(rows: MetricRow[]): MetricRow[] {
  const best = new Map<string, MetricRow>();
  for (const r of rows) {
    const k = `${r.platform}|${r.external_id ?? r.permalink ?? r.proposal_id ?? r.id}`;
    const cur = best.get(k);
    if (!cur) {
      best.set(k, r);
      continue;
    }
    // Las cifras son de la última foto; el nombre y el vínculo pueden venir solo en una anterior.
    const [fresh, old] = stamp(r) > stamp(cur) ? [r, cur] : [cur, r];
    best.set(k, {
      ...fresh,
      proposal_id: fresh.proposal_id ?? old.proposal_id,
      notes: fresh.notes ?? old.notes,
      hook: fresh.hook ?? old.hook,
      origin_code: fresh.origin_code ?? old.origin_code,
      is_test: fresh.is_test || old.is_test,
    });
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
    date: rows.map((r) => r.published_at).filter((d): d is string => Boolean(d)).sort()[0] ?? null,
    links: rows.filter((r) => r.permalink).map((r) => ({ net: r.platform, url: r.permalink as string })),
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
  return [...list].sort((a, b) => tier(a) - tier(b) || (b.rate ?? -1) - (a.rate ?? -1) || (b.reach ?? 0) - (a.reach ?? 0) || (b.views ?? 0) - (a.views ?? 0));
}

export interface SeriesSlot {
  ms: number;
  label: string;
  views: number | null;
  reach: number | null;
  engaged: number | null; // guardados + compartidos
}
export interface MetricSeries {
  unit: "día" | "semana" | "mes";
  slots: SeriesSlot[];
  /** Tramos con al menos una publicación. */
  withData: number;
}

/**
 * Serie por fecha de publicación, con la última medición de cada post. Un tramo sin
 * publicaciones queda en null, no en 0: la gráfica no dibuja lo que no pasó.
 */
export function buildSeries(rows: MetricRow[], start: number, end: number): MetricSeries {
  const days = Math.round((end - start) / DAY) + 1;
  const unit = days <= 92 ? "día" : days <= 400 ? "semana" : "mes";
  const keyOf = (ms: number) => {
    const d = new Date(ms);
    if (unit === "día") return noon(ms);
    if (unit === "semana") return start + Math.floor(Math.round((noon(ms) - start) / DAY) / 7) * 7 * DAY;
    return new Date(d.getFullYear(), d.getMonth(), 1, 12).getTime();
  };
  const groups = new Map<number, MetricRow[]>();
  for (let ms = start; ms <= end; ms += DAY) {
    const k = keyOf(noon(ms));
    if (!groups.has(k)) groups.set(k, []);
  }
  for (const r of rows) {
    if (!r.published_at) continue;
    const list = groups.get(keyOf(new Date(r.published_at).getTime()));
    if (list) list.push(r);
  }
  const slots = [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([ms, list]) => {
    const d = new Date(ms);
    return {
      ms,
      label: unit === "mes" ? `${M_ABBR[d.getMonth()]} ${d.getFullYear()}` : fmtDayMonth(d),
      views: sum(list, (r) => r.views),
      reach: sum(list, (r) => r.reach),
      engaged: sum(list, (r) => (r.saves === null && r.shares === null ? null : (r.saves ?? 0) + (r.shares ?? 0))),
    };
  });
  return { unit, slots, withData: [...groups.values()].filter((l) => l.length > 0).length };
}

export interface MetricsView {
  rows: MetricRow[]; // última foto, ya filtradas por red y rango
  pieces: MetricGroup[];
  networks: MetricGroup[];
  series: MetricSeries;
  total: { views: number | null; reach: number | null; rate: number | null; pieces: number };
  /** Publicaciones sin fecha: no entran en ningún rango. */
  undated: number;
}

/** Arma la pantalla: quita lo descartado, deja la última foto, filtra y ordena. */
export function buildMetrics(all: MetricRow[], proposals: Proposal[], net: MetricNet, start: number, end: number): MetricsView {
  const byId = new Map(proposals.map((p) => [p.id, p]));
  const live = latestPerPost(all).filter((r) => !r.proposal_id || byId.get(r.proposal_id)?.status !== "rejected");
  const inRange = live.filter((r) => {
    if (!r.published_at) return false;
    const day = noon(new Date(r.published_at).getTime());
    return day >= start && day <= end;
  });
  const rows = net === "Todas" ? inRange : inRange.filter((r) => r.platform === net);

  const perPiece = new Map<string, MetricRow[]>();
  for (const r of rows) {
    const k = r.proposal_id ?? `post:${r.platform}:${r.external_id ?? r.permalink ?? r.id}`;
    perPiece.set(k, [...(perPiece.get(k) ?? []), r]);
  }
  const pieces = rankGroups(
    [...perPiece.entries()].map(([k, list]) => {
      const p = list[0].proposal_id ? byId.get(list[0].proposal_id) : undefined;
      const title = (p && pieceTitle(p)) || list[0].notes || list[0].hook || list[0].origin_code || `Publicación de ${list[0].platform}`;
      return group(k, title, list);
    }),
  );

  const perNet = new Map<string, MetricRow[]>();
  for (const r of inRange) perNet.set(r.platform, [...(perNet.get(r.platform) ?? []), r]);
  const networks = rankGroups([...perNet.entries()].map(([k, list]) => group(k, k, list)));

  // La tasa solo cuenta posts con alcance y con guardados o compartidos: hay redes que no los entregan.
  const rated = rows.filter((r) => r.reach !== null && (r.saves !== null || r.shares !== null));
  return {
    rows, pieces, networks,
    series: buildSeries(rows, start, end),
    total: {
      views: sum(rows, (r) => r.views),
      reach: sum(rows, (r) => r.reach),
      rate: rateOf(sum(rated, (r) => r.saves), sum(rated, (r) => r.shares), sum(rated, (r) => r.reach)),
      pieces: pieces.length,
    },
    undated: live.filter((r) => !r.published_at).length,
  };
}

/** Hora de la última captura entre todas las filas. */
export function lastCapture(all: MetricRow[]): string | null {
  return all.reduce<MetricRow | null>((best, r) => (!best || stamp(r) > stamp(best) ? r : best), null)?.captured_at ?? null;
}

const NF = new Intl.NumberFormat("es-CL");
export const fmtInt = (n: number | null) => (n === null ? "—" : NF.format(Math.round(n)));
export const fmtRate = (n: number | null) => (n === null ? "—" : n.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
