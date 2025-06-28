'use client'
import { useEffect } from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
}

const clamp = (v: number) => Math.min(5, Math.max(0.5, v))

export default function ZoomSlider({ value, onChange }: Props) {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.1 : -0.1
      onChange(clamp(value + delta))
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [value, onChange])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        onChange(clamp(value + 0.1))
      } else if (e.key === '-') {
        e.preventDefault()
        onChange(clamp(value - 0.1))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [value, onChange])

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-white px-2 py-1 rounded-md shadow pointer-events-auto">
      <input
        type="range"
        min={50}
        max={500}
        value={Math.round(value * 100)}
        onChange={e => onChange(clamp(e.target.valueAsNumber / 100))}
        className="accent-[--walty-orange]"
      />
      <span className="text-xs w-12 text-right">{Math.round(value * 100)}%</span>
    </div>
  )
}
