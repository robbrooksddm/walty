"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Walty branded editor header.
 * - Full-width teal bar.
 * - Left pill logo.
 * - Two CTAs on the right.
 * - Exports CSS var --walty-header-h so toolbars can align automatically.
 */
export default function WaltyEditorHeader({
  onPreview,
  onAddToBasket,
  height = 72,           // px   ← tweak here, everything else follows
}: {
  onPreview: () => void | Promise<void>;
  onAddToBasket: () => void | Promise<void>;
  height?: number;
}) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--walty-header-h",
        `${height}px`
      );
      document.documentElement.style.setProperty(
        "--walty-toolbar-h",
        "72px"
      );
      return () => {
        document.documentElement.style.removeProperty("--walty-header-h");
        document.documentElement.style.removeProperty("--walty-toolbar-h");
      };
    }
  }, [height]);
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 bg-[--walty-teal] shadow-md shadow-black/5 ring-1 ring-[--walty-teal]/40"
      style={{
        height: `${height}px`,
        // toolbars read this for their `top` value
        // (TextToolbar, ImageToolbar, EditorCommands wrappers)
        "--walty-header-h": `${height}px`,
        "--walty-toolbar-h": "72px",
      } as React.CSSProperties}
    >
      <div className="relative h-full">
        {/* centred logo → homepage */}
        <Link
          href="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <Image
            src="/images/Walty Secondary Logo.png"
            alt="Walty logo"
            height={height - 21}
            width={140}
            priority
            draggable={false}
            className="select-none"
          />
        </Link>

        {/* CTAs flush‑right */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
          <button
            onClick={onPreview}
            className="rounded-md bg-[--walty-cream] px-6 py-2 font-semibold
                       text-[--walty-brown] shadow
                       hover:bg-[--walty-cream]/90 active:translate-y-[1px]"
          >
            Preview
          </button>

          <button
            onClick={onAddToBasket}
            className="rounded-md bg-[--walty-orange] px-6 py-2 font-semibold
                       text-[--walty-cream] shadow
                       hover:bg-[#af4217] active:translate-y-[1px]"
          >
            Add&nbsp;to&nbsp;Basket
          </button>
        </div>
      </div>
    </header>
  );
}