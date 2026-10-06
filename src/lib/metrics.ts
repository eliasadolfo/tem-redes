// Motor de métricas — serie determinística por día (estable entre renders).
// En producción se reemplaza por las métricas reales de cada API manteniendo
// la misma forma: serie diaria por red + agregación en cliente.

import { DAY, M_ABBR } from "./dates";
import type { Grain, MetricNet } from "../types";

const ANCHOR = new Date(2025, 6, 1, 12).getTime();

/** Alcance (en miles) de un día dado — determinístico, no aleatorio. */
export function reachOn(ms: number): number {
  const t = Math.floor((ms - ANCHOR) / DAY);
  return Math.max(
    1.2,
    3.4 + t * 0.008 + 1.9 * Math.sin(t / 6.3) + ((Math.abs(t) * 53) % 13) / 8,
  );
}

const sign = (n: number) => (n >= 0 ? "+" : "") + n;
const fmtK = (vK: number) =>
  vK >= 1000 ? (vK / 1000).toFixed(1) + "M" : Math.round(vK) + "K";

interface NetInfo {
  share: number;
  g: number; // multiplicador de crecimiento del delta
  foll: string;
}
const NET_INFO: Record<string, NetInfo> = {
  Todas: { share: 1, g: 1, foll: "18,540" },
  Instagram: { share: 0.5, g: 0.8, foll: "6,120" },
  TikTok: { share: 0.3, g: 1.4, foll: "2,480" },
  YouTube: { share: 0.09, g: 3, foll: "610" },
  LinkedIn: { share: 0.11, g: 0.7, foll: "1,130" },
};

export interface StatCard {
  label: string;
  value: string;
  delta: string;
}
export interface NetworkStat {
  net: string;
  reach: string;
  delta: string;
  foll: string;
  selected: boolean;
}
export interface Bar {
  h: string; // altura porcentual
  label: string;
  max: boolean; // la barra máxima va en naranja sólido
}

export interface MetricsResult {
  stats: StatCard[];
  networkStats: NetworkStat[];
  bars: Bar[];
  chartUnit: string;
  netLabel: string;
}

/** Calcula todo el bloque de métricas para un rango [startMs, endMs]. */
export function computeMetrics(
  startMs: number,
  endMs: number,
  grain: Grain,
  metricNet: MetricNet,
): MetricsResult {
  const perDay: { ms: number; v: number }[] = [];
  for (let ms = startMs; ms <= endMs; ms += DAY) perDay.push({ ms, v: reachOn(ms) });
  const daysCount = perDay.length || 1;
  const total = perDay.reduce((a, p) => a + p.v, 0);

  // delta vs período inmediatamente anterior de la misma duración
  let prevTotal = 0;
  for (let i = 1; i <= daysCount; i++) prevTotal += reachOn(startMs - i * DAY);
  const pct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;

  const nf = NET_INFO[metricNet] ?? NET_INFO.Todas;
  const totalSel = total * nf.share;
  const pctSel = metricNet === "Todas" ? pct : Math.round(pct * nf.g);

  const stats: StatCard[] = [
    { label: "Alcance", value: fmtK(totalSel), delta: sign(pctSel) + "%" },
    {
      label: "Nuevos seguidores",
      value: Math.round(totalSel * 0.09).toLocaleString("en-US"),
      delta: sign(pctSel) + "%",
    },
    {
      label: "Publicados",
      value: String(
        Math.max(
          1,
          Math.round(daysCount * 0.8 * (metricNet === "Todas" ? 1 : 0.35 + nf.share)),
        ),
      ),
      delta: "en " + daysCount + " días",
    },
    { label: "Aprobación IA", value: "85%", delta: "de propuestas" },
  ];

  const shares: [string, number, number, string][] = [
    ["Instagram", 0.5, 0.8, "6,120"],
    ["TikTok", 0.3, 1.4, "2,480"],
    ["YouTube", 0.09, 3, "610"],
    ["LinkedIn", 0.11, 0.7, "1,130"],
  ];
  const networkStats: NetworkStat[] = shares.map(([net, sh, f, foll]) => ({
    net,
    reach: fmtK(total * sh),
    delta: sign(Math.round(pct * f)) + "%",
    foll,
    selected: metricNet === net,
  }));

  // --- puntos del gráfico ---
  let points: { label: string; v: number }[] = [];
  if (grain === "meses") {
    const map = new Map<number, { v: number; y: number; m: number }>();
    perDay.forEach((p) => {
      const d = new Date(p.ms);
      const k = d.getFullYear() * 12 + d.getMonth();
      const cur = map.get(k) || { v: 0, y: d.getFullYear(), m: d.getMonth() };
      cur.v += p.v;
      map.set(k, cur);
    });
    const keys = [...map.keys()].sort((a, b) => a - b);
    const multiYear = new Set([...map.values()].map((o) => o.y)).size > 1;
    points = keys.map((k) => {
      const o = map.get(k)!;
      return { label: M_ABBR[o.m] + (multiYear ? " '" + String(o.y).slice(2) : ""), v: o.v };
    });
  } else if (daysCount <= 16) {
    points = perDay.map((p) => ({ label: String(new Date(p.ms).getDate()), v: p.v }));
  } else {
    const nb = Math.min(14, daysCount);
    const size = Math.ceil(daysCount / nb);
    for (let i = 0; i < daysCount; i += size) {
      const sl = perDay.slice(i, i + size);
      const d = new Date(sl[0].ms);
      points.push({
        label: d.getDate() + " " + M_ABBR[d.getMonth()],
        v: sl.reduce((a, p) => a + p.v, 0),
      });
    }
  }

  const vmax = Math.max(...points.map((p) => p.v));
  const vmin = Math.min(...points.map((p) => p.v));
  const vspan = vmax - vmin || 1;
  const bars: Bar[] = points.map((p) => ({
    h: (16 + 80 * ((p.v - vmin) / vspan)).toFixed(1) + "%",
    label: p.label,
    max: p.v === vmax,
  }));

  const chartUnit = grain === "meses" ? "por mes" : daysCount <= 16 ? "por día" : "agrupado";
  const netLabel = metricNet === "Todas" ? "Global" : metricNet;

  return { stats, networkStats, bars, chartUnit, netLabel };
}
