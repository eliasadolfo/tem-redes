// Exporta una pieza como PNG lista para publicar, con las medidas del sistema v2
// (las mismas de Card916). Se arma el DOM a mano fuera de pantalla y se rasteriza.

import { toBlob } from "html-to-image";
import type { Proposal, Variant } from "../types";
import { HANDLE } from "../data/mock";
import { guideFor, pieceFormat } from "./formatos";
import { PIEZA, specFor, thumbParts, type PiezaSpec } from "./pieza";
import { pieceTitle } from "./platforms";
import interUrl from "../styles/tem/fonts/inter-latin-500-normal.woff2?url";
import firmaUrl from "../styles/tem/fonts/montserrat-latin-500-normal.woff2?url";

/* Las fuentes van incrustadas en base64: así html-to-image no recorre las del documento. */
let fontCssPromise: Promise<string> | null = null;

async function toDataUrl(url: string): Promise<string> {
  const buf = await fetch(url).then((r) => r.arrayBuffer());
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:font/woff2;base64,${btoa(bin)}`;
}

function fontCss(): Promise<string> {
  if (!fontCssPromise) {
    fontCssPromise = Promise.all([toDataUrl(interUrl), toDataUrl(firmaUrl)]).then(
      ([inter, firma]) =>
        `@font-face{font-family:"Inter";font-weight:500;src:url(${inter}) format("woff2");}` +
        `@font-face{font-family:"TEM Firma";font-weight:500;src:url(${firma}) format("woff2");}`,
    );
  }
  return fontCssPromise;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label}: tiempo agotado`)), ms)),
  ]);
}

function el(tag: string, style: Partial<CSSStyleDeclaration>, text?: string): HTMLElement {
  const n = document.createElement(tag);
  Object.assign(n.style, style);
  if (text !== undefined) n.textContent = text;
  return n;
}

function headline(p: Proposal, size: number): HTMLElement {
  const line = el("div", { fontSize: `${size}px`, overflowWrap: "anywhere" });
  line.append(
    document.createTextNode(p.line.pre),
    el("span", { color: PIEZA.naranja }, p.line.key),
    document.createTextNode(p.line.post),
  );
  return line;
}

const BASE: Partial<CSSStyleDeclaration> = {
  boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden",
  fontFamily: "Inter, sans-serif", fontWeight: "500", letterSpacing: "-0.03em", lineHeight: "1.1",
};

/** Lienzo con tarjeta plana flotando: Reel, Historia, carrusel o post. */
function buildCard(p: Proposal, v: Variant, spec: PiezaSpec): HTMLElement {
  const root = el("div", { ...BASE, width: `${spec.w}px`, height: `${spec.h}px`, padding: `${PIEZA.margen}px`, background: v.bg });
  const card = el("div", {
    background: v.card, color: v.fg, borderRadius: `${PIEZA.radio}px`, padding: `${PIEZA.padding}px`,
    boxShadow: "0 1px 2px rgba(17,17,17,.04), 0 12px 36px rgba(17,17,17,.06)",
  });
  card.appendChild(headline(p, spec.title));
  card.appendChild(el("div", {
    marginTop: `${spec.title / 2 + 8}px`, fontFamily: '"TEM Firma", sans-serif', fontSize: `${spec.handle}px`,
    letterSpacing: "0.01em", color: PIEZA.gris,
  }, HANDLE));
  root.appendChild(card);
  return root;
}

/** Miniatura 1280×720: cifra 300 + palabra 60, sin firma ni logo. */
function buildThumbnail(p: Proposal, spec: PiezaSpec): HTMLElement {
  const root = el("div", { ...BASE, width: `${spec.w}px`, height: `${spec.h}px`, padding: `${PIEZA.padding}px`, background: "#FFFFFF", color: PIEZA.tinta });
  const parts = thumbParts(p.line);
  if (parts) {
    root.appendChild(el("div", { fontSize: "300px", letterSpacing: "-0.055em", lineHeight: "1", color: PIEZA.naranja }, parts.cifra));
    root.appendChild(el("div", { fontSize: "60px" }, parts.palabra));
  } else {
    root.appendChild(headline(p, spec.title));
  }
  return root;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
}

/** Rasteriza la pieza a PNG. No descarga: devuelve el blob. */
export async function renderPieceToPng(p: Proposal, v: Variant): Promise<ExportResult> {
  const spec = specFor(guideFor(pieceFormat(p)).aspect);
  const node = spec.horizontal ? buildThumbnail(p, spec) : buildCard(p, v, spec);

  // Fuera de pantalla pero renderizado (html-to-image necesita layout real)
  const holder = el("div", { position: "fixed", left: "-20000px", top: "0", pointerEvents: "none" });
  holder.appendChild(node);
  document.body.appendChild(holder);
  try {
    const fontEmbedCSS = await withTimeout(fontCss(), 10_000, "fuentes");
    await withTimeout(document.fonts.load("500 100px Inter"), 5_000, "fuente").catch(() => undefined);
    const blob = await withTimeout(
      toBlob(node, { width: spec.w, height: spec.h, pixelRatio: 1, backgroundColor: spec.horizontal ? "#FFFFFF" : v.bg, fontEmbedCSS, skipFonts: true }),
      20_000,
      "render",
    );
    if (!blob) throw new Error("No se pudo generar la imagen");
    const slug = pieceTitle(p)
      .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);
    return { blob, filename: `tem-${slug || p.id}${spec.horizontal ? "-miniatura" : ""}.png`, width: spec.w, height: spec.h };
  } finally {
    holder.remove();
  }
}

/** Descarga el PNG al dispositivo. */
export async function downloadPiecePng(p: Proposal, v: Variant): Promise<ExportResult> {
  const res = await renderPieceToPng(p, v);
  const url = URL.createObjectURL(res.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = res.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return res;
}
