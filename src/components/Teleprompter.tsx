import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, X } from "lucide-react";
import { useStore } from "../store";
import { pieceTitle } from "../lib/platforms";
import { scriptText } from "../lib/stages";
import type { Proposal } from "../types";
import { CheckRow } from "./stages/ui";

interface Props {
  p: Proposal;
  onClose: () => void;
  /** "Grabada": pide el link del bruto y pasa a Editar. */
  onDone?: () => void;
}

/**
 * Teleprompter: texto grande sobre negro, desplazamiento automático con velocidad
 * ajustable y pantalla completa. Espacio = pausa o sigue, Esc = cerrar.
 */
export default function Teleprompter({ p, onClose, onDone }: Props) {
  const { actions } = useStore();
  const text = scriptText(p) || "Esta pieza todavía no tiene guion. Vuelve a Guion y escríbelo.";
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(40); // px por segundo
  const [size, setSize] = useState(() => (window.innerWidth <= 720 ? 32 : 44));
  const [full, setFull] = useState(Boolean(document.fullscreenElement));
  const box = useRef<HTMLDivElement>(null);
  const shots = p.shots ?? [];

  // Desplazamiento con requestAnimationFrame (suave, independiente del refresco)
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const el = box.current;
      if (el) {
        el.scrollTop += ((now - last) / 1000) * speed;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) setPlaying(false);
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  // Atajos: espacio pausa o sigue, Esc cierra (H07)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      if (e.key === " " && !typing) {
        e.preventDefault();
        setPlaying((v) => !v);
      } else if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", onKey, true);
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("fullscreenchange", onFs);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    onClose();
  };

  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void document.documentElement.requestFullscreen?.().catch(() => actions.flash("Tu navegador no permite pantalla completa aquí."));
  };

  const toggleShot = (id: string) =>
    actions.updateFields(p.id, { shots: shots.map((s) => (s.id === id ? { ...s, done: !s.done } : s)) });

  return (
    <div className="tele" role="dialog" aria-label="Teleprompter">
      <div className="tele__barra">
        <button className="tele__control tele__control--empezar" onClick={() => setPlaying((v) => !v)}>
          {playing ? <Pause size={16} strokeWidth={1.5} aria-hidden="true" /> : <Play size={16} strokeWidth={1.5} aria-hidden="true" />}
          {playing ? "Pausa" : "Empezar"}
        </button>
        <label className="tele__rango">
          Velocidad
          <input type="range" min={10} max={120} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Velocidad" />
        </label>
        <label className="tele__rango">
          Tamaño
          <input type="range" min={24} max={80} value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Tamaño del texto" />
        </label>
        <span className="tele__titulo">{pieceTitle(p)}</span>
        <button className="tele__control" onClick={toggleFull} aria-label={full ? "Salir de pantalla completa" : "Pantalla completa"}>
          {full ? <Minimize2 size={16} strokeWidth={1.5} /> : <Maximize2 size={16} strokeWidth={1.5} />}
        </button>
        <button className="tele__control" onClick={close} aria-label="Cerrar teleprompter">
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div ref={box} className="tele__texto" onClick={() => setPlaying((v) => !v)}>
        <div className="tele__guion" style={{ fontSize: size }}>{text}</div>
      </div>

      {(shots.length > 0 || onDone) && (
        <div className="tele__pie">
          <div className="tele__tomas">
            {shots.map((s) => <CheckRow key={s.id} checked={s.done} text={s.text} onToggle={() => toggleShot(s.id)} />)}
          </div>
          {onDone && <button className="tem-btn tem-btn--naranja" onClick={onDone}>Grabada</button>}
        </div>
      )}
    </div>
  );
}
