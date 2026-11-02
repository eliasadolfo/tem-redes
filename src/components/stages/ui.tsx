// Piezas de UI compartidas por los paneles de etapa (escritorio y móvil).
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export const INPUT: CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500,
  color: "var(--tem-ink)", background: "var(--tem-bg)", border: "1.5px solid transparent", borderRadius: 12,
  padding: "10px 12px", outline: "none", lineHeight: 1.45,
};

export const SELECT: CSSProperties = {
  fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "var(--tem-ink)",
  background: "var(--tem-surface)", border: "1.5px solid var(--tem-ink)", borderRadius: 12, padding: "9px 10px",
  minWidth: 0,
};

export const BTN_PRIMARY: CSSProperties = {
  all: "unset", cursor: "pointer", textAlign: "center", fontSize: 14, fontWeight: 600,
  background: "var(--tem-orange)", color: "#fff", padding: "12px 20px", borderRadius: 12,
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, boxSizing: "border-box",
};

export const BTN_SECONDARY: CSSProperties = {
  all: "unset", cursor: "pointer", textAlign: "center", fontSize: 13, fontWeight: 600,
  color: "var(--tem-ink)", border: "1.5px solid var(--tem-ink)", padding: "9px 14px", borderRadius: 12,
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, boxSizing: "border-box",
  background: "var(--tem-surface)",
};

export const BTN_GHOST: CSSProperties = {
  all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--tem-handle)",
  border: "1.5px solid var(--tem-border-muted)", padding: "7px 11px", borderRadius: 10,
  display: "inline-flex", alignItems: "center", gap: 6, boxSizing: "border-box",
};

export function Label({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--tem-handle)" }}>
        {children}
      </span>
      {right && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tem-orange)" }}>{right}</span>}
    </div>
  );
}

export function Hint({ children, warn = false }: { children: ReactNode; warn?: boolean }) {
  return (
    <div style={{ marginTop: 6, fontSize: 11, fontWeight: 500, lineHeight: 1.4, color: warn ? "var(--tem-orange)" : "var(--tem-handle)" }}>
      {children}
    </div>
  );
}

/**
 * Campo de texto que se guarda solo (debounce 600 ms). Si el valor cambia
 * desde fuera (p.ej. lo escribió la IA), se refleja sin pisar lo que escribes.
 */
function useDebounced(value: string, onCommit: (v: string) => void, ms = 600) {
  const [v, setV] = useState(value);
  const last = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      onCommit(x);
    }, ms);
  };
  return [v, onChange] as const;
}

export function TextInput({
  value, onCommit, placeholder, style, ariaLabel, onEnter,
}: {
  value: string; onCommit: (v: string) => void; placeholder?: string; style?: CSSProperties; ariaLabel?: string; onEnter?: () => void;
}) {
  const [v, onChange] = useDebounced(value, onCommit);
  return (
    <input
      value={v}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="tem-textarea"
      style={{ ...INPUT, ...style }}
    />
  );
}

export function TextArea({
  value, onCommit, placeholder, rows = 3, style, ariaLabel,
}: {
  value: string; onCommit: (v: string) => void; placeholder?: string; rows?: number; style?: CSSProperties; ariaLabel?: string;
}) {
  const [v, onChange] = useDebounced(value, onCommit);
  return (
    <textarea
      value={v}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      aria-label={ariaLabel}
      className="tem-textarea"
      style={{ ...INPUT, resize: "vertical", ...style }}
    />
  );
}

/** Casilla con texto (tomas y checklist). */
export function CheckRow({
  checked, text, onToggle, onRemove, big = false,
}: {
  checked: boolean; text: string; onToggle: () => void; onRemove?: () => void; big?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        className="press-sm"
        onClick={onToggle}
        role="checkbox"
        aria-checked={checked}
        aria-label={text}
        style={{
          all: "unset", cursor: "pointer", width: big ? 26 : 20, height: big ? 26 : 20, flex: "none", borderRadius: 7,
          border: `2px solid ${checked ? "var(--tem-orange)" : "var(--tem-ink)"}`,
          background: checked ? "var(--tem-orange)" : "transparent", display: "grid", placeItems: "center",
        }}
      >
        {checked && (
          <svg width={big ? 14 : 11} height={big ? 14 : 11} viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 6.5 5 9.5 10 3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <span style={{ flex: 1, fontSize: big ? 15 : 13, fontWeight: 500, lineHeight: 1.35, textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.55 : 1 }}>
        {text}
      </span>
      {onRemove && (
        <button className="press-sm" onClick={onRemove} aria-label={`Quitar: ${text}`} title="Quitar" style={{ all: "unset", cursor: "pointer", color: "var(--tem-handle)", fontSize: 16, lineHeight: 1, padding: "0 4px" }}>
          ×
        </button>
      )}
    </div>
  );
}

/** Chip de plantilla: clic lo inserta (H06: reconocer, no recordar). */
export function TemplateChip({ text, onPick }: { text: string; onPick: () => void }) {
  return (
    <button
      className="press-sm"
      onClick={onPick}
      title="Usar esta plantilla"
      style={{
        all: "unset", cursor: "pointer", fontSize: 11, fontWeight: 500, padding: "6px 10px", borderRadius: 999,
        border: "1.5px solid var(--tem-border-muted)", color: "var(--tem-ink)", lineHeight: 1.3, maxWidth: "100%",
      }}
    >
      {text}
    </button>
  );
}
