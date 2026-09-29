# AGENTS.md · Timeline Generator

Guía de referencia para agentes (humanos y de IA) que trabajen en este repositorio.
Contiene el contexto del proyecto, convenciones, comandos y reglas críticas.

---

## 1. Qué es este proyecto

**Timeline Generator** es una SPA (Single Page Application) para crear y editar
cronogramas de proyecto estilo Gantt/Roadmap de forma visual e interactiva.

- **Demo**: https://franhmdev.github.io/timeline-generator/
- **Repositorio**: `franHMDev/timeline-generator`
- **Idioma de la UI**: Español (`es-ES`). Textos visibles al usuario deben ir en español.
- **Idioma del código y comentarios**: Español (mantener consistencia con el código existente).

### Funcionalidades principales

- Drag & drop horizontal de barras (snap a semanas) y resize por ambos extremos.
- Hitos (estrella naranja) y dependencias (eslabón cian) como marcadores temporales.
- Enlaces entre marcadores (relaciones de dependencia visual).
- Tareas externas (proveedores/entregas de terceros).
- Inline editing (doble clic o botón lápiz) de fases, tareas e hitos.
- Menú contextual (clic derecho) sobre barras para añadir hitos/dependencias.
- Exportación a **PNG**, **PDF** y **JSON**; importación desde JSON.
- Persistencia automática en `localStorage` (clave `timeline-generator-state-v1`).
- Vista "full" (completa) y "phases" (solo fases).

---

## 2. Stack técnico

| Capa        | Tecnología                                  |
| ----------- | ------------------------------------------- |
| Framework   | React 18 (function components + hooks)      |
| Lenguaje    | TypeScript 5 (estricto: `strict`, `noUnusedLocals`, `noUnusedParameters`) |
| Bundler     | Vite 6                                      |
| Estilos     | Tailwind CSS 3 + PostCSS + Autoprefixer     |
| Estado      | Zustand 4 (store único en `src/store/ganttStore.ts`) |
| Export      | html-to-image (PNG) + jsPDF (PDF)           |
| Drag        | Pointer events nativos (hook `useDrag.ts`, sin librerías) |
| Deploy      | GitHub Pages (`gh-pages`, base `/timeline-generator/`) |

**Sin librerías de UI ni de drag externas** (excepto las de exportación).
No añadir dependencias pesadas sin justificación; preferir implementaciones nativas.

---

## 3. Comandos

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo en http://localhost:3000
npm run build    # type-check (tsc -b) + build de producción a dist/
npm run preview  # previsualizar el build de producción
npm run lint     # comprobación de tipos (tsc --noEmit)
npm run deploy   # build + publicación en GitHub Pages (rama gh-pages)
```

> **Puerto de dev**: 3000 (definido en `vite.config.ts`, con `open: true`).
> **Base URL**: `/timeline-generator/` (necesaria para GitHub Pages).

### Antes de abrir un PR / commit

1. `npm run lint` debe pasar sin errores de tipos.
2. `npm run build` debe completarse correctamente.
3. No introducir `any` sin justificación documentada; el modo `strict` está activado.
4. `noUnusedLocals` y `noUnusedParameters` están activos: eliminar variables/parámetros no usados.

---

## 4. Estructura del proyecto

```
timeline-generator/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── public/
└── src/
    ├── main.tsx                 # Entry point
    ├── App.tsx                  # Componente raíz (layout + ref del gantt para export)
    ├── index.css                # Tailwind + estilos globales (dark, scrollbar)
    ├── types.ts                 # Tipos de datos del dominio
    ├── store/
    │   └── ganttStore.ts        # Store Zustand: estado + acciones + persistencia
    ├── lib/
    │   ├── timeline.ts          # Semanas/meses/años, fechas, uid()
    │   ├── useDrag.ts           # Hook de drag horizontal (pointer events)
    │   └── export.ts            # Exportación PNG/PDF (html-to-image + jsPDF)
    └── components/
        ├── Icons.tsx            # Iconos SVG (DiamondIcon, LinkIcon, etc.)
        ├── layout.ts            # Constantes + contexto de layout (WEEK_WIDTH, ROW_HEIGHT…)
        ├── LayoutProvider.tsx   # Provider del contexto de layout
        ├── ProjectHeader.tsx    # Banner con info del proyecto y kick-off
        ├── Legend.tsx           # Leyenda de colores/iconos
        ├── Toolbar.tsx          # Barra de acciones (guardar, exportar, importar, añadir)
        ├── TimelineHeader.tsx   # Cabecera temporal (años > meses > semanas)
        ├── PhaseSection.tsx     # Fase: cabecera oscura + lista de tareas
        ├── TaskRow.tsx          # Fila de tarea con barras e hitos
        ├── TaskBar.tsx          # Barra de tarea con drag, resize, menú contextual
        ├── MilestoneMarker.tsx  # Hito (estrella) o dependencia (eslabón)
        └── GanttChart.tsx       # Contenedor principal del cronograma
