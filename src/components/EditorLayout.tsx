"use client";

import React from "react";
import { useEditorStore } from "@/store/editorStore";
import Toolbar from "./Toolbar";
import ThumbnailSidebar from "./ThumbnailSidebar";
import PdfViewer from "./PdfViewer";
import PropertiesPanel from "./PropertiesPanel";
import UploadScreen from "./UploadScreen";

export default function EditorLayout() {
  const { pdfUrl, selectedElementId } = useEditorStore();

  return (
    <div className="editor-root">
      <Toolbar />
      {!pdfUrl ? (
        <UploadScreen />
      ) : (
        <div className="editor-workspace">
          <ThumbnailSidebar />
          <div className="editor-main">
            <PdfViewer />
          </div>
          <PropertiesPanel />
        </div>
      )}
    </div>
  );
}
