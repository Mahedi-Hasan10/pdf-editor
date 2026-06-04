You are a Senior Frontend Engineer and UI/UX Architect.

Your task is to build a production-quality, browser-based PDF Editor (NO BACKEND) similar to Smallpdf / iLovePDF / Adobe Acrobat web editor (lite version).

The entire application must run fully in the browser.

---

## 🚀 TECH STACK (MANDATORY)

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- react-pdf (for rendering PDFs)
- react-konva (for canvas-based editing layer)
- pdf-lib (for exporting edited PDF)
- Zustand (state management)

NO backend, NO database, NO server APIs.

---

## 🎯 CORE GOAL

Build a fully functional client-side PDF editor where users can:

- Upload PDF file
- View PDF pages
- Add/edit/move/resize elements on top of PDF
- Export modified PDF as a downloadable file

Everything must work locally in the browser.

---

## 📄 FEATURE REQUIREMENTS (MVP)

### 1. PDF Upload & Viewer
- Upload PDF via file input
- Render PDF pages using react-pdf
- Show page navigation (next/prev)
- Zoom in/out support
- Optional thumbnails sidebar

---

### 2. Editing Layer (MOST IMPORTANT)

Each PDF page must have a canvas overlay using Konva.

Users can:

- Add text anywhere
- Edit text inline
- Drag text around
- Resize text box
- Change font size, color, weight

- Add images (upload from device)
- Drag / resize / rotate images

- Draw freehand (pen tool)
- Add shapes (rectangle, circle, line)

- Highlight text areas

---

### 3. Drag / Resize System

All elements must support:

- Dragging
- Resizing (Konva Transformer)
- Rotation
- Layer ordering (bring front / send back)

---

### 4. Export to PDF (CRITICAL)

Use `pdf-lib` to:

- Load original uploaded PDF
- Overlay all editor elements onto correct pages
- Merge everything into final PDF
- Download result as `edited.pdf`

IMPORTANT:
- Editing happens only in UI layer (NOT modifying original PDF directly)
- Store all changes in JSON state
- Rebuild final PDF on export

---

## 🧠 STATE MANAGEMENT (ZUSTAND)

Maintain editor state like:

```ts id="state1"
{
  pages: [
    {
      pageNumber: number,
      elements: [
        {
          id: string,
          type: "text" | "image" | "shape" | "draw",
          x: number,
          y: number,
          width?: number,
          height?: number,
          rotation?: number,
          fontSize?: number,
          color?: string,
          content?: string,
          src?: string
        }
      ]
    }
  ],
  selectedElementId: string | null
}