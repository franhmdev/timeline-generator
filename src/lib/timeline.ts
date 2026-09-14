import type {
  MonthGroup,
  WeekColumn,
  YearGroup,
  ProjectInfo,
  Phase,
} from "../types";

export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Devuelve la fecha del lunes (o día de inicio configurado) de la semana de la fecha dada. */
export function startOfWeek(date: Date, weekStartDay = 1): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - weekStartDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Suma semanas a una fecha. */
export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/** Compara si dos fechas están en la misma semana natural. */
export function isSameWeek(a: Date, b: Date, weekStartDay = 1): boolean {
  const sa = startOfWeek(a, weekStartDay);
  const sb = startOfWeek(b, weekStartDay);
  return sa.getTime() === sb.getTime();
}

/** Formatea una fecha como YYYY-MM-DD. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Formatea una fecha legible en español. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Devuelve la semana relativa a hoy: 0 si es hoy, negativo si pasada, positivo futura. */
export function weeksFromToday(date: Date, weekStartDay = 1): number {
  const today = new Date();
  const a = startOfWeek(today, weekStartDay).getTime();
  const b = startOfWeek(date, weekStartDay).getTime();
  return Math.round((b - a) / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Genera la lista de columnas de semana a partir de la info del proyecto.
 * Las semanas se numeran consecutivamente dentro de cada mes natural:
 * S1, S2, S3, S4... reiniciando en cada mes. La semana del kick-off se
 * resalta con isKickoff pero mantiene la numeración normal del mes.
 *
 * Cada semana se asigna al mes que tiene más días en ella, de modo que
 * una semana a caballo entre dos meses pertenece al mes dominante.
 */
export function buildWeekColumns(project: ProjectInfo): WeekColumn[] {
  const start = new Date(project.startDate + "T00:00:00");
  const kickoff = new Date(project.kickoffDate + "T00:00:00");
  const weekStartDay = project.weekStartDay ?? 1;

  // Semana de inicio del cronograma
  const timelineStart = startOfWeek(start, weekStartDay);

  const columns: WeekColumn[] = [];
  const today = new Date();

  // generamos hasta cubrir totalMonths
  const endLimit = addWeeks(timelineStart, Math.ceil(project.totalMonths * 4.345) + 2);
  let cursor = new Date(timelineStart);
  let idx = 0;

  while (cursor <= endLimit) {
    const dominant = dominantMonthOf(cursor, weekStartDay);
    const weekInMonth = weekNumberOfMonth(cursor, dominant, weekStartDay);
    columns.push({
      index: idx,
      label: `S${weekInMonth}`,
      isKickoff: isSameWeek(cursor, kickoff, weekStartDay),
      isToday: isSameWeek(cursor, today, weekStartDay),
      year: dominant.year,
      month: dominant.month,
      monthName: MONTH_NAMES[dominant.month - 1],
      startDate: new Date(cursor),
    });
    idx++;
    cursor = addWeeks(cursor, 1);
  }

  return columns;
}

/**
 * Determina el mes dominante de una semana: el mes que tiene más días
 * dentro de los 7 días que empiezan en `weekStart`.
 * En caso de empate (3-4 o 4-3) gana el mes con más días.
 */
function dominantMonthOf(
  weekStart: Date,
  weekStartDay: number
): { year: number; month: number } {
  const counts: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  let bestKey = "";
  let bestCount = -1;
  for (const [key, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }
  const [year, month] = bestKey.split("-").map(Number);
  return { year, month };
}

/**
 * Calcula el número de semana dentro de su mes dominante.
 * Busca la primera semana que pertenece al mes dominante (empezando
 * desde el 1 del mes) y cuenta cuántas semanas hay hasta `weekStart`.
 */
function weekNumberOfMonth(
  weekStart: Date,
  dominant: { year: number; month: number },
  weekStartDay: number
): number {
  // Primer día del mes dominante
  const monthStart = new Date(dominant.year, dominant.month - 1, 1);
  // Inicio de la semana del día 1
  let firstWeekStart = startOfWeek(monthStart, weekStartDay);

  // Si la semana del día 1 pertenece a otro mes (el mes anterior domina),
  // la primera semana de nuestro mes es la siguiente
  const firstWeekDominant = dominantMonthOf(firstWeekStart, weekStartDay);
  if (
    firstWeekDominant.month !== dominant.month ||
    firstWeekDominant.year !== dominant.year
  ) {
    firstWeekStart = addWeeks(firstWeekStart, 1);
  }

  const weekDiff = Math.round(
    (weekStart.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return weekDiff + 1;
}

/** Agrupa las semanas por mes y por año. */
export function groupByMonthYear(weeks: WeekColumn[]): YearGroup[] {
  const map = new Map<number, Map<number, MonthGroup>>();
  for (const w of weeks) {
    if (!map.has(w.year)) map.set(w.year, new Map());
    const ymap = map.get(w.year)!;
    if (!ymap.has(w.month)) {
      ymap.set(w.month, {
        year: w.year,
        month: w.month,
        monthName: w.monthName,
        weeks: [],
      });
    }
    ymap.get(w.month)!.weeks.push(w);
  }

  const years: YearGroup[] = [];
  for (const [year, ymap] of [...map.entries()].sort((a, b) => a[0] - b[0])) {
    const months = [...ymap.values()].sort((a, b) => a.month - b.month);
    years.push({ year, months });
  }
  return years;
}

/** Genera un ID único. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

/**
 * Calcula el rango de fechas de una fase basándose en todas las barras
 * de todas sus tareas. Devuelve null si la fase no tiene barras.
 */
export function getPhaseDateRange(
  phase: Phase,
  weeks: WeekColumn[]
): { start: Date; end: Date } | null {
  let minStart: number | null = null;
  let maxEnd: number | null = null;

  for (const task of phase.tasks) {
    for (const bar of task.bars) {
      const startWeek = weeks[bar.startWeek];
      const endWeek = weeks[bar.startWeek + bar.duration - 1];
      if (!startWeek || !endWeek) continue;
      const startMs = startWeek.startDate.getTime();
      // Fin de la última semana = inicio + 7 días
      const endMs = addWeeks(endWeek.startDate, 1).getTime();
      if (minStart === null || startMs < minStart) minStart = startMs;
      if (maxEnd === null || endMs > maxEnd) maxEnd = endMs;
    }
  }

  if (minStart === null || maxEnd === null) return null;
  return { start: new Date(minStart), end: new Date(maxEnd) };
}

/** Formatea un rango de fechas compacto en español. */
export function formatDateRange(start: Date, end: Date): string {
  const s = start.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
  const e = end.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
  return `${s} → ${e}`;
}

/**
 * Calcula el rango de semanas (índices) de una fase basándose en todas las barras
 * de todas sus tareas. Devuelve null si la fase no tiene barras.
 */
export function getPhaseWeekRange(
  phase: Phase
): { startWeek: number; endWeek: number; duration: number } | null {
  let minStart: number | null = null;
  let maxEnd: number | null = null;

  for (const task of phase.tasks) {
    for (const bar of task.bars) {
      const endWeek = bar.startWeek + bar.duration - 1;
      if (minStart === null || bar.startWeek < minStart) minStart = bar.startWeek;
      if (maxEnd === null || endWeek > maxEnd) maxEnd = endWeek;
    }
  }

  if (minStart === null || maxEnd === null) return null;
  return {
    startWeek: minStart,
    endWeek: maxEnd,
    duration: maxEnd - minStart + 1,
  };
}

/** Calcula el número de semanas entre dos fechas. */
export function weeksBetween(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Calcula los segmentos continuos de barras de una fase.
 * Fusiona las barras que se solapan o son contiguas (una termina en la semana N
 * y la siguiente empieza en la semana N+1). Devuelve una lista de segmentos
 * {startWeek, endWeek, duration} ordenados por startWeek.
 */
export function getPhaseWeekSegments(
  phase: Phase
): { startWeek: number; endWeek: number; duration: number }[] {
  // Recoger todos los rangos [start, end] de las barras
  const ranges: [number, number][] = [];
  for (const task of phase.tasks) {
    for (const bar of task.bars) {
      const endWeek = bar.startWeek + bar.duration - 1;
      ranges.push([bar.startWeek, endWeek]);
    }
  }

  if (ranges.length === 0) return [];

  // Ordenar por inicio
  ranges.sort((a, b) => a[0] - b[0]);

  // Fusionar rangos solapados o contiguos
  const segments: { startWeek: number; endWeek: number; duration: number }[] = [];
  let currentStart = ranges[0][0];
  let currentEnd = ranges[0][1];

  for (let i = 1; i < ranges.length; i++) {
    const [start, end] = ranges[i];
    // Si se solapa o es contiguo (start <= currentEnd + 1)
    if (start <= currentEnd + 1) {
      currentEnd = Math.max(currentEnd, end);
    } else {
      segments.push({
        startWeek: currentStart,
        endWeek: currentEnd,
        duration: currentEnd - currentStart + 1,
      });
      currentStart = start;
      currentEnd = end;
    }
  }
  segments.push({
    startWeek: currentStart,
    endWeek: currentEnd,
    duration: currentEnd - currentStart + 1,
  });

  return segments;
}
