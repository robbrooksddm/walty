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

  const Item = ({
    Icon,
    label,
    action,
    shortcut,
  }: {
    Icon: any;
    label: string;
    action: MenuAction;
    shortcut?: string;
  }) => (
    <button
      type="button"
      onClick={() => onAction(action)}
      className="flex w-full items-center justify-between px-4 py-2 text-[--walty-teal] hover:bg-[--walty-orange]/10"
    >
      <span className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span className="text-base">{label}</span>
      </span>
      {shortcut && <span className="text-xs text-gray-500">{shortcut}</span>}
    </button>
  );

  const Divider = () => (
    <div className="my-1 h-px bg-[rgba(0,91,85,.15)]" />
  );

  const [layerOpen, setLayerOpen] = useState(false);
  const layerRef = useRef<HTMLButtonElement>(null);
  const isMac = /Mac|iPod|iPhone|iPad/.test(typeof navigator === 'undefined' ? '' : navigator.platform);

  return createPortal(
    <div
      style={{ top: pos.y, left: pos.x }}
      className="fixed z-50 bg-white border border-[rgba(0,91,85,.2)] rounded-xl shadow-lg pointer-events-auto min-w-56"
    >
      <div className="flex flex-col py-1">
        {/* group 1 */}
        <Item Icon={Scissors}      label="Cut"        action="cut"        shortcut={`${isMac ? '⌘' : 'Ctrl+'}X`} />
        <Item Icon={Copy}          label="Copy"       action="copy"       shortcut={`${isMac ? '⌘' : 'Ctrl+'}C`} />
        <Item Icon={ClipboardPaste} label="Paste"      action="paste"      shortcut={`${isMac ? '⌘' : 'Ctrl+'}V`} />
        <Item Icon={CopyPlus}      label="Duplicate"  action="duplicate" shortcut={`${isMac ? '⌘' : 'Ctrl+'}D`} />

        <Divider />

        {/* group 2 */}
        <div className="relative">
          <button
            ref={layerRef}
            type="button"
            onClick={() => setLayerOpen(o => !o)}
            className="flex w-full items-center gap-3 px-4 py-2 text-[--walty-teal] hover:bg-[--walty-orange]/10"
          >
            <Layers className="w-5 h-5" />
            <span className="text-base">Layer</span>
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
        <Item Icon={Trash2}        label="Delete"     action="delete"     shortcut={isMac ? '⌘⌫' : 'Del'} />
      </div>
    </div>,
    document.body,
  );
}
