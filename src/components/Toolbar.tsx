"use client";

import React, { useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { ToolType } from "@/types/editor";
import { exportToPdf, downloadBlob } from "@/utils/pdfExport";

const tools: { id: ToolType; label: string; icon: string; shortcut?: string }[] = [
  { id: "select", label: "Select", icon: "↖", shortcut: "V" },
  { id: "text", label: "Text", icon: "T", shortcut: "T" },
  { id: "table", label: "Table", icon: "⊞", shortcut: "B" },
  { id: "image", label: "Image", icon: "🖼", shortcut: "I" },
  { id: "draw", label: "Draw", icon: "✏️", shortcut: "D" },
  { id: "highlight", label: "Highlight", icon: "🖍", shortcut: "H" },
  { id: "shape-rectangle", label: "Rectangle", icon: "▭", shortcut: "R" },
  { id: "shape-circle", label: "Circle", icon: "◯", shortcut: "C" },
  { id: "shape-line", label: "Line", icon: "╱", shortcut: "L" },
  { id: "eraser", label: "Eraser", icon: "⌫", shortcut: "E" },
];

export default function Toolbar() {
  const {
    activeTool,
    setActiveTool,
    pdfFile,
    pdfUrl,
    pages,
    zoom,
    setZoom,
    currentPage,
    totalPages,
    setCurrentPage,
    undo,
    redo,
    undoStack,
    redoStack,
    resetEditor,
    showThumbnails,
    setShowThumbnails,
    pageWidth,
    pageHeight,
  } = useEditorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      useEditorStore.getState().setPdfFile(file);
    }
  };

  const handleExport = async () => {
    if (!pdfFile) return;
    setIsExporting(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfBytes = await exportToPdf(arrayBuffer, pages, pageWidth, pageHeight);
      const fileName = pdfFile.name.replace(".pdf", "") + "_edited.pdf";
      downloadBlob(pdfBytes, fileName);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

  return (
    <div className="toolbar">
      {/* Top Bar */}
      <div className="toolbar-top">
        <div className="toolbar-section">
          <div className="toolbar-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" fill="url(#brandGrad)" />
              <path d="M8 7h8M8 11h8M8 15h5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="brandGrad" x1="3" y1="3" x2="21" y2="21">
                  <stop stopColor="#6366F1" />
                  <stop offset="1" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <span>PDF Editor</span>
          </div>
        </div>

        <div className="toolbar-section toolbar-actions">
          {!pdfUrl ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
              />
              <button
                className="btn btn-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v8M4 6l4-4 4 4M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Upload PDF
              </button>
            </>
          ) : (
            <>
              {/* Undo/Redo */}
              <div className="btn-group">
                <button
                  className="btn btn-icon"
                  onClick={undo}
                  disabled={undoStack.length === 0}
                  title="Undo (Ctrl+Z)"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 6h7a3 3 0 0 1 0 6H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 3L3 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  className="btn btn-icon"
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 6H6a3 3 0 0 0 0 6h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Zoom */}
              <div className="btn-group zoom-controls">
                <button
                  className="btn btn-icon"
                  onClick={() => setZoom(zoom - 0.25)}
                  disabled={zoom <= 0.25}
                  title="Zoom Out"
                >
                  −
                </button>
                <select
                  className="zoom-select"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                >
                  {zoomLevels.map((z) => (
                    <option key={z} value={z}>
                      {Math.round(z * 100)}%
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-icon"
                  onClick={() => setZoom(zoom + 0.25)}
                  disabled={zoom >= 3}
                  title="Zoom In"
                >
                  +
                </button>
              </div>

              {/* Page Navigation */}
              <div className="btn-group page-nav">
                <button
                  className="btn btn-icon"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  ‹
                </button>
                <span className="page-indicator">
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="btn btn-icon"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  ›
                </button>
              </div>

              {/* Thumbnails toggle */}
              <button
                className={`btn btn-icon ${showThumbnails ? "active" : ""}`}
                onClick={() => setShowThumbnails(!showThumbnails)}
                title="Toggle Thumbnails"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="5" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="1" y="9" width="5" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="8" y="1" width="7" height="14" rx="1" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>

              {/* Export & New */}
              <button
                className="btn btn-success"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <span className="btn-spinner" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v8M4 8l4 4 4-4M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {isExporting ? "Exporting..." : "Export PDF"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={resetEditor}
                title="Close file"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tool Bar - only visible when PDF is loaded */}
      {pdfUrl && (
        <div className="toolbar-bottom">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`tool-btn ${activeTool === tool.id ? "active" : ""}`}
              onClick={() => setActiveTool(tool.id)}
              title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ""}`}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
