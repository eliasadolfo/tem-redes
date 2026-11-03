import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { PIEZA, specFor, thumbParts } from "../lib/pieza";
import type { HeadlineLine, Variant } from "../types";

interface Props {
  line: HeadlineLine;
  variant: Variant;
  handle?: string;
  /** Proporción de la guía de formato: "9:16", "4:5" o "16:9". */
  aspect?: string;
  /** Ancho en px, o "100%" para llenar su lugar (se mide en vivo). */
  width?: number | string;
  style?: CSSProperties;
}

/**
 * Vista previa de la pieza con las medidas del sistema v2: lienzo, tarjeta plana
 * flotando, Inter 500 a la izquierda y el handle abajo en gris. Todo escala desde
 * el lienzo real. Colores fijos: una pieza no sigue el tema de la app.
 */
export default function Card916({ line, variant, handle, aspect, width = "100%", style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState<number>(typeof width === "number" ? width : 0);
  const spec = specFor(aspect);

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

  const s = w / spec.w;
  const frame: CSSProperties = {
    width, aspectRatio: `${spec.w} / ${spec.h}`, overflow: "hidden", flex: "none", boxSizing: "border-box",
    fontFamily: "var(--tem-font)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1,
    borderRadius: "var(--tem-r-sm)", ...style,
  };

  if (spec.horizontal) {
    const parts = thumbParts(line);
    return (
      <div ref={ref} style={{ ...frame, background: "#FFFFFF", color: PIEZA.tinta, padding: 72 * s, display: "flex", flexDirection: "column", justifyContent: "center", border: "1px solid var(--tem-line)" }}>
        {parts ? (
          <>
            <div style={{ fontSize: 300 * s, letterSpacing: "-0.055em", lineHeight: 1, color: PIEZA.naranja }}>{parts.cifra}</div>
            <div style={{ fontSize: 60 * s }}>{parts.palabra}</div>
          </>
        ) : (
          <div style={{ fontSize: spec.title * s }}>
            {line.pre}<span style={{ color: PIEZA.naranja }}>{line.key}</span>{line.post}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ ...frame, background: variant.bg, padding: PIEZA.margen * s, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div
        style={{
          background: variant.card, color: variant.fg, borderRadius: PIEZA.radio * s, padding: PIEZA.padding * s,
          boxShadow: "0 1px 2px rgba(17,17,17,.04), 0 12px 36px rgba(17,17,17,.06)",
        }}
      >
        <div style={{ fontSize: spec.title * s, overflowWrap: "anywhere" }}>
          {line.pre}<span style={{ color: PIEZA.naranja }}>{line.key}</span>{line.post}
        </div>
        {handle && (
          <div style={{ marginTop: (spec.title / 2 + 8) * s, fontFamily: "var(--tem-font-firma)", fontSize: spec.handle * s, letterSpacing: "0.01em", color: PIEZA.gris }}>
            {handle}
          </div>
        )}
      </div>
    </div>
  );
}
