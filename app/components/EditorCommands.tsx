"use client";

import React from "react";
import IconButton from "./toolbar/IconButton";
import { RotateCcw, RotateCw, Save, Download, ZoomIn, ZoomOut } from "lucide-react";

type Mode = 'staff' | 'customer';
interface Props {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void | Promise<void>;
  onProof?: () => void | Promise<void>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
  saving: boolean;
  mode?: Mode;
}

export default function EditorCommands({ onUndo, onRedo, onSave, onProof, onZoomIn, onZoomOut, zoom, saving, mode = 'customer' }: Props) {
  return (
    <div className="fixed top-14   right-6 z-40 flex items-center gap-3
                     bg-white shadow rounded-md px-3 py-3 pointer-events-auto select-none" style={{ top: "var(--walty-header-h)" }}>
      <IconButton Icon={RotateCcw} label="Undo" onClick={onUndo} />
      <IconButton Icon={RotateCw} label="Redo" onClick={onRedo} />
      <IconButton Icon={ZoomOut} label="Zoom out" onClick={onZoomOut} size="sm" />
      <div className="text-sm w-10 text-center select-none">{Math.round(zoom*100)}%</div>
      <IconButton Icon={ZoomIn} label="Zoom in" onClick={onZoomIn} size="sm" />
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className={`flex items-center gap-1 px-3 py-2 rounded font-semibold
                    ${saving ? 'opacity-50 cursor-not-allowed'
                              : 'text-[--walty-orange] hover:bg-[--walty-orange]/10'}`}
      >
        <Save className="w-5 h-5" />
        {saving ? 'Saving…' : 'Save'}
      </button>
      {mode === 'staff' && onProof && (
        <button
          type="button"
          onClick={() => onProof()}
          className="flex items-center gap-1 px-3 py-2 rounded text-[--walty-teal] hover:bg-[--walty-teal]/10"
        >
          <Download className="w-5 h-5" />
          Proofs
        </button>
      )}
    </div>
  );
}
