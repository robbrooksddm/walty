"use client";

import IconButton from "./toolbar/IconButton";
import { Scissors, Copy, CopyPlus, Trash2, MoreHorizontal } from "lucide-react";
import { useRef } from "react";

export type MenuAction = import("./ContextMenu").MenuAction;

interface Props {
  pos: { x: number; y: number } | null;
  onAction: (a: MenuAction) => void;
  onMenu: (pos: { x: number; y: number }) => void;
}

export default function SelectionToolbar({ pos, onAction, onMenu }: Props) {
  if (!pos) return null;
  const menuRef = useRef<HTMLButtonElement>(null);
  const style: React.CSSProperties = {
    position: "fixed",
    left: pos.x,
    top: pos.y,
    transform: "translate(-50%, -8px) translateY(-100%)",
    zIndex: 50,
  };

  return (
    <div
      style={style}
      className="pointer-events-auto flex items-center gap-1 px-1.5 py-1 rounded-full bg-white shadow-lg border border-[rgba(0,91,85,.2)]"
    >
      <IconButton Icon={Scissors} label="Cut" onClick={() => onAction("cut")}
        hideCaption size="sm" />
      <IconButton Icon={Copy} label="Copy" onClick={() => onAction("copy")}
        hideCaption size="sm" />
      <IconButton Icon={CopyPlus} label="Duplicate" onClick={() => onAction("duplicate")}
        hideCaption size="sm" />
      <IconButton Icon={Trash2} label="Delete" onClick={() => onAction("delete")}
        hideCaption size="sm" />
      <IconButton
        Icon={MoreHorizontal}
        label="More"
        ref={menuRef}
        onClick={() => {
          if (menuRef.current) {
            const r = menuRef.current.getBoundingClientRect();
            onMenu({ x: r.left + r.width / 2, y: r.bottom });
          }
        }}
        hideCaption
        size="sm"
      />
    </div>
  );
}
