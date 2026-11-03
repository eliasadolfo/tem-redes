// Directrices de grabación por formato. Fuente: Oficina de Contenido de TEM
// (Producción y Arte, 2-nov-2026). Es la "hoja de rodaje" que ve Elías en la
// etapa Grabar y la lista de entrega que el editor exige antes de empezar.

import type { CheckItem, EditMode } from "../types";

export type FormatKey = "reel" | "historia" | "video_largo" | "carrusel" | "post" | "newsletter";

/** Zona segura en px del lienzo de entrega (nada importante ahí). */
export interface SafeZones { top: number; bottom: number; left: number; right: number }

/** Capa de la maqueta: dónde cae cada cosa en la pieza terminada (porcentajes del lienzo). */
export interface MockLayer {
  name: string;
  y: [number, number]; // % alto
  x: [number, number]; // % ancho
  style: string; // una línea: tipografía, color
  when?: string; // cuándo aparece
}

export interface FormatGuide {
  key: FormatKey;
  name: string;
  orientation: "vertical" | "horizontal";
  aspect: string; // "9:16"
  canvas: { w: number; h: number }; // lienzo de entrega en px
  resolution: string;
  duration: { min: number; ideal: number; max: number } | null;
  extent?: string; // láminas, palabras…
  frame: string; // encuadre
  safe: SafeZones;
  audio: string;
  light: string;
  pace: string;
  onScreen: string;
  before: string[]; // checklist antes de grabar
  during: string[]; // checklist en cada toma
  deliver: string[]; // entregables al editor (confirmación manual)
  fileName: string;
  avoid: string[];
  layers: MockLayer[];
  thumbnail?: string;
  variants?: string[];
  isVideo: boolean;
  /** Se edita con modo A/B/C. Una historia se publica tal cual: no lleva modo. */
  editMode: boolean;
}

export const EDIT_MODES: { key: EditMode; name: string; help: string }[] = [
  { key: "A", name: "Reflexivo", help: "Mínimo: sin tarjetas ni música. Un plano a cámara." },
  { key: "B", name: "Instructivo", help: "Pantalla dividida con capturas reales de la herramienta." },
  { key: "C", name: "Declaración", help: "Un solo plano, cero cortes. La frase completa de punta a punta." },
];

/** Reglas que valen para todos los formatos (se muestran plegadas). */
export const GENERAL_RULES = [
  "Elías graba, el sistema edita: los originales llegan por AirDrop al Mac. Telegram y WhatsApp recomprimen y topan en 20 MB.",
  "Oficina real, de noche, con la lámpara a la vista. Se cuida el audio y la legibilidad, no verse caro.",
  "Cada toma se graba completa aunque se trabe; entre tomas no se mueve nada.",
  "Todo gancho empieza con Elías a cámara desde el cuadro 1; los últimos 5-6 s son su cara.",
  "Herramientas siempre con pantalla real (n8n, Telegram, Kajabi), sin datos de clientes visibles.",
  "Ninguna cifra, caso o cliente sin fuente primaria y permiso.",
  "Una foto o clip no se repite en las últimas 3 piezas ni en 14 días.",
];

