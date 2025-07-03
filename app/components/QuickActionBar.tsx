import React from 'react'
import { Scissors, Copy, CopyPlus, Trash2, MoreHorizontal } from 'lucide-react'
import type { MenuAction } from './ContextMenu'

interface Props {
  pos: { x: number; y: number } | null
  onAction: (a: MenuAction) => void
  onMenu: (pos: { x: number; y: number }) => void
}

export default function QuickActionBar({ pos, onAction, onMenu }: Props) {
  if (!pos) return null

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMenu(pos)
  }

  const Btn = ({ Icon, label, action }: { Icon: any; label: string; action?: MenuAction }) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={action ? () => onAction(action) : openMenu}
      className="h-8 w-8 flex items-center justify-center -ml-px first:ml-0 rounded-lg text-[--walty-teal] enabled:hover:bg-[--walty-orange]/10 enabled:hover:text-[--walty-orange] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
    >
      <Icon className="w-5 h-5" />
    </button>
  )

  return (
    <div
      className="fixed z-50 pointer-events-auto flex items-center bg-white border border-[rgba(0,91,85,.2)] shadow-lg rounded-full p-0"
      style={{ top: pos.y, left: pos.x, transform: 'translate(-50%, -100%)' }}
    >
      <Btn Icon={Scissors} label="Cut" action="cut" />
      <Btn Icon={Copy} label="Copy" action="copy" />
      <Btn Icon={CopyPlus} label="Duplicate" action="duplicate" />
      <Btn Icon={Trash2} label="Delete" action="delete" />
      <Btn Icon={MoreHorizontal} label="More" />
    </div>
  )
}
