import React, { useState, useMemo, useRef } from "react";
import type { Phase, WeekColumn, BarType, Task } from "../types";
import { useLayout } from "./layout";
import { TaskRow } from "./TaskRow";
import { PlusIcon, TrashIcon, EditIcon, GripIcon } from "./Icons";
import { getPhaseWeekSegments } from "../lib/timeline";

interface PhaseSectionProps {
  phase: Phase;
  weeks: WeekColumn[];
  onRename: (name: string) => void;
  onRemove: () => void;
  onAddTask: () => void;
  onAddBar: (
    taskId: string,
    type?: BarType,
    startWeek?: number,
    duration?: number
  ) => void;
  onRemoveBar: (taskId: string, barId: string) => void;
  onUpdateBar: (
    taskId: string,
    barId: string,
    patch: Partial<Task["bars"][number]>
  ) => void;
  onAddMilestone: (taskId: string, week: number, label?: string) => void;
  onAddDependency: (taskId: string, week: number, label?: string) => void;
  onUpdateMilestone: (
    taskId: string,
    msId: string,
    patch: Partial<Task["milestones"][number]>
  ) => void;
  onRemoveMilestone: (taskId: string, msId: string) => void;
  onRenameMilestone: (taskId: string, msId: string, label: string) => void;
  onRenameTask: (taskId: string, name: string) => void;
  onRemoveTask: (taskId: string) => void;
  onMoveTask: (fromIndex: number, toIndex: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onLinkFromMilestone: (taskId: string, msId: string) => void;
  linkingFromMsId: { taskId: string; msId: string } | null;
  compact?: boolean;
}

export const PhaseSection: React.FC<PhaseSectionProps> = ({
  phase,
  weeks,
  onRename,
  onRemove,
  onAddTask,
  onAddBar,
  onRemoveBar,
  onUpdateBar,
  onAddMilestone,
  onAddDependency,
  onUpdateMilestone,
  onRemoveMilestone,
  onRenameMilestone,
  onRenameTask,
  onRemoveTask,
  onMoveTask,
  onMoveUp,
  onMoveDown,
  onLinkFromMilestone,
  linkingFromMsId,
  compact = false,
}) => {
  const { weekWidth, nameColumnWidth, rowHeight } = useLayout();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(phase.name);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const totalWidth = weeks.length * weekWidth;

  const weekSegments = useMemo(() => getPhaseWeekSegments(phase), [phase]);

  // --- Drag vertical para reordenar fases ---
  const onVerticalPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragStartY.current = e.clientY;
    setIsDragging(true);
    setDragY(0);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - dragStartY.current;
      setDragY(dy);

      if (Math.abs(dy) > rowHeight / 2) {
        const steps = Math.round(dy / rowHeight);
        if (steps > 0) {
          onMoveDown?.();
          dragStartY.current += rowHeight * steps;
          setDragY(ev.clientY - dragStartY.current);
        } else if (steps < 0) {
          onMoveUp?.();
          dragStartY.current -= rowHeight * Math.abs(steps);
          setDragY(ev.clientY - dragStartY.current);
        }
      }
    };