```

### Alias de importación

- `@/*` → `src/*` (configurado en `tsconfig.json` y `vite.config.ts`).
- Se pueden usar ambos estilos: `../types` (relativo) o `@/types` (alias).
  Mantener el estilo del archivo que se esté editando.

---

## 5. Modelo de datos (`src/types.ts`)

```
ScheduleState
├── project: ProjectInfo        # nombre, descripción, startDate, kickoffDate, totalMonths, weekStartDay
├── phases: Phase[]             # fases (cabeceras oscuras)
│   └── tasks: Task[]          # tareas de la fase
│       ├── bars: Bar[]        # segmentos temporales (startWeek, duration, type)
│       └── milestones: Milestone[]  # hitos (type: "hito" | "dependency")
├── dependencies: Dependency[] # enlaces entre marcadores (from → to milestone/external)
└── externalTasks: ExternalTask[]  # entregas de proveedores externos
```

**Conceptos clave**:

- Las **semanas se indexan globalmente** desde 0 (inicio del cronograma).
  `startWeek` y `week` (de milestones) son índices 0-based sobre el timeline global.
- **`weekStartDay`** (0=domingo … 6=sábado, default 1=lunes) define el inicio de semana.
- **Bar.type**: `"task"` (celeste) o `"phase"` (gris).
- **Milestone.type**: `"hito"` (estrella naranja) o `"dependency"` (eslabón cian).
  Son visualmente distintos: los hitos marcan entregables; las dependencias marcan
  puntos de sincronización.
- **Dependency.toType**: `"milestone"` (interno) o `"external"` (tarea externa).

---

## 6. Estado y store (`src/store/ganttStore.ts`)

Store único con Zustand. Interfaz `GanttStore` extiende `ScheduleState` y añade acciones.

### Acciones disponibles

- **Proyecto**: `setProject(patch)`
- **Fases**: `addPhase`, `removePhase`, `renamePhase`, `movePhase(from, to)`
- **Tareas**: `addTask(phaseId)`, `removeTask`, `renameTask`, `moveTask`
- **Barras**: `addBar(phaseId, taskId, type?, startWeek?, duration?)`, `removeBar`, `updateBar(patch)`
- **Hitos**: `addMilestone(phaseId, taskId, week, label?, type?)`, `removeMilestone`, `renameMilestone`, `moveMilestone`
- **Dependencias**: `addDependency(fromMsId, toType, toId)`, `removeDependency(depId)`
- **Tareas externas**: `addExternalTask(label, week, provider?) → id`, `removeExternalTask`, `renameExternalTask`
- **Persistencia**: `saveToStorage`, `loadFromStorage`, `resetToDefault`, `loadState(state)`

### Reglas del store

- **Persistencia**: el store carga desde `localStorage` al inicio y debe persistir
  tras cada mutación relevante. La clave es `timeline-generator-state-v1`.
- **Migraciones**: `loadInitialState()` incluye migraciones para datos antiguos
  (startDate faltante, milestones sin `type`, dependencias con formato antiguo).
  Al añadir campos nuevos al estado, añadir migración aquí para no romper datos guardados.
- **IDs**: usar `uid()` de `lib/timeline.ts` para generar IDs únicos.
- Las mutaciones usan `set` con actualizaciones inmutables (spread/`.map`/`.filter`).

---

## 7. Layout y constantes (`src/components/layout.ts`)

Constantes fijas de layout, expuestas vía React Context (`LayoutProvider`):

| Constante          | Valor | Significado                          |
| ------------------ | ----- | ------------------------------------ |
| `WEEK_WIDTH`       | 44px  | Ancho de cada columna de semana      |
| `ROW_HEIGHT`       | 56px  | Alto de fila de tarea                 |
| `NAME_COLUMN_WIDTH`| 280px | Ancho de la columna de nombres         |

Acceder vía `useLayout()` hook, no importar las constantes directamente salvo
en casos justificados (ej. `GanttChart.tsx` para cálculos de scroll).

**Posicionamiento de barras/marcadores**: todo se calcula con
`left = startWeek * WEEK_WIDTH` y `width = duration * WEEK_WIDTH`.

---

## 8. Convenciones de código

### TypeScript / React

- **Function components** con `React.FC<Props>` y export nominal
  (`export const Foo: React.FC<Props> = (...) => {}`).
- Props tipadas con `interface` (nombre `ComponentProps`).
- **`useCallback`/`useMemo`** para optimizar renders en componentes con drag/listas.
- **`forwardRef`** cuando el padre necesita la ref del DOM
  (ej. `GanttChart` es `forwardRef<HTMLDivElement>` para la exportación).
- Sin `any`. Usar tipos concretos de `types.ts`.
- Comentarios JSDoc en español para funciones/utilidades públicas.

### Estilos (Tailwind)

- Tema oscuro hardcoded. Paleta en `tailwind.config.js` bajo `colors.gantt`:
  `bg`, `panel`, `phase`, `accent`, `accent2`, `milestone`, `today`, `s0`.
- Clases Tailwind directas en JSX; mínima CSS personalizada en `index.css`
  (scrollbar, no-select durante drag, reglas de exportación).
- Para elementos ocultables durante exportación, usar la clase `.gantt-action`
  y el atributo `data-exporting` (ver `lib/export.ts`).

### Drag & interacción

- Usar el hook `useHorizontalDrag` de `lib/useDrag.ts` para arrastre horizontal.
- **Snap a semanas**: convertir el delta en píxeles a semanas con
  `Math.round(deltaX / WEEK_WIDTH)` y clampear al rango `[0, totalWeeks-1]`.
- Durante el drag, mostrar tooltips con fechas reales (`formatDate` de `lib/timeline.ts`).
- Los handles de resize aparecen al hacer hover.

### Fechas

- Todas las utilidades de fecha están en `lib/timeline.ts`
  (`startOfWeek`, `addWeeks`, `isSameWeek`, `toISODate`, `formatDate`, `weeksFromToday`).
- `buildWeekColumns(project)` genera la lista de `WeekColumn` a partir de `ProjectInfo`.
- Los meses en español (`MONTH_NAMES`).
- Las semanas se asignan al mes dominante (el que tiene más días en esa semana).

---

## 9. Exportación (`src/lib/export.ts`)

- `exportToPNG(element, filename)` y `exportToPDF(element, filename)`.
- Antes de capturar, se marca el contenedor con `data-exporting="true"` para ocultar
  botones de acción (`.gantt-action`) y se elimina el `overflow` para capturar
  todo el contenido (incluido el scroll horizontal/vertical).
- Tras la captura, se restauran los estilos originales.
- Si se añaden elementos que no deban aparecer en exportaciones, añadirles
  la clase `.gantt-action` o comprobar `data-exporting`.

---

## 10. Despliegue (GitHub Pages)

- `npm run deploy` ejecuta `tsc -b && vite build && gh-pages -d dist`.
- La `base` en `vite.config.ts` es `/timeline-generator/` (subpath del repo).
  **No cambiar** sin actualizar también la configuración de Pages.
- El build se publica en la rama `gh-pages`.

---

## 11. Reglas críticas para agentes

1. **Idioma**: la UI y los comentarios van en español. No traducirlos al inglés.
2. **Strict TS**: no usar `any`. Respetar `noUnusedLocals`/`noUnusedParameters`.
3. **Sin dependencias nuevas** salvo necesidad justificada; el proyecto evita
   librerías de UI/drag pesadas.
4. **Inmutabilidad**: mutar el store solo con patrones inmutables
   (`.map`/`.filter`/spread). Nunca mutar arrays/objetos del estado directamente.
5. **IDs**: generar IDs con `uid()` de `lib/timeline.ts`.
6. **Layout**: acceder a las dimensiones vía `useLayout()`, no hardcodear valores.
7. **Persistencia**: cualquier cambio de schema en `ScheduleState` requiere
   una migración en `loadInitialState()` para no romper `localStorage` existente.
8. **Base path**: mantener `base: "/timeline-generator/"` en `vite.config.ts`.
9. **Antes de commit**: `npm run lint` (sin errores) y `npm run build` (correcto).
10. **Exportación**: elementos de UI que no deban salir en PNG/PDF → clase `.gantt-action`.
11. **Drag**: siempre clampear a `[0, totalWeeks-1]` y hacer snap a semanas enteras.

---

## 12. Notas adicionales

- El proyecto carga un **ejemplo completo** por defecto (ver `defaultPhases()`).
- La semana **S0** (kick-off) tiene un punto amarillo y se resalta; la semana
  actual ("hoy") tiene fondo amarillo semitransparente.
- Hay un **menú contextual** (clic derecho) sobre barras y un **modal** al hacer
  clic en una semana de la cabecera para añadir hitos.
- La vista `"phases"` muestra solo las cabeceras de fase (sin tareas detalladas).
