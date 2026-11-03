// Línea de producción: orden de etapas, nombres visibles, requisitos para
// avanzar y valores por defecto. Fuente única para escritorio y móvil.

import type { CheckItem, HeadlineLine, Proposal, ProposalStatus, Script, Stage } from "../types";
import { deliveryFor, guideFor, pieceFormat } from "./formatos";
import { fmtWhen, toInputs } from "./dates";

export const STAGES: Stage[] = ["idea", "guion", "grabar", "editar", "listo", "publicado"];

/** Nombre visible (nunca el nombre interno de la columna). */
export const STAGE_LABEL: Record<Stage, string> = {
  idea: "Idea",
  guion: "Guion",
  grabar: "Grabar",
  editar: "Editar",
  listo: "Listo",
  publicado: "Publicado",
};

/** Qué pasa en cada etapa: se muestra en tooltips y estados vacíos (H10). */
export const STAGE_HELP: Record<Stage, string> = {
  idea: "Material crudo: algo que dijiste, un caso, un dato. Aquí se decide qué vale la pena contar.",
  guion: "Gancho, desarrollo y cierre; formato, duración y la lista de tomas que vas a grabar.",
  grabar: "Hoja de rodaje del formato, checklist, teleprompter, texto en pantalla por toma y la entrega al editor.",
  editar: "Instrucciones de corte, subtítulos, miniatura, caption con hashtags y el link del video final.",
  listo: "Día, hora y redes elegidas. Lo que está aquí sale al calendario.",
  publicado: "Resultados y aprendizaje. Lo aprendido vuelve a Ideas para la próxima pieza.",
};

/** Qué pide cada etapa para dejar entrar una pieza (texto visible antes de bloquear, H05). */
export const STAGE_REQUIREMENT: Record<Stage, string> = {
  idea: "",
  guion: "título y por qué importa",
  grabar: "gancho, desarrollo y al menos una toma",
  editar: "toda la entrega al editor marcada",
  listo: "link del video final y caption",
  publicado: "al menos una red activa",
};

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

