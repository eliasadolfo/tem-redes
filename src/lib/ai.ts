// Generación de propuestas con Claude, vía webhook de n8n.
// La llave de Anthropic vive en n8n (credencial "Anthropic account");
// el navegador nunca la ve.

import type { HeadlineLine, Proposal } from "../types";
import { supabase } from "./supabase";

/** Token de la sesión actual: los webhooks lo verifican contra Supabase Auth. */
async function getToken(): Promise<string> {
  if (!supabase) return "";
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

const WEBHOOK_URL = import.meta.env.VITE_N8N_GENERAR_URL as string | undefined;

export const hasAI = Boolean(WEBHOOK_URL);

export interface GenerateOptions {
  count?: number; // 1-10
  tema?: string; // foco de la semana
  contexto?: string; // notas extra de Elías
  existentes?: string[]; // titulares ya existentes, para no repetir
}

interface GenerateResponse {
  ok: boolean;
  count: number;
  proposals: Proposal[];
}

/** Pide a Claude N propuestas nuevas en la voz de TEM. Lanza error si falla. */
export async function generateProposals(opts: GenerateOptions = {}): Promise<Proposal[]> {
  if (!WEBHOOK_URL) throw new Error("Falta VITE_N8N_GENERAR_URL en .env");
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    // text/plain evita el preflight CORS; n8n igual parsea el JSON del body.
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({
      token: await getToken(),
      count: opts.count ?? 5,
      tema: opts.tema ?? "",
      contexto: opts.contexto ?? "",
      existentes: opts.existentes ?? [],
    }),
  });
  if (!res.ok) throw new Error(`Webhook respondió ${res.status}`);
  const data = (await res.json()) as GenerateResponse;
  if (!data.ok || !Array.isArray(data.proposals)) {
    throw new Error("Respuesta inesperada del generador");
  }
  return data.proposals;
}

/* -------------------------------------------------------------------------- */
/*  Copiloto: ajustar una pieza con una instrucción                            */
/* -------------------------------------------------------------------------- */

const ADJUST_URL = import.meta.env.VITE_N8N_AJUSTAR_URL as string | undefined;

/** Campos de la pieza que el copiloto puede modificar. */
export type PieceEdit = Pick<Proposal, "eyebrow" | "line" | "caption" | "tags">;

interface AdjustResponse {
  ok: boolean;
  reply: string;
  piece: PieceEdit;
}

/** Pide a Claude que aplique `instruction` sobre la pieza. Devuelve respuesta + campos nuevos. */
export async function adjustPiece(
  piece: Proposal,
  instruction: string,
): Promise<{ reply: string; piece: PieceEdit }> {
  if (!ADJUST_URL) throw new Error("Falta VITE_N8N_AJUSTAR_URL en .env");
  const res = await fetch(ADJUST_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({
      piece: {
        eyebrow: piece.eyebrow,
        line: piece.line,
        caption: piece.caption,
        tags: piece.tags,
        platforms: piece.platforms,
        type: piece.type,
      },
      instruction,
      token: await getToken(),
    }),
  });
  if (!res.ok) throw new Error(`Webhook respondió ${res.status}`);
  const data = (await res.json()) as AdjustResponse;
  if (!data.ok || !data.piece) throw new Error("Respuesta inesperada del copiloto");
  return { reply: data.reply, piece: data.piece };
}

/* -------------------------------------------------------------------------- */
/*  Webhook IA genérico: ask(prompt, {system, json})                           */
/* -------------------------------------------------------------------------- */

const IA_URL = import.meta.env.VITE_N8N_IA_URL as string | undefined;

/** true si el encargo genérico de IA está configurado. */
export const hasIA = Boolean(IA_URL);

/** Modo demostración: sin Supabase ni webhook, los encargos devuelven ejemplos. */
const DEMO = !supabase && !IA_URL;

interface AskOptions {
  system?: string;
  json?: boolean;
  max_tokens?: number;
}

interface AskResponse {
  ok: boolean;
  text?: string;
  json?: unknown;
}

/**
 * Encargo libre a Claude vía n8n. La voz TEM ya va en el system del webhook;
 * `system` solo añade el encargo. Con `json: true` devuelve `json` parseado.
 */
