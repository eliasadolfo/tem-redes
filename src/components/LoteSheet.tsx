import { useEffect, useState } from "react";
import { useStore } from "../store";
import { DAY_NAMES_FULL } from "../lib/dates";
import { PLATFORM_LABEL, PUBLISH_TAGS, pieceTitle, platformsStr } from "../lib/platforms";
import type { PlatformTag } from "../types";

/** Lote: elegir varias piezas en Listo y asignarles redes, día y hora de una vez. */
export default function LoteSheet({ onClose }: { onClose: () => void }) {
  const { proposals, actions } = useStore();
  const items = proposals.filter((p) => p.status !== "rejected" && p.stage === "listo");
  const [picked, setPicked] = useState<string[]>([]);
  const [nets, setNets] = useState<PlatformTag[]>([]);
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onEsc, true);
    return () => window.removeEventListener("keydown", onEsc, true);
  }, [onClose]);

  const allPicked = items.length > 0 && picked.length === items.length;
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const hasChange = nets.length > 0 || day !== "" || time !== "";
  const ready = picked.length > 0 && hasChange;

  const apply = () => {
    actions.applyBatch(picked, {
      ...(nets.length ? { platforms: nets } : {}),
      ...(day !== "" ? { day: Number(day) } : {}),
      ...(time ? { time } : {}),
    });
    onClose();
  };

  return (
    <div className="velo" onClick={onClose}>
      <div className="hoja" role="dialog" aria-modal="true" aria-labelledby="t-lote" onClick={(e) => e.stopPropagation()}>
        <div className="hoja__cuerpo">
          <h2 className="tem-title" id="t-lote">Programar en lote</h2>
          {items.length === 0 ? (
            <p className="tem-small tem-muted">Todavía no hay piezas en Listo. Llegan aquí cuando tienen el video final y el caption.</p>
          ) : (
            <>
              <div className="pila pila--chica">
                <div className="grupo__cabeza">
                  {picked.length === 1 ? "1 pieza elegida" : `${picked.length} piezas elegidas`}
                  <button className="tem-btn tem-btn--texto btn-chico" onClick={() => setPicked(allPicked ? [] : items.map((p) => p.id))}>
                    {allPicked ? "Quitar todas" : "Elegir todas"}
                  </button>
                </div>
                <div className="lote-lista">
                  {items.map((p) => (
                    <label key={p.id} className="lote-fila">
                      <input type="checkbox" checked={picked.includes(p.id)} onChange={() => setPicked(toggle(picked, p.id))} />
                      <span className="pila" style={{ gap: 2 }}>
                        <span className="tem-small medio">{pieceTitle(p)}</span>
                        <span className="tem-caption">
                          {[DAY_NAMES_FULL[p.day], p.time, platformsStr(p.platforms)].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </label>
                  ))}
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
                  <label className="tem-label" htmlFor="lote-dia">Día</label>
                  <select id="lote-dia" className="tem-select" value={day} onChange={(e) => setDay(e.target.value)}>
                    <option value="">Sin cambiar</option>
                    {DAY_NAMES_FULL.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="tem-field">
                  <label className="tem-label" htmlFor="lote-hora">Hora</label>
                  <input id="lote-hora" className="tem-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
              <p className="tem-help">Esto deja redes, día y hora en cada pieza. Se suben desde su ficha, con Publicar o Programar.</p>
            </>
          )}
        </div>
        <div className="hoja__pie">
          {items.length > 0 && (
            <button className="tem-btn tem-btn--primario" onClick={apply} disabled={!ready}>
              {picked.length > 1 ? `Aplicar a ${picked.length} piezas` : "Aplicar"}
            </button>
          )}
          <button className="tem-btn tem-btn--secundario" onClick={onClose}>{items.length ? "Cancelar" : "Cerrar"}</button>
        </div>
      </div>
    </div>
  );
}
