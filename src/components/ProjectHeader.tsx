import React, { useState } from "react";
import { useGanttStore } from "../store/ganttStore";
import { CalendarIcon, FlagIcon, SettingsIcon, CheckIcon, XIcon } from "./Icons";
import { formatDate } from "../lib/timeline";

export const ProjectHeader: React.FC = () => {
  const project = useGanttStore((s) => s.project);
  const setProject = useGanttStore((s) => s.setProject);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project);

  React.useEffect(() => setDraft(project), [project]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 border border-slate-700 shadow-xl">
      {/* Decoración */}
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300">
            <CalendarIcon size={26} />
          </div>
          <div className="flex-1">
            {editing ? (
              <input
                className="bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-lg font-bold text-white w-full"
                value={draft.name}
                onChange={(e) =>
                  setDraft({ ...draft, name: e.target.value })
                }
                autoFocus
              />
            ) : (
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                {project.name}
              </h1>
            )}
            {editing ? (
              <textarea
                className="mt-1 bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 w-full"
                value={draft.description}
                rows={2}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            ) : (
              <p className="text-sm text-slate-300 mt-0.5">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="md:ml-auto flex flex-wrap items-center gap-3">
          {/* Badge Inicio del proyecto: solo lectura, se edita desde el formulario */}
          {!editing && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/15 border border-blue-400/40">
              <CalendarIcon size={16} className="text-blue-300" />
              <div className="text-xs leading-tight">
                <div className="text-blue-200/70 uppercase tracking-wide font-semibold">
                  Inicio
                </div>
                <div className="text-blue-50 font-bold">
                  {formatDate(new Date(project.startDate + "T00:00:00"))}
                </div>
              </div>
            </div>
          )}

          {/* Badge Kick-off: solo lectura, se edita desde el formulario */}
          {!editing && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/15 border border-orange-400/40">
              <FlagIcon size={16} className="text-orange-300" />
              <div className="text-xs leading-tight">
                <div className="text-orange-200/70 uppercase tracking-wide font-semibold">
                  Kick-off
                </div>
                <div className="text-orange-50 font-bold">
                  {formatDate(new Date(project.kickoffDate + "T00:00:00"))}
                </div>
              </div>
            </div>
          )}

          {editing ? (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-300 flex items-center gap-2">
                Inicio
                <input
                  type="date"
                  className="bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-white [color-scheme:dark]"
                  value={draft.startDate}
                  onChange={(e) =>
                    setDraft({ ...draft, startDate: e.target.value })
                  }
                />
              </label>
              <label className="text-xs text-slate-300 flex items-center gap-2">
                Kick-off
                <input
                  type="date"
                  className="bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-white [color-scheme:dark]"
                  value={draft.kickoffDate}
                  onChange={(e) =>
                    setDraft({ ...draft, kickoffDate: e.target.value })
                  }
                />
              </label>
              <label className="text-xs text-slate-300 flex items-center gap-2">
                Duración
                <input
                  type="number"
                  min={1}
                  max={48}
                  className="w-16 bg-slate-900/70 border border-slate-600 rounded px-2 py-1 text-white"
                  value={draft.totalMonths}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      totalMonths: Math.max(
                        1,
                        Math.min(48, Number(e.target.value) || 1)
                      ),
                    })
                  }
                />
                meses
              </label>
            </div>
          ) : (
            <div className="text-xs text-slate-300 px-3 py-2 rounded-lg bg-slate-700/40">
              <span className="text-slate-400">Duración:</span>{" "}
              <span className="font-semibold text-slate-100">
                {project.totalMonths} meses
              </span>
            </div>
          )}

          {editing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setProject(draft);
                  setEditing(false);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
              >
                <CheckIcon size={14} /> Guardar
              </button>
              <button
                onClick={() => {
                  setDraft(project);
                  setEditing(false);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium"
              >
                <XIcon size={14} /> Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-200 text-sm font-medium"
            >
              <SettingsIcon size={14} /> Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
