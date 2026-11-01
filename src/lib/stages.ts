// Línea de producción: orden de etapas, nombres visibles, requisitos para
// avanzar y valores por defecto. Fuente única para escritorio y móvil.

import type { CheckItem, Proposal, ProposalStatus, Script, Stage } from "../types";

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
  grabar: "Checklist antes de grabar, teleprompter, marcar las tomas hechas y pegar el link del bruto.",
  editar: "Instrucciones de corte, subtítulos, miniatura, caption con hashtags y el link del video final.",
  listo: "Día, hora y redes elegidas. Lo que está aquí sale al calendario.",
  publicado: "Resultados y aprendizaje. Lo aprendido vuelve a Ideas para la próxima pieza.",
};

/** Qué pide cada etapa para dejar entrar una pieza (texto visible antes de bloquear, H05). */
export const STAGE_REQUIREMENT: Record<Stage, string> = {
  idea: "",
  guion: "título y por qué importa",
  grabar: "gancho, desarrollo y al menos una toma",
  editar: "todas las tomas marcadas o el link del bruto",
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

export const SCRIPT_FORMATS = ["Reel", "Short", "Video largo", "Post", "Carrusel", "Newsletter"];

/** Duraciones típicas (segundos) para el selector del guion (H05: selectores, no texto libre). */
export const DURATIONS_S = [15, 30, 45, 60, 90, 180, 300, 600];

export function newItem(text: string): CheckItem {
  return { id: Math.random().toString(36).slice(2, 10), text, done: false };
}

/** Checklist de grabación por defecto. */
export function defaultChecklist(): CheckItem[] {
  return ["Luz de frente", "Micrófono probado", "Encuadre a la altura de los ojos", "Batería y espacio", "Fondo limpio"].map(newItem);
}

/** Plantillas de ganchos a la vista (H06: reconocer antes que recordar). */
export const HOOK_TEMPLATES = [
  "Si tienes una marca y no has hecho esto, te lo van a quitar.",
  "El error de $3.500 que comete el 80 % de los emprendedores.",
  "Nadie te lo dice cuando emprendes: …",
  "Hoy me llegó un caso que lo explica todo.",
];

/** Plantillas de tomas típicas de un Reel TEM. */
export const SHOT_TEMPLATES = [
  "Gancho a cámara, plano medio",
  "Desarrollo: punto 1, con texto en pantalla",
  "Desarrollo: punto 2",
  "Cierre con llamado a la acción",
  "B-roll: pantalla del formulario / documento",
];

/** Texto para leer en el teleprompter: el guion unido en orden. */
export function scriptText(p: Proposal): string {
  const s = p.script;
  if (!s) return "";
  return [s.hook, s.body, s.cta].filter((t) => t.trim()).join("\n\n");
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
      if (!p.script?.body.trim()) return "Falta el desarrollo del guion.";
      if (!p.shots || p.shots.length === 0) return "Añade al menos una toma.";
      return null;
    }
    case "editar": {
      const allDone = (p.shots ?? []).length > 0 && (p.shots ?? []).every((s) => s.done);
      if (!allDone && !(p.raw_url ?? "").trim()) return "Marca todas las tomas o pega el link del bruto.";
      return null;
    }
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
      const dur = s.duration_s ? ` · ${s.duration_s} s` : "";
      return `${s.format}${dur} · ${(p.shots ?? []).length} tomas`;
    }
    case "grabar": {
      const shots = p.shots ?? [];
      const done = shots.filter((s) => s.done).length;
      return p.raw_url ? "Bruto subido" : shots.length ? `${done} de ${shots.length} tomas grabadas` : "Sin tomas";
    }
    case "editar":
      return p.final_url ? "Video final listo" : (p.notes ? "Instrucciones escritas" : "Sin instrucciones de edición");
    case "listo":
      return p.time ? `Sale a las ${p.time}` : "Sin hora definida";
    case "publicado": {
      const r = p.results;
      if (!r || r.views == null) return "Sin resultados todavía";
      return `${r.views} vistas`;
    }
  }
}
