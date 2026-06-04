import { create } from "zustand";
import { EditorState, PageState, EditorElement, ToolType } from "@/types/editor";

const MAX_HISTORY = 50;

export const useEditorStore = create<EditorState>((set, get) => ({
  // PDF state
  pdfFile: null,
  pdfUrl: null,
  totalPages: 0,
  currentPage: 1,
  zoom: 1,
  pageWidth: 612,
  pageHeight: 792,

  // Editor state
  pages: [],
  selectedElementId: null,
  activeTool: "select",
  extractedPagesText: [],

  // Drawing state
  isDrawing: false,
  currentDrawPoints: [],

  // Sidebar
  showThumbnails: true,

  // History
  undoStack: [],
  redoStack: [],

  // PDF Actions
  setPdfFile: (file: File) => {
    const url = URL.createObjectURL(file);
    set({
      pdfFile: file,
      pdfUrl: url,
      currentPage: 1,
      pages: [],
      selectedElementId: null,
      extractedPagesText: []
    });
  },

  setTotalPages: (total: number) => {
    const { pages } = get();
    const newPages: PageState[] = [];
    for (let i = 1; i <= total; i++) {
      const existingPage = pages.find((p) => p.pageNumber === i);
      newPages.push(existingPage || { pageNumber: i, elements: [] });
    }
    set({ totalPages: total, pages: newPages });
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page, selectedElementId: null });
  },

  setZoom: (zoom: number) => {
    set({ zoom: Math.max(0.25, Math.min(3, zoom)) });
  },

  setPageDimensions: (width: number, height: number) => {
    set({ pageWidth: width, pageHeight: height });
  },

  setActiveTool: (tool: ToolType) => {
    set({ activeTool: tool, selectedElementId: tool !== "select" ? null : get().selectedElementId });
  },

  setShowThumbnails: (show: boolean) => {
    set({ showThumbnails: show });
  },

  // Element Actions
  addElement: (pageNumber: number, element: EditorElement) => {
    const { pages } = get();
    get().saveToHistory();
    const newPages = pages.map((page) => {
      if (page.pageNumber === pageNumber) {
        return { ...page, elements: [...page.elements, element] };
      }
      return page;
    });
    set({ pages: newPages, redoStack: [] });
  },

  addExtractedElements: (pageNumber: number, elements: EditorElement[]) => {
    const { pages, extractedPagesText } = get();
    if (extractedPagesText.includes(pageNumber)) return;
    
    const newPages = pages.map((page) => {
      if (page.pageNumber === pageNumber) {
        // Only append elements that don't already exist
        const existingIds = new Set(page.elements.map(el => el.id));
        const filteredNew = elements.filter(el => !existingIds.has(el.id));
        return { ...page, elements: [...page.elements, ...filteredNew] };
      }
      return page;
    });
    
    set({
      pages: newPages,
      extractedPagesText: [...extractedPagesText, pageNumber]
    });
  },

  updateElement: (pageNumber: number, elementId: string, updates: Partial<EditorElement>) => {
    const { pages } = get();
    const newPages = pages.map((page) => {
      if (page.pageNumber === pageNumber) {
        return {
          ...page,
          elements: page.elements.map((el) =>
            el.id === elementId ? { ...el, ...updates } : el
          ),
        };
      }
      return page;
    });
    set({ pages: newPages });
  },

  deleteElement: (pageNumber: number, elementId: string) => {
    const { pages } = get();
    get().saveToHistory();
    const newPages = pages.map((page) => {
      if (page.pageNumber === pageNumber) {
        // If it is an original PDF text element, mark it as isDeleted: true so we can render a cover.
        // Otherwise, completely remove it.
        const elements = page.elements
          .map((el) => {
            if (el.id === elementId) {
              if (el.isOriginalPdfText) {
                return { ...el, isDeleted: true };
              }
              return null;
            }
            return el;
          })
          .filter(Boolean) as EditorElement[];

        return {
          ...page,
          elements,
        };
      }
      return page;
    });
    set({ pages: newPages, selectedElementId: null, redoStack: [] });
  },

  setSelectedElementId: (id: string | null) => {
    set({ selectedElementId: id });
  },

  duplicateElement: (pageNumber: number, elementId: string) => {
    const { pages } = get();
    const page = pages.find((p) => p.pageNumber === pageNumber);
    if (!page) return;
    const element = page.elements.find((el) => el.id === elementId);
    if (!element) return;
    get().saveToHistory();
    const newElement: EditorElement = {
      ...element,
      id: crypto.randomUUID(),
      x: element.x + 20,
      y: element.y + 20,
      isOriginalPdfText: undefined,
      originalText: undefined,
      originalTextBbox: undefined,
      isDeleted: undefined,
    };
    const newPages = pages.map((p) => {
      if (p.pageNumber === pageNumber) {
        return { ...p, elements: [...p.elements, newElement] };
      }
      return p;
    });
    set({ pages: newPages, selectedElementId: newElement.id, redoStack: [] });
  },

  // Layer ordering
  bringToFront: (pageNumber: number, elementId: string) => {
    const { pages } = get();
    get().saveToHistory();
    const newPages = pages.map((page) => {
      if (page.pageNumber === pageNumber) {
        const element = page.elements.find((el) => el.id === elementId);
        if (!element) return page;
        const others = page.elements.filter((el) => el.id !== elementId);
        return { ...page, elements: [...others, element] };
      }
      return page;
    });
    set({ pages: newPages, redoStack: [] });
  },

  sendToBack: (pageNumber: number, elementId: string) => {
    const { pages } = get();
    get().saveToHistory();
    const newPages = pages.map((page) => {
      if (page.pageNumber === pageNumber) {
        const element = page.elements.find((el) => el.id === elementId);
        if (!element) return page;
        const others = page.elements.filter((el) => el.id !== elementId);
        return { ...page, elements: [element, ...others] };
      }
      return page;
    });
    set({ pages: newPages, redoStack: [] });
  },

  // Drawing
  setIsDrawing: (drawing: boolean) => {
    set({ isDrawing: drawing });
  },

  setCurrentDrawPoints: (points: number[]) => {
    set({ currentDrawPoints: points });
  },

  // History
  saveToHistory: () => {
    const { pages, undoStack } = get();
    const snapshot = JSON.parse(JSON.stringify(pages));
    const newUndoStack = [...undoStack, snapshot].slice(-MAX_HISTORY);
    set({ undoStack: newUndoStack });
  },

  undo: () => {
    const { undoStack, pages } = get();
    if (undoStack.length === 0) return;
    const newUndoStack = [...undoStack];
    const previousState = newUndoStack.pop()!;
    const currentSnapshot = JSON.parse(JSON.stringify(pages));
    set({
      pages: previousState,
      undoStack: newUndoStack,
      redoStack: [...get().redoStack, currentSnapshot],
      selectedElementId: null,
    });
  },

  redo: () => {
    const { redoStack, pages } = get();
    if (redoStack.length === 0) return;
    const newRedoStack = [...redoStack];
    const nextState = newRedoStack.pop()!;
    const currentSnapshot = JSON.parse(JSON.stringify(pages));
    set({
      pages: nextState,
      redoStack: newRedoStack,
      undoStack: [...get().undoStack, currentSnapshot],
      selectedElementId: null,
    });
  },

  // Reset
  resetEditor: () => {
    const { pdfUrl } = get();
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    set({
      pdfFile: null,
      pdfUrl: null,
      totalPages: 0,
      currentPage: 1,
      zoom: 1,
      pages: [],
      selectedElementId: null,
      activeTool: "select",
      extractedPagesText: [],
      isDrawing: false,
      currentDrawPoints: [],
      showThumbnails: true,
      undoStack: [],
      redoStack: [],
    });
  },
}));