const REEL: FormatGuide = {
  key: "reel",
  name: "Reel · TikTok · Short",
  orientation: "vertical",
  aspect: "9:16",
  canvas: { w: 1080, h: 1920 },
  resolution: "Entrega 1080×1920 · grabar en 4K (2160×3840) a 30 fps",
  duration: { min: 30, ideal: 45, max: 60 },
  frame: "Plano medio corto (pecho hacia arriba), cara centrada, ojos en el tercio superior y aire sobre la cabeza para el gancho. Cámara a la altura de los ojos, fija, sin zoom ni paneo.",
  safe: { top: 300, bottom: 340, left: 60, right: 120 },
  audio: "Micrófono del teléfono a menos de 40 cm, sin viento ni ventilador. 5 s de silencio de sala al inicio.",
  light: "Lámpara o ventana de frente o a 45° del rostro. Nunca a contraluz.",
  pace: "Gancho hablado en los primeros 2-3 s. Un punto cada 8-10 s. Si te trabas, sigue y repite la frase; no reinicies la toma.",
  onScreen: "Lo pone el editor: tarjeta blanca de máximo 12 palabras y subtítulo de 1-3 palabras bajo la cara. Tú anotas qué texto va en cada toma.",
  before: [
    "Guion y los 3 ganchos abiertos en OTRO dispositivo",
    "Modo avión, No molestar, 4 GB libres, lente limpio",
    "Encuadre medido (altura de ojos, aire arriba) y teléfono fijo",
    "Luz de frente; sin papeles ni datos de terceros a la vista",
    "Ropa sólida y oscura, sin logos de terceros, sin blanco puro",
    "Prueba de 5 s de encuadre y audio, revisada con auriculares",
  ],
  during: [
    "Mirar al lente, no a la pantalla",
    "Empezar con el gancho desde el primer segundo, sin «bueno…»",
    "Toma completa aunque te trabes; repetir solo la frase fallida",
    "Un gancho por toma (A, B, C) más una de seguridad con el favorito",
    "Pausa de 10-15 s entre tomas sin mover el teléfono",
    "Cerrar mirando a cámara 5-6 s con el llamado a guardar o compartir",
  ],
  deliver: [
    "Bruto original por AirDrop (no Telegram ni WhatsApp)",
    "Grabación de pantalla aparte si el guion muestra una herramienta",
    "Guion con los 3 ganchos y qué gancho va en cada toma",
    "Título exacto (máx. 12 palabras) y su palabra en naranja",
    "Prop real de los primeros 2 s (correo, captura, objeto)",
    "Fuente de cada cifra que se dice",
  ],
  fileName: "AAAA-MM-DD_<pieza>_toma<N>.mov",
  avoid: [
    "Filtros, modo belleza o cinematográfico",
    "Contraluz o ventana detrás",
    "Cortar la toma a mitad para repetir desde ahí",
    "Cara, objeto o cifra en los primeros 300 px o últimos 340 px",
    "Mover el teléfono entre tomas",
    "Mandar el video por Telegram o WhatsApp",
  ],
  layers: [
    { name: "Título", y: [17, 30], x: [9, 91], style: "Tarjeta blanca · Inter 500 · 64 px · hasta 3 palabras en naranja, mismo peso · máx. 12 palabras", when: "primeros 3-5 s" },
    { name: "Inserto", y: [17, 45], x: [14.5, 85.5], style: "Tarjeta blanca de 750 px, una idea y una cifra, uno a la vez", when: "en la palabra que nombra la cosa, 1,5-3 s" },
    { name: "Cara", y: [32, 82], x: [0, 100], style: "Plano completo con aire sobre la cabeza", when: "siempre; nunca fuera más de 3 s" },
    { name: "Subtítulos", y: [60, 68], x: [8, 92], style: "Inter 500 · 64 px · blanco con sombra suave · 1-3 palabras", when: "todo el video" },
    { name: "Cierre", y: [30, 60], x: [14.5, 85.5], style: "Tarjeta negra: «Comenta X» + @tuescuelademarcas abajo en gris", when: "últimos 4-6 s" },
  ],
  thumbnail: "Portada 9:16: cara en la mitad inferior, título de 3-5 palabras con una en naranja, dentro del recuadro 4:5 central.",
  variants: ["Blanca", "Negra", "Azul"],
  isVideo: true,
  editMode: true,
};

