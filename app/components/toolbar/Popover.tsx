//Popover.tsx

"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface Props {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Popover({ anchor, open, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  /* close on click-away / Esc */
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === "Escape") onClose();
      if (
        e instanceof MouseEvent &&
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        anchor &&
        !anchor.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handle, { capture: true });
    window.addEventListener("keydown", handle);
    return () => {
      window.removeEventListener("mousedown", handle, { capture: true });
      window.removeEventListener("keydown", handle);
    };
  }, [open, onClose, anchor]);

  if (!open || !anchor) return null;

  /* centred under the trigger (6 px gap now that arrow is gone) */
  const { bottom, left, width } = anchor.getBoundingClientRect();
  const style: React.CSSProperties = {
    position: "fixed",
    top: bottom + 6,
    left: left + width / 2,
    transform: "translateX(-50%)",
    zIndex: 50,
  };

  return createPortal(
    <div
      ref={ref}
      style={style}
      className="min-w-[13rem] rounded-xl bg-white
                 px-3 py-2 shadow-lg ring-1 ring-walty-brown/15
                 animate-pop"
    >
      {children}
    </div>,
    document.body
  );
}