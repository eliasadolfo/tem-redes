import { useEffect, useMemo, useState } from "react";
import { useStore, type NetResult } from "../store";
import { fmtWhen, fromInputs } from "../lib/dates";
import { PLATFORM_LABEL, PUBLISH_TAGS, pieceTitle, platformsStr } from "../lib/platforms";
import { NETWORK_KEY, TAG_TO_NETWORK, hasPublishing } from "../lib/publish";
import { pieceWhen } from "../lib/stages";
import type { Network, PlatformTag, Proposal } from "../types";

const SEPARACION = [
  { dias: 1, label: "Una por día" },
  { dias: 2, label: "Una cada 2 días" },
  { dias: 7, label: "Una por semana" },
  { dias: 0, label: "Todas a la misma hora" },
];

interface Plan {
  p: Proposal;
  tags: PlatformTag[];
  when: string | null;
  send: Network[]; // redes a las que se envía
  done: Network[]; // redes donde ya quedó: no se repiten
  problem: string | null; // si existe, la pieza no se envía
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** Qué se enviaría por pieza: lo que Elías revisa antes de confirmar. */
function buildPlan(p: Proposal, tags: PlatformTag[], when: string | null, connections: Record<string, boolean>): Plan {
  const nets = [...new Set(tags.map((t) => TAG_TO_NETWORK[t]).filter((n): n is Network => Boolean(n)))];
  const isDone = (n: Network) => {
    const r = p.posts?.[NETWORK_KEY[n]];
    return Boolean(r?.ok && (r.scheduled || r.url || r.pending));
  };
  const done = nets.filter(isDone);
  const send = nets.filter((n) => !isDone(n));
  const off = send.filter((n) => !connections[n]);
  let problem: string | null = null;
  if (!p.final_url) problem = "Falta el link del video final";
  else if (nets.length === 0) problem = "Sin redes";
  else if (send.length === 0) problem = "Ya programada en todas sus redes";
  else if (off.length) problem = `Conecta ${off.join(", ")} en Perfil`;
  else if (!when || new Date(when).getTime() <= Date.now() + 60_000) problem = "La fecha ya pasó";
  return { p, tags, when, send, done, problem };
}

/**
 * Lote: elegir piezas en Listo, revisar qué sale y cuándo, y programarlas en las redes.
 * Nada se envía hasta tocar Programar en la confirmación: ese es el GO de Elías.
 * Las piezas salen una a una; si una falla, las demás siguen.
 */
export default function LoteSheet({ onClose }: { onClose: () => void }) {
  const { proposals, connections, actions } = useStore();
  const items = useMemo(() => proposals.filter((p) => p.status !== "rejected" && p.stage === "listo"), [proposals]);
  const [paso, setPaso] = useState<"elegir" | "confirmar" | "resultado">("elegir");
  const [picked, setPicked] = useState<string[]>([]);
  const [nets, setNets] = useState<PlatformTag[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [gap, setGap] = useState(1);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, NetResult[]>>({});
  const [sent, setSent] = useState<Plan[]>([]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      if (!running) onClose();
    };
    window.addEventListener("keydown", onEsc, true);
    return () => window.removeEventListener("keydown", onEsc, true);
  }, [onClose, running]);

  const plans = useMemo(
    () => items.filter((p) => picked.includes(p.id)).map((p, i) => buildPlan(p, nets.length ? nets : p.platforms, fromInputs(date, time, i * gap), connections)),
    [items, picked, nets, date, time, gap, connections],
  );
  const ready = plans.filter((x) => !x.problem);
  const allPicked = items.length > 0 && picked.length === items.length;

  const run = async () => {
    const queue = ready;
    setSent(queue);
    setPaso("resultado");
    setRunning(true);
    for (const plan of queue) {
      setCurrent(plan.p.id);
      const r = await actions.schedulePiece(plan.p.id, { networks: plan.send, platforms: plan.tags, when: plan.when as string });
      setResults((prev) => ({ ...prev, [plan.p.id]: r }));
    }
    setCurrent(null);
    setRunning(false);
  };

  const okCount = sent.filter((x) => results[x.p.id]?.every((r) => r.ok)).length;
  const titulo =
    paso === "elegir" ? "Programar en lote"
    : paso === "confirmar" ? "Confirma antes de programar"
    : running ? "Programando…"
    : `${okCount} de ${sent.length} ${sent.length === 1 ? "pieza programada" : "piezas programadas"}`;

