// Utilidades de fecha. Todas las fechas se normalizan a mediodía local
// para evitar saltos por DST (regla del handoff).

export const DAY = 86_400_000;

export const M_ABBR = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];
export const M_FULL = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
/** Encabezados del popover: la semana empieza en lunes. */
export const WEEKDAY_HEADERS = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];
export const WK_ABBR = ["LUN", "MAR", "MIÉ", "JUE", "VIE"];
export const DAY_NAMES_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

/** Mediodía local del día que contiene `ms`. */
export function noon(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime();
}

/** Lunes (mediodía) de la semana que contiene `ms`. */
export function mondayOf(ms: number): number {
  const d = new Date(noon(ms));
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  return d.getTime() - dow * DAY;
}

/** Índice de columna (lead) del día 1 del mes, con lunes = 0. */
export function monthLead(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function fmtDayMonth(d: Date): string {
  return `${d.getDate()} ${M_ABBR[d.getMonth()]}`;
}

/** "20 – 24 jul 2026" para el rango de la semana visible. */
export function weekRangeLabel(mondayMs: number): string {
  const start = new Date(mondayMs);
  const end = new Date(mondayMs + 4 * DAY);
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = sameMonth ? String(start.getDate()) : fmtDayMonth(start);
  return `${startStr} – ${end.getDate()} ${M_ABBR[end.getMonth()]} ${end.getFullYear()}`;
}
