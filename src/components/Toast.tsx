interface Props {
  message: string | null;
  /** Distancia desde abajo (móvil usa 104px por la tab bar). */
  bottom?: number;
}

/** Toast global: 2.4s, un punto naranja a la izquierda, fondo negro. */
export default function Toast({ message, bottom = 32 }: Props) {
  if (!message) return null;
  return (
    <div
      // key fuerza reinicio de la animación en cada mensaje nuevo
      key={message}
      style={{
        position: "fixed",
        left: "50%",
        bottom,
        transform: "translateX(-50%)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 9,
        background: "var(--tem-ink)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        padding: "11px 16px",
        borderRadius: 14,
        boxShadow: "var(--sh-popover)",
        animation: "toastInOut 2.4s var(--ease-spring) forwards",
        pointerEvents: "none",
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
      {message}
    </div>
  );
}
