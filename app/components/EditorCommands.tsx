"use client";

import React from "react";
import IconButton from "./toolbar/IconButton";
import { RotateCcw, RotateCw, Save } from "lucide-react";

interface Props {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void | Promise<void>;
  saving: boolean;
}

export default function EditorCommands({ onUndo, onRedo, onSave, saving }: Props) {
  return (
    <div className="fixed right-4 top-2 z-40 flex gap-3 pointer-events-auto select-none">
      <IconButton Icon={RotateCcw} label="Undo" onClick={onUndo} />
      <IconButton Icon={RotateCw} label="Redo" onClick={onRedo} />
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
    </div>
  );
}
