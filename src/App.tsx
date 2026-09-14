import React, { useRef } from "react";
import { ProjectHeader } from "./components/ProjectHeader";
import { Legend } from "./components/Legend";
import { Toolbar } from "./components/Toolbar";
import { GanttChart } from "./components/GanttChart";
import { exportToPNG, exportToPDF } from "./lib/export";

const App: React.FC = () => {
  const ganttRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = async () => {
    if (ganttRef.current) {
      try {
        await exportToPNG(ganttRef.current, "cronograma.png");
      } catch (e) {
        console.error(e);
        alert("Error al exportar PNG");
      }
    }
  };

  const handleExportPDF = async () => {
    if (ganttRef.current) {
      try {
        await exportToPDF(ganttRef.current, "cronograma.pdf");
      } catch (e) {
        console.error(e);
        alert("Error al exportar PDF");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-4">
        <ProjectHeader />

        <Toolbar
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
          ganttRef={ganttRef}
        />

        <Legend />

        <GanttChart ref={ganttRef} />

        <footer className="text-center text-xs text-slate-500 py-4">
          Cronograma interactivo · Arrastra las barras para moverlas, usa los
          extremos para redimensionar, doble clic para editar texto.
        </footer>
      </div>
    </div>
  );
};

export default App;
