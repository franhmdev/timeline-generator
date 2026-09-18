import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useGanttStore } from "../store/ganttStore";
import { buildWeekColumns } from "../lib/timeline";
import type { WeekColumn } from "../types";
import { LayoutProvider } from "./LayoutProvider";
import { WEEK_WIDTH, NAME_COLUMN_WIDTH } from "./layout";
import { TimelineHeader } from "./TimelineHeader";
import { PhaseSection } from "./PhaseSection";

interface GanttChartProps {
  onWeekClickRef?: React.MutableRefObject<
    ((weekIndex: number, clientX: number, clientY: number) => void) | null
  >;
}

export const GanttChart = forwardRef<HTMLDivElement, GanttChartProps>(
  (_props, ref) => {
    const project = useGanttStore((s) => s.project);
    const phases = useGanttStore((s) => s.phases);

    const weeks = useMemo<WeekColumn[]>(
      () => buildWeekColumns(project),
      [project]
    );

    // estado de UI: semana resaltada al hover
    const [highlightWeek, setHighlightWeek] = useState<number | null>(null);
    // modal para añadir hito al hacer clic en una semana
    const [milestoneDialog, setMilestoneDialog] = useState<{
      weekIndex: number;
      x: number;
      y: number;
    } | null>(null);
    // estado de creación de dependencias
    const [linkingFrom, setLinkingFrom] = useState<{
      taskId: string;
      msId: string;
    } | null>(null);
    // vista: "full" = completa, "phases" = solo fases
    const [viewMode, setViewMode] = useState<"full" | "phases">("full");

    const scrollRef = useRef<HTMLDivElement>(null);

    const handleWeekClick = useCallback(
      (weekIndex: number, e: React.MouseEvent) => {
        setMilestoneDialog({
          weekIndex,
          x: e.clientX,
          y: e.clientY,
        });
      },
      []
    );

    return (
      <LayoutProvider>
        <div
          ref={ref}
          className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl"
        >
          {/* Toggle de vista */}
          <div className="gantt-action flex items-center gap-1 px-3 py-2 border-b border-slate-700/60 bg-slate-900">
            <button
              onClick={() => setViewMode("full")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                viewMode === "full"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Vista completa
            </button>
            <button
              onClick={() => setViewMode("phases")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                viewMode === "phases"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Vista por fases
            </button>
          </div>

          {/* Contenedor scroll horizontal */}
          <div
            ref={scrollRef}
            className="overflow-x-auto overflow-y-visible px-2"
            onMouseMove={(e) => {
              // resaltar semana bajo el cursor
              const rect =
                e.currentTarget.getBoundingClientRect();
              const x =
                e.clientX -
                rect.left +
                scrollRef.current!.scrollLeft -
                NAME_COLUMN_WIDTH;
              if (x < 0) {
                setHighlightWeek(null);
                return;
              }
              const idx = Math.floor(x / WEEK_WIDTH);
              setHighlightWeek(
                idx >= 0 && idx < weeks.length ? idx : null
              );
            }}
            onMouseLeave={() => setHighlightWeek(null)}
          >
            {/* Línea vertical resaltando la semana en hover */}
            <TimelineHeader
              weeks={weeks}
              onWeekClick={viewMode === "full" ? handleWeekClick : undefined}
              highlightWeek={highlightWeek}
            />

            <div className="relative">
              {/* Resaltado de columna bajo el cursor */}
              {highlightWeek !== null && (
                <div
                  className="absolute top-0 bottom-0 bg-blue-500/5 border-l border-r border-blue-400/20 pointer-events-none"
                  style={{
                    left: highlightWeek * WEEK_WIDTH + NAME_COLUMN_WIDTH,
                    width: WEEK_WIDTH,
                  }}
                />
              )}

              {phases.map((phase, phaseIndex) => (
                <PhaseSection
                  key={phase.id}
                  phase={phase}
                  weeks={weeks}
                  compact={viewMode === "phases"}
                  onMoveUp={() =>
                    useGanttStore.getState().movePhase(phaseIndex, phaseIndex - 1)
                  }
                  onMoveDown={() =>
                    useGanttStore.getState().movePhase(phaseIndex, phaseIndex + 1)
                  }
                  onRename={(name) =>
                    useGanttStore.getState().renamePhase(phase.id, name)
                  }
                  onRemove={() =>
                    useGanttStore.getState().removePhase(phase.id)
                  }
                  onAddTask={() =>
                    useGanttStore.getState().addTask(phase.id)
                  }
                  onAddBar={(taskId, type, startWeek, duration) =>
                    useGanttStore.getState().addBar(phase.id, taskId, type, startWeek, duration)
                  }
                  onRemoveBar={(taskId, barId) =>
                    useGanttStore
                      .getState()
                      .removeBar(phase.id, taskId, barId)
                  }
                  onUpdateBar={(taskId, barId, patch) =>
                    useGanttStore
                      .getState()
                      .updateBar(phase.id, taskId, barId, patch)
                  }
                  onAddMilestone={(taskId, week, label) =>
                    useGanttStore
                      .getState()
                      .addMilestone(phase.id, taskId, week, label)
                  }
                  onAddDependency={(taskId, week, label) =>
                    useGanttStore
                      .getState()
                      .addMilestone(phase.id, taskId, week, label || "Nueva dependencia", "dependency")
                  }
                  onUpdateMilestone={(taskId, msId, patch) => {
                    if ("week" in patch)
                      useGanttStore
                        .getState()
                        .moveMilestone(phase.id, taskId, msId, patch.week!);
                    if ("label" in patch)
                      useGanttStore
                        .getState()
                        .renameMilestone(
                          phase.id,
                          taskId,
                          msId,
                          patch.label!
                        );
                  }}
                  onRemoveMilestone={(taskId, msId) =>
                    useGanttStore
                      .getState()
                      .removeMilestone(phase.id, taskId, msId)
                  }
                  onRenameMilestone={(taskId, msId, label) =>
                    useGanttStore
                      .getState()
                      .renameMilestone(phase.id, taskId, msId, label)
                  }
                  onRenameTask={(taskId, name) =>
                    useGanttStore
                      .getState()
                      .renameTask(phase.id, taskId, name)
                  }
                  onRemoveTask={(taskId) =>
                    useGanttStore.getState().removeTask(phase.id, taskId)
                  }
                  onMoveTask={(fromIndex, toIndex) =>
                    useGanttStore.getState().moveTask(phase.id, fromIndex, toIndex)
                  }
                  onLinkFromMilestone={(taskId, msId) => {
                    if (linkingFrom && linkingFrom.taskId === taskId && linkingFrom.msId === msId) {
                      setLinkingFrom(null);
                      return;
                    }
                    setLinkingFrom({ taskId, msId });
                  }}
                  linkingFromMsId={linkingFrom}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Modal añadir hito */}
        {milestoneDialog && (
          <AddMilestoneDialog
            weekIndex={milestoneDialog.weekIndex}
            weeks={weeks}
            position={{ x: milestoneDialog.x, y: milestoneDialog.y }}
            phases={phases}
            onClose={() => setMilestoneDialog(null)}
            onCreate={(phaseId, taskId, label) => {
              useGanttStore
                .getState()
                .addMilestone(phaseId, taskId, milestoneDialog.weekIndex, label);
              setMilestoneDialog(null);
            }}
          />
        )}

        {/* Banner de creación de dependencia */}
        {linkingFrom && (
          <DependencyBanner
            onCancel={() => setLinkingFrom(null)}
            onSelectMilestoneTarget={(targetMsId) => {
              useGanttStore
                .getState()
                .addDependency(linkingFrom.msId, "milestone", targetMsId);
              setLinkingFrom(null);
            }}
            onSelectExternalTarget={(label, week, provider) => {
              const extId = useGanttStore
                .getState()
                .addExternalTask(label, week, provider);
              useGanttStore
                .getState()
                .addDependency(linkingFrom.msId, "external", extId);
              setLinkingFrom(null);
            }}
            onSelectExistingExternal={(extId) => {
              useGanttStore
                .getState()
                .addDependency(linkingFrom.msId, "external", extId);
              setLinkingFrom(null);
            }}
            excludedMsId={linkingFrom.msId}
          />
        )}
      </LayoutProvider>
    );
  }
);
GanttChart.displayName = "GanttChart";

/** Modal para añadir un hito al hacer clic en una semana. */
const AddMilestoneDialog: React.FC<{
  weekIndex: number;
  weeks: WeekColumn[];
  position: { x: number; y: number };
  phases: ReturnType<typeof useGanttStore.getState>["phases"];
  onClose: () => void;
  onCreate: (phaseId: string, taskId: string, label: string) => void;
}> = ({ weekIndex, weeks, position, phases, onClose, onCreate }) => {
  const [label, setLabel] = useState("Nuevo hito");
  const [phaseId, setPhaseId] = useState(phases[0]?.id ?? "");
  const tasks = phases.find((p) => p.id === phaseId)?.tasks ?? [];
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "");
  const week = weeks[weekIndex];

  useEffect(() => {
    const t = phases.find((p) => p.id === phaseId)?.tasks ?? [];
    setTaskId(t[0]?.id ?? "");
  }, [phaseId, phases]);

  // cerrar al hacer clic fuera
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        onClose();
    };
    setTimeout(() =>
      document.addEventListener("mousedown", handler)
    );
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-3 w-72"
      style={{
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.min(position.y, window.innerHeight - 220),
      }}
    >
      <div className="text-xs text-slate-400 mb-2">
        Añadir hito en{" "}
        <span className="text-yellow-300 font-semibold">
          {week?.label} · {week?.startDate.toLocaleDateString("es-ES")}
        </span>
      </div>
      <label className="block text-xs text-slate-400 mb-1">Etiqueta</label>
      <input
        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white mb-2"
        value={label}
        autoFocus
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && phaseId && taskId) {
            onCreate(phaseId, taskId, label.trim() || "Hito");
          }
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Fase</label>
          <select
            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
            value={phaseId}
            onChange={(e) => setPhaseId(e.target.value)}
          >
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Tarea</label>
          <select
            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            disabled={tasks.length === 0}
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
        >
          Cancelar
        </button>
        <button
          onClick={() => phaseId && taskId && onCreate(phaseId, taskId, label.trim() || "Hito")}
          disabled={!phaseId || !taskId}
          className="px-3 py-1 text-xs rounded bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50"
        >
          Crear hito
        </button>
      </div>
    </div>
  );
};

