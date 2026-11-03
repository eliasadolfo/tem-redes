// Medidas de la pieza según Sistema TEM v2 › Redes, en píxeles del lienzo real.
// Las usan la vista previa (Card916) y la exportación a PNG, para que coincidan.
import type { HeadlineLine } from "../types";

export const PIEZA = { margen: 96, padding: 72, radio: 40, naranja: "#F47C3C", gris: "#9A9A9A", tinta: "#111111" };

export interface PiezaSpec {
  horizontal: boolean;
  w: number;
  h: number;
  title: number;
  handle: number;
}

export function specFor(aspect: string | undefined): PiezaSpec {
  if (aspect === "16:9") return { horizontal: true, w: 1280, h: 720, title: 72, handle: 0 };
  if (aspect === "4:5") return { horizontal: false, w: 1080, h: 1350, title: 72, handle: 26 };
  return { horizontal: false, w: 1080, h: 1920, title: 64, handle: 30 };
}

/** Miniatura: cifra de 300 + palabra de 60. Sin cifra en el título, va el título completo. */
export function thumbParts(line: HeadlineLine): { cifra: string; palabra: string } | null {
  const text = `${line.pre}${line.key}${line.post}`.trim();
  const m = /(\d[\d.,]*\s?%?)/.exec(line.key || text);
  if (!m) return null;
  const cifra = m[1].trim();
  return { cifra, palabra: text.replace(cifra, "").replace(/\s+/g, " ").trim() };
}
