"use client";

import React, { useRef, useState, useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";

export default function UploadScreen() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file.type === "application/pdf") {
      useEditorStore.getState().setPdfFile(file);
    } else {
      alert("Please upload a PDF file.");
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="upload-screen">
      {/* Background decoration */}
      <div className="upload-bg-decor">
        <div className="upload-bg-blob upload-bg-blob-1" />
        <div className="upload-bg-blob upload-bg-blob-2" />
        <div className="upload-bg-blob upload-bg-blob-3" />
      </div>

      <div className="upload-content">
        <div className="upload-hero">
          <div className="upload-icon-wrapper">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="4" width="40" height="52" rx="6" fill="url(#docGrad)" opacity="0.9" />
              <rect x="16" y="8" width="40" height="52" rx="6" fill="url(#docGrad2)" />
              <path d="M24 28h24M24 34h24M24 40h16" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <circle cx="44" cy="48" r="12" fill="url(#plusGrad)" />
              <path d="M44 43v10M39 48h10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="docGrad" x1="8" y1="4" x2="48" y2="56">
                  <stop stopColor="#6366F1" />
                  <stop offset="1" stopColor="#8B5CF6" />
                </linearGradient>
                <linearGradient id="docGrad2" x1="16" y1="8" x2="56" y2="60">
                  <stop stopColor="#818CF8" />
                  <stop offset="1" stopColor="#A78BFA" />
                </linearGradient>
                <linearGradient id="plusGrad" x1="32" y1="36" x2="56" y2="60">
                  <stop stopColor="#10B981" />
                  <stop offset="1" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="upload-title">
            PDF Editor
          </h1>
          <p className="upload-subtitle">
            Edit PDFs directly in your browser — add text, images, shapes, drawings & more.
            <br />
            <span className="upload-subtitle-highlight">No uploads to any server. 100% private & local.</span>
          </p>
        </div>

        <div
          className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="upload-dropzone-content">
            <div className="upload-dropzone-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 6v20M12 14l8-8 8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 28v4a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="upload-dropzone-text">
              <strong>Click to upload</strong> or drag & drop your PDF
            </p>
            <p className="upload-dropzone-hint">PDF files only • Max 100MB</p>
          </div>
        </div>

        {/* Features */}
        <div className="upload-features">
          {[
            { icon: "✏️", title: "Add Text", desc: "Place text anywhere on the page" },
            { icon: "🖼", title: "Insert Images", desc: "Drag, resize & rotate images" },
            { icon: "🔺", title: "Draw Shapes", desc: "Rectangles, circles & lines" },
            { icon: "🖍", title: "Freehand Draw", desc: "Pen tool for annotations" },
            { icon: "💛", title: "Highlight", desc: "Highlight important areas" },
            { icon: "📥", title: "Export PDF", desc: "Download your edited file" },
          ].map((feature) => (
            <div key={feature.title} className="upload-feature-card">
              <span className="upload-feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
