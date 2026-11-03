// Piezas de UI compartidas por los paneles de etapa (escritorio y teléfono).
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Etiqueta arriba, siempre visible; ayuda o aviso debajo. */
export function Field({
  label, aside, help, warn = false, children,
}: {
  label: string; aside?: ReactNode; help?: ReactNode; warn?: boolean; children: ReactNode;
}) {
  return (
    <div className={`tem-field${warn ? " tem-field--error" : ""}`}>
      <div className="grupo__cabeza">
        <span className="tem-label">{label}</span>
        {aside && <span>{aside}</span>}
      </div>
      {children}
      {help && <span className="tem-help">{help}</span>}
    </div>
  );
}

/**
 * Campo de texto que se guarda solo (600 ms). Si el valor cambia desde fuera
 * (por ejemplo, lo escribió la IA), se refleja sin pisar lo que escribes.
 */
function useDebounced(value: string, onCommit: (v: string) => void, ms = 600) {
  const [v, setV] = useState(value);
  const last = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Siempre la última versión del callback: si el padre volvió a renderizar
  // mientras se escribía, el commit usa datos frescos (no pisa otros campos).
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;
  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      setV(value);
    }
  }, [value]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const onChange = (x: string) => {
    setV(x);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      last.current = x;
      commitRef.current(x);
    }, ms);
  };
  return [v, onChange] as const;
}

export function TextInput({
  value, onCommit, placeholder, ariaLabel, onEnter, alignRight = false,
}: {
  value: string; onCommit: (v: string) => void; placeholder?: string; ariaLabel: string; onEnter?: () => void; alignRight?: boolean;
}) {
  const [v, onChange] = useDebounced(value, onCommit);
  return (
    <input
      className="tem-input"
      value={v}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      placeholder={placeholder}
      aria-label={ariaLabel}
      style={alignRight ? { textAlign: "right" } : undefined}
    />
  );
}

export function TextArea({
  value, onCommit, placeholder, rows = 3, ariaLabel,
}: {
  value: string; onCommit: (v: string) => void; placeholder?: string; rows?: number; ariaLabel: string;
}) {
  const [v, onChange] = useDebounced(value, onCommit);
  return (
    <textarea
      className="tem-textarea"
      value={v}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      aria-label={ariaLabel}
    />
  );
}

/** Casilla con texto (tomas, checklist, entrega). */
export function CheckRow({
  checked, text, onToggle, onRemove, disabled = false, aside,
}: {
  checked: boolean; text: string; onToggle?: () => void; onRemove?: () => void; disabled?: boolean; aside?: string;
}) {
  const id = useId();
  return (
    <div className="fila" style={{ flexWrap: "nowrap" }}>
      <label className={`casilla crece${checked ? " casilla--hecha" : ""}`} htmlFor={id}>
        <input id={id} type="checkbox" checked={checked} onChange={onToggle} disabled={disabled} />
        <span>{text}</span>
      </label>
      {aside && <span className="tem-caption">{aside}</span>}
      {onRemove && <button className="tem-btn tem-btn--texto btn-chico" onClick={onRemove} aria-label={`Quitar: ${text}`}>Quitar</button>}
    </div>
  );
}
