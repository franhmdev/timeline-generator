import { create } from "zustand";
import type {
  Bar,
  BarType,
  Dependency,
  DependencyTargetType,
  ExternalTask,
  Milestone,
  MilestoneType,
  Phase,
  ProjectInfo,
  ScheduleState,
} from "../types";
import { uid } from "../lib/timeline";

const STORAGE_KEY = "timeline-generator-state-v1";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const defaultProject: ProjectInfo = {
  name: "Proyecto Cronograma",
  description: "Cronograma de proyecto generado dinámicamente.",
  startDate: todayISO(),
  kickoffDate: todayISO(),
  totalMonths: 7,
  weekStartDay: 1,
};

function defaultPhases(): Phase[] {
  return [
    {
      id: "phase-1",
      name: "Inicio y Planificación",
      tasks: [
        {
          id: "task-1",
          name: "Kick-off y definición de alcance",
          bars: [
            { id: "bar-1", startWeek: 0, duration: 2, type: "task" as BarType },
          ],
          milestones: [
            { id: "ms-1", week: 2, label: "Alcance aprobado", type: "hito" as MilestoneType },
          ],
        },
        {
          id: "task-2",
          name: "Planificación detallada",
          bars: [
            { id: "bar-2", startWeek: 2, duration: 3, type: "task" as BarType },
          ],
          milestones: [
            { id: "ms-2", week: 5, label: "Plan de proyecto validado", type: "hito" as MilestoneType },
          ],
        },
      ],
    },
    {
      id: "phase-2",
      name: "Diseño",
      tasks: [
        {
          id: "task-3",
          name: "Diseño UX/UI",
          bars: [
            { id: "bar-3", startWeek: 4, duration: 5, type: "task" as BarType },
          ],
          milestones: [
            { id: "ms-3", week: 9, label: "Prototipo aprobado", type: "hito" as MilestoneType },
            { id: "ms-4", week: 6, label: "Wireframes", type: "dependency" as MilestoneType },
          ],
        },
        {
          id: "task-4",
          name: "Identidad visual",
          bars: [
            { id: "bar-4", startWeek: 5, duration: 4, type: "task" as BarType },
          ],
          milestones: [
            { id: "ms-5", week: 9, label: "Manual de marca", type: "hito" as MilestoneType },
          ],
        },
      ],
    },
    {
      id: "phase-3",
      name: "Desarrollo",
      tasks: [
        {
          id: "task-5",
          name: "Frontend",
          bars: [
            { id: "bar-5", startWeek: 8, duration: 8, type: "task" as BarType },
            { id: "bar-6", startWeek: 17, duration: 3, type: "task" as BarType },
          ],
          milestones: [
            { id: "ms-6", week: 16, label: "Beta frontend", type: "hito" as MilestoneType },
            { id: "ms-7", week: 20, label: "Frontend completo", type: "hito" as MilestoneType },
          ],
        },
        {
          id: "task-6",
          name: "Backend y API",
          bars: [
            { id: "bar-7", startWeek: 7, duration: 10, type: "task" as BarType },
          ],
          milestones: [
            { id: "ms-8", week: 17, label: "API en producción", type: "hito" as MilestoneType },
            { id: "ms-9", week: 10, label: "Integración pagos", type: "dependency" as MilestoneType },
          ],
        },
        {
          id: "task-7",
          name: "Base de datos",
          bars: [
            { id: "bar-8", startWeek: 6, duration: 6, type: "task" as BarType },
          ],
          milestones: [],
        },
      ],
    },
    {
      id: "phase-4",
      name: "Pruebas y QA",
      tasks: [
        {
          id: "task-8",
          name: "Pruebas funcionales",
          bars: [
            { id: "bar-9", startWeek: 16, duration: 5, type: "task" as BarType },
          ],
          milestones: [
            { id: "ms-10", week: 21, label: "UAT completado", type: "hito" as MilestoneType },
          ],
        },
        {
          id: "task-9",
          name: "Pruebas de rendimiento",
          bars: [
            { id: "bar-10", startWeek: 18, duration: 3, type: "task" as BarType },
          ],
          milestones: [
            { id: "ms-11", week: 21, label: "Optimización OK", type: "dependency" as MilestoneType },
          ],
        },
      ],
    },
    {
      id: "phase-5",
      name: "Despliegue y Cierre",
      tasks: [
        {
          id: "task-10",
          name: "Despliegue a producción",
          bars: [
            { id: "bar-11", startWeek: 21, duration: 2, type: "task" as BarType },
          ],
          milestones: [
            { id: "ms-12", week: 23, label: "Go-Live", type: "hito" as MilestoneType },
          ],
        },
        {
          id: "task-11",
          name: "Cierre y handover",
          bars: [
            { id: "bar-12", startWeek: 23, duration: 2, type: "task" as BarType },
          ],
          milestones: [
            { id: "ms-13", week: 25, label: "Proyecto cerrado", type: "hito" as MilestoneType },
          ],
        },
      ],
    },
  ];
}

