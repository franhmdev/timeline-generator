import React from "react";
import {
  DiamondIcon,
  LinkIcon,
} from "./Icons";

type LegendItem = {
  label: string;
  color: string;
  icon?: React.ReactNode;
  swatch?: React.ReactNode;
};

const items: LegendItem[] = [
  {
    label: "Hito",
    color: "#f97316",
    icon: <DiamondIcon size={14} className="text-orange-400" />,
  },
  {
    label: "Dependencia",
    color: "#06b6d4",
    icon: <LinkIcon size={14} className="text-cyan-400" />,
  },
  {
    label: "Tarea",
    color: "#06b6d4",
    swatch: (
      <div className="h-3 w-6 rounded bg-gradient-to-r from-cyan-500 to-cyan-400" />
    ),
  },
  {
    label: "Kick-off",
    color: "#fde047",
    swatch: (
      <div className="relative w-6 h-3 flex items-center justify-end">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
      </div>
    ),
  },
  {
    label: "Hoy",
    color: "#facc15",
    swatch: (
      <div className="h-3 w-6 rounded bg-yellow-400/15 border border-yellow-400/30" />
    ),
  },
];

export const Legend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300">
      <span className="font-semibold text-slate-400 uppercase tracking-wide mr-1">
        Leyenda
      </span>
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          {it.icon ?? it.swatch}
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
};
