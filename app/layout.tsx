import React from "react";
import "./globals.css";
import { Domine, Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const domine = Domine({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-domine",
  display: "swap",
});

export const metadata = {
  title: "Walty",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${domine.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