const defaultDependencies: Dependency[] = [
  { id: "dep-1", fromMilestoneId: "ms-1", toType: "milestone", toMilestoneId: "ms-2" },
  { id: "dep-2", fromMilestoneId: "ms-2", toType: "milestone", toMilestoneId: "ms-3" },
  { id: "dep-3", fromMilestoneId: "ms-3", toType: "milestone", toMilestoneId: "ms-6" },
  { id: "dep-4", fromMilestoneId: "ms-4", toType: "external", toExternalId: "ext-1" },
  { id: "dep-5", fromMilestoneId: "ms-6", toType: "milestone", toMilestoneId: "ms-7" },
  { id: "dep-6", fromMilestoneId: "ms-8", toType: "milestone", toMilestoneId: "ms-10" },
  { id: "dep-7", fromMilestoneId: "ms-10", toType: "milestone", toMilestoneId: "ms-12" },
  { id: "dep-8", fromMilestoneId: "ms-9", toType: "external", toExternalId: "ext-2" },
];

const defaultExternalTasks: ExternalTask[] = [
  { id: "ext-1", label: "Entrega de diseños finales", provider: "Estudio Creativo S.L.", week: 7 },
  { id: "ext-2", label: "Certificación PCI-DSS", provider: "SecurityAudit Corp", week: 12 },
];

interface GanttStore extends ScheduleState {
  // Project
  setProject: (patch: Partial<ProjectInfo>) => void;
  // Phases
  addPhase: () => void;
  removePhase: (phaseId: string) => void;
  renamePhase: (phaseId: string, name: string) => void;
  movePhase: (fromIndex: number, toIndex: number) => void;
  // Tasks
  addTask: (phaseId: string) => void;
  removeTask: (phaseId: string, taskId: string) => void;
  renameTask: (phaseId: string, taskId: string, name: string) => void;
  moveTask: (phaseId: string, fromIndex: number, toIndex: number) => void;
  // Bars
  addBar: (
    phaseId: string,
    taskId: string,
    type?: BarType,
    startWeek?: number,
    duration?: number
  ) => void;
  removeBar: (phaseId: string, taskId: string, barId: string) => void;
  updateBar: (
    phaseId: string,
    taskId: string,
    barId: string,
    patch: Partial<Bar>
  ) => void;
  // Milestones
  addMilestone: (
    phaseId: string,
    taskId: string,
    week: number,
    label?: string,
    type?: MilestoneType
  ) => void;
  removeMilestone: (phaseId: string, taskId: string, msId: string) => void;
  renameMilestone: (
    phaseId: string,
    taskId: string,
    msId: string,
    label: string
  ) => void;
  moveMilestone: (
    phaseId: string,
    taskId: string,
    msId: string,
    week: number
  ) => void;
  // Dependencies
  addDependency: (
    fromMilestoneId: string,
    toType: DependencyTargetType,
    toId: string
  ) => void;
  removeDependency: (depId: string) => void;
  // External tasks
  addExternalTask: (label: string, week: number, provider?: string) => string;
  removeExternalTask: (extId: string) => void;
  renameExternalTask: (extId: string, label: string) => void;
  // Persistence
  saveToStorage: () => void;
  loadFromStorage: () => void;
  resetToDefault: () => void;
  loadState: (state: ScheduleState) => void;
}

