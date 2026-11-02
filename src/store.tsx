import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ChatMessage,
  DesktopView,
  Grain,
  HeadlineLine,
  MetricNet,
  MobileTab,
  Network,
  PlatformTag,
  Proposal,
  Stage,
} from "./types";
import { DAY, mondayOf, noon } from "./lib/dates";
import { INITIAL_PROPOSALS } from "./data/mock";
import {
  fetchConnections,
  fetchProposals,
  insertProposals,
  updateConnection,
  updateProposalFields,
  updateProposalStatus,
  type ProposalFields,
} from "./lib/db";
import {
  adjustPiece,
  aiCaption,
  aiCuts,
  aiIdeas,
  aiLearning,
  aiScript,
  aiShots,
  generateProposals,
  hasAI,
  hasIA,
  type GenerateOptions,
} from "./lib/ai";
import { PLATFORM_LABEL } from "./lib/platforms";
import { STAGE_LABEL, missingFor, newItem, statusForStage } from "./lib/stages";

/** H09 — el error dice qué pasó y cómo seguir, sin códigos técnicos. */
function aiErrorText(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (msg.startsWith("Falta VITE_")) return "El asistente no está configurado en este entorno. Revisa las variables del .env.";
  return "El asistente no respondió. Revisa tu conexión y vuelve a intentar.";
}

/* -------------------------------------------------------------------------- */
/*  Estado                                                                     */
/* -------------------------------------------------------------------------- */

interface State {
  // navegación
  view: DesktopView;
  tab: MobileTab;
  work: string | null; // id de la pieza abierta en el copiloto / sheet
  // copiloto
  variant: 0 | 1 | 2;
  pubOff: Record<string, boolean>; // redes DESACTIVADAS para publicar
  chat: ChatMessage[];
  // datos
  proposals: Proposal[];
  connections: Record<string, boolean>;
  // calendario
  calWeekStart: number;
  calPickerOpen: boolean;
  calPickerY: number;
  calPickerM: number;
  // métricas
  metricStart: number;
  metricEnd: number;
  grain: Grain;
  metricNet: MetricNet;
  pickerOpen: boolean;
  pickerY: number;
  pickerM: number;
  picking: "start" | "end";
  // biblioteca
  libFilter: string;
  // feedback
  toast: string | null;
  /** Acción reversible asociada al toast actual (H03: deshacer). */
  undo: (() => void) | null;
  /** Carga inicial desde Supabase en curso (H01: visibilidad del estado). */
  loading: boolean;
  // IA
  generating: boolean;
  chatBusy: boolean; // el copiloto está aplicando un ajuste
  /** Encargo de IA en curso ("guion", "tomas", "cortes", "caption", "aprendizaje") o null. */
  aiBusy: AiTask | null;
}

export type AiTask = "guion" | "tomas" | "cortes" | "caption" | "aprendizaje";

const initialState: State = {
  view: "tablero",
  tab: "inicio",
  work: null,
  variant: 0,
  pubOff: {},
  chat: [],
  proposals: INITIAL_PROPOSALS,
  connections: { Instagram: true, TikTok: true, YouTube: false, LinkedIn: false },
  calWeekStart: new Date(2026, 6, 20, 12).getTime(),
  calPickerOpen: false,
  calPickerY: 2026,
  calPickerM: 6,
  metricStart: new Date(2026, 5, 24, 12).getTime(),
  metricEnd: new Date(2026, 6, 23, 12).getTime(),
  grain: "días",
  metricNet: "Todas",
  pickerOpen: false,
  pickerY: 2026,
  pickerM: 6,
  picking: "start",
  libFilter: "Todas",
  toast: null,
  undo: null,
  loading: true,
  generating: false,
  chatBusy: false,
  aiBusy: null,
};

/** Primer mensaje del copiloto según la etapa en que se abre la pieza. */
const OPEN_TEXT: Record<Stage, string> = {
  idea: "Esta es la idea en crudo. Dime por qué importa o pídeme ganchos y la convertimos en guion.",
  guion: "Vamos con el guion: gancho, desarrollo y cierre. Puedo escribirlo o sugerirte las tomas.",
  grabar: "Todo listo para grabar. Revisa el checklist, abre el teleprompter y marca las tomas.",
  editar: "Ya está grabada. Te propongo cortes, el caption y lo que falta para dejarla lista.",
  listo: "Solo falta elegir día, hora y redes. Cuando la programes, sale al calendario.",
  publicado: "Anota los resultados y te digo qué aprendimos para la próxima pieza.",
};