const HISTORIA: FormatGuide = {
  key: "historia",
  name: "Historia de Instagram",
  orientation: "vertical",
  aspect: "9:16",
  canvas: { w: 1080, h: 1920 },
  resolution: "Entrega 1080×1920 · grabar vertical a 30 fps",
  duration: { min: 5, ideal: 10, max: 15 },
  frame: "Selfie o plano fijo a la altura de los ojos, cara al centro. Sin producción: se graba donde estás.",
  safe: { top: 250, bottom: 340, left: 60, right: 60 },
  audio: "Micrófono del teléfono a menos de 40 cm, sin viento. Mucha gente la ve sin sonido: la idea tiene que leerse en pantalla.",
  light: "Luz de frente o ventana a 45°. Nunca a contraluz.",
  pace: "Una sola idea en 10 segundos, dicha de una vez. Si no cabe, es un Reel.",
  onScreen: "Una frase corta en tarjeta blanca, dentro de la zona segura. Tú anotas el texto en cada toma.",
  before: [
    "Frase de la historia a mano, en una línea",
    "Encuadre fijo a la altura de los ojos",
    "Luz de frente; sin papeles ni datos de terceros a la vista",
  ],
  during: [
    "Mirar al lente y decirlo de una vez",
    "Si te trabas, repite la historia completa: dura 10 segundos",
  ],
  deliver: [
    "Bruto original por AirDrop (no Telegram ni WhatsApp)",
    "Fuente de la cifra, o indicar que no lleva",
  ],
  fileName: "AAAA-MM-DD_<pieza>_toma<N>.mov",
  avoid: [
    "Más de una idea",
    "Texto en los primeros 250 px o los últimos 340 px",
    "Filtros o modo belleza",
    "Datos de clientes o de terceros a la vista",
  ],
  layers: [
    { name: "Cara", y: [13, 82], x: [0, 100], style: "Selfie o plano fijo, cara libre de texto", when: "toda la historia" },
    { name: "Tarjeta", y: [52, 72], x: [9, 91], style: "Tarjeta blanca · Inter 500 · 64 px · máx. 12 palabras · handle 30 px en gris", when: "toda la historia" },
  ],
  variants: ["Blanca", "Negra", "Azul"],
  isVideo: true,
  editMode: false,
};

const VIDEO_LARGO: FormatGuide = {
  key: "video_largo",
  name: "Video largo de YouTube",
  orientation: "horizontal",
  aspect: "16:9",
  canvas: { w: 1920, h: 1080 },
  resolution: "Entrega 1920×1080 · grabar en 4K (3840×2160) a 30 fps",
  duration: { min: 420, ideal: 600, max: 900 },
  frame: "Horizontal, plano medio con aire arriba y a los lados (de ahí salen los 3 cortes verticales). Cara centrada, cámara fija. La pantalla del computador se graba aparte.",
  safe: { top: 54, bottom: 108, left: 96, right: 96 },
  audio: "Micrófono a menos de 40 cm, sin ventilador ni aire acondicionado. Son 7-15 minutos de voz: el audio importa más que la imagen.",
  light: "Misma lámpara cálida, de frente o a 45°, y el mismo fondo durante toda la sesión.",
  pace: "Gancho con historia propia y cifras exactas en los primeros 15 s, luego estructura numerada. Cada capítulo arranca diciendo su título en voz alta.",
  onScreen: "Poco: título del capítulo, cifras grandes y capturas reales. Lista en las tomas cada capítulo con su título y cada cifra a destacar.",
  before: [
    "Guion con capítulos y una búsqueda literal como título (cómo… sin…)",
    "Pestañas y herramientas abiertas y en orden; notificaciones apagadas",
    "Pantalla sin datos personales ni de clientes",
    "Teléfono en horizontal, 4K, trípode, 20 GB libres, enchufado",
    "Prueba de 5 s de audio y encuadre",
    "Vaso de agua a mano",
  ],
  during: [
    "Decir en voz alta el capítulo al empezar cada bloque («Paso 2: …»)",
    "Al pasar a la pantalla, narrar lo que haces mientras lo haces",
    "Si te equivocas: pausa de 2 s y repetir la frase completa",
    "Cerrar a cámara con tu conclusión, no con un pedido genérico",
    "Una sola sentada por bloques, sin mover la cámara",
  ],
  deliver: [
    "Bruto de la cara por AirDrop",
    "Grabación de pantalla aparte (AAAA-MM-DD_<pieza>_pantalla.mov)",
    "Guion con capítulos y marcas de tiempo aproximadas",
    "Título, descripción con capítulos y las 3 palabras de la miniatura",
    "Cifras que llevan tarjeta y en qué segundo se dicen",
    "Fuente de cada cifra que se dice",
  ],
  fileName: "AAAA-MM-DD_<pieza>_toma<N>.mov",
  avoid: [
    "Grabar vertical",
    "Mezclar cara y pantalla en un solo archivo",
    "Leer el guion con la vista desviada del lente",
    "Ventanas con datos de clientes abiertas",
    "Ráfagas de menos de 1 minuto: se pierde continuidad de luz y voz",
    "Prometer en el gancho algo que el video no entrega",
  ],
  layers: [
    { name: "Capítulo", y: [8, 12], x: [5, 40], style: "Inter 500 · 30 px · número + nombre, en sentence case", when: "primeros 3 s de cada capítulo" },
    { name: "Cara", y: [0, 100], x: [0, 100], style: "Regla de tercios, luz cálida de un lado, fondo oscuro", when: "siempre" },
    { name: "Cifra", y: [20, 80], x: [55, 95], style: "Tarjeta blanca, cifra Inter 500 + una línea", when: "al decir la cifra, 3-5 s" },
    { name: "Título", y: [72, 88], x: [5, 60], style: "Tarjeta blanca · Inter 500 · 64 px · hasta 3 palabras en naranja, mismo peso", when: "primeros 5 s" },
    { name: "Subtítulos", y: [84, 92], x: [15, 85], style: "Inter 500 · 38 px · blanco con sombra suave · máx. 7 palabras", when: "si no hay música" },
    { name: "Logo", y: [88, 95], x: [90, 96], style: "Logo TEM 80 px, blanco, sin alterar", when: "todo el video" },
  ],
  thumbnail: "1280×720, máx. 3 palabras: cifra de 300 px + palabra de 60 px en Inter 500, a la izquierda, con la cara en la mitad derecha. Sin firma ni logo.",
  variants: ["Blanca", "Negra", "Azul"],
  isVideo: true,
  editMode: true,
};

