"use client";

import React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useEditorStore } from "@/store/editorStore";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function ThumbnailSidebar() {
  const { pdfUrl, totalPages, currentPage, setCurrentPage, showThumbnails, pages } =
    useEditorStore();

  if (!pdfUrl || !showThumbnails) return null;

  const thumbnailPages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="thumbnail-sidebar">
      <div className="thumbnail-header">
        <span>Pages</span>
        <span className="badge">{totalPages}</span>
      </div>
      <div className="thumbnail-list">
        <Document file={pdfUrl} loading={null}>
          {thumbnailPages.map((pageNum) => {
            const pageState = pages.find((p) => p.pageNumber === pageNum);
            const hasElements = pageState && pageState.elements.length > 0;

            return (
              <button
                key={pageNum}
                className={`thumbnail-item ${currentPage === pageNum ? "active" : ""}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                <div className="thumbnail-preview">
                  <Page
                    pageNumber={pageNum}
                    width={140}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                  {hasElements && <div className="thumbnail-edited-badge">✎</div>}
                </div>
                <span className="thumbnail-label">{pageNum}</span>
              </button>
            );
          })}
        </Document>
      </div>
    </div>
  );
}
