// lib/fonts.ts  (new file)
import localFont from "next/font/local";

export const recoleta = localFont({
  variable: "--font-recoleta",
  display : "swap",
  src: [
    // paths are **relative to THIS FILE**
    { path: "../app/fonts/Recoleta-Regular.woff2", weight: "400", style: "normal" },
    { path: "../app/fonts/Recoleta-Regular.woff",  weight: "400", style: "normal" },
    { path: "../app/fonts/Recoleta-Medium.woff2",  weight: "500", style: "normal" },
    { path: "../app/fonts/Recoleta-Medium.woff",   weight: "500", style: "normal" },
    { path: "../app/fonts/Recoleta-SemiBold.woff2",weight: "600", style: "normal" },
    { path: "../app/fonts/Recoleta-SemiBold.woff", weight: "600", style: "normal" },
  ],
});

export const ambit = localFont({
  variable: "--font-ambit",
  display : "swap",
  src: [
    { path: "../app/fonts/Ambit-Regular.woff2", weight: "400", style: "normal" },
    { path: "../app/fonts/Ambit-Regular.woff",  weight: "400", style: "normal" },
    { path: "../app/fonts/Ambit-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../app/fonts/Ambit-SemiBold.woff",  weight: "600", style: "normal" },
  ],
});