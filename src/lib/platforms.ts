import type { MetricNet, Network, PlatformTag, Proposal } from "../types";

/** Nombre visible de cada etiqueta de plataforma. */
export const PLATFORM_LABEL: Record<PlatformTag, string> = {
  IG: "Instagram",
  Facebook: "Facebook",
  Threads: "Threads",
  TikTok: "TikTok",
  Shorts: "Shorts",
  YouTube: "YouTube",
  in: "LinkedIn",
  Newsletter: "Newsletter",
};

/** Redes donde se puede publicar, en el orden en que se muestran. */
export const PUBLISH_TAGS: PlatformTag[] = ["IG", "Facebook", "Threads", "TikTok", "Shorts", "YouTube", "in"];

/** Redes que se conectan una vez desde Perfil. */
export const CONNECTABLE: Network[] = ["Instagram", "Facebook", "Threads", "TikTok", "YouTube", "LinkedIn"];

/** Filtro de red en Métricas. */
export const METRIC_NETS: MetricNet[] = ["Todas", "Instagram", "Facebook", "Threads", "TikTok", "YouTube", "LinkedIn"];

export function platformsStr(tags: PlatformTag[]): string {
  return tags.map((t) => PLATFORM_LABEL[t] ?? t).join(" · ");
}

/** Título corrido de una pieza. */
export function pieceTitle(p: Pick<Proposal, "line">): string {
  return p.line.pre + p.line.key + p.line.post;
}
