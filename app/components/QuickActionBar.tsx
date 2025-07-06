import React from 'react'
import {
  Scissors,
  Copy,
  CopyPlus,
  Trash2,
  MoreHorizontal,
  Lock,
} from 'lucide-react'
import type { MenuAction } from './ContextMenu'

interface Props {
  pos: { x: number; y: number } | null
  onAction: (a: MenuAction) => void
  onMenu: (pos: { x: number; y: number }) => void
  locked?: boolean
  onUnlock?: () => void
  mode?: 'staff' | 'customer'
}

export default function QuickActionBar({ pos, onAction, onMenu, locked, onUnlock, mode = 'customer' }: Props) {
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
      disabled={locked && !!action && (action === 'cut' || action === 'duplicate' || action === 'delete')}
      onClick={action ? () => onAction(action) : openMenu}
      className="h-8 w-8 flex items-center justify-center -ml-px first:ml-0 rounded-lg text-[--walty-teal] enabled:hover:bg-[--walty-orange]/10 enabled:hover:text-[--walty-orange] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50 disabled:opacity-40"
    >
      <Icon className="w-5 h-5" />
    </button>
  )

  if (locked) {
    return (
      <div
        className="fixed z-50 pointer-events-auto flex items-center bg-white border border-[rgba(0,91,85,.2)] shadow-lg rounded-full p-0"
        style={{ top: pos.y, left: pos.x, transform: 'translate(-50%, -100%)' }}
      >
        {mode === 'staff' ? (
          <button
            type="button"
            aria-label="Unlock layer"
            title="Unlock layer"
            onClick={onUnlock}
            className="h-8 w-8 flex items-center justify-center ml-0 rounded-lg text-[--walty-teal] hover:bg-[--walty-orange]/10 hover:text-[--walty-orange] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
          >
            <Lock className="w-5 h-5" />
          </button>
        ) : (
          <div className="h-8 w-8 flex items-center justify-center ml-0 rounded-lg text-[--walty-teal] opacity-40">
            <Lock className="w-5 h-5" />
          </div>
        )}
      </div>
    )
  }

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
