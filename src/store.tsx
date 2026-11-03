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
  CheckItem,
  ConnectionDetail,
  DesktopView,
  EditMode,
  HeadlineLine,
  MetricNet,
  MobileTab,
  Network,
  PlatformTag,
  Proposal,
  Stage,
} from "./types";
import { DAY, mondayOf } from "./lib/dates";
import { INITIAL_PROPOSALS } from "./data/mock";
import {
  fetchConnections,
  fetchMetrics,
  fetchProposals,
  insertProposals,
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
import { hasSupabase } from "./lib/supabase";
import { toMetricRow, type MetricRow } from "./lib/metrics";
import { TAG_TO_NETWORK, fetchConnectionStatus, hasPublishing, publishPiece as publishViaRobot, startConnect } from "./lib/publish";
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
  chat: ChatMessage[];
  // datos
  proposals: Proposal[];
  connections: Record<string, boolean>;
  connDetails: Record<string, ConnectionDetail>; // handle, última revisión, error
  connChecking: boolean; // "Revisar conexiones" en curso
  publishing: string | null; // id de la pieza que se está publicando
  // calendario
  calWeekStart: number;
  // métricas (reales, de tem_metrics)
  metrics: MetricRow[];
  metricsState: "cargando" | "listo" | "error";
  metricNet: MetricNet;
  // biblioteca
  libFilter: PlatformTag | "Todas";
  // feedback
  toast: string | null;
  /** Acción reversible asociada al toast actual (H03: deshacer). */
  undo: (() => void) | null;
  /** Carga inicial desde Supabase en curso (H01: visibilidad del estado). */
  loading: boolean;
  /** No se pudieron leer las piezas: se dice, nunca se muestran datos de ejemplo. */
  loadError: boolean;
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
  chat: [],
  proposals: hasSupabase ? [] : INITIAL_PROPOSALS,
  connections: {},
  connDetails: {},
  connChecking: false,
  publishing: null,
  calWeekStart: mondayOf(Date.now()),
  metrics: [],
  metricsState: "cargando",
  metricNet: "Todas",
  libFilter: "Todas",
  toast: null,
  undo: null,
  loading: true,
  loadError: false,
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
  /** Enciende o apaga una red en una pieza (se guarda al tiro). */
  togglePlatform: (id: string, tag: PlatformTag) => void;
  /** Lote: asigna redes, día y hora a varias piezas a la vez (con Deshacer). */
  applyBatch: (ids: string[], change: { platforms?: PlatformTag[]; day?: number; time?: string }) => void;
  sendChat: (text: string) => void;
  /** Agrega un mensaje del asistente al chat del copiloto (p.ej. tras un encargo de IA). */
  say: (text: string) => void;
  reject: (id: string) => void;
  /**
   * Mueve la pieza a otra etapa. Hacia atrás siempre; hacia adelante solo si
   * cumple el requisito (si no, avisa qué falta). Devuelve true si se movió.
   */
  setStage: (id: string, stage: Stage) => boolean;
  /** Actualiza campos sueltos de una pieza y los persiste. */
  updateFields: (id: string, fields: ProposalFields) => void;
  /** Cambia una toma (texto, hecho, texto en pantalla) con el estado fresco: seguro con campos que se guardan solos. */
  updateShot: (id: string, shotId: string, part: Partial<CheckItem>) => void;
  /** "Grabada ✓": marca todas las tomas, guarda el link del bruto y pasa a Editar (con Deshacer). */
  finishRecording: (id: string, rawUrl: string, editMode?: EditMode | null) => boolean;
  /** Crea una idea nueva (entrada rápida o a partir de un aprendizaje). */
  addIdea: (idea: { line: HeadlineLine; why?: string; source?: string; eyebrow?: string }) => Proposal;
  /** Guarda varias piezas nuevas ya armadas (p.ej. ideas generadas por la IA). */
  addProposals: (items: Proposal[]) => Promise<void>;
  flash: (text: string, undo?: (() => void) | null) => void;
  // calendario
  calWeekNav: (delta: number) => void;
  calToday: () => void;
  // métricas
  setNet: (net: MetricNet) => void;
  loadMetrics: () => Promise<void>;
  // biblioteca
  setLib: (filter: PlatformTag | "Todas") => void;
  /** Vuelve a leer las piezas (tras un error de carga). */
  reload: () => Promise<void>;
  // conexiones
  /** Lee el estado real de las redes y lo guarda. */
  refreshConnections: () => Promise<void>;
  /** Abre la autorización oficial de una red. */
  connectNetwork: (net: Network) => Promise<void>;
  /** Publica (o programa si `when` es ISO futuro) la pieza en sus redes activas. Devuelve `true` si todo salió bien. */
  publishPiece: (id: string, when?: string | null, opts?: { trial?: boolean }) => Promise<boolean>;
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
  // Espejo SINCRÓNICO del estado: cada patch lo actualiza en el acto y React
  // recibe ese mismo objeto. Así dos guardados seguidos (campos con debounce,
  // tomas, checklists) nunca se pisan por leer un estado viejo (TRAMPAS.md).
  const sRef = useRef<State>(s);
  // Idea sugerida por el encargo "aprendizaje", por pieza, hasta que se use.
  const pendingIdea = useRef<Record<string, { line: HeadlineLine; why: string } | undefined>>({});

  const patch = useCallback((p: Partial<State> | ((prev: State) => Partial<State>)) => {
    const next: State = { ...sRef.current, ...(typeof p === "function" ? p(sRef.current) : p) };
    sRef.current = next;
    setS(next);
  }, []);

  // Toast: 2.4 s para avisos simples; 6 s cuando ofrece "Deshacer".
  const flash = useCallback((text: string, undo: (() => void) | null = null) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    patch({ toast: text, undo });
    toastTimer.current = setTimeout(
      () => patch({ toast: null, undo: null }),
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
        eyebrow: eyebrow ?? "",
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
      const missing = missingFor(p, stage);
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

    /**
     * "Grabada": marca las tomas, guarda bruto y modo, y SOLO pasa a Editar si la
     * entrega al editor está completa (como un editor: no se renderiza a medias).
     * Devuelve `true` si avanzó.
     */
    const updateShot = (id: string, shotId: string, part: Partial<CheckItem>) => {
      const p = sRef.current.proposals.find((x) => x.id === id);
      if (!p) return;
      applyFields(id, { shots: (p.shots ?? []).map((sh) => (sh.id === shotId ? { ...sh, ...part } : sh)) });
    };

    const finishRecording = (id: string, rawUrl: string, editMode?: EditMode | null): boolean => {
      const p = sRef.current.proposals.find((x) => x.id === id);
      if (!p) return false;
      const before: ProposalFields = {
        shots: p.shots ?? null, raw_url: p.raw_url ?? null, edit_mode: p.edit_mode ?? null,
        recorded_at: p.recorded_at ?? null, stage: p.stage, status: p.status,
      };
      const url = rawUrl.trim();
      const fields: ProposalFields = {
        shots: (p.shots ?? []).map((s) => ({ ...s, done: true })),
        raw_url: url || null,
        edit_mode: editMode === undefined ? (p.edit_mode ?? null) : editMode,
        recorded_at: p.recorded_at ?? new Date().toISOString(),
      };
      const next: Proposal = { ...p, shots: fields.shots ?? undefined, raw_url: url || undefined, edit_mode: fields.edit_mode ?? undefined };
      const missing = missingFor(next, "editar");
      if (missing) {
        applyFields(id, fields);
        flash(`Grabada · sigue en Grabar. ${missing}`, () => applyFields(id, before));
        return false;
      }
      applyFields(id, { ...fields, stage: "editar", status: statusForStage("editar") });
      if (sRef.current.work === id) {
        patch((prev) => ({ chat: [...prev.chat, { role: "ai", text: OPEN_TEXT.editar }] }));
      }
      flash("Grabada · pasó a Editar", () => applyFields(id, before));
      return true;
    };

    return {
      setStage,
      updateFields: applyFields,
      updateShot,
      finishRecording,
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
      togglePlatform: (id, tag) => {
        const p = sRef.current.proposals.find((x) => x.id === id);
        if (!p) return;
        const platforms = p.platforms.includes(tag) ? p.platforms.filter((t) => t !== tag) : [...p.platforms, tag];
        applyFields(id, { platforms });
      },
      applyBatch: (ids, change) => {
        const pieces = sRef.current.proposals.filter((p) => ids.includes(p.id));
        const before = pieces.map((p) => ({ id: p.id, platforms: p.platforms, day: p.day, time: p.time }));
        pieces.forEach((p) => applyFields(p.id, change));
        flash(pieces.length === 1 ? "1 pieza actualizada" : `${pieces.length} piezas actualizadas`, () => {
          before.forEach(({ id, ...old }) => applyFields(id, old));
        });
      },
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
      flash,
      // calendario
      calWeekNav: (delta) =>
        patch((prev) => ({ calWeekStart: prev.calWeekStart + delta * 7 * DAY })),
      calToday: () => patch({ calWeekStart: mondayOf(Date.now()) }),
      // métricas
      setNet: (net) => patch({ metricNet: net }),
      loadMetrics: async () => {
        patch({ metricsState: "cargando" });
        const raw = await fetchMetrics();
        if (raw === null) patch({ metricsState: "error" });
        else patch({ metrics: raw.map(toMetricRow), metricsState: "listo" });
      },
      // biblioteca
      setLib: (libFilter) => patch({ libFilter }),
      reload: async () => {
        patch({ loading: true, loadError: false });
        const props = await fetchProposals();
        if (props) patch({ proposals: props, loading: false });
        else patch({ loading: false, loadError: true });
      },
      // conexiones
      refreshConnections: async () => {
        if (sRef.current.connChecking) return;
        patch({ connChecking: true });
        try {
          if (hasPublishing) {
            const r = await fetchConnectionStatus();
            const connections: Record<string, boolean> = {};
            const connDetails: Record<string, ConnectionDetail> = {};
            const now = new Date().toISOString();
            for (const [net, c] of Object.entries(r.connections)) {
              connections[net] = c.connected;
              connDetails[net] = { connected: c.connected, handle: c.handle, checked_at: now, error: c.reauth ? "Hay que volver a conectar" : null };
            }
            patch({ connections, connDetails });
            const n = Object.values(connections).filter(Boolean).length;
            flash(n === 0 ? "Ninguna red conectada todavía" : `${n} ${n === 1 ? "red conectada" : "redes conectadas"}`);
          } else {
            const conns = await fetchConnections();
            if (conns) {
              patch({ connDetails: conns, connections: Object.fromEntries(Object.entries(conns).map(([k, v]) => [k, v.connected])) });
            }
          }
        } catch (e) {
          flash(`No pude revisar las redes: ${(e as Error).message}`);
        } finally {
          patch({ connChecking: false });
        }
      },
      connectNetwork: async (net) => {
        try {
          const r = await startConnect(net);
          window.location.assign(r.authorize_url);
        } catch (e) {
          flash(`No pude abrir la conexión de ${net}: ${(e as Error).message}`);
        }
      },
      publishPiece: async (id, when, opts) => {
        const p = sRef.current.proposals.find((x) => x.id === id);
        if (!p || sRef.current.publishing) return false;
        const nets = [...new Set(p.platforms.map((t) => TAG_TO_NETWORK[t]).filter((n): n is Network => Boolean(n)))];
        if (nets.length === 0) { flash("Elige al menos una red"); return false; }
        const notConnected = nets.filter((n) => !sRef.current.connections[n]);
        if (notConnected.length) { flash(`Primero conecta ${notConnected.join(", ")} en Perfil`); return false; }
        patch({ publishing: id });
        try {
          const r = await publishViaRobot(id, nets, when, opts);
          const before: ProposalFields = { posts: p.posts ?? null, stage: p.stage, status: p.status, published_at: p.published_at ?? null };
          const fields: ProposalFields = { posts: r.posts };
          if (r.published) { fields.stage = "publicado"; fields.status = statusForStage("publicado"); fields.published_at = new Date().toISOString(); }
          // El robot ya escribió en la base; aquí solo reflejamos en pantalla.
          patch((prev) => ({ proposals: prev.proposals.map((x) => (x.id === id ? { ...x, ...(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v ?? undefined])) as Partial<Proposal>) } : x)) }));
          const fails = Object.entries(r.posts).filter(([, v]) => !v.ok);
          if (fails.length) {
            flash(`Publicado con errores: ${fails.map(([k, v]) => `${k}: ${v.error ?? "sin detalle"}`).join(" · ")}`);
          } else if (r.scheduled) {
            flash("Programada en las redes");
          } else {
            flash("Publicada en las redes", () => applyFields(id, before));
          }
          return r.ok;
        } catch (e) {
          flash(`No se pudo publicar: ${(e as Error).message}`);
          return false;
        } finally {
          patch({ publishing: null });
        }
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
            eyebrow: "",
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

  // Carga inicial desde Supabase (si está configurado). Si falla, se avisa: nunca
  // se muestran datos de ejemplo en su lugar.
  useEffect(() => {
    let alive = true;
    (async () => {
      const [props, conns] = await Promise.all([fetchProposals(), fetchConnections()]);
      if (!alive) return;
      const upd: Partial<State> = { loading: false };
      if (props) upd.proposals = props;
      else if (hasSupabase) upd.loadError = true;
      if (conns) {
        upd.connDetails = conns;
        upd.connections = Object.fromEntries(Object.entries(conns).map(([k, v]) => [k, v.connected]));
      }
      patch(upd);
      // Vuelta de la autorización de una red (?conectada=Instagram): avisar y revisar.
      const q = new URLSearchParams(window.location.search);
      const back = q.get("conectada");
      if (back) {
        const status = q.get("connect_status");
        window.history.replaceState({}, "", window.location.pathname);
        if (status === "success" || !status) flash(`${back}: autorización completada. Revisando…`);
        else flash(`${back}: la conexión no se completó (${q.get("error_code") ?? status}).`);
        patch({ view: "settings", tab: "perfil" });
        void actions.refreshConnections();
      }
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
