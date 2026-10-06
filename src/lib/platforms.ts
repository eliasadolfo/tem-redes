import type { PlatformTag } from "../types";

/** Nombre visible de cada etiqueta de plataforma. */
export const PLATFORM_LABEL: Record<PlatformTag, string> = {
  IG: "Instagram",
  TikTok: "TikTok",
  Shorts: "Shorts",
  YouTube: "YouTube",
  in: "LinkedIn",
  Newsletter: "Newsletter",
};

/** Etiqueta corta para pills compactas. */
export const PLATFORM_SHORT: Record<PlatformTag, string> = {
  IG: "IG",
  TikTok: "TikTok",
  Shorts: "Shorts",
  YouTube: "YouTube",
  in: "in",
  Newsletter: "News",
};

export function platformsStr(tags: PlatformTag[]): string {
  return tags.map((t) => PLATFORM_LABEL[t]).join(" · ");
}
