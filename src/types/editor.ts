export type ElementType = "text" | "image" | "shape" | "draw" | "highlight" | "table";

export type ShapeType = "rectangle" | "circle" | "line";

export type ToolType =
  | "select"
  | "text"
  | "image"
  | "draw"
  | "highlight"
  | "shape-rectangle"
  | "shape-circle"
  | "shape-line"
  | "table"
  | "eraser";

export interface EditorElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fontWeight?: string;
  color?: string;
  align?: string;
  // Image properties
  src?: string;
  imageName?: string;
  // Shape properties
  shapeType?: ShapeType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  // Draw properties
  points?: number[];
  // Highlight properties
  highlightColor?: string;
  // Original PDF text edit support
  isOriginalPdfText?: boolean;
  originalText?: string;
  originalTextBbox?: { x: number; y: number; width: number; height: number };
  isDeleted?: boolean;
  // Table properties
  rows?: number;
  cols?: number;
  tableData?: string[][];
  colWidths?: number[];
  rowHeights?: number[];
}

export interface PageState {
  pageNumber: number;
  elements: EditorElement[];
}

export interface EditorState {
  // PDF state
  pdfFile: File | null;
  pdfUrl: string | null;
  totalPages: number;
  currentPage: number;
  zoom: number;
  // Page dimensions (from rendered PDF)
  pageWidth: number;
  pageHeight: number;
  // Editor state
  pages: PageState[];
  selectedElementId: string | null;
  activeTool: ToolType;
  // Extracted pages tracking
  extractedPagesText: number[];
  // Drawing state
  isDrawing: boolean;
  currentDrawPoints: number[];
  // Sidebar
  showThumbnails: boolean;
  // History
  undoStack: PageState[][];
  redoStack: PageState[][];
  // Actions
  setPdfFile: (file: File) => void;
  setTotalPages: (total: number) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setPageDimensions: (width: number, height: number) => void;
  setActiveTool: (tool: ToolType) => void;
  setShowThumbnails: (show: boolean) => void;
  // Element actions
  addElement: (pageNumber: number, element: EditorElement) => void;
  addExtractedElements: (pageNumber: number, elements: EditorElement[]) => void;
  updateElement: (pageNumber: number, elementId: string, updates: Partial<EditorElement>) => void;
  deleteElement: (pageNumber: number, elementId: string) => void;
  setSelectedElementId: (id: string | null) => void;
  duplicateElement: (pageNumber: number, elementId: string) => void;
  // Layer ordering
  bringToFront: (pageNumber: number, elementId: string) => void;
  sendToBack: (pageNumber: number, elementId: string) => void;
  // Drawing
  setIsDrawing: (drawing: boolean) => void;
  setCurrentDrawPoints: (points: number[]) => void;
  // History
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  // Reset
  resetEditor: () => void;
}
