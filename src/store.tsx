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
  MetricNet,
  MobileTab,
  Network,
  PlatformTag,
  Proposal,
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
} from "./lib/db";
import { adjustPiece, generateProposals, type GenerateOptions } from "./lib/ai";

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
  // IA
  generating: boolean;
  chatBusy: boolean; // el copiloto está aplicando un ajuste
}

const initialState: State = {
  view: "calendar",
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
  generating: false,
  chatBusy: false,
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
  approve: (id: string) => void;
  reject: (id: string) => void;
  publishNow: () => void;
  flash: (text: string) => void;
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
  updateCaption: (id: string, caption: string) => void;
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

  const patch = useCallback((p: Partial<State> | ((prev: State) => Partial<State>)) => {
    setS((prev) => ({ ...prev, ...(typeof p === "function" ? p(prev) : p) }));
  }, []);

  const flash = useCallback(
    (text: string) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setS((prev) => ({ ...prev, toast: text }));
      toastTimer.current = setTimeout(() => {
        setS((prev) => ({ ...prev, toast: null }));
      }, 2400);
    },
    [],
  );

  const actions = useMemo<Actions>(() => {
    const openWork = (id: string) =>
      patch({
        work: id,
        variant: 0,
        pubOff: {},
        chat: [
          {
            role: "ai",
            text: "Preparé esta pieza. Puedes cambiar el estilo con las variantes o pedirme un ajuste.",
          },
        ],
      });

    return {
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
              chat: [...prev.chat, { role: "ai", text: "No pude aplicar el ajuste. Intenta de nuevo." }],
            }));
          } finally {
            patch({ chatBusy: false });
          }
        })();
      },
      // Caption editado a mano (se guarda)
      updateCaption: (id, caption) => {
        patch((prev) => ({
          proposals: prev.proposals.map((p) => (p.id === id ? { ...p, caption } : p)),
        }));
        void updateProposalFields(id, { caption });
      },
      approve: (id) => {
        patch((prev) => ({
          proposals: prev.proposals.map((p) =>
            p.id === id ? { ...p, status: "scheduled" } : p,
          ),
          work: null,
        }));
        flash("Aprobado y programado");
        void updateProposalStatus(id, "scheduled");
      },
      reject: (id) => {
        patch((prev) => ({
          proposals: prev.proposals.map((p) =>
            p.id === id ? { ...p, status: "rejected" } : p,
          ),
          work: null,
        }));
        flash("Propuesta descartada");
        void updateProposalStatus(id, "rejected");
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
        const nice = active.map((t) => (t === "in" ? "LinkedIn" : t)).join(", ");
        patch((p) => ({
          proposals: p.proposals.map((x) =>
            x.id === w.id ? { ...x, status: "scheduled" } : x,
          ),
          work: null,
        }));
        flash("Publicado en " + nice);
        void updateProposalStatus(w.id, "scheduled");
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
      // IA: pide propuestas nuevas a Claude, las guarda y las muestra
      generate: async (opts) => {
        if (sRef.current.generating) return;
        patch({ generating: true });
        try {
          const existentes = sRef.current.proposals
            .filter((p) => p.status !== "rejected")
            .map((p) => p.line.pre + p.line.key + p.line.post);
          const nuevas = await generateProposals({ count: 5, ...opts, existentes });
          await insertProposals(nuevas);
          patch((prev) => ({ proposals: [...prev.proposals, ...nuevas], view: "inbox" }));
          flash(`${nuevas.length} propuestas nuevas listas`);
        } catch (e) {
          console.error("generate:", e);
          flash("No pude generar propuestas. Intenta de nuevo.");
        } finally {
          patch({ generating: false });
        }
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
      const upd: Partial<State> = {};
      if (props) upd.proposals = props;
      if (conns) upd.connections = conns;
      if (Object.keys(upd).length > 0) patch(upd);
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