export async function ask(prompt: string, opts: AskOptions = {}): Promise<{ text: string; json: unknown }> {
  if (!IA_URL) throw new Error("Falta VITE_N8N_IA_URL en .env");
  const res = await fetch(IA_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({
      token: await getToken(),
      system: opts.system ?? "",
      prompt,
      max_tokens: opts.max_tokens ?? 1200,
      json: opts.json ?? false,
    }),
  });
  if (!res.ok) throw new Error(`Webhook respondió ${res.status}`);
  const data = (await res.json()) as AskResponse;
  if (!data.ok) throw new Error("Respuesta inesperada del asistente");
  let json: unknown = data.json ?? null;
  // Por si el webhook devuelve el JSON como texto.
  if (opts.json && json == null && data.text) {
    try {
      json = JSON.parse(data.text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    } catch {
      json = null;
    }
  }
  if (opts.json && json == null) throw new Error("El asistente no devolvió JSON");
  return { text: data.text ?? "", json };
}

/* -------------------------------------------------------------------------- */
/*  Encargos por etapa                                                         */
/* -------------------------------------------------------------------------- */

const JSON_ONLY = "Responde solo con JSON válido, sin texto antes ni después, sin comentarios.";

function pieceContext(p: Proposal): string {
  const title = p.line.pre + p.line.key + p.line.post;
  const s = p.script;
  return [
    `Título: ${title}`,
    p.eyebrow ? `Etiqueta: ${p.eyebrow}` : "",
    p.notes ? `Por qué importa / notas: ${p.notes}` : "",
    p.source ? `De dónde salió: ${p.source}` : "",
    `Redes: ${p.platforms.join(", ")} · Tipo: ${p.type}`,
    s ? `Guion actual — formato ${s.format}, ${s.duration_s ?? "?"} s.\nGancho: ${s.hook}\nDesarrollo: ${s.body}\nCierre: ${s.cta}` : "",
    p.shots?.length ? `Tomas: ${p.shots.map((x) => x.text).join(" | ")}` : "",
    p.caption ? `Caption actual: ${p.caption}` : "",
  ].filter(Boolean).join("\n");
}

export interface IdeaOut { line: HeadlineLine; why: string; source: string }

/** Ideas a partir de notas + tema → { ideas: [{ line, why, source }] }. */
export async function aiIdeas(opts: { tema: string; notas?: string; existentes: string[] }): Promise<IdeaOut[]> {
  if (DEMO) return demoIdeas(opts.tema);
  const { json } = await ask(
    [
      `Propón 5 ideas de contenido para TEM${opts.tema ? ` sobre el tema de la semana: "${opts.tema}"` : ""}.`,
      opts.notas ? `Notas de Elías:\n${opts.notas}` : "",
      opts.existentes.length ? `Ya existen (no repetir): ${opts.existentes.join(" · ")}` : "",
      `Formato: {"ideas":[{"line":{"pre":"","key":"","post":""},"why":"","source":""}]}.`,
      `"line" es el titular: pre + key + post forman una frase; "key" es la palabra o cifra clave (2-3 palabras).`,
      `"why" explica en una frase por qué le importa a un emprendedor. "source" dice de dónde sale (dato, caso, pregunta frecuente).`,
      JSON_ONLY,
    ].filter(Boolean).join("\n"),
    { json: true, system: "Eres el estratega de contenido de TEM. Ideas concretas, con cifras y casos reales de marcas en Chile y Latinoamérica." },
  );
  const out = (json as { ideas?: IdeaOut[] })?.ideas;
  if (!Array.isArray(out)) throw new Error("Sin ideas en la respuesta");
  return out.filter((i) => i && i.line && typeof i.line.pre === "string");
}

export interface ScriptOut { hook: string; body: string; cta: string; duration_s: number | null; format: string; shots: string[] }

