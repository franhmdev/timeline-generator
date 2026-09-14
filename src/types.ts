export type BarType = "task" | "phase";

/** Un segmento temporal de una tarea (una tarea puede tener varios). */
export interface Bar {
  id: string;
  /** Índice de semana de inicio (0-based) dentro del timeline global. */
  startWeek: number;
  /** Duración en semanas. */
  duration: number;
  /** Tipo visual de la barra. */
  type: BarType;
}

/** Hito: punto único en una semana. */
export interface Milestone {
  id: string;
  /** Índice de semana. */
  week: number;
  label: string;
}

/** Dependencia entre dos hitos. */
export interface Dependency {
  id: string;
  fromMilestoneId: string;
  toMilestoneId: string;
}

/** Tarea / subítem dentro de una fase. */
export interface Task {
  id: string;
  name: string;
  bars: Bar[];
  milestones: Milestone[];
}

/** Fase principal del proyecto (cabecera oscura). */
export interface Phase {
  id: string;
  name: string;
  tasks: Task[];
}

/** Configuración del proyecto. */
export interface ProjectInfo {
  name: string;
  description: string;
  /** Fecha de inicio del cronograma en ISO (yyyy-mm-dd). */
  startDate: string;
  /** Fecha de Kick-off en ISO (yyyy-mm-dd). */
  kickoffDate: string;
  /** Duración total del proyecto en meses. */
  totalMonths: number;
  /** Día de la semana que se considera inicio de semana (0=domingo … 6=sábado). */
  weekStartDay: number;
}

/** Estado completo del cronograma. */
export interface ScheduleState {
  project: ProjectInfo;
  phases: Phase[];
  dependencies: Dependency[];
}

/** Representación de una columna de semana en el timeline. */
export interface WeekColumn {
  /** Índice global 0-based. */
  index: number;
  /** Etiqueta corta: S0, S1, S2 … */
  label: string;
  /** Si es la semana de Kick-off (S0). */
  isKickoff: boolean;
  /** Si es la semana actual (hoy). */
  isToday: boolean;
  /** Año (ej. 2026). */
  year: number;
  /** Mes 1-12. */
  month: number;
  /** Nombre del mes. */
  monthName: string;
  /** Fecha de inicio de la semana. */
  startDate: Date;
}

/** Representación de un mes agrupado. */
export interface MonthGroup {
  year: number;
  month: number;
  monthName: string;
  weeks: WeekColumn[];
}

/** Representación de un año agrupado. */
export interface YearGroup {
  year: number;
  months: MonthGroup[];
}