const CARRUSEL: FormatGuide = {
  key: "carrusel",
  name: "Carrusel de Instagram · LinkedIn",
  orientation: "vertical",
  aspect: "4:5",
  canvas: { w: 1080, h: 1350 },
  resolution: "1080×1350 por lámina (PNG) · fotos de origen de al menos 1620×2025",
  duration: null,
  extent: "6-8 láminas, una idea o una historia; una foto real por lámina",
  frame: "Fotos reales de Elías en vertical con la cara libre del texto: aire arriba o abajo según dónde irá el título. Mismo fondo y luz entre láminas.",
  safe: { top: 96, bottom: 96, left: 96, right: 96 },
  audio: "No aplica.",
  light: "Luz natural o la lámpara cálida real, sin flash ni filtros que cambien la piel.",
  pace: "Lámina 1 = gancho; láminas 2 a N-1 = un paso o dato por lámina; última = cierre con llamado a guardar o compartir.",
  onScreen: "Lo arma el editor: tarjeta blanca con título de 72 px y texto de 38 px, márgenes de 96 px. Tú entregas el texto y la cifra real de cada lámina.",
  before: [
    "Historia o lista cerrada con su dato real por lámina",
    "Una foto real por lámina identificada (qué momento cuenta)",
    "Si hay cliente: permiso, cifra de antes y después, foto y cita textual",
    "Revisar que ninguna foto se usó en las últimas 3 piezas",
  ],
  during: [
    "Foto en vertical, cámara nativa, sin editar",
    "Dos o tres variantes por momento, cara libre de objetos",
    "Elías nítido y sin papeles con datos de terceros",
  ],
  deliver: [
    "Fotos originales por AirDrop (AAAA-MM-DD_<pieza>_lamNN)",
    "Texto final de cada lámina, en orden (título de 10 palabras + párrafo de 25)",
    "Gancho de la lámina 1 (máx. 10 palabras) y su palabra en naranja",
    "Pregunta o puerta de la última lámina («Comenta X»)",
    "Fuente de cada cifra",
  ],
  fileName: "AAAA-MM-DD_<pieza>_lam<NN>.jpg",
  avoid: [
    "Stock o imágenes de IA para rellenar: si falta la foto, se pide",
    "Fotos de WhatsApp (pierden resolución)",
    "Más de una idea por lámina",
    "Mayúsculas sostenidas o emoji",
  ],
  layers: [
    { name: "Foto", y: [0, 100], x: [0, 100], style: "Foto real a sangre, una distinta por lámina, cara libre de texto", when: "láminas 1 a N-1" },
    { name: "Tarjeta", y: [52, 90], x: [9, 91], style: "Tarjeta blanca · título Inter 500 · 72 px + texto Inter 400 · 38 px, a la izquierda", when: "una idea por lámina" },
    { name: "Firma", y: [83, 87], x: [15, 60], style: "Montserrat 500 · 26 px · @tuescuelademarcas en gris, dentro de la tarjeta", when: "primera y última lámina" },
  ],
  thumbnail: "La lámina 1 es la portada: gancho de máx. 10 palabras, hasta 3 en naranja, foto real de Elías.",
  variants: ["Blanca", "Negra", "Azul"],
  isVideo: false,
  editMode: false,
};