/* -------------------------------------------------------------------------- */
/*  Acciones                                                                   */
/* -------------------------------------------------------------------------- */

interface Actions {
  go: (view: DesktopView) => void;
  setTab: (tab: MobileTab) => void;
  openWork: (id: string) => void;
  closeWork: () => void;
  setVariant: (v: 0 | 1 | 2) => void;
  togglePub: (tag: PlatformTag) => void;
  sendChat: (text: string) => void;
  /** Agrega un mensaje del asistente al chat del copiloto (p.ej. tras un encargo de IA). */
  say: (text: string) => void;
  reject: (id: string) => void;
  /** "Programar publicación": pasa la pieza abierta a Listo con las redes activas. */
  publishNow: () => void;
  /**
   * Mueve la pieza a otra etapa. Hacia atrás siempre; hacia adelante solo si
   * cumple el requisito (si no, avisa qué falta). Devuelve true si se movió.
   */
  setStage: (id: string, stage: Stage) => boolean;
  /** Actualiza campos sueltos de una pieza y los persiste. */
  updateFields: (id: string, fields: ProposalFields) => void;
  /** Crea una idea nueva (entrada rápida o a partir de un aprendizaje). */
  addIdea: (idea: { line: HeadlineLine; why?: string; source?: string; eyebrow?: string }) => Proposal;
  /** Guarda varias piezas nuevas ya armadas (p.ej. ideas generadas por la IA). */
  addProposals: (items: Proposal[]) => Promise<void>;
  flash: (text: string, undo?: (() => void) | null) => void;
  // calendario
  calWeekNav: (delta: number) => void;
  toggleCalPicker: () => void;
  closeCalPicker: () => void;
  calPickerNav: (delta: number) => void;
  calPickDay: (ms: number) => void;
  // métricas
  setNet: (net: MetricNet) => void;
  setGrain: (grain: Grain) => void;
  presetDays: (n: number) => void;
  presetMonths: (n: number) => void;
  togglePicker: () => void;
  closePicker: () => void;
  pickerNav: (delta: number) => void;
  pickDay: (ms: number) => void;
  // biblioteca
  setLib: (filter: string) => void;
  // conexiones
  toggleConn: (net: Network) => void;
  // IA
  generate: (opts?: GenerateOptions) => Promise<void>;
  /** Pide ideas nuevas al asistente a partir del tema de la semana. */
  generateIdeas: (tema: string) => Promise<void>;
  /** Encargos de IA por etapa (todos con Deshacer). */
  runScript: (id: string) => Promise<void>;
  runShots: (id: string) => Promise<void>;
  runCuts: (id: string) => Promise<void>;
  runCaption: (id: string) => Promise<void>;
  runLearning: (id: string) => Promise<void>;
  /** Crea una idea nueva a partir del aprendizaje de una pieza publicada. */
  ideaFromLearning: (id: string) => void;
  updateCaption: (id: string, caption: string) => void;
  /** Cambia día (0-4) y/o hora ("HH:MM" o "") de una pieza. */
  updateSchedule: (id: string, s: { day?: number; time?: string }) => void;
  /** Revierte la última acción (si el toast con "Deshacer" sigue visible). */
  undoLast: () => void;
}

