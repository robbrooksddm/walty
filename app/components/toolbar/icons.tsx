// app/components/toolbar/icons.tsx
"use client";
import type { SVGProps } from "react";

/* mirror / flip */
export const MirrorH = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4} fill="none" {...props}>
    <path d="M8 5 3 12l5 7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 5l5 7-5 7" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

export const MirrorV = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4} fill="none" {...props}>
    <path d="M5 8 12 3l7 5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 16l7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="4" y1="12" x2="20" y2="12" />
  </svg>
);

/* add more custom SVGs in one place as you need */