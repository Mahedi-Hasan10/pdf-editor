"use client";

import dynamic from "next/dynamic";

const EditorLayout = dynamic(() => import("@/components/EditorLayout"), {
  ssr: false,
  loading: () => (
    <div className="app-loading">
      <div className="app-loading-spinner" />
      <p>Loading PDF Editor...</p>
    </div>
  ),
});

export default function Home() {
  return <EditorLayout />;
}
