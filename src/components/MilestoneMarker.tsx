import React, { useState, useRef } from "react";
import type { Milestone, WeekColumn } from "../types";
import { useLayout } from "./layout";
import { useHorizontalDrag } from "../lib/useDrag";
import { formatDate } from "../lib/timeline";
import { DiamondIcon, LinkIcon, TrashIcon } from "./Icons";

interface MilestoneMarkerProps {
  milestone: Milestone;
  weeks: WeekColumn[];
  totalWeeks: number;
  onUpdate: (patch: Partial<Milestone>) => void;
  onDelete: () => void;
  onRename: (label: string) => void;
  onLinkStart?: () => void;
  isLinkSource?: boolean;
}

export const MilestoneMarker: React.FC<MilestoneMarkerProps> = ({
  milestone,
  weeks,
  totalWeeks,
  onUpdate,
  onDelete,
  onRename,
  onLinkStart: _onLinkStart,
  isLinkSource: _isLinkSource,
}) => {
  const { weekWidth, rowHeight } = useLayout();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(milestone.label);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const originRef = useRef({ week: 0 });
  const [visualDelta, setVisualDelta] = useState(0);

  const clampWeek = (w: number) => Math.max(0, Math.min(totalWeeks - 1, w));

  const drag = useHorizontalDrag({
    onStart: () => {
      originRef.current = { week: milestone.week };
      setVisualDelta(0);
    },
    onDrag: (dx) => {
      setVisualDelta(dx);
      const deltaWeeks = Math.round(dx / weekWidth);
      const newWeek = clampWeek(originRef.current.week + deltaWeeks);
      const w = weeks[newWeek];
      setTooltip({
        x: 0,
        y: 0,
        text: `${w?.label ?? "S?"} · ${formatDate(w?.startDate ?? new Date())}`,
      });
    },
    onEnd: (dx) => {
      const deltaWeeks = Math.round(dx / weekWidth);
      const newWeek = clampWeek(originRef.current.week + deltaWeeks);
      onUpdate({ week: newWeek });
      setVisualDelta(0);
      setTooltip(null);
    },
  });

  const isDependency = milestone.type === "dependency";
  const defaultLabel = isDependency ? "Nueva dependencia" : "Hito";
  const titleLabel = isDependency ? "Dependencia" : "Hito";

  const left = milestone.week * weekWidth + visualDelta + weekWidth / 2;

  return (
    <>
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 no-select cursor-grab active:cursor-grabbing"
        style={{ left, height: rowHeight }}
        onPointerDown={(e) => {
          if (editing || e.detail === 2) return;
          drag.onPointerDown(e);
        }}
        onMouseEnter={(e) =>
          setTooltip({
            x: e.clientX,
            y: e.clientY,
            text: milestone.label,
          })
        }
        onMouseMove={(e) => {
          if (!tooltip) return;
          setTooltip({ x: e.clientX, y: e.clientY, text: tooltip.text });
        }}
        onMouseLeave={() => !drag.isDragging && setTooltip(null)}
      >
        {/* Indicador visual + etiqueta + acciones */}
        <div className="relative flex items-center h-full cursor-grab active:cursor-grabbing">
          {/* Indicador visual: estrella (hito) o eslabón (dependencia) */}
          <div
            className={`w-4 h-4 flex items-center justify-center shrink-0 ${
              isDependency ? "text-cyan-400" : "text-orange-400"
            }`}
            title={titleLabel}
          >
            {isDependency ? (
              <LinkIcon size={12} />
            ) : (
              <DiamondIcon size={12} />
            )}
          </div>

          {/* Etiqueta flotante a la derecha */}
          {editing ? (
            <input
              className="ml-2 bg-slate-900 border border-slate-600 rounded px-2 py-0.5 text-xs text-white w-40"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                onRename(draft.trim() || defaultLabel);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onRename(draft.trim() || defaultLabel);
                  setEditing(false);
                }
                if (e.key === "Escape") {
                  setDraft(milestone.label);
                  setEditing(false);
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className={`ml-2 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-xs font-medium whitespace-nowrap cursor-grab active:cursor-grabbing ${
                isDependency ? "text-cyan-100" : "text-orange-100"
              }`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setDraft(milestone.label);
                setEditing(true);
              }}
            >
              {milestone.label}
            </div>
          )}

          {/* Botón eliminar */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={`gantt-action ml-1.5 w-4 h-4 rounded-full bg-rose-700 hover:bg-rose-600 text-white flex items-center justify-center cursor-grab active:cursor-grabbing`}
            title={`Eliminar ${isDependency ? "dependencia" : "hito"}`}
          >
            <TrashIcon size={8} />
          </button>
        </div>
      </div>

      {tooltip && (
        <div
          className="gantt-tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y - 32 }}
        >
          {tooltip.text}
        </div>
      )}
    </>
  );
};
