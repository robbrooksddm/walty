'use client'

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Scissors,
  Copy,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  Crop,
  Layers,
  AlignCenter,
  ArrowUpToLine,
  ArrowDownToLine,
} from 'lucide-react';

export type MenuAction =
  | 'cut'
  | 'copy'
  | 'paste'
  | 'duplicate'
  | 'layer-forward'
  | 'layer-back'
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

  const Item = ({ Icon, label, action }: { Icon: any; label: string; action: MenuAction }) => (
    <button
      type="button"
      onClick={() => onAction(action)}
      className="flex items-center gap-2 px-4 py-1 text-[--walty-teal] hover:bg-[--walty-orange]/10"
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </button>
  );

  return createPortal(
    <div
      style={{ top: pos.y, left: pos.x }}
      className="fixed z-50 bg-white border border-[rgba(0,91,85,.2)] rounded-xl shadow-lg pointer-events-auto min-w-40"
    >
      <div className="flex flex-col py-1">
        <Item Icon={Scissors}      label="Cut"        action="cut" />
        <Item Icon={Copy}          label="Copy"       action="copy" />
        <Item Icon={ClipboardPaste} label="Paste"      action="paste" />
        <Item Icon={CopyPlus}      label="Duplicate"  action="duplicate" />
        <hr className="my-1 border-t border-walty-teal/20" />
        <div className="relative group">
          <Item Icon={Layers} label="Layer" action="layer-forward" />
          {/* submenu */}
          <div className="absolute left-full top-0 hidden group-hover:block">
            <div className="min-w-32 rounded-xl bg-white border border-[rgba(0,91,85,.2)] shadow-lg flex flex-col py-1">
              <Item Icon={ArrowUpToLine}   label="Bring forward" action="layer-forward" />
              <Item Icon={ArrowDownToLine} label="Send backward" action="layer-back" />
            </div>
          </div>
        </div>
        <Item Icon={AlignCenter}   label="Align to Page" action="align" />
        <hr className="my-1 border-t border-walty-teal/20" />
        <Item Icon={Crop}          label="Crop"       action="crop" />
        <Item Icon={Trash2}        label="Delete"     action="delete" />
      </div>
    </div>,
    document.body,
  );
}
