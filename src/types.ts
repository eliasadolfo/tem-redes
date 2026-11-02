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

/**
 * `status` se mantiene por compatibilidad con la v1:
 * `scheduled` ⇔ etapa `listo`/`publicado`; `rejected` = descartada; `proposal` = en producción.
 */
export type ProposalStatus = "proposal" | "scheduled" | "rejected";

/** Etapas de la línea de producción (v2). El orden importa. */
export type Stage = "idea" | "guion" | "grabar" | "editar" | "listo" | "publicado";

export interface HeadlineLine {
  pre: string;
  key: string; // la palabra clave va en naranja
  post: string;
}

/** Guion de la pieza: gancho, desarrollo, cierre/CTA, formato y duración. */
export interface Script {
  hook: string;
  body: string;
  cta: string;
  duration_s: number | null;
  format: string; // "Reel", "Short", "Video largo", "Post", "Carrusel", "Newsletter"
}

/** Toma a grabar o ítem de checklist: texto + hecho. */
export interface CheckItem {
  id: string;
  text: string;
  done: boolean;
  screen?: string; // solo en tomas: texto que irá en pantalla en esa toma
}

/** Modo de edición (lo define la Oficina de Contenido): A reflexivo, B instructivo, C declaración. */
export type EditMode = "A" | "B" | "C";

/** Resultados tras publicar + aprendizaje. */
export interface Results {
  views: number | null;
  likes: number | null;
  saves: number | null;
  comments: number | null;
  learned: string;
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
  guion?: string[]; // guion para videos largos (v1)
  // --- v2: línea de producción ---
  stage: Stage;
  source?: string; // de dónde salió la idea (nota, reunión, comentario…)
  script?: Script;
  shots?: CheckItem[];
  checklist?: CheckItem[];
  raw_url?: string; // link del bruto (Drive)
  edit_mode?: EditMode; // se elige antes de pasar a Editar
  delivery?: CheckItem[]; // entrega al editor: lo que se confirma a mano
  final_url?: string; // link del video final
  thumbnail_url?: string;
  notes?: string; // instrucciones de edición / por qué importa
  recorded_at?: string; // ISO
  published_at?: string; // ISO
  results?: Results;
  posts?: Record<string, PostResult>; // resultado de publicación por red (instagram, youtube…)
}

/** Resultado de publicar en una red (lo escribe el robot de publicación). */
export interface PostResult {
  ok: boolean;
  at: string;
  url?: string;
  post_id?: string;
  publish_id?: string;
  job_id?: string;
  scheduled?: boolean;
  scheduled_date?: string | null;
  pending?: boolean;
  request_id?: string;
  error?: string;
}

/** Detalle de una conexión de red (tem_connections). */
export interface ConnectionDetail {
  connected: boolean;
  handle: string;
  checked_at: string | null;
  error: string | null;
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
  | "tablero"
  | "ideas"
  | "grabar"
  | "calendar"
  | "library"
  | "metrics"
  | "newsletter"
  | "settings";

export type MobileTab = "inicio" | "grabar" | "semana" | "metricas" | "perfil";

export type MetricNet = "Todas" | "Instagram" | "TikTok" | "YouTube" | "LinkedIn";
export type Grain = "días" | "meses";
