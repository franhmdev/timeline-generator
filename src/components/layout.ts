import { createContext, useContext } from "react";

/** Ancho fijo de cada columna de semana (px). */
export const WEEK_WIDTH = 44;
/** Alto de fila de tarea (px). */
export const ROW_HEIGHT = 56;
/** Ancho de la columna de nombres de tarea (px). */
export const NAME_COLUMN_WIDTH = 280;

interface LayoutContextValue {
  weekWidth: number;
  rowHeight: number;
  nameColumnWidth: number;
}

export const LayoutContext = createContext<LayoutContextValue>({
  weekWidth: WEEK_WIDTH,
  rowHeight: ROW_HEIGHT,
  nameColumnWidth: NAME_COLUMN_WIDTH,
});

export const useLayout = () => useContext(LayoutContext);
