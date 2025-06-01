// app/components/toolbar/FontSizeStepper.tsx
'use client'

interface Props {
  value    : number
  onChange : (v: number) => void
  disabled : boolean
}

export function FontSizeStepper ({ value, onChange, disabled }: Props) {
  return (
    <div className="flex h-12">
      <button
        disabled={disabled}
        onClick={() => onChange(Math.max(4, value - 4))}
        className="
          w-12 rounded-l-lg border border-r-0 border-teal-800/10
          enabled:hover:bg-teal-50 disabled:opacity-40
        "
      >
        −
      </button>

      <input
        disabled={disabled}
        type="number"
        value={value}
        onChange={e => onChange(+e.target.value)}
        className="
          w-16 h-12 text-center border-y border-teal-800/10
          disabled:opacity-40
        "
      />

      <button
        disabled={disabled}
        onClick={() => onChange(value + 4)}
        className="
          w-12 rounded-r-lg border border-l-0 border-teal-800/10
          enabled:hover:bg-teal-50 disabled:opacity-40
        "
      >
        +
      </button>
    </div>
  )
}