"use client";

import React from "react";
import { useEditorStore } from "@/store/editorStore";

const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];
const fontFamilies = ["Helvetica", "Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"];
const highlightColors = ["#FFFF00", "#00FF00", "#FF69B4", "#87CEEB", "#FFA500", "#FF6347"];

export default function PropertiesPanel() {
  const {
    selectedElementId,
    currentPage,
    pages,
    updateElement,
    deleteElement,
    duplicateElement,
    bringToFront,
    sendToBack,
  } = useEditorStore();

  const page = pages.find((p) => p.pageNumber === currentPage);
  const element = page?.elements.find((el) => el.id === selectedElementId);

  if (!element) {
    return (
      <div className="properties-panel">
        <div className="properties-empty">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.3">
            <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M20 24h8M24 20v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p>Select an element to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleUpdate = (updates: Record<string, unknown>) => {
    updateElement(currentPage, element.id, updates);
  };

  const handleUpdateRows = (newRows: number) => {
    if (newRows < 1) return;
    const currentRows = element.rows || 3;
    const currentCols = element.cols || 3;
    let newTableData = element.tableData ? element.tableData.map(row => [...row]) : [];
    let newRowHeights = element.rowHeights ? [...element.rowHeights] : [];

    if (newRows > currentRows) {
      for (let r = currentRows; r < newRows; r++) {
        newTableData.push(Array(currentCols).fill(""));
        newRowHeights.push(25);
      }
    } else {
      newTableData = newTableData.slice(0, newRows);
      newRowHeights = newRowHeights.slice(0, newRows);
    }

    const newHeight = newRowHeights.reduce((a, b) => a + b, 0);

    handleUpdate({
      rows: newRows,
      tableData: newTableData,
      rowHeights: newRowHeights,
      height: newHeight,
    });
  };

  const handleUpdateCols = (newCols: number) => {
    if (newCols < 1) return;
    const currentRows = element.rows || 3;
    const currentCols = element.cols || 3;
    let newTableData = element.tableData ? element.tableData.map(row => [...row]) : [];
    let newColWidths = element.colWidths ? [...element.colWidths] : [];

    if (newCols > currentCols) {
      for (let r = 0; r < currentRows; r++) {
        while (newTableData[r].length < newCols) {
          newTableData[r].push("");
        }
      }
      for (let c = currentCols; c < newCols; c++) {
        newColWidths.push(100);
      }
    } else {
      for (let r = 0; r < currentRows; r++) {
        newTableData[r] = newTableData[r].slice(0, newCols);
      }
      newColWidths = newColWidths.slice(0, newCols);
    }

    const newWidth = newColWidths.reduce((a, b) => a + b, 0);

    handleUpdate({
      cols: newCols,
      tableData: newTableData,
      colWidths: newColWidths,
      width: newWidth,
    });
  };

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <h3>
          {element.type === "text" && "Text"}
          {element.type === "table" && "Table"}
          {element.type === "image" && "Image"}
          {element.type === "shape" && `Shape: ${element.shapeType}`}
          {element.type === "draw" && "Drawing"}
          {element.type === "highlight" && "Highlight"}
        </h3>
        <div className="properties-header-actions">
          <button
            className="btn btn-icon btn-sm"
            onClick={() => duplicateElement(currentPage, element.id)}
            title="Duplicate"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M10 2H3.5A1.5 1.5 0 0 0 2 3.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className="btn btn-icon btn-sm btn-danger"
            onClick={() => deleteElement(currentPage, element.id)}
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M9 6v5M5 6v5M3 4l1 8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="properties-content">
        {/* Position & Size */}
        <div className="property-group">
          <h4>Position & Size</h4>
          <div className="property-grid">
            <div className="property-field">
              <label>X</label>
              <input
                type="number"
                value={Math.round(element.x)}
                onChange={(e) => handleUpdate({ x: Number(e.target.value) })}
              />
            </div>
            <div className="property-field">
              <label>Y</label>
              <input
                type="number"
                value={Math.round(element.y)}
                onChange={(e) => handleUpdate({ y: Number(e.target.value) })}
              />
            </div>
            <div className="property-field">
              <label>W</label>
              <input
                type="number"
                value={Math.round(element.width)}
                onChange={(e) => handleUpdate({ width: Number(e.target.value) })}
              />
            </div>
            <div className="property-field">
              <label>H</label>
              <input
                type="number"
                value={Math.round(element.height)}
                onChange={(e) => handleUpdate({ height: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="property-field">
            <label>Rotation</label>
            <div className="slider-row">
              <input
                type="range"
                min="0"
                max="360"
                value={element.rotation}
                onChange={(e) => handleUpdate({ rotation: Number(e.target.value) })}
              />
              <span>{Math.round(element.rotation)}°</span>
            </div>
          </div>
        </div>

        {/* Table Properties */}
        {element.type === "table" && (
          <div className="property-group">
            <h4>Table Structure</h4>
            <div className="property-grid">
              <div className="property-field">
                <label>Rows</label>
                <input
                  type="number"
                  min="1"
                  value={element.rows || 3}
                  onChange={(e) => handleUpdateRows(Number(e.target.value))}
                />
              </div>
              <div className="property-field">
                <label>Columns</label>
                <input
                  type="number"
                  min="1"
                  value={element.cols || 3}
                  onChange={(e) => handleUpdateCols(Number(e.target.value))}
                />
              </div>
            </div>

            <h4>Cell Typography</h4>
            <div className="property-field">
              <label>Font Family</label>
              <select
                value={element.fontFamily || "Helvetica"}
                onChange={(e) => handleUpdate({ fontFamily: e.target.value })}
              >
                {fontFamilies.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="property-grid">
              <div className="property-field">
                <label>Text Size</label>
                <select
                  value={element.fontSize || 12}
                  onChange={(e) => handleUpdate({ fontSize: Number(e.target.value) })}
                >
                  {fontSizes.map((s) => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
              </div>
              <div className="property-field">
                <label>Text Color</label>
                <input
                  type="color"
                  value={element.color || "#000000"}
                  onChange={(e) => handleUpdate({ color: e.target.value })}
                />
              </div>
            </div>
            <div className="property-field">
              <label>Style</label>
              <div className="btn-group">
                <button
                  className={`btn btn-icon btn-sm ${element.fontWeight === "bold" ? "active" : ""}`}
                  onClick={() =>
                    handleUpdate({ fontWeight: element.fontWeight === "bold" ? "normal" : "bold" })
                  }
                >
                  <strong>B</strong>
                </button>
                <button
                  className={`btn btn-icon btn-sm ${element.fontStyle === "italic" ? "active" : ""}`}
                  onClick={() =>
                    handleUpdate({ fontStyle: element.fontStyle === "italic" ? "normal" : "italic" })
                  }
                >
                  <em>I</em>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Text Properties */}
        {element.type === "text" && (
          <div className="property-group">
            <h4>Typography</h4>
            <div className="property-field">
              <label>Font Family</label>
              <select
                value={element.fontFamily || "Helvetica"}
                onChange={(e) => handleUpdate({ fontFamily: e.target.value })}
              >
                {fontFamilies.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="property-grid">
              <div className="property-field">
                <label>Size</label>
                <select
                  value={element.fontSize || 16}
                  onChange={(e) => handleUpdate({ fontSize: Number(e.target.value) })}
                >
                  {fontSizes.map((s) => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
              </div>
              <div className="property-field">
                <label>Color</label>
                <input
                  type="color"
                  value={element.color || "#000000"}
                  onChange={(e) => handleUpdate({ color: e.target.value })}
                />
              </div>
            </div>
            <div className="property-field">
              <label>Style</label>
              <div className="btn-group">
                <button
                  className={`btn btn-icon btn-sm ${element.fontWeight === "bold" ? "active" : ""}`}
                  onClick={() =>
                    handleUpdate({ fontWeight: element.fontWeight === "bold" ? "normal" : "bold" })
                  }
                >
                  <strong>B</strong>
                </button>
                <button
                  className={`btn btn-icon btn-sm ${element.fontStyle === "italic" ? "active" : ""}`}
                  onClick={() =>
                    handleUpdate({ fontStyle: element.fontStyle === "italic" ? "normal" : "italic" })
                  }
                >
                  <em>I</em>
                </button>
              </div>
            </div>
            <div className="property-field">
              <label>Text</label>
              <textarea
                value={element.text || ""}
                onChange={(e) => handleUpdate({ text: e.target.value })}
                rows={3}
                placeholder="Enter text..."
              />
            </div>
          </div>
        )}

        {/* Shape Properties */}
        {element.type === "shape" && (
          <div className="property-group">
            <h4>Style</h4>
            <div className="property-grid">
              <div className="property-field">
                <label>Fill</label>
                <input
                  type="color"
                  value={element.fill || "#3B82F6"}
                  onChange={(e) => handleUpdate({ fill: e.target.value })}
                />
              </div>
              <div className="property-field">
                <label>Stroke</label>
                <input
                  type="color"
                  value={element.stroke || "#000000"}
                  onChange={(e) => handleUpdate({ stroke: e.target.value })}
                />
              </div>
            </div>
            <div className="property-field">
              <label>Stroke Width</label>
              <div className="slider-row">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={element.strokeWidth || 2}
                  onChange={(e) => handleUpdate({ strokeWidth: Number(e.target.value) })}
                />
                <span>{element.strokeWidth || 2}px</span>
              </div>
            </div>
            <div className="property-field">
              <label>Opacity</label>
              <div className="slider-row">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={element.opacity ?? 1}
                  onChange={(e) => handleUpdate({ opacity: Number(e.target.value) })}
                />
                <span>{Math.round((element.opacity ?? 1) * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Draw Properties */}
        {element.type === "draw" && (
          <div className="property-group">
            <h4>Drawing Style</h4>
            <div className="property-grid">
              <div className="property-field">
                <label>Color</label>
                <input
                  type="color"
                  value={element.color || "#000000"}
                  onChange={(e) => handleUpdate({ color: e.target.value })}
                />
              </div>
              <div className="property-field">
                <label>Width</label>
                <div className="slider-row">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={element.strokeWidth || 2}
                    onChange={(e) => handleUpdate({ strokeWidth: Number(e.target.value) })}
                  />
                  <span>{element.strokeWidth || 2}px</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Highlight Properties */}
        {element.type === "highlight" && (
          <div className="property-group">
            <h4>Highlight Color</h4>
            <div className="color-swatches">
              {highlightColors.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${element.highlightColor === color ? "active" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleUpdate({ highlightColor: color })}
                />
              ))}
            </div>
            <div className="property-field">
              <label>Opacity</label>
              <div className="slider-row">
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={element.opacity ?? 0.3}
                  onChange={(e) => handleUpdate({ opacity: Number(e.target.value) })}
                />
                <span>{Math.round((element.opacity ?? 0.3) * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Image Properties */}
        {element.type === "image" && (
          <div className="property-group">
            <h4>Image</h4>
            <div className="property-field">
              <label>Opacity</label>
              <div className="slider-row">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={element.opacity ?? 1}
                  onChange={(e) => handleUpdate({ opacity: Number(e.target.value) })}
                />
                <span>{Math.round((element.opacity ?? 1) * 100)}%</span>
              </div>
            </div>
            {element.imageName && (
              <p className="image-name">{element.imageName}</p>
            )}
          </div>
        )}

        {/* Layer Controls */}
        <div className="property-group">
          <h4>Layer</h4>
          <div className="btn-group layer-btns">
            <button
              className="btn btn-sm"
              onClick={() => bringToFront(currentPage, element.id)}
            >
              ↑ Bring to Front
            </button>
            <button
              className="btn btn-sm"
              onClick={() => sendToBack(currentPage, element.id)}
            >
              ↓ Send to Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