/** Guion completo a partir de la idea y el formato → { hook, body, cta, duration_s, format, shots }. */
export async function aiScript(p: Proposal): Promise<ScriptOut> {
  if (DEMO) return demoScript(p);
  const fmt = p.script?.format ?? "Reel";
  const dur = p.script?.duration_s;
  const { json } = await ask(
    [
      `Escribe el guion de esta pieza en formato ${fmt}${dur ? ` de ${dur} segundos` : ""}.`,
      pieceContext(p),
      `Formato: {"hook":"","body":"","cta":"","duration_s":${dur ?? 30},"format":"${fmt}","shots":["",""]}.`,
      `El gancho son los primeros 3 segundos (una frase). El desarrollo va en frases cortas, una idea por línea, para leer en teleprompter. El cierre pide una acción concreta. "shots" son 3-6 tomas a grabar, cada una en una línea corta.`,
      JSON_ONLY,
    ].join("\n"),
    { json: true, system: "Eres el guionista de TEM. Hablas en primera persona como Elías: directo, con tuteo, sin emoji." },
  );
  const o = json as Partial<ScriptOut>;
  if (!o || typeof o.hook !== "string" || typeof o.body !== "string") throw new Error("Guion incompleto");
  return {
    hook: o.hook,
    body: o.body,
    cta: typeof o.cta === "string" ? o.cta : "",
    duration_s: typeof o.duration_s === "number" ? o.duration_s : (dur ?? null),
    format: typeof o.format === "string" ? o.format : fmt,
    shots: Array.isArray(o.shots) ? o.shots.filter((x): x is string => typeof x === "string") : [],
  };
}

/** Lista de tomas → { shots: [string] }. */
export async function aiShots(p: Proposal): Promise<string[]> {
  if (DEMO) return demoScript(p).shots;
  const { json } = await ask(
    [
      `Propón la lista de tomas para grabar esta pieza.`,
      pieceContext(p),
      `Formato: {"shots":["",""]}. Entre 3 y 6 tomas, cada una en una línea corta (qué se ve, qué plano, qué texto en pantalla si lo hay).`,
      JSON_ONLY,
    ].join("\n"),
    { json: true, system: "Eres el productor de video de TEM." },
  );
  const out = (json as { shots?: unknown })?.shots;
  if (!Array.isArray(out)) throw new Error("Sin tomas en la respuesta");
  return out.filter((x): x is string => typeof x === "string" && x.trim() !== "");
}

export interface CutsOut { cuts: { t: string; note: string }[]; subtitles_style: string }

/** Propuesta de cortes y estilo de subtítulos → { cuts: [{t, note}], subtitles_style }. */
export async function aiCuts(p: Proposal): Promise<CutsOut> {
  if (DEMO) return demoCuts(p);
  const { json } = await ask(
    [
      `Propón los cortes de edición de esta pieza a partir de su duración y guion.`,
      pieceContext(p),
      `Formato: {"cuts":[{"t":"mm:ss","note":""}],"subtitles_style":""}. 4-8 cortes con el tiempo aproximado y qué pasa (corte, texto en pantalla, zoom, b-roll). "subtitles_style" describe en una línea cómo van los subtítulos.`,
      JSON_ONLY,
    ].join("\n"),
    { json: true, system: "Eres el editor de video de TEM: ritmo rápido, subtítulos palabra por palabra, texto grande en pantalla." },
  );
  const o = json as Partial<CutsOut>;
  if (!o || !Array.isArray(o.cuts)) throw new Error("Sin cortes en la respuesta");
  return {
    cuts: o.cuts.filter((c) => c && typeof c.note === "string"),
    subtitles_style: typeof o.subtitles_style === "string" ? o.subtitles_style : "",
  };
}

/** Caption + hashtags → { caption, tags }. */
export async function aiCaption(p: Proposal): Promise<{ caption: string; tags: string[] }> {
  if (DEMO) {
    return {
      caption: `${p.line.pre}${p.line.key}${p.line.post} Te cuento cómo en el video. ¡Hagamos que pase!`,
      tags: ["#marca", "#emprender", "#TEM"],
    };
  }
  const { json } = await ask(
    [
      `Escribe el caption y los hashtags de esta pieza para ${p.platforms.join(", ")}.`,
      pieceContext(p),
      `Formato: {"caption":"","tags":["#..."]}. Caption de 2-4 líneas, con una pregunta o llamado al final. 3-6 hashtags.`,
      JSON_ONLY,
    ].join("\n"),
    { json: true },
  );
  const o = json as { caption?: unknown; tags?: unknown };
  if (!o || typeof o.caption !== "string") throw new Error("Sin caption en la respuesta");
  return { caption: o.caption, tags: Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === "string") : [] };
}

