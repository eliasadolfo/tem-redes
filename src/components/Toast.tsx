interface Props {
  message: string | null;
  /** Distancia desde abajo (el teléfono deja lugar a la barra). */
  bottom?: number;
  /** Si existe, el aviso ofrece Deshacer (H03) y dura más. */
  onUndo?: (() => void) | null;
}

export default function Toast({ message, bottom = 24, onUndo = null }: Props) {
  if (!message) return null;
  return (
    <div className="toast" key={message + (onUndo ? "-u" : "")} role="status" aria-live="polite" style={{ bottom }}>
      <span>{message}</span>
      {onUndo && <button onClick={onUndo}>Deshacer</button>}
    </div>
  );
}
