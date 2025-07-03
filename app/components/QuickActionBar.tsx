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
      className="fixed z-50 pointer-events-auto flex items-center gap-0 bg-white border border-[rgba(0,91,85,.2)] shadow-lg rounded-full px-0 py-0"
      style={{ top: pos.y, left: pos.x, transform: 'translate(-50%, -100%)' }}
    >
      <IconButton Icon={Scissors} label="Cut" hideCaption size="xs" onClick={() => onAction('cut')} />
      <IconButton Icon={Copy} label="Copy" hideCaption size="xs" onClick={() => onAction('copy')} />
      <IconButton Icon={CopyPlus} label="Duplicate" hideCaption size="xs" onClick={() => onAction('duplicate')} />
      <IconButton Icon={Trash2} label="Delete" hideCaption size="xs" onClick={() => onAction('delete')} />
      <IconButton Icon={MoreHorizontal} label="More" hideCaption size="xs" onClick={openMenu} />
    </div>
  )
}
