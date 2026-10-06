// Tipos del dominio de la Plataforma TEM.

/** Etiquetas de plataforma usadas por las piezas (según el prototipo). */
export type PlatformTag =
  | "IG"
  | "TikTok"
  | "Shorts"
  | "YouTube"
  | "in" // LinkedIn
  | "Newsletter";

/** Redes "canónicas" para filtros de biblioteca / métricas / conexiones. */
export type Network =
  | "Instagram"
  | "TikTok"
  | "Shorts"
  | "YouTube"
  | "LinkedIn";

export type ProposalStatus = "proposal" | "scheduled" | "rejected";

export interface HeadlineLine {
  pre: string;
  key: string; // la palabra clave va en naranja
  post: string;
}

export interface Proposal {
  id: string;
  day: number; // 0-4 (lun-vie)
  time: string; // "" = sugerir hora
  platforms: PlatformTag[];
  type: string; // Reel, Short, Video, Newsletter, Post...
  format?: "video" | "vertical";
  duration?: string; // "8:24" para YouTube
  eyebrow: string;
  line: HeadlineLine;
  status: ProposalStatus;
  caption: string;
  tags: string[];
  guion?: string[]; // guion para videos largos
}

/** Estilo de variante del card 9:16. */
export interface Variant {
  bg: string;
  fg: string;
}

export interface GalleryItem {
  eyebrow: string;
  pre: string;
  key: string;
  post: string;
  bg: string;
  fg: string;
  net: Network;
  platStr: string;
  reach: string;
}

export interface ThemeRow {
  name: string;
  pct: string;
  note: string;
}

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export type DesktopView =
  | "calendar"
  | "inbox"
  | "library"
  | "metrics"
  | "newsletter"
  | "settings";

export type MobileTab = "inicio" | "semana" | "metricas" | "perfil";

export type MetricNet = "Todas" | "Instagram" | "TikTok" | "YouTube" | "LinkedIn";
export type Grain = "días" | "meses";
