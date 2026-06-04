import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { PageState, EditorElement } from "@/types/editor";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    };
  }
  return { r: 0, g: 0, b: 0 };
}

async function loadImageAsBytes(src: string): Promise<Uint8Array> {
  const response = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function isPng(src: string): boolean {
  return src.includes("image/png") || src.toLowerCase().endsWith(".png");
}

export async function exportToPdf(
  originalFileBytes: ArrayBuffer,
  pages: PageState[],
  pageWidth: number,
  pageHeight: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalFileBytes);
  const pdfPages = pdfDoc.getPages();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const pageState of pages) {
    const pageIndex = pageState.pageNumber - 1;
    if (pageIndex >= pdfPages.length) continue;

    const pdfPage = pdfPages[pageIndex];
    const { width: pdfW, height: pdfH } = pdfPage.getSize();

    // Scale factor from editor canvas to actual PDF dimensions
    const scaleX = pdfW / pageWidth;
    const scaleY = pdfH / pageHeight;

    for (const element of pageState.elements) {
      await renderElementToPdf(
        pdfDoc,
        pdfPage,
        element,
        scaleX,
        scaleY,
        pdfH,
        helveticaFont,
        helveticaBoldFont
      );
    }
  }

  return await pdfDoc.save();
}

async function renderElementToPdf(
  pdfDoc: PDFDocument,
  pdfPage: ReturnType<typeof PDFDocument.prototype.getPages>[0],
  element: EditorElement,
  scaleX: number,
  scaleY: number,
  pdfH: number,
  font: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>,
  boldFont: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>
) {
  if (element.isDeleted && !element.isOriginalPdfText) return;

  // Convert coordinates: editor (top-left origin) → PDF (bottom-left origin)
  const x = element.x * scaleX;
  const y = pdfH - element.y * scaleY;

  switch (element.type) {
    case "text": {
      if (element.isDeleted) {
        if (element.isOriginalPdfText && element.originalTextBbox) {
          const bbox = element.originalTextBbox;
          const xCover = bbox.x * scaleX;
          const yCover = pdfH - (bbox.y + bbox.height) * scaleY;
          const wCover = bbox.width * scaleX;
          const hCover = bbox.height * scaleY;
          pdfPage.drawRectangle({
            x: xCover,
            y: yCover,
            width: wCover,
            height: hCover,
            color: rgb(1, 1, 1),
          });
        }
        break;
      }

      const originalBbox = element.originalTextBbox;
      const isModified =
        !element.isOriginalPdfText ||
        !originalBbox ||
        element.text !== element.originalText ||
        Math.abs(element.x - originalBbox.x) > 1.0 ||
        Math.abs(element.y - originalBbox.y) > 1.0;

      // If it is an original PDF text that has NOT been modified, do nothing
      if (element.isOriginalPdfText && !isModified) {
        break;
      }

      // If it is an original PDF text that HAS been modified/moved, cover it first
      if (element.isOriginalPdfText && originalBbox && isModified) {
        const xCover = originalBbox.x * scaleX;
        const yCover = pdfH - (originalBbox.y + originalBbox.height) * scaleY;
        const wCover = originalBbox.width * scaleX;
        const hCover = originalBbox.height * scaleY;
        pdfPage.drawRectangle({
          x: xCover,
          y: yCover,
          width: wCover,
          height: hCover,
          color: rgb(1, 1, 1),
        });
      }

      if (!element.text) break;
      const fontSize = (element.fontSize || 16) * scaleX;
      const color = hexToRgb(element.color || "#000000");
      const selectedFont = element.fontWeight === "bold" ? boldFont : font;

      // Split text into lines and draw each
      const lines = element.text.split("\n");
      const lineHeight = fontSize * 1.2;

      lines.forEach((line, index) => {
        pdfPage.drawText(line, {
          x,
          y: y - fontSize - index * lineHeight,
          size: fontSize,
          font: selectedFont,
          color: rgb(color.r, color.g, color.b),
          rotate: degrees(-(element.rotation || 0)),
        });
      });
      break;
    }

    case "image": {
      if (!element.src) break;
      try {
        const imageBytes = await loadImageAsBytes(element.src);
        const image = isPng(element.src)
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);

        const w = element.width * scaleX;
        const h = element.height * scaleY;

        pdfPage.drawImage(image, {
          x,
          y: y - h,
          width: w,
          height: h,
          rotate: degrees(-(element.rotation || 0)),
        });
      } catch (e) {
        console.error("Failed to embed image:", e);
      }
      break;
    }

    case "shape": {
      const color = hexToRgb(element.fill || element.color || "#3B82F6");
      const strokeColor = hexToRgb(element.stroke || "#000000");
      const opacity = element.opacity ?? 1;

      if (element.shapeType === "rectangle") {
        const w = element.width * scaleX;
        const h = element.height * scaleY;

        if (element.fill && element.fill !== "transparent") {
          pdfPage.drawRectangle({
            x,
            y: y - h,
            width: w,
            height: h,
            color: rgb(color.r, color.g, color.b),
            opacity,
            rotate: degrees(-(element.rotation || 0)),
          });
        }

        if (element.stroke) {
          pdfPage.drawRectangle({
            x,
            y: y - h,
            width: w,
            height: h,
            borderColor: rgb(strokeColor.r, strokeColor.g, strokeColor.b),
            borderWidth: (element.strokeWidth || 2) * scaleX,
            opacity,
            rotate: degrees(-(element.rotation || 0)),
          });
        }
      } else if (element.shapeType === "circle") {
        const radiusX = (element.width * scaleX) / 2;
        const radiusY = (element.height * scaleY) / 2;
        const cx = x + radiusX;
        const cy = y - radiusY;

        pdfPage.drawEllipse({
          x: cx,
          y: cy,
          xScale: radiusX,
          yScale: radiusY,
          color: element.fill && element.fill !== "transparent" ? rgb(color.r, color.g, color.b) : undefined,
          borderColor: element.stroke ? rgb(strokeColor.r, strokeColor.g, strokeColor.b) : undefined,
          borderWidth: (element.strokeWidth || 2) * scaleX,
          opacity,
        });
      } else if (element.shapeType === "line") {
        const endX = x + element.width * scaleX;
        const endY = y - element.height * scaleY;

        pdfPage.drawLine({
          start: { x, y },
          end: { x: endX, y: endY },
          thickness: (element.strokeWidth || 2) * scaleX,
          color: rgb(strokeColor.r, strokeColor.g, strokeColor.b),
          opacity,
        });
      }
      break;
    }

    case "draw": {
      if (!element.points || element.points.length < 4) break;
      const color = hexToRgb(element.color || "#000000");
      const points = element.points;

      for (let i = 0; i < points.length - 2; i += 2) {
        const startX = (element.x + points[i]) * scaleX;
        const startY = pdfH - (element.y + points[i + 1]) * scaleY;
        const endX = (element.x + points[i + 2]) * scaleX;
        const endY = pdfH - (element.y + points[i + 3]) * scaleY;

        pdfPage.drawLine({
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
          thickness: (element.strokeWidth || 2) * scaleX,
          color: rgb(color.r, color.g, color.b),
        });
      }
      break;
    }

    case "highlight": {
      const color = hexToRgb(element.highlightColor || "#FFFF00");
      const w = element.width * scaleX;
      const h = element.height * scaleY;

      pdfPage.drawRectangle({
        x,
        y: y - h,
        width: w,
        height: h,
        color: rgb(color.r, color.g, color.b),
        opacity: element.opacity ?? 0.3,
      });
      break;
    }

    case "table": {
      const colWidths = element.colWidths || [];
      const rowHeights = element.rowHeights || [];
      const tableData = element.tableData || [];
      const rows = element.rows || 3;
      const cols = element.cols || 3;
      const fontSize = (element.fontSize || 12) * scaleX;
      const color = hexToRgb(element.color || "#000000");

      let currentYOffset = 0;
      for (let r = 0; r < rows; r++) {
        const rowHeight = (rowHeights[r] || 25) * scaleY;
        let currentXOffset = 0;
        for (let c = 0; c < cols; c++) {
          const colWidth = (colWidths[c] || 100) * scaleX;
          const cellText = tableData[r]?.[c] || "";
          const isHeader = r === 0;

          const cellX = x + currentXOffset;
          // In PDF, y is bottom-left origin, so moving down rows means subtracting height
          const cellY = y - currentYOffset - rowHeight;

          // Draw header background
          if (isHeader) {
            pdfPage.drawRectangle({
              x: cellX,
              y: cellY,
              width: colWidth,
              height: rowHeight,
              color: rgb(0.95, 0.95, 0.95),
            });
          }

          // Draw border
          pdfPage.drawRectangle({
            x: cellX,
            y: cellY,
            width: colWidth,
            height: rowHeight,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 1,
          });

          // Draw text
          if (cellText) {
            const textX = cellX + 5 * scaleX;
            // Center the text vertically within the cell
            const textY = cellY + (rowHeight - fontSize) / 2;

            pdfPage.drawText(cellText, {
              x: textX,
              y: textY,
              size: fontSize,
              font: isHeader ? boldFont : font,
              color: rgb(color.r, color.g, color.b),
            });
          }

          currentXOffset += colWidth;
        }
        currentYOffset += rowHeight;
      }
      break;
    }
  }
}

export function downloadBlob(data: Uint8Array, filename: string) {
  const blob = new Blob([data as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
