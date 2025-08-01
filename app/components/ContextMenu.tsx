'use client'

import { useEffect, useRef, useState } from 'react';
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
  ChevronsUp,
  ChevronsDown,
} from 'lucide-react';
import Popover from './toolbar/Popover';

const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|od|ad)/.test(navigator.platform);
const shortcuts: Partial<Record<MenuAction, string>> = {
  cut:       isMac ? '⌘X'   : 'Ctrl+X',
  copy:      isMac ? '⌘C'   : 'Ctrl+C',
  paste:     isMac ? '⌘V'   : 'Ctrl+V',
  duplicate: isMac ? '⌘D'   : 'Ctrl+D',
  delete:    isMac ? '⌘⌫'  : 'Del',
};

export type MenuAction =
  | 'cut'
  | 'copy'
  | 'paste'
  | 'duplicate'
  | 'bring-forward'
  | 'send-backward'
  | 'bring-to-front'
  | 'send-to-back'
  | 'align'
  | 'delete'
  | 'crop';

interface Props {
  pos: { x: number; y: number };
  onAction: (a: MenuAction) => void;
  onClose: () => void;
}

export default function ContextMenu({ pos, onAction, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onClose();
    };
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
      className="flex w-full items-center gap-2 px-4 py-2 text-[--walty-teal] hover:bg-[--walty-orange]/10"
    >
      <Icon className="w-5 h-5" />
      <span className="flex-1 text-base text-left">{label}</span>
      {shortcuts[action] && (
        <span className="text-xs opacity-70">{shortcuts[action]}</span>
      )}
    </button>
  );

  const Divider = () => (
    <div className="my-1 h-px bg-[rgba(0,91,85,.15)]" />
  );

  const [layerOpen, setLayerOpen] = useState(false);
  const layerRef = useRef<HTMLButtonElement>(null);

  return createPortal(
    <div
      ref={menuRef}
      style={{ top: pos.y, left: pos.x }}
      className="fixed z-50 bg-white border border-[rgba(0,91,85,.2)] rounded-xl shadow-lg pointer-events-auto min-w-[14rem]"
    >
      <div className="flex flex-col py-1">
        {/* group 1 */}
        <Item Icon={Scissors}      label="Cut"        action="cut" />
        <Item Icon={Copy}          label="Copy"       action="copy" />
        <Item Icon={ClipboardPaste} label="Paste"      action="paste" />
        <Item Icon={CopyPlus}      label="Duplicate"  action="duplicate" />

        <Divider />

        {/* group 2 */}
        <div className="relative">
          <button
            ref={layerRef}
            type="button"
            onClick={() => setLayerOpen(o => !o)}
            className="flex w-full items-center gap-2 px-4 py-2 text-[--walty-teal] hover:bg-[--walty-orange]/10"
          >
            <Layers className="w-5 h-5" />
            <span className="flex-1 text-base text-left">Layer</span>
          </button>
          <Popover anchor={layerRef.current} open={layerOpen} onClose={() => setLayerOpen(false)}>
            <Item Icon={ArrowUpToLine}   label="Bring forward"  action="bring-forward" />
            <Item Icon={ArrowDownToLine} label="Send backward"  action="send-backward" />
            <Item Icon={ChevronsUp}     label="Bring to front" action="bring-to-front" />
            <Item Icon={ChevronsDown}   label="Send to back"   action="send-to-back" />
          </Popover>
        </div>
        <Item Icon={AlignCenter} label="Align to Page" action="align" />

        <Divider />

        {/* group 3 */}
        <Item Icon={Crop}          label="Crop"       action="crop" />
        <Item Icon={Trash2}        label="Delete"     action="delete" />
      </div>
    </div>,
    document.body,
  );
}
