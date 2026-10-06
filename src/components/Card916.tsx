import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { HeadlineLine } from "../types";

interface Props {
  eyebrow: string;
  line: HeadlineLine;
  bg: string;
  fg: string;
  handle?: string;
  /** Ancho del card en px, o "100%" para llenar su slot (se mide en runtime). */
  width?: number | string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Card de contenido de marca en proporción 9:16.
 * Usa Montserrat (nunca la fuente de la UI). La escala tipográfica se deriva
 * del ancho real medido con ResizeObserver, para verse bien a cualquier tamaño.
 * La palabra clave (`line.key`) va siempre en naranja.
 */
export default function Card916({
  eyebrow,
  line,
  bg,
  fg,
  handle,
  width = "100%",
  className,
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState<number>(typeof width === "number" ? width : 0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width;
      if (cw) setW(cw);
    });
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Escala relativa al ancho (referencia: prototipo a 236px).
  const pad = w * 0.085;
  const eyebrowSize = w * 0.05;
  const lineSize = w * 0.118;
  const handleSize = w * 0.045;

  // Si el fondo ES el naranja, la palabra clave usaría naranja/naranja
  // (invisible). En ese caso cae al color de texto.
  const isOrangeBg = bg.toLowerCase() === "#f47c3c";
  const keyColor = isOrangeBg ? fg : "var(--tem-orange)";
  const eyebrowColor = isOrangeBg ? fg : "var(--tem-orange)";

  return (
    <div
      ref={ref}
      className={className}
      style={{
        width,
        aspectRatio: "9 / 16",
        background: bg,
        color: fg,
        borderRadius: "var(--r-card916)",
        padding: pad,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: "var(--font-brand)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          fontWeight: 900,
          fontSize: eyebrowSize,
          letterSpacing: "0.22em",
          color: eyebrowColor,
          marginBottom: pad * 0.5,
          overflowWrap: "anywhere",
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontWeight: 900,
          fontSize: lineSize,
          lineHeight: 1.12,
          letterSpacing: "-0.01em",
          overflowWrap: "anywhere",
        }}
      >
        {line.pre}
        <span style={{ color: keyColor }}>{line.key}</span>
        {line.post}
      </div>
      {handle && (
        <div
          style={{
            marginTop: "auto",
            textAlign: "center",
            fontSize: handleSize,
            fontWeight: 700,
            color: "var(--tem-handle)",
            paddingTop: pad,
          }}
        >
          {handle}
        </div>
      )}
    </div>
  );
}
