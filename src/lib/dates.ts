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
export const WK_ABBR = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const DAY_NAMES_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

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

/** "20 – 26 jul 2026" para el rango de la semana visible. */
export function weekRangeLabel(mondayMs: number): string {
  const start = new Date(mondayMs);
  const end = new Date(mondayMs + 6 * DAY);
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = sameMonth ? String(start.getDate()) : fmtDayMonth(start);
  return `${startStr} – ${end.getDate()} ${M_ABBR[end.getMonth()]} ${end.getFullYear()}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO → valores de los campos de fecha y hora, en hora local. */
export function toInputs(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/** Fecha y hora locales → ISO, sumando días de calendario (no se corre con el cambio de hora). */
export function fromInputs(date: string, time: string, addDays = 0): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const h = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m || !h) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + addDays, Number(h[1]), Number(h[2])).toISOString();
}

/** "mié 5 nov, 18:30" */
export function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const dia = WK_ABBR[(d.getDay() + 6) % 7].toLowerCase();
  return `${dia} ${d.getDate()} ${M_ABBR[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