type Store = State & { actions: Actions };

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(initialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Espejo del estado actual para leerlo dentro de acciones sin efectos
  // colaterales en los updaters de setS.
  const sRef = useRef(s);
  sRef.current = s;
  // Idea sugerida por el encargo "aprendizaje", por pieza, hasta que se use.
  const pendingIdea = useRef<Record<string, { line: HeadlineLine; why: string } | undefined>>({});

  const patch = useCallback((p: Partial<State> | ((prev: State) => Partial<State>)) => {
    setS((prev) => ({ ...prev, ...(typeof p === "function" ? p(prev) : p) }));
  }, []);

  // Toast: 2.4 s para avisos simples; 6 s cuando ofrece "Deshacer".
  const flash = useCallback((text: string, undo: (() => void) | null = null) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setS((prev) => ({ ...prev, toast: text, undo }));
    toastTimer.current = setTimeout(
      () => setS((prev) => ({ ...prev, toast: null, undo: null })),
      undo ? 6000 : 2400,
    );
  }, []);

  const actions = useMemo<Actions>(() => {
    const openWork = (id: string) => {
      const p = sRef.current.proposals.find((x) => x.id === id);
      const stage = p?.stage ?? "idea";
      patch({
        work: id,
        variant: 0,
        pubOff: {},
        chat: [{ role: "ai", text: OPEN_TEXT[stage] }],
      });
    };

    /** Aplica campos a una pieza en memoria y en Supabase (`null` vacía el campo). */
    const applyFields = (id: string, fields: ProposalFields) => {
      const mem = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined).map(([k, v]) => [k, v ?? undefined]),
      ) as Partial<Proposal>;
      patch((prev) => ({
        proposals: prev.proposals.map((p) => (p.id === id ? { ...p, ...mem } : p)),
      }));
      void updateProposalFields(id, fields);
    };

    const reject = (id: string) => {
      const before = sRef.current.proposals.find((p) => p.id === id)?.status ?? "proposal";
      patch((prev) => ({
        proposals: prev.proposals.map((p) => (p.id === id ? { ...p, status: "rejected" } : p)),
        work: null,
      }));
      void updateProposalStatus(id, "rejected");
      flash("Pieza descartada", () => {
        patch((prev) => ({
          proposals: prev.proposals.map((p) => (p.id === id ? { ...p, status: before } : p)),
        }));
        void updateProposalStatus(id, before);
      });
    };

    const addIdea: Actions["addIdea"] = ({ line, why, source, eyebrow }) => {
      const dow = new Date().getDay(); // 0 = domingo
      const idea: Proposal = {
        id: crypto.randomUUID(),
        day: dow >= 1 && dow <= 5 ? dow - 1 : 0,
        time: "",
        platforms: ["IG"],
        type: "Reel",
        eyebrow: eyebrow ?? "LA IDEA",
        line,
        status: "proposal",
        caption: "",
        tags: [],
        stage: "idea",
        source: source || undefined,
        notes: why || undefined,
      };
      patch((prev) => ({ proposals: [...prev.proposals, idea] }));
      void insertProposals([idea]);
      return idea;
    };

    /**
     * Ejecuta un encargo de IA sobre una pieza con estado visible (H01),
     * mensaje en el copiloto y Deshacer (H03). `run` aplica el cambio y
     * devuelve cómo revertirlo.
     */
    const runAi = async (
      task: AiTask,
      id: string,
      run: (p: Proposal) => Promise<{ before: ProposalFields; done: string; say: string }>,
    ) => {
      if (sRef.current.aiBusy) return;
      const p = sRef.current.proposals.find((x) => x.id === id);
      if (!p) return;
      patch({ aiBusy: task });
      try {
        const r = await run(p);
        if (sRef.current.work === id) patch((prev) => ({ chat: [...prev.chat, { role: "ai", text: r.say }] }));
        flash(r.done, () => applyFields(id, r.before));
      } catch (e) {
        console.error(`ai:${task}`, e);
        flash(aiErrorText(e));
      } finally {
        patch({ aiBusy: null });
      }
    };

    const setStage = (id: string, stage: Stage): boolean => {
      const p = sRef.current.proposals.find((x) => x.id === id);
      if (!p || p.stage === stage) return false;
      const active = p.platforms.filter((t) => !sRef.current.pubOff[t]).length;
      const missing = missingFor(p, stage, active);
      if (missing) {
        flash(missing);
        return false;
      }
      const before: ProposalFields = {
        stage: p.stage,
        status: p.status,
        recorded_at: p.recorded_at,
        published_at: p.published_at,
      };
      const next: ProposalFields = { stage, status: statusForStage(stage) };
      if (stage === "editar" && !p.recorded_at) next.recorded_at = new Date().toISOString();
      if (stage === "publicado" && !p.published_at) next.published_at = new Date().toISOString();
      applyFields(id, next);
      // Si la pieza está abierta, el copiloto cambia de contexto con ella.
      if (sRef.current.work === id) {
        patch((prev) => ({ chat: [...prev.chat, { role: "ai", text: OPEN_TEXT[stage] }] }));
      }
      flash(`Pasó a ${STAGE_LABEL[stage]}`, () => applyFields(id, before));
      return true;
    };

    // IA: pide propuestas nuevas a Claude, las guarda como ideas y las muestra
    const generate = async (opts?: GenerateOptions) => {
      if (sRef.current.generating) return;
      patch({ generating: true });
      try {
        const existentes = sRef.current.proposals
          .filter((p) => p.status !== "rejected")
          .map((p) => p.line.pre + p.line.key + p.line.post);
        const nuevas = (await generateProposals({ count: 5, ...opts, existentes })).map((p) => ({
          ...p,
          stage: "idea" as const,
          status: "proposal" as const,
          source: opts?.tema ? `Tema de la semana: ${opts.tema}` : "Propuesta del asistente",
        }));
        await insertProposals(nuevas);
        patch((prev) => ({ proposals: [...prev.proposals, ...nuevas], view: "ideas" }));
        flash(`${nuevas.length} ideas nuevas`);
      } catch (e) {
        console.error("generate:", e);
        // H09: qué pasó + cómo seguir, sin códigos técnicos
        flash("El asistente no respondió. Revisa tu conexión y vuelve a intentar.");
      } finally {
        patch({ generating: false });
      }
    };

    return {
      setStage,
      updateFields: applyFields,
      addIdea,
      reject,
      addProposals: async (items) => {
        if (items.length === 0) return;
        await insertProposals(items);
        patch((prev) => ({ proposals: [...prev.proposals, ...items] }));
      },
      say: (text) => patch((prev) => ({ chat: [...prev.chat, { role: "ai", text }] })),
      go: (view) => patch({ view, work: null }),
      setTab: (tab) => patch({ tab }),
      openWork,
      closeWork: () => patch({ work: null }),
      setVariant: (variant) => patch({ variant }),
      togglePub: (tag) =>
        patch((prev) => ({ pubOff: { ...prev.pubOff, [tag]: !prev.pubOff[tag] } })),
      // Copiloto: Claude aplica la instrucción sobre la pieza abierta
      sendChat: (text) => {
        const clean = text.trim();
        if (!clean || sRef.current.chatBusy) return;
        const w = sRef.current.proposals.find((p) => p.id === sRef.current.work);
        patch((prev) => ({ chat: [...prev.chat, { role: "user", text: clean }], chatBusy: true }));
        if (!w) {
          patch({ chatBusy: false });
          return;
        }
        void (async () => {
          try {
            const r = await adjustPiece(w, clean);
            patch((prev) => ({
              proposals: prev.proposals.map((p) => (p.id === w.id ? { ...p, ...r.piece } : p)),
              chat: [...prev.chat, { role: "ai", text: r.reply }],
            }));
            void updateProposalFields(w.id, r.piece);
          } catch (e) {
            console.error("sendChat:", e);
            patch((prev) => ({
              chat: [...prev.chat, { role: "ai", text: "No pude aplicar ese ajuste. Vuelve a intentarlo o pídemelo de otra forma." }],
            }));
          } finally {
            patch({ chatBusy: false });
          }
        })();
      },
      updateSchedule: (id, sch) => {
        patch((prev) => ({
          proposals: prev.proposals.map((p) => (p.id === id ? { ...p, ...sch } : p)),
        }));
        void updateProposalFields(id, sch);
      },
      // Caption editado a mano (se guarda)
      updateCaption: (id, caption) => {
        patch((prev) => ({
          proposals: prev.proposals.map((p) => (p.id === id ? { ...p, caption } : p)),
        }));
        void updateProposalFields(id, { caption });
      },
      undoLast: () => {
        const u = sRef.current.undo;
        if (!u) return;
        if (toastTimer.current) clearTimeout(toastTimer.current);
        u();
        flash("Listo, lo deshice");
      },
      publishNow: () => {
        const prev = sRef.current;
        const w = prev.proposals.find((p) => p.id === prev.work);
        if (!w) return;
        const active = w.platforms.filter((t) => !prev.pubOff[t]);
        if (active.length === 0) {
          flash("Elige al menos una red");
          return;
        }
        const nice = active.map((t) => PLATFORM_LABEL[t]).join(", ");
        const beforePlatforms = w.platforms;
        // "Listo" guarda las redes elegidas: las desactivadas se quitan de la pieza.
        if (active.length !== w.platforms.length) applyFields(w.id, { platforms: active });
        const already = w.stage === "listo" || w.stage === "publicado";
        if (!already && !setStage(w.id, "listo")) {
          applyFields(w.id, { platforms: beforePlatforms });
          return;
        }
        patch({ work: null, pubOff: {} });
        flash("Programada para " + nice, () => {
          applyFields(w.id, { stage: w.stage, status: w.status, platforms: beforePlatforms });
        });
      },
      flash,
      // calendario
      calWeekNav: (delta) =>
        patch((prev) => ({ calWeekStart: prev.calWeekStart + delta * 7 * DAY })),
      toggleCalPicker: () =>
        patch((prev) => {
          const d = new Date(prev.calWeekStart);
          return {
            calPickerOpen: !prev.calPickerOpen,
            calPickerY: d.getFullYear(),
            calPickerM: d.getMonth(),
          };
        }),
      closeCalPicker: () => patch({ calPickerOpen: false }),
      calPickerNav: (delta) =>
        patch((prev) => {
          const m = prev.calPickerM + delta;
          const y = prev.calPickerY + Math.floor(m / 12);
          return { calPickerY: y, calPickerM: ((m % 12) + 12) % 12 };
        }),
      calPickDay: (ms) => patch({ calWeekStart: mondayOf(ms), calPickerOpen: false }),
      // métricas
      setNet: (net) => patch({ metricNet: net }),
      setGrain: (grain) => patch({ grain }),
      presetDays: (n) =>
        patch((prev) => {
          const end = prev.metricEnd;
          return { metricStart: noon(end - (n - 1) * DAY), metricEnd: noon(end), grain: "días" };
        }),
      presetMonths: (n) =>
        patch((prev) => {
          const e = new Date(prev.metricEnd);
          const start = new Date(e.getFullYear(), e.getMonth() - (n - 1), 1, 12).getTime();
          return { metricStart: start, grain: "meses" };
        }),
      togglePicker: () =>
        patch((prev) => {
          const d = new Date(prev.metricEnd);
          return {
            pickerOpen: !prev.pickerOpen,
            pickerY: d.getFullYear(),
            pickerM: d.getMonth(),
            picking: "start",
          };
        }),
      closePicker: () => patch({ pickerOpen: false }),
      pickerNav: (delta) =>
        patch((prev) => {
          const m = prev.pickerM + delta;
          const y = prev.pickerY + Math.floor(m / 12);
          return { pickerY: y, pickerM: ((m % 12) + 12) % 12 };
        }),
      pickDay: (ms) =>
        patch((prev) => {
          const t = noon(ms);
          if (prev.picking === "start") {
            return { metricStart: t, metricEnd: t, picking: "end" };
          }
          // segundo clic: fija fin, ordena si es anterior, cierra
          const start = Math.min(prev.metricStart, t);
          const end = Math.max(prev.metricStart, t);
          return { metricStart: start, metricEnd: end, picking: "start", pickerOpen: false };
        }),
      // biblioteca
      setLib: (libFilter) => patch({ libFilter }),
      // conexiones
      toggleConn: (net) => {
        const next = !sRef.current.connections[net];
        patch((prev) => ({ connections: { ...prev.connections, [net]: next } }));
        void updateConnection(net, next);
      },
      generate,
      // Encargo "Ideas": con el webhook genérico; si solo existe el generador de propuestas, lo usa.
      generateIdeas: async (tema) => {
        if (!hasIA && hasAI) return generate({ tema });
        if (sRef.current.generating) return;
        patch({ generating: true });
        try {
          const existentes = sRef.current.proposals
            .filter((p) => p.status !== "rejected")
            .map((p) => p.line.pre + p.line.key + p.line.post);
          const ideas = await aiIdeas({ tema, existentes });
          const nuevas: Proposal[] = ideas.map((i) => ({
            id: crypto.randomUUID(),
            day: 0,
            time: "",
            platforms: ["IG"],
            type: "Reel",
            eyebrow: "LA IDEA",
            line: i.line,
            status: "proposal",
            caption: "",
            tags: [],
            stage: "idea",
            notes: i.why || undefined,
            source: i.source || (tema ? `Tema de la semana: ${tema}` : "Propuesta del asistente"),
          }));
          await insertProposals(nuevas);
          patch((prev) => ({ proposals: [...prev.proposals, ...nuevas], view: "ideas" }));
          const ids = nuevas.map((n) => n.id);
          flash(`${nuevas.length} ideas nuevas`, () => {
            patch((prev) => ({ proposals: prev.proposals.map((p) => (ids.includes(p.id) ? { ...p, status: "rejected" } : p)) }));
            ids.forEach((id) => void updateProposalStatus(id, "rejected"));
          });
        } catch (e) {
          console.error("generateIdeas:", e);
          flash(aiErrorText(e));
        } finally {
          patch({ generating: false });
        }
      },
      runScript: (id) => runAi("guion", id, async (p) => {
        const r = await aiScript(p);
        const shots = (p.shots ?? []).length ? p.shots : r.shots.map(newItem);
        const before: ProposalFields = { script: p.script ?? null, shots: p.shots ?? null };
        applyFields(id, { script: { hook: r.hook, body: r.body, cta: r.cta, duration_s: r.duration_s, format: r.format }, shots });
        return { before, done: "Guion escrito", say: "Escribí el guion: gancho, desarrollo y cierre. Ajusta lo que no suene a ti." };
      }),
      runShots: (id) => runAi("tomas", id, async (p) => {
        const list = await aiShots(p);
        const before: ProposalFields = { shots: p.shots ?? null };
        applyFields(id, { shots: list.map(newItem) });
        return { before, done: `${list.length} tomas sugeridas`, say: `Te propongo ${list.length} tomas. Quita o añade las que necesites.` };
      }),
      runCuts: (id) => runAi("cortes", id, async (p) => {
        const r = await aiCuts(p);
        const text = [
          "Cortes propuestos:",
          ...r.cuts.map((c) => `${c.t} · ${c.note}`),
          r.subtitles_style ? `Subtítulos: ${r.subtitles_style}` : "",
        ].filter(Boolean).join("\n");
        const before: ProposalFields = { notes: p.notes ?? null };
        applyFields(id, { notes: p.notes?.trim() ? `${p.notes.trim()}\n\n${text}` : text });
        return { before, done: "Cortes añadidos a las instrucciones", say: "Añadí los cortes y el estilo de subtítulos a las instrucciones de edición." };
      }),
      runCaption: (id) => runAi("caption", id, async (p) => {
        const r = await aiCaption(p);
        const before: ProposalFields = { caption: p.caption, tags: p.tags };
        applyFields(id, { caption: r.caption, tags: r.tags.length ? r.tags : p.tags });
        return { before, done: "Caption escrito", say: "Escribí el caption y los hashtags." };
      }),
      runLearning: (id) => runAi("aprendizaje", id, async (p) => {
        const r = await aiLearning(p);
        const before: ProposalFields = { results: p.results ?? null };
        const base = p.results ?? { views: null, likes: null, saves: null, comments: null, learned: "" };
        applyFields(id, { results: { ...base, learned: r.learned } });
        pendingIdea.current[id] = r.idea;
        return { before, done: "Aprendizaje anotado", say: `${r.learned}\n\nIdea para la próxima: ${r.idea.line.pre}${r.idea.line.key}${r.idea.line.post}` };
      }),
      ideaFromLearning: (id) => {
        const p = sRef.current.proposals.find((x) => x.id === id);
        if (!p) return;
        const sug = pendingIdea.current[id];
        const title = p.line.pre + p.line.key + p.line.post;
        const idea = addIdea({
          line: sug?.line ?? { pre: "Segunda parte: ", key: p.line.key || title, post: p.line.key ? p.line.post : "" },
          why: sug?.why || p.results?.learned || undefined,
          source: `Aprendizaje de “${title}”`,
          eyebrow: p.eyebrow,
        });
        flash("Idea creada a partir del aprendizaje", () => reject(idea.id));
      },
    };
  }, [patch, flash]);

  // Carga inicial desde Supabase (si está configurado). Si falla o no hay
  // conexión, la app sigue con los datos mock iniciales.
  useEffect(() => {
    let alive = true;
    (async () => {
      const [props, conns] = await Promise.all([fetchProposals(), fetchConnections()]);
      if (!alive) return;
      const upd: Partial<State> = { loading: false };
      if (props) upd.proposals = props;
      if (conns) upd.connections = conns;
      patch(upd);
    })();
    return () => {
      alive = false;
    };
  }, [patch]);

  const value = useMemo<Store>(() => ({ ...s, actions }), [s, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}