/** Carga el estado inicial desde localStorage. Si no hay, usa los defaults. */
function loadInitialState(): ScheduleState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      project: defaultProject,
      phases: defaultPhases(),
      dependencies: defaultDependencies,
      externalTasks: defaultExternalTasks,
    };
  }
  try {
    const parsed = JSON.parse(raw) as ScheduleState;
    // Migración: si el proyecto guardado no tiene startDate, usar kickoffDate
    const project = parsed.project
      ? {
          ...defaultProject,
          ...parsed.project,
          startDate:
            parsed.project.startDate ?? parsed.project.kickoffDate ?? todayISO(),
        }
      : defaultProject;
    // Migración: asegurar que todos los milestones tengan tipo
    const phases = (parsed.phases ?? []).map((p) => ({
      ...p,
      tasks: p.tasks.map((t) => ({
        ...t,
        milestones: t.milestones.map((m) => ({
          ...m,
          type: m.type ?? "hito",
        })),
      })),
    }));
    // Migración: convertir dependencias antiguas (toMilestoneId) al nuevo formato
    const dependencies = (parsed.dependencies ?? []).map((d) => {
      const oldTo = (d as unknown as { toMilestoneId?: string }).toMilestoneId;
      if (oldTo) {
        return {
          id: d.id,
          fromMilestoneId: d.fromMilestoneId,
          toType: "milestone" as DependencyTargetType,
          toMilestoneId: oldTo,
        };
      }
      return d;
    });
    return {
      project,
      phases,
      dependencies,
      externalTasks: parsed.externalTasks ?? [],
    };
  } catch {
    return {
      project: defaultProject,
      phases: defaultPhases(),
      dependencies: defaultDependencies,
      externalTasks: defaultExternalTasks,
    };
  }
}

/** Guarda el estado actual en localStorage. */
function persistState(state: ScheduleState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        project: state.project,
        phases: state.phases,
        dependencies: state.dependencies,
        externalTasks: state.externalTasks,
      })
    );
  } catch {
    // ignore quota errors
  }
}