export interface LearningOut { learned: string; idea: { line: HeadlineLine; why: string } }

/** Aprendizaje: texto corto (3 líneas) + una idea nueva para alimentar Ideas. */
export async function aiLearning(p: Proposal): Promise<LearningOut> {
  if (DEMO) return demoLearning(p);
  const r = p.results;
  const { json } = await ask(
    [
      `Esta pieza ya se publicó. Resultados: ${r?.views ?? "?"} vistas, ${r?.likes ?? "?"} me gusta, ${r?.saves ?? "?"} guardados, ${r?.comments ?? "?"} comentarios.`,
      pieceContext(p),
      `Formato: {"learned":"","idea":{"line":{"pre":"","key":"","post":""},"why":""}}.`,
      `"learned": 3 líneas cortas (qué funcionó, qué no, qué probar). "idea": una pieza nueva que nace de este aprendizaje.`,
      JSON_ONLY,
    ].join("\n"),
    { json: true, system: "Eres el analista de contenido de TEM. Concreto, sin adornos." },
  );
  const o = json as Partial<LearningOut>;
  if (!o || typeof o.learned !== "string" || !o.idea?.line) throw new Error("Aprendizaje incompleto");
  return { learned: o.learned, idea: { line: o.idea.line, why: typeof o.idea.why === "string" ? o.idea.why : "" } };
}

/* -------------------------------------------------------------------------- */
/*  Ejemplos para el modo demostración (sin .env)                              */
/* -------------------------------------------------------------------------- */

function demoIdeas(tema: string): IdeaOut[] {
  const t = tema.trim() || "registro de marca";
  return [
    { line: { pre: "Lo que nadie te dice sobre ", key: t, post: "." }, why: "Resuelve la duda que más llega por mensajes.", source: "Preguntas frecuentes" },
    { line: { pre: "El error de ", key: "$3.500", post: ` que cometen con ${t}.` }, why: "Una cifra concreta frena el scroll.", source: "Caso real de un cliente" },
    { line: { pre: "", key: "3 señales", post: ` de que vas tarde con ${t}.` }, why: "Lista corta, fácil de guardar.", source: "Experiencia propia" },
  ];
}

function demoScript(p: Proposal): ScriptOut {
  const title = p.line.pre + p.line.key + p.line.post;
  return {
    hook: `${title} Y te lo explico en 30 segundos.`,
    body: "Primero: el problema real, con un caso.\nSegundo: el dato que casi nadie conoce.\nTercero: qué hacer hoy mismo.",
    cta: "Si tienes una marca, escríbeme y la revisamos juntos.",
    duration_s: p.script?.duration_s ?? 30,
    format: p.script?.format ?? "Reel",
    shots: ["Gancho a cámara, plano medio", "Desarrollo con texto en pantalla", "B-roll: pantalla del formulario", "Cierre a cámara con llamado"],
  };
}

function demoCuts(p: Proposal): CutsOut {
  const d = p.script?.duration_s ?? 30;
  const t = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return {
    cuts: [
      { t: t(0), note: "Gancho: corte seco, texto grande con la cifra" },
      { t: t(Math.round(d * 0.15)), note: "Zoom suave al entrar al desarrollo" },
      { t: t(Math.round(d * 0.5)), note: "B-roll de pantalla, 3 s" },
      { t: t(Math.round(d * 0.85)), note: "Cierre a cámara, logo al final" },
    ],
    subtitles_style: "Palabra por palabra, blanco con borde negro, palabra clave en naranja.",
  };
}

function demoLearning(p: Proposal): LearningOut {
  return {
    learned: "Funcionó: la cifra en el gancho.\nNo funcionó: el cierre largo.\nProbar: la misma idea en 20 segundos.",
    idea: { line: { pre: "La versión corta de ", key: p.line.key || "esto", post: "." }, why: "Lo que más retuvo fue el gancho; vale una pieza aparte." },
  };
}
