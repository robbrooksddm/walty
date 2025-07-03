import React from 'react'
import IconButton from './toolbar/IconButton'
import { Scissors, Copy, CopyPlus, Trash2, MoreHorizontal } from 'lucide-react'
import type { MenuAction } from './ContextMenu'

interface Props {
  pos: { x: number; y: number } | null
  onAction: (a: MenuAction) => void
  onMenu: (pos: { x: number; y: number }) => void
}

export default function QuickActionBar({ pos, onAction, onMenu }: Props) {
  if (!pos) return null
  const openMenu = () => onMenu(pos)
  return (
    <div
      className="fixed z-50 pointer-events-auto flex items-center gap-1 bg-white border border-[rgba(0,91,85,.2)] shadow-lg rounded-full px-2 py-1"
      style={{ top: pos.y, left: pos.x, transform: 'translate(-50%, -100%)' }}
    >
      <IconButton Icon={Scissors} label="Cut" hideCaption size="sm" onClick={() => onAction('cut')} />
      <IconButton Icon={Copy} label="Copy" hideCaption size="sm" onClick={() => onAction('copy')} />
      <IconButton Icon={CopyPlus} label="Duplicate" hideCaption size="sm" onClick={() => onAction('duplicate')} />
      <IconButton Icon={Trash2} label="Delete" hideCaption size="sm" onClick={() => onAction('delete')} />
      <IconButton Icon={MoreHorizontal} label="More" hideCaption size="sm" onClick={openMenu} />
    </div>
  )
}