export const useGanttStore = create<GanttStore>((set, get) => {
  const initial = loadInitialState();

  return {
    project: initial.project,
    phases: initial.phases,
    dependencies: initial.dependencies,
    externalTasks: initial.externalTasks,

  setProject: (patch) =>
    set((state) => ({ project: { ...state.project, ...patch } })),

  addPhase: () =>
    set((state) => ({
      phases: [
        ...state.phases,
        { id: uid("phase"), name: "Nueva fase", tasks: [] },
      ],
    })),

  removePhase: (phaseId) =>
    set((state) => ({
      phases: state.phases.filter((p) => p.id !== phaseId),
    })),

  renamePhase: (phaseId, name) =>
    set((state) => ({
      phases: state.phases.map((p) =>
        p.id === phaseId ? { ...p, name } : p
      ),
    })),

  movePhase: (fromIndex, toIndex) =>
    set((state) => {
      const phases = [...state.phases];
      if (fromIndex < 0 || fromIndex >= phases.length) return {};
      if (toIndex < 0 || toIndex >= phases.length) return {};
      const [moved] = phases.splice(fromIndex, 1);
      phases.splice(toIndex, 0, moved);
      return { phases };
    }),

  addTask: (phaseId) =>
    set((state) => ({
      phases: state.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: [
                ...p.tasks,
                {
                  id: uid("task"),
                  name: "Nueva tarea",
                  bars: [],
                  milestones: [],
                },
              ],
            }
          : p
      ),
    })),

  removeTask: (phaseId, taskId) =>
    set((state) => ({
      phases: state.phases.map((p) =>
        p.id === phaseId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          : p
      ),
    })),

  renameTask: (phaseId, taskId, name) =>
    set((state) => ({
      phases: state.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId ? { ...t, name } : t
              ),
            }
          : p
      ),
    })),

  moveTask: (phaseId, fromIndex, toIndex) =>
    set((state) => ({
      phases: state.phases.map((p) => {
        if (p.id !== phaseId) return p;
        const tasks = [...p.tasks];
        if (fromIndex < 0 || fromIndex >= tasks.length) return p;
        if (toIndex < 0 || toIndex >= tasks.length) return p;
        const [moved] = tasks.splice(fromIndex, 1);
        tasks.splice(toIndex, 0, moved);
        return { ...p, tasks };
      }),
    })),

  addBar: (phaseId, taskId, type = "task", startWeek, duration) =>
    set((state) => ({
      phases: state.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      bars: [
                        ...t.bars,
                        {
                          id: uid("bar"),
                          startWeek: startWeek ?? 0,
                          duration: duration ?? 2,
                          type,
                        } as Bar,
                      ],
                    }
                  : t
              ),
            }
          : p
      ),
    })),

  removeBar: (phaseId, taskId, barId) =>
    set((state) => ({
      phases: state.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, bars: t.bars.filter((b) => b.id !== barId) }
                  : t
              ),
            }
          : p
      ),
    })),

  updateBar: (phaseId, taskId, barId, patch) =>
    set((state) => ({
      phases: state.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      bars: t.bars.map((b) =>
                        b.id === barId ? { ...b, ...patch } : b
                      ),
                    }
                  : t
              ),
            }
          : p
      ),
    })),

  addMilestone: (
    phaseId,
    taskId,
    week,
    label = "Nuevo hito",
    type: MilestoneType = "hito"
  ) =>
    set((state) => ({
      phases: state.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      milestones: [
                        ...t.milestones,
                        {
                          id: uid("ms"),
                          week,
                          label,
                          type,
                        } as Milestone,
                      ],
                    }
                  : t
              ),
            }
          : p
      ),
    })),

  removeMilestone: (phaseId, taskId, msId) =>
    set((state) => ({
      phases: state.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      milestones: t.milestones.filter(
                        (m) => m.id !== msId
                      ),
                    }
                  : t
              ),
            }
          : p
      ),
      dependencies: state.dependencies.filter(
        (d) => d.fromMilestoneId !== msId && d.toMilestoneId !== msId
      ),
    })),

  renameMilestone: (phaseId, taskId, msId, label) =>
    set((state) => ({
      phases: state.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      milestones: t.milestones.map((m) =>
                        m.id === msId ? { ...m, label } : m
                      ),
                    }
                  : t
              ),
            }
          : p
      ),
    })),

  moveMilestone: (phaseId, taskId, msId, week) =>
    set((state) => ({
      phases: state.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      milestones: t.milestones.map((m) =>
                        m.id === msId ? { ...m, week } : m
                      ),
                    }
                  : t
              ),
            }
          : p
      ),
    })),

  addDependency: (fromMilestoneId, toType, toId) =>
    set((state) => {
      // Evitar duplicados
      if (
        state.dependencies.some(
          (d) =>
            d.fromMilestoneId === fromMilestoneId &&
            d.toType === toType &&
            ((toType === "milestone" && d.toMilestoneId === toId) ||
              (toType === "external" && d.toExternalId === toId))
        )
      )
        return state;
      const newDep: Dependency = {
        id: uid("dep"),
        fromMilestoneId,
        toType,
        ...(toType === "milestone"
          ? { toMilestoneId: toId }
          : { toExternalId: toId }),
      };
      return {
        dependencies: [...state.dependencies, newDep],
      };
    }),

  removeDependency: (depId) =>
    set((state) => ({
      dependencies: state.dependencies.filter((d) => d.id !== depId),
    })),

  addExternalTask: (label, week, provider) => {
    const id = uid("ext");
    set((state) => ({
      externalTasks: [
        ...state.externalTasks,
        { id, label, week, provider } as ExternalTask,
      ],
    }));
    return id;
  },

  removeExternalTask: (extId) =>
    set((state) => ({
      externalTasks: state.externalTasks.filter((e) => e.id !== extId),
      dependencies: state.dependencies.filter(
        (d) => !(d.toType === "external" && d.toExternalId === extId)
      ),
    })),

  renameExternalTask: (extId, label) =>
    set((state) => ({
      externalTasks: state.externalTasks.map((e) =>
        e.id === extId ? { ...e, label } : e
      ),
    })),

  saveToStorage: () => {
    const { project, phases, dependencies, externalTasks } = get();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ project, phases, dependencies, externalTasks })
    );
  },

  loadFromStorage: () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ScheduleState;
      set({
        project: parsed.project ?? defaultProject,
        phases: (parsed.phases ?? []).map((p) => ({
          ...p,
          tasks: p.tasks.map((t) => ({
            ...t,
            milestones: t.milestones.map((m) => ({
              ...m,
              type: m.type ?? "hito",
            })),
          })),
        })),
        dependencies: parsed.dependencies ?? [],
        externalTasks: parsed.externalTasks ?? [],
      });
    } catch {
      // ignore
    }
  },

  resetToDefault: () =>
    set({
      project: defaultProject,
      phases: defaultPhases(),
      dependencies: defaultDependencies,
      externalTasks: defaultExternalTasks,
    }),

  loadState: (state) =>
    set({
      project: state.project,
      phases: state.phases,
      dependencies: state.dependencies,
      externalTasks: state.externalTasks ?? [],
    }),
  };
});

// Auto-guardado: cada vez que el estado cambia, se persiste en localStorage
useGanttStore.subscribe((state) => {
  persistState(state);
});

export { STORAGE_KEY };
