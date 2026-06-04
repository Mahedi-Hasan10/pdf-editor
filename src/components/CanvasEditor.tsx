"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { Stage, Layer, Rect, Circle, Line, Text, Image as KonvaImage, Transformer, Group } from "react-konva";
import Konva from "konva";
import { useEditorStore } from "@/store/editorStore";
import { EditorElement } from "@/types/editor";

interface CanvasEditorProps {
  pageWidth: number;
  pageHeight: number;
}

export default function CanvasEditor({ pageWidth, pageHeight }: CanvasEditorProps) {
  const {
    currentPage,
    pages,
    activeTool,
    selectedElementId,
    isDrawing,
    currentDrawPoints,
    zoom,
    addElement,
    updateElement,
    deleteElement,
    setSelectedElementId,
    setIsDrawing,
    setCurrentDrawPoints,
    setActiveTool,
    saveToHistory,
  } = useEditorStore();

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const page = pages.find((p) => p.pageNumber === currentPage);
  const elements = page?.elements || [];

  // Load images for image elements
  useEffect(() => {
    elements.forEach((el) => {
      if (el.type === "image" && el.src && !loadedImages[el.id]) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setLoadedImages((prev) => ({ ...prev, [el.id]: img }));
        };
        img.src = el.src;
      }
    });
  }, [elements, loadedImages]);

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    if (selectedElementId && activeTool === "select") {
      const node = stageRef.current.findOne(`#${selectedElementId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedElementId, activeTool, elements]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementId) {
          deleteElement(currentPage, selectedElementId);
        }
      }

      if (e.key === "Escape") {
        setSelectedElementId(null);
        setActiveTool("select");
        setEditingTextId(null);
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "v": setActiveTool("select"); break;
          case "t": setActiveTool("text"); break;
          case "b": setActiveTool("table"); break;
          case "d": setActiveTool("draw"); break;
          case "h": setActiveTool("highlight"); break;
          case "r": setActiveTool("shape-rectangle"); break;
          case "c": setActiveTool("shape-circle"); break;
          case "l": setActiveTool("shape-line"); break;
          case "e": setActiveTool("eraser"); break;
        }
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          useEditorStore.getState().redo();
        } else {
          useEditorStore.getState().undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, currentPage, deleteElement, setSelectedElementId, setActiveTool]);

  const getPointerPosition = useCallback(() => {
    if (!stageRef.current) return { x: 0, y: 0 };
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return { x: pos.x / zoom, y: pos.y / zoom };
  }, [zoom]);

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<any>) => {
      const pos = getPointerPosition();
      const clickedOnEmpty = e.target === e.target.getStage();

      if (activeTool === "select") {
        if (clickedOnEmpty) {
          setSelectedElementId(null);
          setEditingTextId(null);
        }
        return;
      }

      if (activeTool === "eraser") {
        if (!clickedOnEmpty) {
          const nodeId = e.target.id() || e.target.parent?.id();
          if (nodeId) {
            deleteElement(currentPage, nodeId);
          }
        }
        return;
      }

      if (activeTool === "text") {
        const newElement: EditorElement = {
          id: crypto.randomUUID(),
          type: "text",
          x: pos.x,
          y: pos.y,
          width: 200,
          height: 30,
          rotation: 0,
          text: "Double click to edit",
          fontSize: 16,
          fontFamily: "Helvetica",
          fontWeight: "normal",
          fontStyle: "normal",
          color: "#000000",
        };
        addElement(currentPage, newElement);
        setSelectedElementId(newElement.id);
        setActiveTool("select");
        return;
      }

      if (activeTool === "image") {
        imageInputRef.current?.click();
        return;
      }

      if (activeTool === "draw") {
        setIsDrawing(true);
        setCurrentDrawPoints([pos.x, pos.y]);
        return;
      }

      if (activeTool === "highlight") {
        const newElement: EditorElement = {
          id: crypto.randomUUID(),
          type: "highlight",
          x: pos.x,
          y: pos.y,
          width: 150,
          height: 25,
          rotation: 0,
          highlightColor: "#FFFF00",
          opacity: 0.3,
        };
        addElement(currentPage, newElement);
        setSelectedElementId(newElement.id);
        setActiveTool("select");
        return;
      }

      if (activeTool.startsWith("shape-")) {
        const shapeType = activeTool.replace("shape-", "") as "rectangle" | "circle" | "line";
        const newElement: EditorElement = {
          id: crypto.randomUUID(),
          type: "shape",
          shapeType,
          x: pos.x,
          y: pos.y,
          width: shapeType === "line" ? 150 : 120,
          height: shapeType === "line" ? 0 : 80,
          rotation: 0,
          fill: shapeType === "line" ? "transparent" : "#3B82F6",
          stroke: "#1E40AF",
          strokeWidth: 2,
          opacity: 0.8,
        };
        addElement(currentPage, newElement);
        setSelectedElementId(newElement.id);
        setActiveTool("select");
        return;
      }

      if (activeTool === "table") {
        const rows = 3;
        const cols = 3;
        const tableData = [
          ["Header 1", "Header 2", "Header 3"],
          ["Row 1, Col 1", "Row 1, Col 2", "Row 1, Col 3"],
          ["Row 2, Col 1", "Row 2, Col 2", "Row 2, Col 3"],
        ];
        const colWidths = [120, 120, 120];
        const rowHeights = [30, 25, 25];
        const width = colWidths.reduce((a, b) => a + b, 0);
        const height = rowHeights.reduce((a, b) => a + b, 0);

        const newElement: EditorElement = {
          id: crypto.randomUUID(),
          type: "table",
          x: pos.x,
          y: pos.y,
          width,
          height,
          rotation: 0,
          rows,
          cols,
          tableData,
          colWidths,
          rowHeights,
          fontSize: 12,
          fontFamily: "Helvetica",
          fontWeight: "normal",
          fontStyle: "normal",
          color: "#000000",
        };
        addElement(currentPage, newElement);
        setSelectedElementId(newElement.id);
        setActiveTool("select");
        return;
      }
    },
    [activeTool, currentPage, getPointerPosition, addElement, setSelectedElementId, setActiveTool, deleteElement, setIsDrawing, setCurrentDrawPoints]
  );

  const handleStageMouseMove = useCallback(() => {
    if (!isDrawing || activeTool !== "draw") return;
    const pos = getPointerPosition();
    setCurrentDrawPoints([...currentDrawPoints, pos.x, pos.y]);
  }, [isDrawing, activeTool, getPointerPosition, currentDrawPoints, setCurrentDrawPoints]);

  const handleStageMouseUp = useCallback(() => {
    if (!isDrawing || activeTool !== "draw") return;
    setIsDrawing(false);

    if (currentDrawPoints.length >= 4) {
      // Make points relative to the first point
      const originX = currentDrawPoints[0];
      const originY = currentDrawPoints[1];
      const relativePoints = currentDrawPoints.map((val, index) =>
        index % 2 === 0 ? val - originX : val - originY
      );

      const newElement: EditorElement = {
        id: crypto.randomUUID(),
        type: "draw",
        x: originX,
        y: originY,
        width: 0,
        height: 0,
        rotation: 0,
        points: relativePoints,
        color: "#000000",
        strokeWidth: 2,
      };
      addElement(currentPage, newElement);
    }
    setCurrentDrawPoints([]);
  }, [isDrawing, activeTool, currentDrawPoints, addElement, currentPage, setIsDrawing, setCurrentDrawPoints]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxW = 300;
        const ratio = img.width / img.height;
        const w = Math.min(img.width, maxW);
        const h = w / ratio;

        const newElement: EditorElement = {
          id: crypto.randomUUID(),
          type: "image",
          x: 50,
          y: 50,
          width: w,
          height: h,
          rotation: 0,
          src,
          imageName: file.name,
          opacity: 1,
        };
        addElement(currentPage, newElement);
        setSelectedElementId(newElement.id);
        setActiveTool("select");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  };

  const handleDragEnd = (elementId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    saveToHistory();
    updateElement(currentPage, elementId, {
      x: e.target.x() / zoom,
      y: e.target.y() / zoom,
    });
  };

  const handleTransformEnd = (elementId: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    saveToHistory();

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and apply the scale to dimensions
    node.scaleX(1);
    node.scaleY(1);

    const el = pages
      .find((p) => p.pageNumber === currentPage)
      ?.elements.find((item) => item.id === elementId);

    const newWidth = Math.max(5, node.width() * scaleX);
    const newHeight = Math.max(5, node.height() * scaleY);

    const updates: Partial<EditorElement> = {
      x: node.x() / zoom,
      y: node.y() / zoom,
      width: newWidth,
      height: newHeight,
      rotation: node.rotation(),
    };

    if (el?.type === "table" && el.colWidths && el.rowHeights) {
      updates.colWidths = el.colWidths.map((w) => w * scaleX);
      updates.rowHeights = el.rowHeights.map((h) => h * scaleY);
    }

    updateElement(currentPage, elementId, updates);
  };

  const handleTextDblClick = (element: EditorElement) => {
    if (element.type !== "text") return;
    setEditingTextId(element.id);

    // Get stage container
    const stage = stageRef.current;
    if (!stage) return;

    const stageBox = stage.container().getBoundingClientRect();
    const textNode = stage.findOne(`#${element.id}`);
    if (!textNode) return;

    const textPosition = textNode.getClientRect();

    // Create textarea overlay
    const textarea = document.createElement("textarea");
    textarea.value = element.text || "";
    textarea.style.position = "absolute";
    textarea.style.top = `${stageBox.top + textPosition.y}px`;
    textarea.style.left = `${stageBox.left + textPosition.x}px`;
    textarea.style.width = `${textPosition.width + 10}px`;
    textarea.style.height = `${textPosition.height + 10}px`;
    textarea.style.fontSize = `${(element.fontSize || 16) * zoom}px`;
    textarea.style.fontFamily = element.fontFamily || "Helvetica";
    textarea.style.fontWeight = element.fontWeight || "normal";
    textarea.style.fontStyle = element.fontStyle || "normal";
    textarea.style.color = element.color || "#000000";
    textarea.style.border = "2px solid #6366F1";
    textarea.style.borderRadius = "4px";
    textarea.style.padding = "2px 4px";
    textarea.style.margin = "0";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.background = "rgba(255,255,255,0.95)";
    textarea.style.zIndex = "10000";
    textarea.style.lineHeight = "1.2";
    textarea.style.overflow = "hidden";
    textarea.style.transformOrigin = "left top";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const removeTextarea = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      let maxWidth = element.width;
      const lines = textarea.value.split("\n");

      if (context) {
        context.font = `${element.fontWeight || "normal"} ${element.fontStyle || "normal"} ${element.fontSize || 16}px ${element.fontFamily || "Helvetica"}`;
        const measuredWidths = lines.map((line) => context.measureText(line).width);
        maxWidth = Math.max(...measuredWidths) + 15; // padding
      }

      const newHeight = lines.length * (element.fontSize || 16) * 1.25;

      updateElement(currentPage, element.id, {
        text: textarea.value,
        width: maxWidth,
        height: newHeight,
      });
      document.body.removeChild(textarea);
      setEditingTextId(null);
    };

    textarea.addEventListener("blur", removeTextarea);
    textarea.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" && !evt.shiftKey) {
        removeTextarea();
      }
      if (evt.key === "Escape") {
        removeTextarea();
      }
    });
  };

  const handleCellDblClick = (element: EditorElement, rowIndex: number, colIndex: number) => {
    const stage = stageRef.current;
    if (!stage) return;

    const stageBox = stage.container().getBoundingClientRect();
    const colWidths = element.colWidths || [];
    const rowHeights = element.rowHeights || [];

    let cellRelativeX = 0;
    for (let c = 0; c < colIndex; c++) {
      cellRelativeX += colWidths[c] || 100;
    }

    let cellRelativeY = 0;
    for (let r = 0; r < rowIndex; r++) {
      cellRelativeY += rowHeights[r] || 25;
    }

    // Absolute position in editor pixels
    const cellAbsX = (element.x + cellRelativeX) * zoom;
    const cellAbsY = (element.y + cellRelativeY) * zoom;
    const cellWidth = (colWidths[colIndex] || 100) * zoom;
    const cellHeight = (rowHeights[rowIndex] || 25) * zoom;

    // Create input overlay
    const input = document.createElement("input");
    input.type = "text";
    input.value = element.tableData?.[rowIndex]?.[colIndex] || "";
    input.style.position = "absolute";
    input.style.top = `${stageBox.top + cellAbsY}px`;
    input.style.left = `${stageBox.left + cellAbsX}px`;
    input.style.width = `${cellWidth}px`;
    input.style.height = `${cellHeight}px`;
    input.style.fontSize = `${(element.fontSize || 12) * zoom}px`;
    input.style.fontFamily = element.fontFamily || "Helvetica";
    input.style.fontWeight = rowIndex === 0 ? "bold" : "normal";
    input.style.color = element.color || "#000000";
    input.style.border = "2px solid #6366F1";
    input.style.padding = "2px 4px";
    input.style.margin = "0";
    input.style.outline = "none";
    input.style.background = "white";
    input.style.zIndex = "10000";

    document.body.appendChild(input);
    input.focus();
    input.select();

    const removeInput = () => {
      const newTableData = element.tableData ? element.tableData.map((row) => [...row]) : [];
      if (newTableData[rowIndex]) {
        newTableData[rowIndex][colIndex] = input.value;
      }
      updateElement(currentPage, element.id, { tableData: newTableData });
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    input.addEventListener("blur", removeInput);
    input.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        removeInput();
      }
      if (evt.key === "Escape") {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }
    });
  };

  const renderElement = (element: EditorElement) => {
    if (element.isDeleted) {
      if (element.isOriginalPdfText && element.originalTextBbox) {
        return (
          <Rect
            key={element.id}
            x={element.originalTextBbox.x * zoom}
            y={element.originalTextBbox.y * zoom}
            width={element.originalTextBbox.width * zoom}
            height={element.originalTextBbox.height * zoom}
            fill="white"
          />
        );
      }
      return null;
    }

    const isSelected = selectedElementId === element.id;
    const isDraggable = activeTool === "select";
    const commonProps = {
      id: element.id,
      x: element.x * zoom,
      y: element.y * zoom,
      rotation: element.rotation,
      draggable: isDraggable,
      onClick: () => {
        if (activeTool === "eraser") {
          deleteElement(currentPage, element.id);
          return;
        }
        setSelectedElementId(element.id);
        setActiveTool("select");
      },
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(element.id, e),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(element.id, e),
    };

    switch (element.type) {
      case "text": {
        const originalBbox = element.originalTextBbox;
        const showCover =
          element.isOriginalPdfText &&
          originalBbox &&
          (element.text !== element.originalText ||
            Math.abs(element.x - originalBbox.x) > 1.0 ||
            Math.abs(element.y - originalBbox.y) > 1.0 ||
            selectedElementId === element.id);

        // If it's an original PDF text that is NOT modified/selected, render it as transparent
        // to avoid double rendering with the PDF canvas underneath.
        const textFillColor = (!element.isOriginalPdfText || showCover)
          ? (element.color || "#000000")
          : "rgba(0, 0, 0, 0.01)";

        const textComponent = (
          <Text
            key={element.id}
            {...commonProps}
            text={element.text || ""}
            fontSize={(element.fontSize || 16) * zoom}
            fontFamily={element.fontFamily || "Helvetica"}
            fontStyle={
              (element.fontStyle === "italic" ? "italic " : "") +
              (element.fontWeight === "bold" ? "bold" : "normal")
            }
            fill={textFillColor}
            width={element.width * zoom}
            visible={editingTextId !== element.id}
            onDblClick={() => handleTextDblClick(element)}
            onDblTap={() => handleTextDblClick(element)}
          />
        );

        if (showCover && originalBbox) {
          return (
            <Group key={element.id}>
              <Rect
                x={originalBbox.x * zoom}
                y={originalBbox.y * zoom}
                width={originalBbox.width * zoom}
                height={originalBbox.height * zoom}
                fill="white"
              />
              {textComponent}
            </Group>
          );
        }

        // For untouched original text, wrap in a Group with a transparent Rect overlay to capture clicks
        if (element.isOriginalPdfText && !showCover) {
          return (
            <Group key={element.id}>
              <Rect
                x={element.x * zoom}
                y={element.y * zoom}
                width={element.width * zoom}
                height={element.height * zoom}
                fill="rgba(0, 0, 0, 0.01)" // captures events
                onClick={commonProps.onClick}
                onDblClick={() => handleTextDblClick(element)}
                onDblTap={() => handleTextDblClick(element)}
              />
              {textComponent}
            </Group>
          );
        }

        return textComponent;
      }

      case "table": {
        const colWidths = element.colWidths || [];
        const rowHeights = element.rowHeights || [];
        const tableData = element.tableData || [];
        const rows = element.rows || 3;
        const cols = element.cols || 3;

        const cells: React.ReactNode[] = [];

        let currentY = 0;
        for (let r = 0; r < rows; r++) {
          const rowHeight = (rowHeights[r] || 25) * zoom;
          let currentX = 0;
          for (let c = 0; c < cols; c++) {
            const colWidth = (colWidths[c] || 100) * zoom;
            const cellText = tableData[r]?.[c] || "";
            const isHeader = r === 0;

            const cellX = currentX;
            const cellY = currentY;
            const cellId = `${element.id}_cell_${r}_${c}`;

            cells.push(
              <Group key={cellId} x={cellX} y={cellY}>
                <Rect
                  width={colWidth}
                  height={rowHeight}
                  fill={isHeader ? "#F3F4F6" : "transparent"}
                  stroke="#D1D5DB"
                  strokeWidth={1}
                />
                <Text
                  x={5 * zoom}
                  y={(rowHeight - (element.fontSize || 12) * zoom) / 2}
                  text={cellText}
                  width={colWidth - 10 * zoom}
                  fontSize={(element.fontSize || 12) * zoom}
                  fontFamily={element.fontFamily || "Helvetica"}
                  fontStyle={
                    isHeader
                      ? "bold"
                      : (element.fontStyle === "italic" ? "italic " : "") +
                        (element.fontWeight === "bold" ? "bold" : "normal")
                  }
                  fill={element.color || "#000000"}
                  ellipsis={true}
                  wrap="none"
                  onDblClick={() => handleCellDblClick(element, r, c)}
                  onDblTap={() => handleCellDblClick(element, r, c)}
                />
              </Group>
            );

            currentX += colWidth;
          }
          currentY += rowHeight;
        }

        return (
          <Group
            key={element.id}
            {...commonProps}
            width={element.width * zoom}
            height={element.height * zoom}
          >
            {cells}
          </Group>
        );
      }

      case "image": {
        const img = loadedImages[element.id];
        if (!img) return null;
        return (
          <KonvaImage
            key={element.id}
            {...commonProps}
            image={img}
            width={element.width * zoom}
            height={element.height * zoom}
            opacity={element.opacity ?? 1}
          />
        );
      }

      case "shape": {
        if (element.shapeType === "rectangle") {
          return (
            <Rect
              key={element.id}
              {...commonProps}
              width={element.width * zoom}
              height={element.height * zoom}
              fill={element.fill || "#3B82F6"}
              stroke={element.stroke}
              strokeWidth={(element.strokeWidth || 2) * zoom}
              opacity={element.opacity ?? 0.8}
              cornerRadius={4}
            />
          );
        }
        if (element.shapeType === "circle") {
          return (
            <Circle
              key={element.id}
              {...commonProps}
              x={(element.x + element.width / 2) * zoom}
              y={(element.y + element.height / 2) * zoom}
              radiusX={(element.width / 2) * zoom}
              radiusY={(element.height / 2) * zoom}
              fill={element.fill || "#3B82F6"}
              stroke={element.stroke}
              strokeWidth={(element.strokeWidth || 2) * zoom}
              opacity={element.opacity ?? 0.8}
              scaleX={1}
              scaleY={element.height / element.width}
            />
          );
        }
        if (element.shapeType === "line") {
          return (
            <Line
              key={element.id}
              {...commonProps}
              points={[0, 0, element.width * zoom, element.height * zoom]}
              stroke={element.stroke || "#000000"}
              strokeWidth={(element.strokeWidth || 2) * zoom}
              opacity={element.opacity ?? 1}
              lineCap="round"
            />
          );
        }
        return null;
      }

      case "draw":
        return (
          <Line
            key={element.id}
            {...commonProps}
            points={(element.points || []).map((p) => p * zoom)}
            stroke={element.color || "#000000"}
            strokeWidth={(element.strokeWidth || 2) * zoom}
            lineCap="round"
            lineJoin="round"
            tension={0.5}
          />
        );

      case "highlight":
        return (
          <Rect
            key={element.id}
            {...commonProps}
            width={element.width * zoom}
            height={element.height * zoom}
            fill={element.highlightColor || "#FFFF00"}
            opacity={element.opacity ?? 0.3}
            cornerRadius={2}
          />
        );

      default:
        return null;
    }
  };

  const getCursorStyle = () => {
    switch (activeTool) {
      case "text": return "text";
      case "draw": return "crosshair";
      case "highlight": return "crosshair";
      case "eraser": return "not-allowed";
      case "image": return "copy";
      default:
        if (activeTool.startsWith("shape-")) return "crosshair";
        return "default";
    }
  };

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <Stage
        ref={stageRef}
        width={pageWidth * zoom}
        height={pageHeight * zoom}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={handleStageMouseDown}
        onTouchMove={handleStageMouseMove}
        onTouchEnd={handleStageMouseUp}
        style={{ cursor: getCursorStyle() }}
      >
        <Layer>
          {elements.map(renderElement)}

          {/* Live drawing line */}
          {isDrawing && currentDrawPoints.length >= 4 && (
            <Line
              points={currentDrawPoints.map((p) => p * zoom)}
              stroke="#000000"
              strokeWidth={2 * zoom}
              lineCap="round"
              lineJoin="round"
              tension={0.5}
            />
          )}

          {/* Transformer */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
            rotateEnabled={true}
            enabledAnchors={[
              "top-left",
              "top-center",
              "top-right",
              "middle-right",
              "bottom-right",
              "bottom-center",
              "bottom-left",
              "middle-left",
            ]}
            borderStroke="#6366F1"
            anchorFill="#6366F1"
            anchorStroke="#4F46E5"
            anchorSize={8}
            anchorCornerRadius={2}
          />
        </Layer>
      </Stage>
    </>
  );
}
