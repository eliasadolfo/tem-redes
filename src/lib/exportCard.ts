// Exporta una pieza como imagen PNG lista para publicar.
// 9:16 (1080×1920) para Reels/TikTok/Shorts; 16:9 (1920×1080) para miniatura de YouTube.
// Se construye el DOM a mano (sin React) fuera de pantalla y se rasteriza con html-to-image.

import { toBlob } from "html-to-image";
import type { Proposal, Variant } from "../types";
import { HANDLE } from "../data/mock";
import montserratBlackUrl from "../assets/fonts/Montserrat-Black.ttf?url";
import montserratBoldUrl from "../assets/fonts/Montserrat-Bold.ttf?url";

const ORANGE = "#F47C3C";
const HANDLE_GRAY = "#9A9A9A";

/* -------------------------------------------------------------------------- */
/*  Fuentes: solo Montserrat, incrustada en base64 (evita que html-to-image     */
/*  escanee e intente bajar todas las fuentes del documento, p.ej. Inter).      */
/* -------------------------------------------------------------------------- */

let fontCssPromise: Promise<string> | null = null;

async function toDataUrl(url: string): Promise<string> {
  const buf = await fetch(url).then((r) => r.arrayBuffer());
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:font/ttf;base64,${btoa(bin)}`;
}

function montserratCss(): Promise<string> {
  if (!fontCssPromise) {
    fontCssPromise = Promise.all([toDataUrl(montserratBlackUrl), toDataUrl(montserratBoldUrl)]).then(
      ([black, bold]) =>
        `@font-face{font-family:"Montserrat";font-weight:900;src:url(${black}) format("truetype");}` +
        `@font-face{font-family:"Montserrat";font-weight:700;src:url(${bold}) format("truetype");}`,
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

/** Construye el nodo 9:16 con la misma escala que Card916 (referencia: ancho). */
function buildVertical(p: Proposal, v: Variant, w = 1080): HTMLElement {
  const h = Math.round((w * 16) / 9);
  const pad = w * 0.085;
  const isOrangeBg = v.bg.toLowerCase() === ORANGE.toLowerCase();
  const accent = isOrangeBg ? v.fg : ORANGE;

  const root = el("div", {
    width: `${w}px`, height: `${h}px`, boxSizing: "border-box", padding: `${pad}px`,
    background: v.bg, color: v.fg, display: "flex", flexDirection: "column", justifyContent: "center",
    fontFamily: "Montserrat, sans-serif", overflow: "hidden",
  });
  root.appendChild(el("div", {
    fontWeight: "900", fontSize: `${w * 0.05}px`, letterSpacing: "0.22em", color: accent,
    marginBottom: `${pad * 0.5}px`, textTransform: "uppercase",
  }, p.eyebrow));
  const line = el("div", {
    fontWeight: "900", fontSize: `${w * 0.118}px`, lineHeight: "1.12", letterSpacing: "-0.01em",
    overflowWrap: "anywhere",
  });
  line.append(
    document.createTextNode(p.line.pre),
    el("span", { color: accent }, p.line.key),
    document.createTextNode(p.line.post),
  );
  root.appendChild(line);
  root.appendChild(el("div", {
    marginTop: "auto", textAlign: "center", fontSize: `${w * 0.045}px`, fontWeight: "700",
    color: HANDLE_GRAY, paddingTop: `${pad}px`,
  }, HANDLE));
  return root;
}

/** Miniatura 16:9 para video largo (YouTube). */
function buildThumbnail(p: Proposal, v: Variant, w = 1920): HTMLElement {
  const h = Math.round((w * 9) / 16);
  const pad = w * 0.06;
  const isOrangeBg = v.bg.toLowerCase() === ORANGE.toLowerCase();
  const accent = isOrangeBg ? v.fg : ORANGE;

  const root = el("div", {
    width: `${w}px`, height: `${h}px`, boxSizing: "border-box", padding: `${pad}px`,
    background: v.bg, color: v.fg, display: "flex", flexDirection: "column",
    fontFamily: "Montserrat, sans-serif", overflow: "hidden",
  });
  root.appendChild(el("div", {
    fontWeight: "900", fontSize: `${w * 0.022}px`, letterSpacing: "0.25em", color: accent, textTransform: "uppercase",
  }, p.eyebrow));
  const line = el("div", {
    marginTop: `${pad * 0.5}px`, fontWeight: "900", fontSize: `${w * 0.06}px`, lineHeight: "1.05",
    letterSpacing: "-0.02em", maxWidth: "78%", overflowWrap: "anywhere",
  });
  line.append(
    document.createTextNode(p.line.pre),
    el("span", { color: accent }, p.line.key),
    document.createTextNode(p.line.post),
  );
  root.appendChild(line);
  const foot = el("div", { marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" });
  const play = el("div", {
    width: `${w * 0.06}px`, height: `${w * 0.06}px`, borderRadius: "999px", background: ORANGE,
    display: "flex", alignItems: "center", justifyContent: "center",
  });
  play.appendChild(el("span", {
    width: "0", height: "0", borderLeft: `${w * 0.02}px solid #fff`,
    borderTop: `${w * 0.013}px solid transparent`, borderBottom: `${w * 0.013}px solid transparent`, marginLeft: `${w * 0.004}px`,
  }));
  foot.appendChild(play);
  foot.appendChild(el("div", { fontSize: `${w * 0.02}px`, fontWeight: "700", color: HANDLE_GRAY }, HANDLE));
  root.appendChild(foot);
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
  const isVideo = p.format === "video";
  const node = isVideo ? buildThumbnail(p, v) : buildVertical(p, v);
  const width = parseInt(node.style.width, 10);
  const height = parseInt(node.style.height, 10);

  // Fuera de pantalla pero renderizado (html-to-image necesita layout real)
  const holder = el("div", { position: "fixed", left: "-20000px", top: "0", pointerEvents: "none" });
  holder.appendChild(node);
  document.body.appendChild(holder);
  try {
    const fontEmbedCSS = await withTimeout(montserratCss(), 10_000, "fuentes");
    await withTimeout(document.fonts.load("900 100px Montserrat"), 5_000, "fuente").catch(() => undefined);
    const blob = await withTimeout(
      toBlob(node, { width, height, pixelRatio: 1, backgroundColor: v.bg, fontEmbedCSS, skipFonts: true }),
      20_000,
      "render",
    );
    if (!blob) throw new Error("No se pudo generar la imagen");
    const slug = (p.line.pre + p.line.key + p.line.post)
      .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);
    return { blob, filename: `tem-${slug || p.id}${isVideo ? "-miniatura" : ""}.png`, width, height };
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
