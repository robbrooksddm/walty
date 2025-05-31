"use client";

import React from 'react';

interface Props {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void | Promise<void>;
  saving: boolean;
}

export default function EditorCommands({ onUndo, onRedo, onSave, saving }: Props) {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!document.getElementById('command-btn-css')) {
      const shared = 'border px-2 py-[2px] rounded hover:bg-gray-100 disabled:opacity-40';
      const style = document.createElement('style');
      style.id = 'command-btn-css';
      style.innerHTML = `.command-btn{${shared}}`;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="fixed right-4 top-2 z-40 flex gap-4 pointer-events-auto select-none">
      <button onClick={onUndo} className="command-btn">↶ Undo</button>
      <button onClick={onRedo} className="command-btn">↷ Redo</button>
      <button
        onClick={onSave}
        disabled={saving}
        className={`command-btn font-semibold ${saving ? 'opacity-50 cursor-not-allowed' : 'text-blue-600'}`}
      >
        {saving ? '⏳ Saving…' : '💾 Save'}
      </button>
    </div>
  );
}
