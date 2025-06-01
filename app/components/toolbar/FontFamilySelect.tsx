// app/components/toolbar/FontFamilySelect.tsx
'use client'

import type { ChangeEvent } from 'react'

interface Props {
  value    : string
  onChange : (v: string) => void
  disabled : boolean
}

export function FontFamilySelect ({ value, onChange, disabled }: Props) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className="
        h-12 min-w-[9rem] px-2 rounded-lg
        bg-white/80 border border-teal-800/10 text-sm
        disabled:opacity-40
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50
      "
    >
      {['Arial', 'Georgia', 'monospace', 'Dingos Stamp'].map(f => (
        <option key={f}>{f}</option>
      ))}
    </select>
  )
}