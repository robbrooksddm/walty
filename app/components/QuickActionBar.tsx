"use client";
import { createPortal } from "react-dom";
import {
  Scissors,
  Copy,
  CopyPlus,
  Trash2,
  Ellipsis,
} from "lucide-react";
import IconButton from "./toolbar/IconButton";
import type { MenuAction } from "./ContextMenu";

interface Props {
  pos: { x: number; y: number } | null;
  onAction: (a: MenuAction) => void;
  onMore: (pos: { x: number; y: number }) => void;
}

export default function QuickActionBar({ pos, onAction, onMore }: Props) {
  if (!pos) return null;
  return createPortal(
    <div
      className="fixed z-40 flex items-center gap-1.5 bg-white border border-[rgba(0,91,85,.2)] rounded-full shadow-lg px-2 py-1 pointer-events-auto"
      style={{ top: pos.y, left: pos.x, transform: "translate(-50%, -100%)" }}
    >
      <IconButton size="sm" hideCaption Icon={Scissors} label="Cut" onClick={() => onAction("cut")} />
      <IconButton size="sm" hideCaption Icon={Copy} label="Copy" onClick={() => onAction("copy")} />
      <IconButton size="sm" hideCaption Icon={CopyPlus} label="Duplicate" onClick={() => onAction("duplicate")} />
      <IconButton size="sm" hideCaption Icon={Trash2} label="Delete" onClick={() => onAction("delete")} />
      <IconButton size="sm" hideCaption Icon={Ellipsis} label="More" onClick={() => onMore(pos)} />
    </div>,
    document.body
  );
}