  return (
    <div className="velo" onClick={() => !running && onClose()}>
      <div className="hoja" role="dialog" aria-modal="true" aria-labelledby="t-lote" onClick={(e) => e.stopPropagation()}>
        <div className="hoja__cuerpo">
          <h2 className="tem-title" id="t-lote">{titulo}</h2>

          {paso === "elegir" && items.length === 0 && (
            <p className="tem-small tem-muted">Todavía no hay piezas en Listo. Llegan aquí cuando tienen el video final y el caption.</p>
          )}

          {paso === "elegir" && items.length > 0 && (
            <>
              <div className="pila pila--chica">
                <div className="grupo__cabeza">
                  {picked.length === 1 ? "1 pieza elegida" : `${picked.length} piezas elegidas`}
                  <button className="tem-btn tem-btn--texto btn-chico" onClick={() => setPicked(allPicked ? [] : items.map((p) => p.id))}>
                    {allPicked ? "Quitar todas" : "Elegir todas"}
                  </button>
                </div>
                <div className="lote-lista">
                  {items.map((p) => {
                    const when = pieceWhen(p);
                    return (
                      <label key={p.id} className="lote-fila">
                        <input type="checkbox" checked={picked.includes(p.id)} onChange={() => setPicked(toggle(picked, p.id))} />
                        <span className="pila" style={{ gap: 2 }}>
                          <span className="tem-small medio">{pieceTitle(p)}</span>
                          <span className="tem-caption">{[when ? fmtWhen(when) : "Sin fecha", platformsStr(p.platforms)].filter(Boolean).join(" · ")}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="tem-field">
                <span className="tem-label" id="l-redes">Redes</span>
                <div className="opciones" role="group" aria-labelledby="l-redes">
                  {PUBLISH_TAGS.map((t) => (
                    <button key={t} className="opcion" aria-pressed={nets.includes(t)} onClick={() => setNets(toggle(nets, t))}>{PLATFORM_LABEL[t]}</button>
                  ))}
                </div>
                <span className="tem-help">Reemplazan las redes de cada pieza. Sin elegir, cada una conserva las suyas.</span>
              </div>

              <div className="dos">
                <div className="tem-field">
                  <label className="tem-label" htmlFor="lote-fecha">Primera fecha</label>
                  <input id="lote-fecha" className="tem-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="tem-field">
                  <label className="tem-label" htmlFor="lote-hora">Hora</label>
                  <input id="lote-hora" className="tem-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
              <div className="tem-field">
                <label className="tem-label" htmlFor="lote-gap">Repartir</label>
                <select id="lote-gap" className="tem-select" value={gap} onChange={(e) => setGap(Number(e.target.value))}>
                  {SEPARACION.map((s) => <option key={s.dias} value={s.dias}>{s.label}</option>)}
                </select>
              </div>
            </>
          )}

          {paso === "confirmar" && (
            <>
              <div className="tem-aviso tem-aviso--warn" role="alert">
                {ready.length === 0
                  ? "Ninguna pieza se puede enviar. Revisa los motivos."
                  : `Al confirmar, ${ready.length === 1 ? "1 pieza se envía" : `${ready.length} piezas se envían`} a las redes en estas fechas. No se deshace desde aquí.`}
              </div>
              {!hasPublishing && <div className="tem-aviso tem-aviso--error">La publicación no está configurada en este entorno.</div>}
              <div>
                {plans.map((x) => (
                  <div key={x.p.id} className="lote-plan">
                    <span className="tem-small medio">{pieceTitle(x.p)}</span>
                    <span className="tem-small">{x.when ? fmtWhen(x.when) : "Sin fecha"}</span>
                    <span className="tem-caption">{x.send.join(", ") || "Sin redes por enviar"}{x.done.length > 0 ? `. Ya está en ${x.done.join(", ")}` : ""}</span>
                    {x.problem && <span className="lote-res"><span className="tem-tag tem-tag--warn">No se envía: {x.problem}</span></span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {paso === "resultado" && (
            <>
              {running && <p className="tem-help" role="status">No cierres esta pantalla: cada video tarda lo que tarde en subir.</p>}
              <div>
                {sent.map((x) => {
                  const r = results[x.p.id];
                  return (
                    <div key={x.p.id} className="lote-plan">
                      <span className="tem-small medio">{pieceTitle(x.p)}</span>
                      <span className="tem-caption">{x.when ? fmtWhen(x.when) : ""}</span>
                      <span className="lote-res">
                        {r
                          ? r.map((n) => <span key={n.network} className={`tem-tag ${n.ok ? "tem-tag--ok" : "tem-tag--error"}`}>{n.network}: {n.detail}</span>)
                          : <span className="tem-tag">{current === x.p.id ? "Enviando…" : "En cola"}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
              {!running && okCount < sent.length && <p className="tem-help">Lo que falló sigue en Listo. Al volver a programarla solo se envían las redes pendientes.</p>}
            </>
          )}
        </div>

        <div className="hoja__pie">
          {paso === "elegir" && items.length > 0 && (
            <button className="tem-btn tem-btn--primario" onClick={() => setPaso("confirmar")} disabled={picked.length === 0 || !date || !time}>Revisar</button>
          )}
          {paso === "elegir" && <button className="tem-btn tem-btn--secundario" onClick={onClose}>{items.length ? "Cancelar" : "Cerrar"}</button>}
          {paso === "confirmar" && (
            <>
              <button className="tem-btn tem-btn--naranja" onClick={() => void run()} disabled={ready.length === 0 || !hasPublishing}>
                {ready.length === 1 ? "Programar 1 pieza" : `Programar ${ready.length} piezas`}
              </button>
              <button className="tem-btn tem-btn--secundario" onClick={() => setPaso("elegir")}>Volver</button>
            </>
          )}
          {paso === "resultado" && <button className="tem-btn tem-btn--primario" onClick={onClose} disabled={running}>{running ? "Programando…" : "Listo"}</button>}
        </div>
      </div>
    </div>
  );
}
