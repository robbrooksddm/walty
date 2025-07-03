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
    const isSm   = size === 'sm'
    const isXs   = size === 'xs'
    const btnCls = isXs
      ? 'h-[30px] w-[30px]'
      : isSm
        ? 'h-10 w-10'          // 40 px
        : 'h-12 w-12'          // 48 px
    const icnCls = isSm || isXs ? 'h-5 w-5' : 'h-6 w-6'  // keep 20 px icon
    const txtCls = isSm || isXs ? 'text-[10px]' : 'text-[11px]'

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