const POST: FormatGuide = {
  key: "post",
  name: "Post de imagen única",
  orientation: "vertical",
  aspect: "4:5",
  canvas: { w: 1080, h: 1350 },
  resolution: "1080×1350 (PNG o JPG)",
  duration: null,
  extent: "1 imagen y un caption; Instagram hasta 150 palabras, LinkedIn 1.200-1.500 caracteres",
  frame: "Una foto real o una captura real, un solo punto focal, la cara fuera de la zona del texto. Margen de 96 px.",
  safe: { top: 96, bottom: 96, left: 96, right: 96 },
  audio: "No aplica.",
  light: "Luz natural o lámpara cálida real. Capturas de pantalla en alta resolución.",
  pace: "Una sola idea, legible en 3 segundos sin abrir el caption.",
  onScreen: "Máximo 12 palabras en la imagen, naranja solo en 1-3 palabras clave. Tú entregas el texto exacto y la cifra con su fuente.",
  before: [
    "Una idea y una cifra o frase final",
    "Foto o captura elegida y con permiso",
    "Caption redactado en tú",
  ],
  during: [
    "Foto vertical con aire para el texto",
    "Captura en alta resolución sin datos personales",
  ],
  deliver: [
    "Imagen original por AirDrop (AAAA-MM-DD_<pieza>_img)",
    "Titular exacto (máx. 10 palabras) y su palabra en naranja",
    "Fuente de la cifra, o indicar que no lleva",
  ],
  fileName: "AAAA-MM-DD_<pieza>_img.jpg",
  avoid: [
    "Cuadrado o apaisado: pierde espacio en el feed",
    "Texto pequeño o más de una idea",
    "Logo de TEM encima de una foto",
    "Cifras sin fuente primaria",
  ],
  layers: [
    { name: "Titular", y: [20, 62], x: [9, 91], style: "Tarjeta blanca · Inter 500 · 72 px · hasta 3 palabras en naranja, mismo peso · máx. 10 palabras", when: "una sola idea" },
    { name: "Texto", y: [62, 80], x: [9, 91], style: "Inter 400 · 38 px en gris · con una línea de apoyo", when: "solo si cambia lo que el lector hace" },
    { name: "Firma", y: [84, 89], x: [9, 60], style: "Montserrat 500 · 26 px · @tuescuelademarcas en gris" },
  ],
  thumbnail: "En el feed se recorta a 4:5 en la cuadrícula 3:4: titular y rostro dentro del 80 % central.",
  variants: ["Blanca", "Negra", "Azul"],
  isVideo: false,
  editMode: false,
};

