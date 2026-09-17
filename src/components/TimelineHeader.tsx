import React from "react";
import type { WeekColumn, YearGroup } from "../types";
import { groupByMonthYear } from "../lib/timeline";
import { useLayout } from "./layout";

interface TimelineHeaderProps {
  weeks: WeekColumn[];
  onWeekClick?: (weekIndex: number, e: React.MouseEvent) => void;
  highlightWeek: number | null;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  weeks,
  onWeekClick,
  highlightWeek,
}) => {
  const { weekWidth, nameColumnWidth } = useLayout();
  const years = React.useMemo(() => groupByMonthYear(weeks), [weeks]);
  const totalWidth = weeks.length * weekWidth;

  return (
    <div className="flex border-b border-slate-700 bg-slate-900">
      {/* Columna de nombres */}
      <div
        className="sticky left-0 z-30 bg-slate-900 border-r border-slate-700 flex items-end px-4 py-3"
        style={{ width: nameColumnWidth, minWidth: nameColumnWidth }}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Tareas
        </span>
      </div>

      {/* Años / meses / semanas */}
      <div style={{ width: totalWidth, minWidth: totalWidth }}>
        {/* Fila de años */}
        <div className="flex border-b border-slate-700/60">
          {years.map((y) => {
            const yearWidth = countWeeks(y) * weekWidth;
            return (
              <div
                key={y.year}
                className="flex items-center justify-center border-r border-slate-700/50 py-1"
                style={{ width: yearWidth }}
              >
                <span className="text-xs font-bold text-slate-300">
                  {y.year}
                </span>
              </div>
            );
          })}
        </div>

        {/* Fila de meses */}
        <div className="flex border-b border-slate-700/60">
          {years.map((y) =>
            y.months.map((m) => {
              const mw = m.weeks.length * weekWidth;
              return (
                <div
                  key={`${y.year}-${m.month}`}
                  className="flex items-center justify-center border-r border-slate-700/50 py-1"
                  style={{ width: mw }}
                >
                  <span className="text-[11px] font-semibold text-slate-400 capitalize">
                    {m.monthName}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Fila de semanas */}
        <div className="flex">
          {weeks.map((w) => (
            <button
              key={w.index}
              onClick={(e) => onWeekClick?.(w.index, e)}
              title={`${w.label} · ${w.startDate.toLocaleDateString("es-ES")}`}
              className={`relative h-10 flex items-center justify-center text-[10px] font-medium border-r border-slate-800/60 transition-colors ${
                w.isToday
                  ? "bg-yellow-400/15 text-yellow-200 hover:bg-yellow-400/25"
                  : "text-slate-400 hover:bg-slate-700/40"
              } ${
                highlightWeek === w.index
                  ? "ring-1 ring-inset ring-blue-400 bg-blue-500/20"
                  : ""
              }`}
              style={{ width: weekWidth, minWidth: weekWidth }}
            >
              {w.label}
              {w.isKickoff && (
                <span className="absolute top-[5px] right-[5px] w-1.5 h-1.5 rounded-full bg-yellow-300" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

function countWeeks(y: YearGroup): number {
  return y.months.reduce((acc, m) => acc + m.weeks.length, 0);
}