    const onUp = () => {
      setIsDragging(false);
      setDragY(0);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      className={`group/phase border-b border-slate-900 ${isDragging ? "opacity-80 ring-2 ring-cyan-400 z-50 relative" : ""}`}
      style={{ transform: isDragging ? `translateY(${dragY}px)` : undefined }}
    >
      {/* Cabecera de fase */}
      <div className="flex border-b border-slate-700/60">
        <div
          className="sticky left-0 z-20 flex items-center gap-1 px-2 py-2.5 bg-slate-950 border-r border-slate-700/60"
          style={{ width: nameColumnWidth, minWidth: nameColumnWidth }}
        >
          {/* Handle de arrastre vertical */}
          <div
            onPointerDown={onVerticalPointerDown}
            className="gantt-action shrink-0 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 touch-none"
            title="Arrastrar para reordenar fase"
          >
            <GripIcon size={14} />
          </div>
          {editing ? (
            <input
              className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm font-bold text-white"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                onRename(draft.trim() || "Fase");
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onRename(draft.trim() || "Fase");
                  setEditing(false);
                }
                if (e.key === "Escape") {
                  setDraft(phase.name);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <div
              className="flex-1 flex items-center gap-1.5 cursor-text group/name"
              onDoubleClick={() => {
                setDraft(phase.name);
                setEditing(true);
              }}
              title={`${phase.name} (doble clic para editar)`}
            >
              <span className="text-sm font-bold text-white truncate flex-1">
                {phase.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDraft(phase.name);
                  setEditing(true);
                }}
                className="gantt-action w-5 h-5 rounded bg-slate-600 hover:bg-slate-500 text-slate-200 flex items-center justify-center opacity-0 group-hover/phase:opacity-100 transition-opacity shrink-0"
                title="Editar fase"
              >
                <EditIcon size={11} />
              </button>
            </div>
          )}
          {!compact && (
            <button
              onClick={onAddTask}
              className="gantt-action w-5 h-5 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center opacity-0 group-hover/phase:opacity-100 transition-opacity"
              title="Añadir tarea"
            >
              <PlusIcon size={12} />
            </button>
          )}
          {!compact && (
            <button
              onClick={onRemove}
              className="gantt-action w-5 h-5 rounded bg-rose-700 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover/phase:opacity-100 transition-opacity"
              title="Eliminar fase"
            >
              <TrashIcon size={11} />
            </button>
          )}
        </div>
        <div
          className="flex-1 bg-slate-950 relative"
          style={{ width: totalWidth, minWidth: totalWidth, minHeight: 40 }}
        >
          {compact ? (
            <>
              {weekSegments.map((seg, idx) => (
                <div
                  key={idx}
                  className="absolute top-1/2 -translate-y-1/2 h-7 rounded-md bg-gradient-to-r from-cyan-500 to-cyan-400 border border-cyan-300/50 shadow-md flex items-center justify-center"
                  style={{
                    left: seg.startWeek * weekWidth,
                    width: seg.duration * weekWidth,
                  }}
                >
                  <span className="text-[10px] font-semibold text-white/90 px-2 truncate pointer-events-none select-none">
                    {seg.duration} sem
                  </span>
                </div>
              ))}
            </>
          ) : (
            <div className="flex items-center px-3 h-full">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                {phase.tasks.length} tarea{phase.tasks.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filas de tareas (solo en vista completa) */}
      {!compact &&
        (phase.tasks.length === 0 ? (
          <div className="flex border-b border-slate-800/60 text-xs text-slate-500 italic">
            <div
            className="sticky left-0 bg-slate-900/50 px-3 py-3 border-r border-slate-700/60"
            style={{ width: nameColumnWidth, minWidth: nameColumnWidth }}
          >
            Sin tareas
          </div>
          <div
            className="flex-1 px-3 py-3"
            style={{ width: totalWidth, minWidth: totalWidth }}
          >
            <button
              onClick={onAddTask}
              className="gantt-action text-blue-400 hover:text-blue-300 underline"
            >
              + Añadir tarea a esta fase
            </button>
          </div>
        </div>
      ) : (
        phase.tasks.map((task, taskIndex) => (
          <TaskRow
            key={task.id}
            task={task}
            weeks={weeks}
            onRename={(name) => onRenameTask(task.id, name)}
            onRemove={() => onRemoveTask(task.id)}
            onMoveUp={() => onMoveTask(taskIndex, taskIndex - 1)}
            onMoveDown={() => onMoveTask(taskIndex, taskIndex + 1)}
            onAddBar={(type, startWeek, duration) => onAddBar(task.id, type, startWeek, duration)}
            onUpdateBar={(barId, patch) => onUpdateBar(task.id, barId, patch)}
            onRemoveBar={(barId) => onRemoveBar(task.id, barId)}
            onAddMilestone={(week, label) =>
              onAddMilestone(task.id, week, label)
            }
            onAddDependency={(week, label) =>
              onAddDependency(task.id, week, label)
            }
            onUpdateMilestone={(msId, patch) =>
              onUpdateMilestone(task.id, msId, patch)
            }
            onRemoveMilestone={(msId) => onRemoveMilestone(task.id, msId)}
            onRenameMilestone={(msId, label) =>
              onRenameMilestone(task.id, msId, label)
            }
            onLinkFromMilestone={(msId) => onLinkFromMilestone(task.id, msId)}
            linkingFromMsId={
              linkingFromMsId?.taskId === task.id
                ? linkingFromMsId.msId
                : null
            }
          />
        ))
      ))}
    </div>
  );
};
