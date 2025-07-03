// components/toolbar/IconButton.tsx
'use client'

import { forwardRef } from 'react'

interface IconBtnProps {
  Icon        : React.ElementType
  label       : string
  caption?    : string
  onClick     : () => void
  active?     : boolean
  disabled?   : boolean
  hideCaption?: boolean
  size?       : 'lg' | 'sm' | 'xs'  // ← NEW (default "lg")
}

const IconButton = forwardRef<HTMLButtonElement, IconBtnProps>(
  (
    {
      Icon,
      label,
      caption     = label.split(' ')[0],
      onClick,
      active      = false,
      disabled    = false,
      hideCaption = false,
      size        = 'lg',
    },
    ref,
  ) => {
    const btnCls =
      size === 'lg'
        ? 'h-12 w-12'
        : size === 'sm'
        ? 'h-10 w-10'
        : 'h-8 w-8'             // xs = 32px
    const icnCls = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
    const txtCls = size === 'lg' ? 'text-[11px]' : 'text-[10px]'

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        onClick={onClick}
        disabled={disabled}
        className={`
          flex flex-col items-center justify-center gap-0.5
          ${btnCls} rounded-lg transition
          ${active ? 'bg-[--walty-orange]/10 text-[--walty-orange]' : 'text-[--walty-teal]'}
          enabled:hover:bg-[--walty-orange]/10 enabled:hover:text-[--walty-orange]    
          disabled:opacity-40
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50
        `}
      >
        <Icon className={`${icnCls} stroke-[2] ${active ? 'stroke-[--walty-orange]' : 'enabled:hover:stroke-[--walty-orange]'}`} />
        {!hideCaption && (
          <span className={`${txtCls} leading-none`}>{caption}</span>
        )}
      </button>
    )
  },
)

IconButton.displayName = 'IconButton'
export default IconButton