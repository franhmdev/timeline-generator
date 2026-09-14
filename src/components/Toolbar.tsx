import React, { useRef } from "react";
import { useGanttStore } from "../store/ganttStore";
import type { ScheduleState } from "../types";
import {
  UploadIcon,
  DownloadIcon,
  ImageIcon,
  FileIcon,
  ResetIcon,
  PlusIcon,
} from "./Icons";

interface ToolbarProps {
  onExportPNG: () => void;
  onExportPDF: () => void;
  ganttRef?: React.RefObject<HTMLElement>;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onExportPNG,
  onExportPDF,
}) => {
  const resetToDefault = useGanttStore((s) => s.resetToDefault);
  const loadState = useGanttStore((s) => s.loadState);
  const addPhase = useGanttStore((s) => s.addPhase);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const state = useGanttStore.getState();
    const data: ScheduleState = {
      project: state.project,
      phases: state.phases,
      dependencies: state.dependencies,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.project.name.replace(/\s+/g, "_")}_cronograma.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as ScheduleState;
        loadState(parsed);
      } catch {
        alert("Archivo JSON inválido");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const btn =
    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={addPhase}
        className={`${btn} bg-blue-600 hover:bg-blue-500 text-white`}
      >
        <PlusIcon size={16} /> Añadir fase
      </button>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      <button
        onClick={handleExportJSON}
        className={`${btn} bg-slate-700 hover:bg-slate-600 text-slate-100`}
        title="Descargar como JSON"
      >
        <DownloadIcon size={16} /> JSON
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className={`${btn} bg-slate-700 hover:bg-slate-600 text-slate-100`}
        title="Importar JSON"
      >
        <UploadIcon size={16} /> Importar
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportJSON}
      />

      <div className="w-px h-6 bg-slate-700 mx-1" />

      <button
        onClick={onExportPNG}
        className={`${btn} bg-cyan-700 hover:bg-cyan-600 text-white`}
        title="Exportar como imagen PNG"
      >
        <ImageIcon size={16} /> PNG
      </button>
      <button
        onClick={onExportPDF}
        className={`${btn} bg-cyan-700 hover:bg-cyan-600 text-white`}
        title="Exportar como PDF"
      >
        <FileIcon size={16} /> PDF
      </button>

      <div className="ml-auto" />

      <button
        onClick={() => {
          if (
            confirm(
              "¿Restablecer el cronograma a los datos de ejemplo? Se perderán los cambios actuales."
            )
          ) {
            resetToDefault();
          }
        }}
        className={`${btn} bg-rose-900/70 hover:bg-rose-800 text-rose-100`}
        title="Restablecer a ejemplo"
      >
        <ResetIcon size={16} /> Restablecer
      </button>
    </div>
  );
};
