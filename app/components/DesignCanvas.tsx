// app/components/DesignCanvas.tsx
"use client";

import dynamic from "next/dynamic";

// load the file you just created ONLY in the browser
const CanvasInner = dynamic(() => import("./CanvasInner"), { ssr: false });

export default function DesignCanvas() {
  return <CanvasInner />;
}
