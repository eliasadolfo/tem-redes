// Datos mock determinísticos — extraídos 1:1 del prototipo de diseño.
// Copy final en español latinoamericano neutro (ver handoff §Voz y copy).
// En producción: reemplazar por lo que traiga el backend / las APIs.

import type {
  GalleryItem,
  Proposal,
  ThemeRow,
  Variant,
  Network,
} from "../types";

export const HANDLE = "@tuescuelademarcas";

export const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: "p1", day: 0, time: "9:00", platforms: ["IG", "TikTok"], type: "Reel",
    eyebrow: "EL PROBLEMA",
    line: { pre: "Tu marca ", key: "no es tuya", post: " hasta que la registras." },
    status: "scheduled",
    caption: "¿De verdad es tuya? Regístrala antes de que alguien más lo haga.",
    tags: ["#marcaregistrada", "#emprender", "#TEM"],
  },
  {
    id: "p2", day: 0, time: "", platforms: ["IG"], type: "Reel",
    eyebrow: "EL DATO",
    line: { pre: "El ", key: "80%", post: " de las marcas nunca se registran." },
    status: "proposal",
    caption: "La mayoría lo deja para después. Después casi siempre es tarde.",
    tags: ["#datocurioso", "#marca", "#TEM"],
  },
  {
    id: "p3", day: 1, time: "", platforms: ["TikTok"], type: "Reel",
    eyebrow: "EL COSTO",
    line: { pre: "Perder tu marca cuesta ", key: "$3,500", post: "." },
    status: "proposal",
    caption: "Y eso es solo el trámite. La reputación no tiene precio de recompra.",
    tags: ["#pymes", "#marca", "#TEM"],
  },
  {
    id: "p4", day: 2, time: "18:00", platforms: ["Shorts"], type: "Short",
    eyebrow: "EL TRÁMITE",
    line: { pre: "Registrarla toma ", key: "90 días", post: ", no 90 dolores de cabeza." },
    status: "scheduled",
    caption: "Te acompañamos paso a paso. Tú pones la marca, nosotros el mapa.",
    tags: ["#trámite", "#TEM"],
  },
  {
    id: "p5", day: 3, time: "", platforms: ["Newsletter", "in"], type: "Newsletter",
    eyebrow: "LA CARTA",
    line: { pre: "Lo que aprendí ", key: "registrando 5 marcas", post: "." },
    status: "proposal",
    caption: "Tres atajos que me hubieran ahorrado meses. Para founders con prisa.",
    tags: ["#founders", "#TEM"],
  },
  {
    id: "p6", day: 4, time: "12:00", platforms: ["IG"], type: "Reel",
    eyebrow: "LA SOLUCIÓN",
    line: { pre: "Regístrala en ", key: "90 días", post: " con TEM." },
    status: "scheduled",
    caption: "Sin abogados carísimos ni vueltas. ¡Hagamos que pase!",
    tags: ["#TEM", "#marca"],
  },
  {
    id: "p7", day: 4, time: "", platforms: ["in"], type: "Post",
    eyebrow: "PARA FUNDADORES",
    line: { pre: "Tu marca es tu ", key: "activo", post: ", trátala como tal." },
    status: "proposal",
    caption: "La valúas cuando levantas capital. Protégela desde antes.",
    tags: ["#linkedin", "#founders"],
  },
  {
    id: "p8", day: 2, time: "", platforms: ["YouTube"], type: "Video",
    format: "video", duration: "8:24",
    eyebrow: "YOUTUBE",
    line: { pre: "Cómo registrar tu marca en ", key: "90 días", post: " (paso a paso)" },
    status: "proposal",
    caption:
      "El tutorial completo que tus clientes piden. 8 min, sin relleno, con el formulario real en pantalla.",
    tags: ["#tutorial", "#marca", "#TEM"],
    guion: [
      "Gancho: el error que cuesta $3,500",
      "Los 3 pasos reales del registro",
      "En vivo: llenar el formulario",
      "Cierre: agenda tu registro con TEM",
    ],
  },
];

export const VARIANTS: Variant[] = [
  { bg: "#FFFFFF", fg: "#111111" },
  { bg: "#111111", fg: "#FFFFFF" },
  { bg: "#1D3557", fg: "#FFFFFF" },
];

export const GALLERY: GalleryItem[] = [
  { eyebrow: "EL COSTO", pre: "Perder tu marca cuesta ", key: "$3,500", post: ".", bg: "#111111", fg: "#FFFFFF", net: "TikTok", platStr: "TikTok", reach: "38K" },
  { eyebrow: "LA SOLUCIÓN", pre: "Regístrala en ", key: "90 días", post: ".", bg: "#1D3557", fg: "#FFFFFF", net: "Instagram", platStr: "Instagram", reach: "25K" },
  { eyebrow: "EL PROBLEMA", pre: "Tu marca ", key: "no es tuya", post: " aún.", bg: "#FFFFFF", fg: "#111111", net: "Shorts", platStr: "Shorts", reach: "31K" },
  { eyebrow: "EL DATO", pre: "El ", key: "80%", post: " no se registra.", bg: "#FFFFFF", fg: "#111111", net: "Instagram", platStr: "Instagram", reach: "19K" },
  { eyebrow: "TEM", pre: "¡Hagamos que ", key: "pase", post: "!", bg: "#F47C3C", fg: "#FFFFFF", net: "Instagram", platStr: "Instagram", reach: "22K" },
  { eyebrow: "EL TRÁMITE", pre: "Toma ", key: "90 días", post: ", no dolores.", bg: "#111111", fg: "#FFFFFF", net: "Shorts", platStr: "Shorts", reach: "17K" },
  { eyebrow: "YOUTUBE", pre: "Registra tu marca en ", key: "90 días", post: ".", bg: "#111111", fg: "#FFFFFF", net: "YouTube", platStr: "YouTube · 8:24", reach: "9.4K" },
  { eyebrow: "PARA FUNDADORES", pre: "Tu marca es tu ", key: "activo", post: ".", bg: "#FFFFFF", fg: "#111111", net: "LinkedIn", platStr: "LinkedIn", reach: "5.8K" },
  { eyebrow: "EL COSTO", pre: "No registrarla te ", key: "cuesta más", post: ".", bg: "#1D3557", fg: "#FFFFFF", net: "TikTok", platStr: "TikTok", reach: "14K" },
];

export const LIB_CHIPS = ["Todas", "Instagram", "TikTok", "Shorts", "YouTube", "LinkedIn"] as const;

export const THEMES: ThemeRow[] = [
  { name: "Costo de perder la marca", pct: "92%", note: "Alto interés" },
  { name: "Registro paso a paso", pct: "78%", note: "Guardan mucho" },
  { name: "Errores comunes al emprender", pct: "64%", note: "Comentan" },
  { name: "Precios y plazos reales", pct: "57%", note: "Preguntan" },
  { name: "Casos de marcas reales", pct: "49%", note: "Comparten" },
];

export const NET_HANDLES: Record<Network, string> = {
  Instagram: "@tuescuelademarcas",
  TikTok: "@tuescuelademarcas",
  Shorts: "TEM · Tu Escuela de Marcas",
  YouTube: "TEM · Tu Escuela de Marcas",
  LinkedIn: "Elías Adolfo",
};

/** Redes con estado de conexión OAuth (mock). */
export const CONNECTABLE: Network[] = ["Instagram", "TikTok", "YouTube", "LinkedIn"];

/** Chat inicial del copiloto al abrir una pieza. */
export const INITIAL_CHAT_TEXT =
  "Preparé esta pieza. Puedes cambiar el estilo con las variantes o pedirme un ajuste.";