const NEWSLETTER: FormatGuide = {
  key: "newsletter",
  name: "Newsletter",
  orientation: "vertical",
  aspect: "2:1 cabecera",
  canvas: { w: 1200, h: 600 },
  resolution: "Cabecera 1200×600 · columna de lectura de 600 px",
  duration: null,
  extent: "Lectura de 3 minutos (400-600 palabras), un tema y un llamado",
  frame: "No se graba video. Insumo: una nota de voz de 60-90 s con la idea central, o el texto base, más una foto real o una captura.",
  safe: { top: 0, bottom: 0, left: 0, right: 0 },
  audio: "Nota de voz a 30 cm del micrófono, sin ruido, una idea completa por nota.",
  light: "Solo para la foto de cabecera: luz natural o lámpara cálida.",
  pace: "Asunto con una promesa concreta (≤ 50 caracteres), primera línea que entrega valor, tres bloques cortos, un solo llamado al final.",
  onScreen: "Naranja solo en enlaces y 1-3 palabras clave. Sin emoji. Tú al lector.",
  before: [
    "Tema que sale de una pieza ya publicada o de una vivencia real",
    "Una táctica aplicable hoy, no solo una reflexión",
    "Enlace de destino y llamado definidos",
  ],
  during: [
    "Grabar la nota de voz de corrido y sin leer",
    "Dar la cifra o el ejemplo real que sostiene la idea",
  ],
  deliver: [
    "Nota de voz o texto base (AAAA-MM-DD_<pieza>_nota)",
    "Foto o captura de cabecera",
    "Asunto y texto de vista previa propuestos",
  ],
  fileName: "AAAA-MM-DD_<pieza>_nota.m4a",
  avoid: [
    "Más de un llamado a la acción",
    "Adjuntos pesados",
    "Tecnicismos sin explicar",
    "Promesas sin un caso real detrás",
  ],
  layers: [],
  isVideo: false,
  editMode: false,
};

export const FORMAT_GUIDES: Record<FormatKey, FormatGuide> = {
  reel: REEL,
  historia: HISTORIA,
  video_largo: VIDEO_LARGO,
  carrusel: CARRUSEL,
  post: POST,
  newsletter: NEWSLETTER,
};

/** Del formato del guion ("Reel", "Short", "Historia", "Video largo"…) a la guía. */
export function formatKey(format: string | undefined): FormatKey {
  const f = (format ?? "").toLowerCase();
  if (f.includes("largo") || f === "video" || f.includes("youtube")) return "video_largo";
  if (f.includes("histori")) return "historia";
  if (f.includes("carrusel")) return "carrusel";
  if (f.includes("post")) return "post";
  if (f.includes("news")) return "newsletter";
  return "reel";
}

export function guideFor(format: string | undefined): FormatGuide {
  return FORMAT_GUIDES[formatKey(format)];
}

/** Formato de una pieza: el del guion, o su tipo si todavía no tiene guion. */
export function pieceFormat(p: { type: string; script?: { format: string } }): string {
  return p.script?.format || p.type;
}

export function durationLabel(g: FormatGuide): string {
  if (!g.duration) return g.extent ?? "";
  const f = (s: number) => (s < 120 ? `${s} s` : `${Math.round(s / 60)} min`);
  return `${f(g.duration.min)} a ${f(g.duration.max)} · ideal ${f(g.duration.ideal)}`;
}

function item(text: string): CheckItem {
  return { id: Math.random().toString(36).slice(2, 10), text, done: false };
}

/** Checklist "antes de grabar" del formato. */
export function checklistFor(format: string | undefined): CheckItem[] {
  return guideFor(format).before.map(item);
}

/** Checklist manual de entrega al editor del formato. */
export function deliveryFor(format: string | undefined): CheckItem[] {
  return guideFor(format).deliver.map(item);
}

/** Nombre de archivo sugerido para la toma N de la pieza. */
export function suggestedFileName(g: FormatGuide, title: string, n = 1): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28) || "pieza";
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return g.fileName.replace("AAAA-MM-DD", date).replace("<pieza>", slug).replace("<N>", String(n)).replace("<NN>", String(n).padStart(2, "0"));
}
