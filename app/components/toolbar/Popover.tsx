"use client";
import { useEffect, useRef } from "react";

interface Props {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Popover({ anchor, open, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  /* close on click-away or Esc */
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === "Escape") onClose();
      if (e instanceof MouseEvent && ref.current && !ref.current.contains(e.target as Node))
        onClose();
    };
    window.addEventListener("mousedown", handle, { capture: true });
    window.addEventListener("keydown", handle);
    return () => {
      window.removeEventListener("mousedown", handle, { capture: true });
      window.removeEventListener("keydown", handle);
    };
  }, [open, onClose]);

  if (!open || !anchor) return null;
  const r = anchor.getBoundingClientRect();
  return (
    <div
      ref={ref}
      style={{ left: r.left, top: r.bottom + 6 }}
      className="fixed z-50 rounded-md border bg-[--walty-cream] shadow px-2 py-1"
    >
      {children}
    </div>
  );
}