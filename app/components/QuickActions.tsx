import { createPortal } from 'react-dom'
import IconButton from './toolbar/IconButton'
import { Scissors, Copy, CopyPlus, Trash2, MoreHorizontal } from 'lucide-react'
import type { MenuAction } from './ContextMenu'

interface Props {
  anchor: DOMRect | null
  onAction: (a: MenuAction) => void
  onMore: (pos: { x: number; y: number }) => void
}

export default function QuickActions({ anchor, onAction, onMore }: Props) {
  if (!anchor) return null
  const style: React.CSSProperties = {
    position: 'fixed',
    top: anchor.top - 8,
    left: anchor.left + anchor.width / 2,
    transform: 'translate(-50%, -100%)',
    zIndex: 45,
  }
  const openMenu = () =>
    onMore({ x: anchor.left + anchor.width / 2, y: anchor.bottom })
  return createPortal(
    <div
      style={style}
      className="pointer-events-auto flex items-center gap-1 rounded-full border border-[rgba(0,91,85,.2)] bg-white px-2 py-1 shadow-lg"
    >
      <IconButton Icon={Scissors} label="Cut" onClick={() => onAction('cut')} hideCaption size="sm" />
      <IconButton Icon={Copy} label="Copy" onClick={() => onAction('copy')} hideCaption size="sm" />
      <IconButton Icon={CopyPlus} label="Duplicate" onClick={() => onAction('duplicate')} hideCaption size="sm" />
      <IconButton Icon={Trash2} label="Delete" onClick={() => onAction('delete')} hideCaption size="sm" />
      <IconButton Icon={MoreHorizontal} label="More" onClick={openMenu} hideCaption size="sm" />
    </div>,
    document.body,
  )
}
