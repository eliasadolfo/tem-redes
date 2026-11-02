// Directrices de grabación por formato. Fuente: Oficina de Contenido de TEM
// (Producción y Arte, 2-nov-2026). Es la "hoja de rodaje" que ve Elías en la
// etapa Grabar y la lista de entrega que el editor exige antes de empezar.

import type { CheckItem, EditMode } from "../types";

export type FormatKey = "reel" | "video_largo" | "carrusel" | "post" | "newsletter";

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
  onScreen: "Lo pone el editor: subtítulo de 1-3 palabras bajo la cara, gancho detrás de la cabeza los primeros 3-4 s. Tú anotas qué texto va en cada toma.",
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
    "Título exacto (máx. 7 palabras) y su palabra en naranja",
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
    { name: "Eyebrow", y: [15.5, 17], x: [8, 92], style: "Montserrat 800 · 28 px · mayúsculas naranja", when: "junto al título" },
    { name: "Título", y: [17, 30], x: [8, 92], style: "Montserrat 900 · 64 px · blanco sobre caja #111 · una palabra naranja · máx. 7 palabras", when: "primeros 3-5 s" },
    { name: "Inserto", y: [17, 45], x: [14.5, 85.5], style: "Tarjeta blanca de 750 px, una idea y una cifra, uno a la vez", when: "en la palabra que nombra la cosa, 1,5-3 s" },
    { name: "Cara", y: [32, 82], x: [0, 100], style: "Plano completo con aire sobre la cabeza", when: "siempre; nunca fuera más de 3 s" },
    { name: "Subtítulos", y: [60, 68], x: [8, 92], style: "Montserrat 800 · 62 px · blanco con sombra · 1-3 palabras", when: "todo el video" },
    { name: "Cierre", y: [30, 60], x: [14.5, 85.5], style: "Tarjeta #111: eyebrow naranja + «Comenta X» + @tuescuelademarcas", when: "últimos 4-6 s" },
  ],
  thumbnail: "Portada 9:16: cara en la mitad inferior, título de 3-5 palabras con una en naranja dentro del recuadro 4:5 central.",
  variants: ["Blanca", "Negra", "Azul"],
  isVideo: true,
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
    { name: "Capítulo", y: [8, 12], x: [5, 40], style: "Montserrat 800 · 26 px · mayúsculas naranja · número + nombre", when: "primeros 3 s de cada capítulo" },
    { name: "Cara", y: [0, 100], x: [0, 100], style: "Regla de tercios, luz cálida de un lado, fondo oscuro", when: "siempre" },
    { name: "Cifra", y: [20, 80], x: [55, 95], style: "Tarjeta blanca, cifra Montserrat 900 naranja + una línea", when: "al decir la cifra, 3-5 s" },
    { name: "Título", y: [72, 88], x: [5, 60], style: "Montserrat 900 · 72 px · blanco sobre caja #111 · palabra naranja", when: "primeros 5 s" },
    { name: "Subtítulos", y: [84, 92], x: [15, 85], style: "Montserrat 600 · 44 px · blanco con sombra · máx. 7 palabras", when: "si no hay música" },
    { name: "Logo", y: [88, 95], x: [90, 96], style: "Logo TEM 80 px, blanco al 60 %", when: "todo el video" },
  ],
  thumbnail: "1280×720: cara ocupando la mitad derecha, máx. 3 palabras en Montserrat 900 naranja sobre #111, sin logo.",
  variants: ["Blanca", "Negra", "Azul"],
  isVideo: true,
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
  safe: { top: 72, bottom: 72, left: 72, right: 72 },
  audio: "No aplica.",
  light: "Luz natural o la lámpara cálida real, sin flash ni filtros que cambien la piel.",
  pace: "Lámina 1 = gancho; láminas 2 a N-1 = un paso o dato por lámina; última = cierre con llamado a guardar o compartir.",
  onScreen: "Lo arma el editor: texto blanco sobre degradado oscuro, 72 px de margen. Tú entregas el texto y la cifra real de cada lámina.",
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
    "Texto final de cada lámina, en orden (máx. 20 palabras)",
    "Gancho de la lámina 1 (máx. 7 palabras) y su palabra en naranja",
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
    { name: "Contador", y: [4, 7], x: [80, 93], style: "Montserrat 800 · 24 px · blanco · 2/7", when: "láminas 2 a N" },
    { name: "Degradado", y: [45, 100], x: [0, 100], style: "De #111 al 85 % a transparente, bajo el texto", when: "láminas con foto" },
    { name: "Eyebrow", y: [58, 62], x: [7, 93], style: "Montserrat 800 · 26 px · mayúsculas naranja" },
    { name: "Titular", y: [62, 88], x: [7, 93], style: "Lámina 1: Montserrat 900 · 88 px · blanco · máx. 7 palabras, una naranja. Resto: 500 con frase clave en 800", when: "una idea por lámina" },
    { name: "Handle", y: [93, 96], x: [7, 50], style: "@tuescuelademarcas · 24 px · blanco", when: "primera y última lámina" },
  ],
  thumbnail: "La lámina 1 es la portada: gancho de máx. 7 palabras, una en naranja, foto real de Elías.",
  variants: ["Foto", "Blanca", "Negra", "Azul"],
  isVideo: false,
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
  frame: "Una foto real o una captura real, un solo punto focal, la cara fuera de la zona del texto. Margen de 72 px.",
  safe: { top: 72, bottom: 72, left: 72, right: 72 },
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
    "Titular exacto (máx. 7 palabras), su palabra en naranja y el eyebrow",
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
    { name: "Eyebrow", y: [10, 14], x: [8, 92], style: "Montserrat 800 · 26 px · mayúsculas naranja" },
    { name: "Titular", y: [20, 70], x: [8, 92], style: "Montserrat 900 · 96 px · #111 sobre claro o blanco sobre oscuro · una palabra naranja · máx. 7 palabras", when: "una sola idea" },
    { name: "Cifra", y: [70, 82], x: [8, 92], style: "Montserrat 900 naranja · 120 px · con una línea de apoyo", when: "solo si cambia lo que el lector hace" },
    { name: "Handle", y: [91, 95], x: [8, 60], style: "@tuescuelademarcas · 24 px · #111 o blanco según fondo" },
    { name: "Logo", y: [90, 95], x: [84, 92], style: "Logo TEM 64 px" },
  ],
  thumbnail: "En el feed se recorta a 4:5 en la cuadrícula 3:4: titular y rostro dentro del 80 % central.",
  variants: ["Blanca", "Negra", "Azul"],
  isVideo: false,
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
};

export const FORMAT_GUIDES: Record<FormatKey, FormatGuide> = {
  reel: REEL,
  video_largo: VIDEO_LARGO,
  carrusel: CARRUSEL,
  post: POST,
  newsletter: NEWSLETTER,
};

/** Del formato del guion ("Reel", "Short", "Video largo"…) a la guía. */
export function formatKey(format: string | undefined): FormatKey {
  const f = (format ?? "").toLowerCase();
  if (f.includes("largo") || f === "video" || f.includes("youtube")) return "video_largo";
  if (f.includes("carrusel")) return "carrusel";
  if (f.includes("post")) return "post";
  if (f.includes("news")) return "newsletter";
  return "reel";
}

export function guideFor(format: string | undefined): FormatGuide {
  return FORMAT_GUIDES[formatKey(format)];
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
