import React, { useState, useRef, useCallback } from "react";
import type { Bar, BarType } from "../types";
import { useLayout } from "./layout";
import { useHorizontalDrag } from "../lib/useDrag";
import { formatDate } from "../lib/timeline";
import type { WeekColumn } from "../types";
import { LinkIcon } from "./Icons";

interface TaskBarProps {
  bar: Bar;
  weeks: WeekColumn[];
  totalWeeks: number;
  onUpdate: (patch: Partial<Bar>) => void;
  onDelete: () => void;
  onAddMilestoneAtEnd?: () => void;
}

const BAR_STYLES: Record<
  BarType,
  { bg: string; border: string; label: string }
> = {
  task: {
    bg: "from-cyan-500 to-cyan-400",
    border: "border-cyan-300/50",
    label: "Tarea",
  },
  phase: {
    bg: "from-slate-600 to-slate-500",
    border: "border-slate-400/50",
    label: "Fase",
  },
};

export const TaskBar: React.FC<TaskBarProps> = ({
  bar,
  weeks,
  totalWeeks,
  onUpdate,
  onDelete,
  onAddMilestoneAtEnd,
}) => {
  const { weekWidth, rowHeight } = useLayout();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const [dragMode, setDragMode] = useState<
    "move" | "resize-left" | "resize-right" | null
  >(null);
  // Delta temporal visual en px mientras arrastramos
  const [visualDelta, setVisualDelta] = useState(0);
  // Delta temporal de ancho mientras redimensionamos
  const [visualWidthDelta, setVisualWidthDelta] = useState(0);
  // Menú contextual
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  // Origen (startWeek/duration) al inicio del drag
  const originRef = useRef({ startWeek: 0, duration: 0 });

  const clampWeek = (w: number) =>
    Math.max(0, Math.min(totalWeeks - 1, w));
  const clampDuration = (d: number) => Math.max(1, d);

  const showTooltip = useCallback(
    (clientX: number, clientY: number, startWeek: number, duration: number) => {
      const start = weeks[startWeek];
      const endIdx = Math.min(weeks.length - 1, startWeek + duration - 1);
      const end = weeks[endIdx];
      const text =
        duration <= 1
          ? `${start?.label ?? "S?"} · ${formatDate(start?.startDate ?? new Date())}`
          : `${start?.label ?? "S?"} → ${end?.label ?? "S?"} · ${duration} sem · ${formatDate(
              start?.startDate ?? new Date()
            )}`;
      setTooltip({ x: clientX, y: clientY, text });
    },
    [weeks]
  );

  // --- Move (arrastrar cuerpo) ---
  const moveDrag = useHorizontalDrag({
    onStart: () => {
      originRef.current = {
        startWeek: bar.startWeek,
        duration: bar.duration,
      };
      setDragMode("move");
      setVisualDelta(0);
    },
    onDrag: (dx) => {
      setVisualDelta(dx);
      const deltaWeeks = Math.round(dx / weekWidth);
      const newStart = clampWeek(
        originRef.current.startWeek + deltaWeeks
      );
      showTooltip(
        0,
        0,
        newStart,
        originRef.current.duration
      );
      setTooltip((t) =>
        t ? { ...t, text: `Semana inicial: ${weeks[newStart]?.label ?? "?"}` } : t
      );
    },
    onEnd: (dx) => {
      const deltaWeeks = Math.round(dx / weekWidth);
      const newStart = clampWeek(
        originRef.current.startWeek + deltaWeeks
      );
      onUpdate({ startWeek: newStart });
      setVisualDelta(0);
      setDragMode(null);
      setTooltip(null);
    },
  });

  // --- Resize izquierdo ---
  const resizeLeftDrag = useHorizontalDrag({
    onStart: () => {
      originRef.current = {
        startWeek: bar.startWeek,
        duration: bar.duration,
      };
      setDragMode("resize-left");
      setVisualWidthDelta(0);
    },
    onDrag: (dx) => {
      setVisualWidthDelta(dx);
      const deltaWeeks = Math.round(dx / weekWidth);
      let newStart = originRef.current.startWeek + deltaWeeks;
      let newDuration =
        originRef.current.duration - deltaWeeks;
      // No permitir que la duración sea < 1
      if (newDuration < 1) {
        newDuration = 1;
        newStart = originRef.current.startWeek + originRef.current.duration - 1;
      }
      newStart = clampWeek(newStart);
      showTooltip(0, 0, newStart, newDuration);
      setTooltip((t) =>
        t
          ? { ...t, text: `Inicio: ${weeks[newStart]?.label} · Dur: ${newDuration} sem` }
          : t
      );
    },
    onEnd: (dx) => {
      const deltaWeeks = Math.round(dx / weekWidth);
      let newStart = originRef.current.startWeek + deltaWeeks;
      let newDuration = originRef.current.duration - deltaWeeks;
      if (newDuration < 1) {
        newDuration = 1;
        newStart = originRef.current.startWeek + originRef.current.duration - 1;
      }
      newStart = clampWeek(newStart);
      onUpdate({
        startWeek: newStart,
        duration: clampDuration(newDuration),
      });
      setVisualWidthDelta(0);
      setDragMode(null);
      setTooltip(null);
    },
  });

  // --- Resize derecho ---
  const resizeRightDrag = useHorizontalDrag({
    onStart: () => {
      originRef.current = {
        startWeek: bar.startWeek,
        duration: bar.duration,
      };
      setDragMode("resize-right");
      setVisualWidthDelta(0);
    },
    onDrag: (dx) => {
      setVisualWidthDelta(dx);
      const deltaWeeks = Math.round(dx / weekWidth);
      const newDuration = clampDuration(
        originRef.current.duration + deltaWeeks
      );
      showTooltip(0, 0, originRef.current.startWeek, newDuration);
      setTooltip((t) =>
        t ? { ...t, text: `Duración: ${newDuration} semanas` } : t
      );
    },
    onEnd: (dx) => {
      const deltaWeeks = Math.round(dx / weekWidth);
      const newDuration = clampDuration(
        originRef.current.duration + deltaWeeks
      );
      onUpdate({ duration: newDuration });
      setVisualWidthDelta(0);
      setDragMode(null);
      setTooltip(null);
    },
  });

  // Cálculo de posición visual
  const baseLeft = bar.startWeek * weekWidth;
  const baseWidth = bar.duration * weekWidth;
  let visualLeft = baseLeft;
  let visualWidth = baseWidth;
  if (dragMode === "move") visualLeft = baseLeft + visualDelta;
  if (dragMode === "resize-left") {
    visualLeft = baseLeft + visualWidthDelta;
    visualWidth = baseWidth - visualWidthDelta;
  }
  if (dragMode === "resize-right") {
    visualWidth = baseWidth + visualWidthDelta;
  }
  if (visualWidth < weekWidth) visualWidth = weekWidth;

  const styles = BAR_STYLES[bar.type];

  return (
    <>
      <div
        className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md bg-gradient-to-r ${styles.bg} border ${styles.border} shadow-md flex items-center justify-between group cursor-grab active:cursor-grabbing no-select`}
        style={{
          left: visualLeft,
          width: visualWidth,
          minHeight: rowHeight - 18,
        }}
        onPointerDown={(e) => {
          if (e.button === 2) return;
          moveDrag.onPointerDown(e);
        }}
        onContextMenu={(e) => {
          if (onAddMilestoneAtEnd) {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY });
          }
        }}
        onMouseEnter={(e) =>
          showTooltip(e.clientX, e.clientY, bar.startWeek, bar.duration)
        }
        onMouseMove={(e) => {
          if (!tooltip) return;
          setTooltip({ x: e.clientX, y: e.clientY, text: tooltip.text });
        }}
        onMouseLeave={() => !dragMode && setTooltip(null)}
      >
        {/* Handle izquierdo */}
        <div
          className="absolute -left-0.5 top-0 bottom-0 w-2 cursor-ew-resize bg-white/0 hover:bg-white/30 rounded-l-md flex items-center justify-center"
          onPointerDown={(e) => {
            e.stopPropagation();
            resizeLeftDrag.onPointerDown(e);
          }}
        >
          <div className="w-0.5 h-3 bg-white/40 opacity-0 group-hover:opacity-100" />
        </div>

        {/* Etiqueta centrada */}
        <span className="text-[10px] font-semibold text-white/90 px-2 truncate pointer-events-none select-none absolute left-1/2 -translate-x-1/2">
          {bar.duration} sem
        </span>

        {/* Handle derecho */}
        <div
          className="absolute -right-0.5 top-0 bottom-0 w-2 cursor-ew-resize bg-white/0 hover:bg-white/30 rounded-r-md flex items-center justify-center"
          onPointerDown={(e) => {
            e.stopPropagation();
            resizeRightDrag.onPointerDown(e);
          }}
        >
          <div className="w-0.5 h-3 bg-white/40 opacity-0 group-hover:opacity-100" />
        </div>

        {/* Botón eliminar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="gantt-action absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-rose-500"
          title="Eliminar línea"
        >
          ×
        </button>
      </div>

      {tooltip && (
        <div
          className="gantt-tooltip"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 32,
          }}
        >
          {tooltip.text}
        </div>
      )}

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
            className="fixed z-[9999] bg-slate-800 border border-slate-600 rounded shadow-lg py-1 w-48"
            style={{
              top: Math.min(contextMenu.y, window.innerHeight - 100),
              left: Math.min(contextMenu.x, window.innerWidth - 200),
            }}
          >
            <button
              onClick={() => {
                onAddMilestoneAtEnd?.();
                setContextMenu(null);
              }}
              className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
            >
              <LinkIcon size={12} className="text-slate-400" />
              Añadir dependencia
            </button>
          </div>
        </>
      )}
    </>
  );
};
