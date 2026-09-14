import { useEffect, useRef, useState, useCallback } from "react";

export interface DragState {
  /** Desplazamiento en px desde el inicio. */
  deltaX: number;
  /** Posición inicial del puntero. */
  startX: number;
}

export interface UseDragOptions {
  /** Se llama al iniciar el arrastre. */
  onStart?: () => void;
  /** Se llama continuamente con el delta en px acumulado. */
  onDrag?: (deltaX: number, e: PointerEvent) => void;
  /** Se llama al finalizar, con el delta final en px. */
  onEnd?: (deltaX: number, e: PointerEvent) => void;
  /** Botón del ratón que dispara (default 0 = izquierdo). */
  button?: number;
}

/**
 * Hook para gestionar arrastre horizontal con pointer events.
 * Devuelve un handler `onPointerDown` para adjuntar al elemento draggable.
 */
export function useHorizontalDrag({
  onStart,
  onDrag,
  onEnd,
  button = 0,
}: UseDragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const stateRef = useRef<{
    startX: number;
    lastX: number;
    active: boolean;
    pointerId?: number;
  }>({ startX: 0, lastX: 0, active: false });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== button) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      stateRef.current = {
        startX: e.clientX,
        lastX: e.clientX,
        active: true,
        pointerId: e.pointerId,
      };
      setIsDragging(true);
      onStart?.();
    },
    [button, onStart]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: PointerEvent) => {
      if (!stateRef.current.active) return;
      const dx = e.clientX - stateRef.current.startX;
      stateRef.current.lastX = e.clientX;
      onDrag?.(dx, e);
    };
    const handleUp = (e: PointerEvent) => {
      if (!stateRef.current.active) return;
      const dx = e.clientX - stateRef.current.startX;
      stateRef.current.active = false;
      setIsDragging(false);
      onEnd?.(dx, e);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [isDragging, onDrag, onEnd]);

  return { onPointerDown, isDragging };
}
