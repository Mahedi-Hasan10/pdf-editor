"use client";

import React, { useCallback, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useEditorStore } from "@/store/editorStore";
import CanvasEditor from "./CanvasEditor";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer() {
  const { pdfUrl, currentPage, zoom, setTotalPages, setPageDimensions, pageWidth, pageHeight } =
    useEditorStore();
  const [loading, setLoading] = useState(true);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setTotalPages(numPages);
      setLoading(false);
    },
    [setTotalPages]
  );

  // Group items into lines to make them editable as paragraphs/sentences
  const groupTextItemsIntoLines = useCallback((items: any[], height: number) => {
    const elements: any[] = [];
    if (items.length === 0) return [];

    // Filter and sort items from top-to-bottom, left-to-right
    const sortedItems = [...items].sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      if (Math.abs(yA - yB) > 5) {
        return yB - yA; // Top to bottom
      }
      return a.transform[4] - b.transform[4]; // Left to right
    });

    let currentLine: any[] = [];

    for (const item of sortedItems) {
      if (!item.str || item.str.trim() === "") continue;

      if (currentLine.length === 0) {
        currentLine.push(item);
      } else {
        const lastItem = currentLine[currentLine.length - 1];
        const sameY = Math.abs(item.transform[5] - lastItem.transform[5]) < 5;
        const expectedNextX = lastItem.transform[4] + lastItem.width;
        const xDistance = item.transform[4] - expectedNextX;

        // If on the same horizontal line and relatively close, merge
        if (sameY && xDistance < 25) {
          currentLine.push(item);
        } else {
          const lineEl = buildLineElement(currentLine, height);
          if (lineEl) elements.push(lineEl);
          currentLine = [item];
        }
      }
    }

    if (currentLine.length > 0) {
      const lineEl = buildLineElement(currentLine, height);
      if (lineEl) elements.push(lineEl);
    }

    return elements;
  }, []);

  const buildLineElement = (lineItems: any[], pageHeight: number) => {
    if (lineItems.length === 0) return null;

    const firstItem = lineItems[0];
    const text = lineItems.map((item) => item.str).join(" ");
    if (text.trim() === "") return null;

    const rawX = Math.min(...lineItems.map((item) => item.transform[4]));
    const pdfY = firstItem.transform[5];
    const fontSize = firstItem.transform[0] || 12;
    const y = pageHeight - pdfY - fontSize;

    // Measure exact visual character width using HTML Canvas
    let exactWidth = 0;
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context) {
        context.font = `${fontSize}px Helvetica, Arial, sans-serif`;
        exactWidth = context.measureText(text).width;
      }
    }

    const maxX = Math.max(...lineItems.map((item) => item.transform[4] + item.width));
    const fallbackWidth = maxX - rawX;
    
    // Add a tiny safety margin (2%) to cover letter edges but stay far from cell borders
    const width = exactWidth ? (exactWidth * 1.02 + 1) : fallbackWidth;
    const height = fontSize * 1.15;

    return {
      id: crypto.randomUUID(),
      type: "text" as const,
      x: rawX,
      y,
      width: Math.max(width, 20),
      height: Math.max(height, fontSize),
      rotation: 0,
      text,
      fontSize: Math.round(fontSize),
      fontFamily: "Helvetica",
      fontWeight: "normal",
      fontStyle: "normal",
      color: "#000000",
      isOriginalPdfText: true,
      originalText: text,
      originalTextBbox: { x: rawX, y, width, height },
    };
  };

  const onPageLoadSuccess = useCallback(
    (page: any) => {
      setPageDimensions(page.width, page.height);

      // Extract existing text elements from the PDF
      const store = useEditorStore.getState();
      if (!store.extractedPagesText.includes(currentPage)) {
        page.getTextContent().then((textContent: any) => {
          if (textContent && textContent.items) {
            const elements = groupTextItemsIntoLines(textContent.items, page.height);
            store.addExtractedElements(currentPage, elements);
          }
        });
      }
    },
    [currentPage, setPageDimensions, groupTextItemsIntoLines]
  );

  if (!pdfUrl) return null;

  return (
    <div className="pdf-viewer-container">
      <div
        className="pdf-page-wrapper"
        style={{
          width: pageWidth * zoom,
          height: pageHeight * zoom,
        }}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="pdf-loading">
              <div className="pdf-loading-spinner" />
              <p>Loading PDF...</p>
            </div>
          }
          error={
            <div className="pdf-error">
              <p>Failed to load PDF. Please try another file.</p>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            width={pageWidth * zoom}
            devicePixelRatio={typeof window !== "undefined" ? Math.max(window.devicePixelRatio, 2) : 2}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onLoadSuccess={onPageLoadSuccess}
            loading={null}
          />
        </Document>

        {/* Konva overlay */}
        <div className="canvas-overlay">
          <CanvasEditor pageWidth={pageWidth} pageHeight={pageHeight} />
        </div>
      </div>
    </div>
  );
}
