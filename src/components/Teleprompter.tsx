import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, X } from "lucide-react";
import { useStore } from "../store";
import { scriptText } from "../lib/stages";
import type { Proposal } from "../types";
import { CheckRow } from "./stages/ui";

interface Props {
  p: Proposal;
  onClose: () => void;
  /** "Grabada ✓": marca las tomas, pide el link del bruto y pasa a Editar. */
  onDone?: () => void;
}

/**
 * Teleprompter: texto grande sobre fondo negro, desplazamiento automático con
 * velocidad ajustable y pantalla completa. Espacio = pausa/sigue, Esc = cerrar.
 */
export default function Teleprompter({ p, onClose, onDone }: Props) {
  const { actions } = useStore();
  const text = scriptText(p) || "Esta pieza todavía no tiene guion. Vuelve a Guion y escríbelo.";
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(40); // px por segundo
  const [size, setSize] = useState(44);
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

  // Atajos: espacio pausa/sigue, Esc cierra (H07)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA";
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

  const ctl: React.CSSProperties = {
    all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, color: "#fff",
    fontSize: 13, fontWeight: 500, padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,.35)",
  };

  return (
    <div
      role="dialog"
      aria-label="Teleprompter"
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "#000", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "var(--font-ui)" }}
    >
      {/* controles */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
        <button className="press" onClick={() => setPlaying((v) => !v)} style={{ ...ctl, background: playing ? "transparent" : "var(--tem-orange)", borderColor: playing ? "rgba(255,255,255,.35)" : "var(--tem-orange)" }} title="Espacio">
          {playing ? <Pause size={16} strokeWidth={2.4} /> : <Play size={16} strokeWidth={2.4} />}
          {playing ? "Pausa" : "Empezar"}
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.7)" }}>
          Velocidad
          <input type="range" min={10} max={120} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Velocidad" style={{ width: 110, accentColor: "#F47C3C" }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.7)" }}>
          Tamaño
          <input type="range" min={24} max={80} value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Tamaño del texto" style={{ width: 90, accentColor: "#F47C3C" }} />
        </label>
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,.55)" }}>
          {p.line.pre}{p.line.key}{p.line.post}
        </span>
        <button className="press" onClick={toggleFull} style={ctl} title={full ? "Salir de pantalla completa" : "Pantalla completa"}>
          {full ? <Minimize2 size={16} strokeWidth={2.4} /> : <Maximize2 size={16} strokeWidth={2.4} />}
        </button>
        <button className="press" onClick={close} style={ctl} aria-label="Cerrar teleprompter (Esc)" title="Cerrar (Esc)">
          <X size={16} strokeWidth={2.4} />
        </button>
      </div>

      {/* texto */}
      <div ref={box} onClick={() => setPlaying((v) => !v)} style={{ flex: 1, overflowY: "auto", padding: "40vh 8vw", scrollBehavior: "auto", cursor: "pointer" }} title="Toca para pausar o seguir">
        <div style={{ fontSize: size, lineHeight: 1.35, fontWeight: 600, letterSpacing: "-.01em", whiteSpace: "pre-wrap", maxWidth: 960, margin: "0 auto" }}>
          {text}
        </div>
      </div>

      {/* tomas + Grabada */}
      {(shots.length > 0 || onDone) && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,.12)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
            {shots.map((s) => (
              <CheckRow key={s.id} checked={s.done} text={s.text} onToggle={() => toggleShot(s.id)} />
            ))}
          </div>
          {onDone && (
            <button className="press" onClick={onDone} style={{ ...ctl, background: "var(--tem-orange)", borderColor: "var(--tem-orange)", fontSize: 14, padding: "11px 18px" }}>
              Grabada ✓
            </button>
          )}
        </div>
      )}
    </div>
  );
}
