# Timeline Generator · Cronograma Gantt interactivo

Aplicación web SPA para la gestión visual de cronogramas de proyecto estilo Gantt/Roadmap, con soporte completo para drag & drop, redimensionado, hitos y dependencias.

## Stack técnico

- **React 18 + TypeScript**
- **Vite 6** como bundler
- **Tailwind CSS 3** para estilos
- **Zustand** para el estado global
- **html-to-image** + **jsPDF** para exportar a PNG/PDF
- Drag & drop implementado con **pointer events** nativos (sin librerías pesadas)

## Puesta en marcha

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo (http://localhost:3000)
npm run build    # build de producción en dist/
npm run preview  # previsualizar el build
```

## Estructura del proyecto

```
src/
├── types.ts                 # Tipos de datos (Phase, Task, Bar, Milestone, etc.)
├── App.tsx                  # Componente raíz
├── main.tsx                 # Entry point
├── index.css                # Estilos globales + Tailwind
├── store/
│   └── ganttStore.ts        # Store Zustand (fases, tareas, hitos, persistencia)
├── lib/
│   ├── timeline.ts          # Generación de semanas/meses/años y utilidades de fecha
│   ├── useDrag.ts           # Hook de drag horizontal con pointer events
│   └── export.ts            # Exportación PNG/PDF
└── components/
    ├── Icons.tsx            # Iconos SVG
    ├── layout.ts            # Constantes y contexto de layout (WEEK_WIDTH, etc.)
    ├── LayoutProvider.tsx   # Provider del contexto de layout
    ├── ProjectHeader.tsx    # Banner superior con info del proyecto y kick-off
    ├── Legend.tsx           # Leyenda de colores/iconos
    ├── Toolbar.tsx          # Barra de acciones (guardar, exportar, añadir)
    ├── TimelineHeader.tsx   # Cabecera temporal (años > meses > semanas)
    ├── PhaseSection.tsx      # Fase principal (cabecera oscura + tareas)
    ├── TaskRow.tsx          # Fila de tarea con barras e hitos
    ├── TaskBar.tsx           # Barra de tarea con drag y resize
    ├── MilestoneMarker.tsx  # Hito (estrella) o dependencia (eslabón) con arrastre y edición
    └── GanttChart.tsx       # Contenedor principal del cronograma
```

## Funcionalidades

### Estructura de datos
- **Proyecto** con nombre, descripción, fecha de kick-off y duración en meses
- **Fases** como cabeceras oscuras que agrupan tareas
- **Tareas** con múltiples líneas/barras temporales y múltiples hitos
- **Barras** con tipo visual: `task` (celeste), `phase` (gris)
- **Hitos** como puntos únicos en el tiempo, identificados con icono de **estrella** naranja
- **Dependencias** como marcadores temporales con icono de **eslabón** cian, diferenciados visualmente de los hitos
- **Enlaces** entre hitos/dependencias (relación visual entre marcadores)

### Eje temporal
- Organizado por semanas, agrupadas en meses y años
- Semana especial **S0** (kick-off) con punto amarillo en la esquina superior derecha
- Columna de la semana actual ("hoy") resaltada con fondo amarillo semitransparente
- Scroll horizontal fluido

### Interactividad
- **Drag & drop horizontal**: arrastra una barra para mover su semana de inicio (snap a semanas)
- **Resize**: handles en ambos extremos para alargar/acortar la duración
- **Tooltips en tiempo real** durante arrastre/redimensión mostrando fechas y duración
- **Añadir/eliminar** dinámicamente: fases, tareas, líneas (barras), hitos y dependencias
- **Menú contextual** (clic derecho sobre barra): añadir hito o dependencia
- **Añadir hito** haciendo clic en cualquier columna de semana de la cabecera
- **Inline editing**: doble clic o botón de editar (lápiz) para editar texto de fases y tareas
- **Botones de acción** (editar, añadir, eliminar) visibles al hacer hover sobre fases y tareas
- **Dependencias**: crea enlaces entre hitos seleccionando origen y destino

### Exportación y persistencia
- **PNG**: exportar el cronograma como imagen
- **PDF**: exportar como documento PDF
- **JSON**: descargar el estado como archivo
- **Importar JSON**: cargar un cronograma desde archivo
- **localStorage**: guardar/cargar automáticamente en el navegador
- **Restablecer**: volver al ejemplo inicial

## Uso rápido

1. La aplicación carga con un ejemplo completo
2. Arrastra las barras para cambiar su fecha de inicio
3. Usa los extremos (aparecen al hacer hover) para cambiar la duración
4. Haz doble clic en cualquier texto o usa el botón de editar (lápiz) para editarlo
5. Usa el botón `+` de la tarea para añadir trabajos (barras) o hitos
6. Haz clic derecho sobre una barra para añadir un hito o una dependencia
7. Haz clic en una semana de la cabecera para añadir un hito en esa posición
8. Usa los botones de la barra superior para guardar, exportar o importar
*(Este README reemplaza la descripción inicial del repositorio en GitHub)*
