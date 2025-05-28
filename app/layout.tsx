// app/layout.tsx
import React from "react";
import "./globals.css";
import { Domine, Inter } from "next/font/google";
import { recoleta } from "@/lib/fonts";           // local font
import WaltyNav from "@/components/site/WaltyNav"; // ← put this back

export const domine = Domine({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-domine",
});
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = { title: "Walty" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* use back-ticks so the template literals are evaluated */}
      <body className={`${inter.variable} ${domine.variable} ${recoleta.variable}`}>
        <WaltyNav />
        {children}
      </body>
    </html>
  );
}