'use client'

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Scissors,
  Copy,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  Crop,
  Lock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { AlignToPageVertical } from './toolbar/AlignToPage';

export type MenuAction =
  | 'cut'
  | 'copy'
  | 'paste'
  | 'duplicate'
  | 'bringForward'
  | 'sendBackward'
  | 'lock'
  | 'align'
  | 'crop'
  | 'delete';

interface Props {
  pos: { x: number; y: number };
  locked: boolean;
  onAction: (a: MenuAction) => void;
  onClose: () => void;
}

export default function ContextMenu({ pos, locked, onAction, onClose }: Props) {
  useEffect(() => {
    const close = () => onClose();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [onClose]);

  const [showLayer, setShowLayer] = useState(false);

  const Item = (
    { Icon, label, action, onClick }:
      { Icon: any; label: string; action?: MenuAction; onClick?: () => void },
  ) => (
    <button
      type="button"
      onClick={() => (onClick ? onClick() : action && onAction(action))}
      className="flex items-center gap-2 px-3 py-1 text-[--walty-teal] hover:bg-[--walty-orange]/10 w-full text-left"
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm flex-1">{label}</span>
    </button>
  );

  return createPortal(
    <div
      style={{ top: pos.y, left: pos.x }}
      className="fixed z-50 bg-white border border-[rgba(0,91,85,.2)] rounded-xl shadow-lg pointer-events-auto min-w-[200px]"
    >
      <div className="flex flex-col py-1">
        {/* group 1 */}
        <Item Icon={Scissors}      label="Cut"        action="cut" />
        <Item Icon={Copy}          label="Copy"       action="copy" />
        <Item Icon={ClipboardPaste} label="Paste"      action="paste" />
        <Item Icon={CopyPlus}      label="Duplicate"  action="duplicate" />

        <hr className="my-1 border-t border-[rgba(0,91,85,.1)]" />

        {/* group 2 */}
        <div className="relative">
          <Item
            Icon={Layers}
            label="Layer"
            onClick={() => setShowLayer(v => !v)}
          />
          {showLayer && (
            <div
              className="absolute left-full top-0 ml-2 flex flex-col bg-white border border-[rgba(0,91,85,.2)] rounded-xl shadow-lg"
            >
              <Item Icon={ChevronRight} label="Bring forward" action="bringForward" />
              <Item Icon={ChevronRight} label="Send backward" action="sendBackward" />
              <Item Icon={Lock} label={locked ? 'Unlock' : 'Lock'} action="lock" />
            </div>
          )}
        </div>
        <Item Icon={AlignToPageVertical} label="Align to Page" action="align" />

        <hr className="my-1 border-t border-[rgba(0,91,85,.1)]" />

        {/* group 3 */}
        <Item Icon={Crop}          label="Crop"       action="crop" />
        <Item Icon={Trash2}        label="Delete"     action="delete" />
      </div>
    </div>,
    document.body,
  );
}
