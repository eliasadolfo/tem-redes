interface Props {
  message: string | null;
  /** Distancia desde abajo (móvil usa 104px por la tab bar). */
  bottom?: number;
  /** Si existe, el toast ofrece "Deshacer" (H03) y dura más. */
  onUndo?: (() => void) | null;
}

/** Toast global: punto naranja a la izquierda, fondo negro. 2.4 s, o 6 s con Deshacer. */
export default function Toast({ message, bottom = 32, onUndo = null }: Props) {
  if (!message) return null;
  return (
    <div
      // key fuerza reinicio de la animación en cada mensaje nuevo
      key={message + (onUndo ? "-u" : "")}
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        bottom,
        transform: "translateX(-50%)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--tem-ink)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        padding: onUndo ? "9px 9px 9px 16px" : "11px 16px",
        borderRadius: 14,
        boxShadow: "var(--sh-popover)",
        animation: `toastInOut ${onUndo ? "6s" : "2.4s"} var(--ease-spring) forwards`,
        maxWidth: "calc(100vw - 36px)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: "var(--tem-orange)",
          flexShrink: 0,
        }}
      />
      <span style={{ lineHeight: 1.3 }}>{message}</span>
      {onUndo && (
        <button
          className="press-sm"
          onClick={onUndo}
          style={{
            all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff",
            border: "1.5px solid rgba(255,255,255,.55)", borderRadius: 999, padding: "6px 12px",
            marginLeft: 4, whiteSpace: "nowrap",
          }}
        >
          Deshacer
        </button>
      )}
    </div>
  );
}