/** Banner que indica modo de creación de dependencia. */
const DependencyBanner: React.FC<{
  onCancel: () => void;
  onSelectMilestoneTarget: (msId: string) => void;
  onSelectExternalTarget: (label: string, week: number, provider?: string) => void;
  onSelectExistingExternal: (extId: string) => void;
  excludedMsId: string;
}> = ({
  onCancel,
  onSelectMilestoneTarget,
  onSelectExternalTarget,
  onSelectExistingExternal,
  excludedMsId,
}) => {
  const phases = useGanttStore((s) => s.phases);
  const externalTasks = useGanttStore((s) => s.externalTasks);
  const weeks = buildWeekColumns(useGanttStore.getState().project);
  const [mode, setMode] = useState<"milestone" | "external-existing" | "external-new">(
    "milestone"
  );
  const [extLabel, setExtLabel] = useState("Entrega de diseños");
  const [extProvider, setExtProvider] = useState("");
  const [extWeek, setExtWeek] = useState(0);

  const allMilestones = phases.flatMap((p) =>
    p.tasks.flatMap((t) =>
      t.milestones.map((m) => ({
        ...m,
        phaseName: p.name,
        taskName: t.name,
        taskId: t.id,
      }))
    )
  );

  const availableMilestones = allMilestones.filter(
    (m) => m.id !== excludedMsId
  );

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-cyan-900 border border-cyan-500 rounded-lg shadow-2xl px-4 py-3 w-[28rem]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-cyan-100">
          🔗 Crear dependencia
        </span>
        <button
          onClick={onCancel}
          className="text-cyan-300 hover:text-white text-xs"
        >
          ✕ Cancelar
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setMode("milestone")}
          className={`px-2 py-1 text-[11px] rounded transition-colors ${
            mode === "milestone"
              ? "bg-cyan-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Hito existente
        </button>
        <button
          onClick={() => setMode("external-existing")}
          className={`px-2 py-1 text-[11px] rounded transition-colors ${
            mode === "external-existing"
              ? "bg-cyan-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Tarea externa existente
        </button>
        <button
          onClick={() => setMode("external-new")}
          className={`px-2 py-1 text-[11px] rounded transition-colors ${
            mode === "external-new"
              ? "bg-cyan-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          + Nueva tarea externa
        </button>
      </div>

      {/* Hito interno existente */}
      {mode === "milestone" && (
        <div>
          {availableMilestones.length === 0 ? (
            <p className="text-xs text-cyan-200/70">
              No hay otros hitos disponibles. Crea más hitos o usa una tarea externa.
            </p>
          ) : (
            <select
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white mb-2"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) onSelectMilestoneTarget(e.target.value);
              }}
            >
              <option value="" disabled>
                -- Elige hito destino --
              </option>
              {availableMilestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.phaseName} / {m.taskName})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Tarea externa existente */}
      {mode === "external-existing" && (
        <div>
          {externalTasks.length === 0 ? (
            <p className="text-xs text-cyan-200/70">
              No hay tareas externas creadas. Usa la pestaña "Nueva tarea externa".
            </p>
          ) : (
            <select
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white mb-2"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) onSelectExistingExternal(e.target.value);
              }}
            >
              <option value="" disabled>
                -- Elige tarea externa --
              </option>
              {externalTasks.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                  {e.provider ? ` · ${e.provider}` : ""}
                  {" · "}
                  {weeks[e.week]?.label ?? "S?"}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Nueva tarea externa */}
      {mode === "external-new" && (
        <div className="space-y-2">
          <div>
            <label className="block text-[11px] text-cyan-200/70 mb-0.5">
              Descripción
            </label>
            <input
              className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
              value={extLabel}
              autoFocus
              onChange={(e) => setExtLabel(e.target.value)}
              placeholder="Ej: Entrega de diseños"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-cyan-200/70 mb-0.5">
                Proveedor (opcional)
              </label>
              <input
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                value={extProvider}
                onChange={(e) => setExtProvider(e.target.value)}
                placeholder="Ej: Estudio Creativo S.L."
              />
            </div>
            <div>
              <label className="block text-[11px] text-cyan-200/70 mb-0.5">
                Semana
              </label>
              <select
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                value={extWeek}
                onChange={(e) => setExtWeek(Number(e.target.value))}
              >
                {weeks.map((w) => (
                  <option key={w.index} value={w.index}>
                    {w.label} · {w.startDate.toLocaleDateString("es-ES")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() =>
              onSelectExternalTarget(
                extLabel.trim() || "Tarea externa",
                extWeek,
                extProvider.trim() || undefined
              )
            }
            className="w-full mt-1 px-3 py-1.5 text-xs rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
          >
            Crear y enlazar
          </button>
        </div>
      )}
    </div>
  );
};
