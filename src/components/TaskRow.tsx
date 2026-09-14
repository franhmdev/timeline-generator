import React, { useState, useEffect, useRef } from "react";
import type { Task, WeekColumn, BarType } from "../types";
import { useLayout } from "./layout";
import { TaskBar } from "./TaskBar";
import { MilestoneMarker } from "./MilestoneMarker";
import { PlusIcon, TrashIcon, EditIcon, GripIcon } from "./Icons";

interface TaskRowProps {
  task: Task;
  weeks: WeekColumn[];
  onRename: (name: string) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAddBar: (
    type?: BarType,
    startWeek?: number,
    duration?: number
  ) => void;
  onUpdateBar: (barId: string, patch: Partial<Task["bars"][number]>) => void;
  onRemoveBar: (barId: string) => void;
  onAddMilestone: (week: number, label?: string) => void;
  onAddDependency: (week: number, label?: string) => void;
  onUpdateMilestone: (
    msId: string,
    patch: Partial<Task["milestones"][number]>
  ) => void;
  onRemoveMilestone: (msId: string) => void;
  onRenameMilestone: (msId: string, label: string) => void;
  onLinkFromMilestone: (msId: string) => void;
  linkingFromMsId: string | null;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  weeks,
  onRename,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddBar,
  onUpdateBar,
  onRemoveBar,
  onAddMilestone,
  onAddDependency,
  onUpdateMilestone,
  onRemoveMilestone,
  onRenameMilestone,
  onLinkFromMilestone,
  linkingFromMsId,
}) => {
  const { weekWidth, rowHeight, nameColumnWidth } = useLayout();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.name);
  const [showBarMenu, setShowBarMenu] = useState(false);
  const [barMenuPos, setBarMenuPos] = useState({ top: 0, left: 0 });
  const [contextMenu, setContextMenu] = useState<{
    week: number;
    top: number;
    left: number;
  } | null>(null);
  // Drag vertical (reordenar)
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const movedRef = useRef(false);
  const totalWidth = weeks.length * weekWidth;

  const openBarMenu = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setBarMenuPos({
      top: rect.bottom + 4,
      left: rect.right - 112, // 112 = w-28 (7rem) aprox
    });
    setShowBarMenu((v) => !v);
  };

  // Cerrar el menú al hacer scroll o resize
  useEffect(() => {
    if (!showBarMenu && !contextMenu) return;
    const close = () => {
      setShowBarMenu(false);
      setContextMenu(null);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [showBarMenu, contextMenu]);

  // Handler del click derecho en el área de barras
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const weekIdx = Math.max(0, Math.min(weeks.length - 1, Math.floor(x / weekWidth)));
    setContextMenu({
      week: weekIdx,
      top: e.clientY,
      left: e.clientX,
    });
  };

  // --- Drag vertical para reordenar tareas ---
  const onVerticalPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragStartY.current = e.clientY;
    movedRef.current = false;
    setIsDragging(true);
    setDragY(0);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - dragStartY.current;
      if (Math.abs(dy) > 4) movedRef.current = true;
      setDragY(dy);

      // Mover mientras arrastras: cada rowHeight cruced es un cambio de posición
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
      className={`flex border-b border-slate-800/60 hover:bg-slate-800/20 group ${
        showBarMenu ? "relative z-50" : "relative"
      } ${isDragging ? "opacity-80 ring-2 ring-cyan-400 z-50" : ""}`}
      style={{ height: rowHeight, transform: isDragging ? `translateY(${dragY}px)` : undefined }}
    >
      {/* Columna nombre */}
      <div
        className="sticky left-0 z-20 flex items-center gap-1 px-2 bg-slate-900 border-r border-slate-700/60"
        style={{ width: nameColumnWidth, minWidth: nameColumnWidth }}
      >
        {/* Handle de arrastre vertical */}
        <div
          onPointerDown={onVerticalPointerDown}
          className="gantt-action shrink-0 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 touch-none"
          title="Arrastrar para reordenar"
        >
          <GripIcon size={14} />
        </div>
        {editing ? (
          <input
            className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-sm text-white"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              onRename(draft.trim() || "Tarea");
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onRename(draft.trim() || "Tarea");
                setEditing(false);
              }
              if (e.key === "Escape") {
                setDraft(task.name);
                setEditing(false);
              }
            }}
          />
        ) : (
          <div
            className="flex-1 flex items-center gap-1.5 cursor-text group/name"
            onDoubleClick={() => {
              setDraft(task.name);
              setEditing(true);
            }}
            title={`${task.name} (doble clic para editar)`}
          >
            <span className="text-sm text-slate-200 truncate flex-1">
              {task.name}
            </span>
            <EditIcon
              size={12}
              className="text-slate-500 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0"
            />
          </div>
        )}

        {/* Menú añadir línea */}
        <div className="relative gantt-action">
          <button
            onClick={openBarMenu}
            className="w-5 h-5 rounded bg-slate-700 hover:bg-blue-600 text-slate-200 flex items-center justify-center"
            title="Añadir línea"
          >
            <PlusIcon size={12} />
          </button>
          {showBarMenu && (
            <>
              {/* Overlay para cerrar al hacer clic fuera */}
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setShowBarMenu(false)}
              />
              <div
                className="fixed z-[9999] bg-slate-800 border border-slate-600 rounded shadow-lg py-1 w-28"
                style={{
                  top: barMenuPos.top,
                  left: barMenuPos.left,
                }}
              >
                <button
                  onClick={() => {
                    onAddBar("task");
                    setShowBarMenu(false);
                  }}
                  className="block w-full text-left px-3 py-1 text-xs text-slate-200 hover:bg-slate-700"
                >
                  + Tarea
                </button>
                <button
                  onClick={() => {
                    onAddMilestone(0);
                    setShowBarMenu(false);
                  }}
                  className="block w-full text-left px-3 py-1 text-xs text-orange-300 hover:bg-slate-700"
                >
                  + Hito
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onRemove}
          className="gantt-action w-5 h-5 rounded bg-rose-800/60 hover:bg-rose-600 text-rose-100 flex items-center justify-center opacity-0 group-hover:opacity-100"
          title="Eliminar tarea"
        >
          <TrashIcon size={11} />
        </button>
      </div>

      {/* Área de barras */}
      <div
        className="relative"
        style={{ width: totalWidth, minWidth: totalWidth }}
        onContextMenu={handleContextMenu}
      >
        {/* Línea de fondo de hoy */}
        {weeks.map((w) =>
          w.isToday ? (
            <div
              key={`today-${w.index}`}
              className="absolute top-0 bottom-0 bg-yellow-400/10 border-l border-r border-yellow-400/30"
              style={{
                left: w.index * weekWidth,
                width: weekWidth,
              }}
            />
          ) : null
        )}

        {/* Barras de tarea */}
        {task.bars.map((bar) => (
          <TaskBar
            key={bar.id}
            bar={bar}
            weeks={weeks}
            totalWeeks={weeks.length}
            onUpdate={(patch) => onUpdateBar(bar.id, patch)}
            onDelete={() => onRemoveBar(bar.id)}
            onAddMilestoneAtEnd={() =>
              onAddMilestone(bar.startWeek + bar.duration)
            }
            onAddDependencyAtEnd={() =>
              onAddDependency(bar.startWeek + bar.duration, "Nueva dependencia")
            }
          />
        ))}

        {/* Hitos */}
        {task.milestones.map((ms) => (
          <MilestoneMarker
            key={ms.id}
            milestone={ms}
            weeks={weeks}
            totalWeeks={weeks.length}
            onUpdate={(patch) => onUpdateMilestone(ms.id, patch)}
            onDelete={() => onRemoveMilestone(ms.id)}
            onRename={(label) => onRenameMilestone(ms.id, label)}
            onLinkStart={() => onLinkFromMilestone(ms.id)}
            isLinkSource={linkingFromMsId === ms.id}
          />
        ))}
      </div>

      {/* Menú contextual (click derecho) */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            className="fixed z-[9999] bg-slate-800 border border-slate-600 rounded shadow-lg py-1 w-44"
            style={{
              top: Math.min(contextMenu.top, window.innerHeight - 120),
              left: Math.min(contextMenu.left, window.innerWidth - 180),
            }}
          >
            <div className="px-3 py-1 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-700 mb-1">
              {weeks[contextMenu.week]?.label} ·{" "}
              {weeks[contextMenu.week]?.startDate.toLocaleDateString("es-ES")}
            </div>
            <button
              onClick={() => {
                onAddBar("task", contextMenu.week, 4);
                setContextMenu(null);
              }}
              className="block w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
            >
              + Tarea (4 sem)
            </button>
            <button
              onClick={() => {
                onAddMilestone(contextMenu.week);
                setContextMenu(null);
              }}
              className="block w-full text-left px-3 py-1.5 text-xs text-orange-300 hover:bg-slate-700"
            >
              + Hito
            </button>
          </div>
        </>
      )}
    </div>
  );
};
