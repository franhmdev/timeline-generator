import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Marca el contenedor como "exportando" para que los botones de acción
 * (clase `.gantt-action`) se oculten durante la captura.
 * Además, elimina temporalmente los límites de overflow para que todo el
 * contenido (incluido el scroll horizontal y vertical) se vea en la captura.
 * Devuelve las dimensiones completas del contenido calculadas ANTES de
 * cambiar el overflow (cuando scrollWidth/scrollHeight aún son válidos).
 */
function withExporting<T>(
  element: HTMLElement,
  fn: (size: { width: number; height: number }) => Promise<T>
): Promise<T> {
  element.setAttribute("data-exporting", "true");

  // Capturar dimensiones ANTES de cambiar overflow
  const scrollContent = element.querySelector<HTMLElement>(".overflow-x-auto");
  const fullWidth = scrollContent ? scrollContent.scrollWidth : element.scrollWidth;
  // Calcular altura real: sumar offsetTop + offsetHeight de todos los hijos directos
  // del contenedor de scroll, ya que scrollHeight puede no incluir todo
  const calcContentHeight = (container: HTMLElement): number => {
    let maxBottom = 0;
    Array.from(container.children).forEach((child) => {
      const el = child as HTMLElement;
      const bottom = el.offsetTop + el.offsetHeight;
      if (bottom > maxBottom) maxBottom = bottom;
    });
    return maxBottom;
  };
  const scrollHeight = scrollContent
    ? Math.max(scrollContent.scrollHeight, calcContentHeight(scrollContent))
    : element.scrollHeight;
  const fullHeight = Math.max(element.scrollHeight, scrollHeight);

  // Guardar y sobrescribir estilos del contenedor exterior y de los scroll
  const outerOriginal = {
    overflow: element.style.overflow,
    height: element.style.height,
    maxHeight: element.style.maxHeight,
  };
  element.style.overflow = "visible";
  element.style.height = "auto";
  element.style.maxHeight = "none";

  const scrollContainers = Array.from(
    element.querySelectorAll<HTMLElement>(".overflow-x-auto")
  );
  const originalStyles = scrollContainers.map((c) => ({
    el: c,
    overflowX: c.style.overflowX,
    overflowY: c.style.overflowY,
    height: c.style.height,
    maxHeight: c.style.maxHeight,
  }));
  scrollContainers.forEach((c) => {
    c.style.overflowX = "visible";
    c.style.overflowY = "visible";
    c.style.height = "auto";
    c.style.maxHeight = "none";
  });

  return fn({ width: fullWidth, height: fullHeight }).finally(() => {
    element.removeAttribute("data-exporting");
    element.style.overflow = outerOriginal.overflow;
    element.style.height = outerOriginal.height;
    element.style.maxHeight = outerOriginal.maxHeight;
    originalStyles.forEach(({ el, overflowX, overflowY, height, maxHeight }) => {
      el.style.overflowX = overflowX;
      el.style.overflowY = overflowY;
      el.style.height = height;
      el.style.maxHeight = maxHeight;
    });
  });
}

/** Exporta un elemento DOM a PNG descargable. */
export async function exportToPNG(
  element: HTMLElement,
  fileName = "cronograma.png"
): Promise<void> {
  await withExporting(element, async ({ width: fullWidth, height: fullHeight }) => {
    const dataUrl = await toPng(element, {
      backgroundColor: "#0b1120",
      pixelRatio: 2,
      cacheBust: true,
      width: fullWidth,
      height: fullHeight,
      style: {
        width: `${fullWidth}px`,
        height: `${fullHeight}px`,
      },
      skipFonts: true,
    });
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  });
}

/** Exporta un elemento DOM a PDF. */
export async function exportToPDF(
  element: HTMLElement,
  fileName = "cronograma.pdf"
): Promise<void> {
  await withExporting(element, async ({ width: fullWidth, height: fullHeight }) => {
    const dataUrl = await toPng(element, {
      backgroundColor: "#0b1120",
      pixelRatio: 2,
      cacheBust: true,
      width: fullWidth,
      height: fullHeight,
      style: {
        width: `${fullWidth}px`,
        height: `${fullHeight}px`,
      },
      skipFonts: true,
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise((res) => (img.onload = res));

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [img.width, img.height],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
    pdf.save(fileName);
  });
}