export function nextStage(stage: Stage): Stage | null {
  const i = stageIndex(stage);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

export function prevStage(stage: Stage): Stage | null {
  const i = stageIndex(stage);
  return i > 0 ? STAGES[i - 1] : null;
}

/** `status` compatible con la v1 para una etapa dada. */
export function statusForStage(stage: Stage): ProposalStatus {
  return stage === "listo" || stage === "publicado" ? "scheduled" : "proposal";
}

/** Etapa por defecto de una fila sin `stage` (datos de la v1). */
export function defaultStage(status: ProposalStatus): Stage {
  return status === "scheduled" ? "listo" : "idea";
}

export const EMPTY_SCRIPT: Script = { hook: "", body: "", cta: "", duration_s: null, format: "Reel" };

export const SCRIPT_FORMATS = ["Reel", "Short", "Historia", "Video largo", "Post", "Carrusel", "Newsletter"];

/** Duraciones típicas (segundos) para el selector del guion (H05: selectores, no texto libre). */
export const DURATIONS_S = [10, 15, 30, 45, 60, 90, 180, 300, 600];

export function newItem(text: string): CheckItem {
  return { id: Math.random().toString(36).slice(2, 10), text, done: false };
}

/** Plantillas de tomas típicas de un Reel TEM. */
export const SHOT_TEMPLATES = [
  "Gancho a cámara, plano medio",
  "Desarrollo: punto 1, con texto en pantalla",
  "Desarrollo: punto 2",
  "Cierre con llamado a la acción",
  "B-roll: pantalla del formulario / documento",
];

/**
 * Convierte una línea escrita a mano en titular: la parte entre *asteriscos*
 * es la palabra clave (va en naranja). Sin asteriscos, todo es `pre`.
 */
export function parseLine(text: string): HeadlineLine {
  const m = /^(.*?)\*([^*]+)\*(.*)$/.exec(text);
  if (!m) return { pre: text, key: "", post: "" };
  return { pre: m[1], key: m[2], post: m[3] };
}

/**
 * Fecha real de la pieza: la publicación si ya salió; si no, la programada, o la que
 * devolvió el robot por red. `null` = sin fecha: no se ubica en ninguna semana.
 */
export function pieceWhen(p: Proposal): string | null {
  if (p.stage === "publicado" && p.published_at) return p.published_at;
  if (p.scheduled_at) return p.scheduled_at;
  const dates = Object.values(p.posts ?? {}).map((r) => r.scheduled_date).filter((d): d is string => Boolean(d)).sort();
  return dates[0] ?? null;
}

/** Campos a guardar para una fecha. `day` solo admite lunes a viernes en la base. */
export function scheduleFields(iso: string): { scheduled_at: string; time: string; day?: number } {
  const day = (new Date(iso).getDay() + 6) % 7;
  return { scheduled_at: iso, time: toInputs(iso).time, ...(day <= 4 ? { day } : {}) };
}

/** Texto para leer en el teleprompter: el guion unido en orden. */
export function scriptText(p: Proposal): string {
  const s = p.script;
  if (!s) return "";
  // Los ganchos alternativos se leen seguidos, con aire entre uno y otro.
  const hook = s.hook.replace(/\n+(?=GANCHO [A-Z]:)/g, "\n\n");
  return [hook, s.body, s.cta].filter((t) => t.trim()).join("\n\n");
}

/**
 * Devuelve `null` si la pieza puede entrar en `target`; si no, una frase corta
 * con lo que falta (H03/H05/H09: el botón explica qué falta).
 */
export function missingFor(p: Proposal, target: Stage, activePlatforms?: number): string | null {
  // Hacia atrás siempre se puede.
  if (stageIndex(target) <= stageIndex(p.stage)) return null;
  // Hacia adelante: cada etapa intermedia tiene que cumplirse (no se saltan etapas).
  const from = stageIndex(p.stage);
  const to = stageIndex(target);
  for (let i = from + 1; i <= to; i++) {
    const m = missingForStep(p, STAGES[i], activePlatforms);
    if (m) return m;
  }
  return null;
}

function missingForStep(p: Proposal, target: Stage, activePlatforms?: number): string | null {
  switch (target) {
    case "idea":
      return null;
    case "guion": {
      const title = (p.line.pre + p.line.key + p.line.post).trim();
      if (!title) return "Falta el título de la idea.";
      if (!(p.notes ?? "").trim() && !(p.caption ?? "").trim()) return "Falta decir por qué importa.";
      return null;
    }
    case "grabar": {
      if (!p.script?.hook.trim()) return "Falta el gancho del guion.";
      if (!p.script?.body.trim() && guideFor(pieceFormat(p)).key !== "historia") return "Falta el desarrollo del guion.";
      if (!p.shots || p.shots.length === 0) return "Añade al menos una toma.";
      return null;
    }
    case "editar":
      return deliveryMissing(p);
    case "listo": {
      if (!(p.final_url ?? "").trim()) return "Falta el link del video final.";
      if (!(p.caption ?? "").trim()) return "Falta el caption.";
      return null;
    }
    case "publicado": {
      const n = activePlatforms ?? p.platforms.length;
      if (n === 0) return "Activa al menos una red.";
      return null;
    }
  }
}

/** Resumen de una línea de cada etapa para mostrarla plegada en la ficha. */
export function stageSummary(p: Proposal, stage: Stage): string {
  switch (stage) {
    case "idea":
      return p.source ? `De: ${p.source}` : (p.notes || p.caption || "Sin notas todavía");
    case "guion": {
      const s = p.script;
      if (!s || !s.hook) return "Sin guion todavía";
      const dur = s.duration_s ? ` · ${s.duration_s < 120 ? `${s.duration_s} s` : `${Math.round(s.duration_s / 60)} min`}` : "";
      const n = (p.shots ?? []).length;
      return `${s.format}${dur} · ${n === 1 ? "1 toma" : `${n} tomas`}`;
    }
    case "grabar": {
      const d = deliveryStatus(p);
      const ok = d.filter((x) => x.done).length;
      return ok === d.length ? "Entrega completa" : `Entrega ${ok} de ${d.length}`;
    }
    case "editar":
      return p.final_url ? "Video final listo" : (p.notes ? "Instrucciones escritas" : "Sin instrucciones de edición");
    case "listo":
    {
      const when = pieceWhen(p);
      return when ? `Sale el ${fmtWhen(when)}` : "Sin fecha";
    }
    case "publicado": {
      const r = p.results;
      if (!r || r.views == null) return "Sin resultados todavía";
      return `${r.views} vistas`;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Entrega al editor (como un editor: nada se renderiza a medias)             */
/* -------------------------------------------------------------------------- */

export interface DeliveryItem extends CheckItem {
  /** `true` = lo calcula la app a partir de los datos; `false` = lo confirma Elías a mano. */
  auto: boolean;
}

/**
 * Lista completa de la entrega al editor para la pieza: lo automático (guion,
 * tomas, texto en pantalla, bruto, modo) + lo manual del formato (`p.delivery`).
 */
export function deliveryStatus(p: Proposal): DeliveryItem[] {
  const g = guideFor(pieceFormat(p));
  const shots = p.shots ?? [];
  const done = shots.filter((s) => s.done).length;
  const auto: DeliveryItem[] = [];
  const hook = (p.script?.hook ?? "").trim();
  const body = (p.script?.body ?? "").trim();
  // Una historia puede ser una sola frase: basta con el gancho.
  const bodyOk = Boolean(body) || g.key === "historia";
  auto.push({ id: "auto_script", text: g.key === "historia" ? "Guion final" : "Guion final: gancho y desarrollo", done: Boolean(hook && bodyOk), auto: true });
  if (g.isVideo) {
    auto.push({ id: "auto_shots", text: shots.length ? `Todas las tomas grabadas (${done} de ${shots.length})` : "Lista de tomas", done: shots.length > 0 && done === shots.length, auto: true });
    auto.push({ id: "auto_screen", text: "Texto en pantalla anotado en cada toma", done: shots.length > 0 && shots.every((s) => (s.screen ?? "").trim().length > 0), auto: true });
    if (g.editMode) auto.push({ id: "auto_mode", text: "Modo de edición elegido (A, B o C)", done: Boolean(p.edit_mode), auto: true });
  }
  auto.push({ id: "auto_raw", text: g.isVideo ? "Link del bruto" : "Link del material (fotos, captura o nota)", done: (p.raw_url ?? "").trim().length > 0, auto: true });
  const manual = (p.delivery?.length ? p.delivery : deliveryFor(pieceFormat(p))).map((d) => ({ ...d, auto: false }));
  return [...auto, ...manual];
}

/** Primera cosa que falta de la entrega, en una frase, o `null` si está completa. */
export function deliveryMissing(p: Proposal): string | null {
  const first = deliveryStatus(p).find((d) => !d.done);
  return first ? `Falta: ${first.text.replace(/ \(\d+ de \d+\)$/, "").toLowerCase()}.` : null;
}
