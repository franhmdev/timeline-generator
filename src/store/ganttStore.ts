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
  totalMonths: 6,
  weekStartDay: 1,
};

function defaultPhases(): Phase[] {
  return [];
}

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
      dependencies: [],
      externalTasks: [],
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
      dependencies: [],
      externalTasks: [],
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
      dependencies: [],
      externalTasks: [],
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
