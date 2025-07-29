'use client'
import { useState, useRef } from 'react'

interface Props {
  variantId: string
  areaId: string
}

export default function MockupClient({ variantId, areaId }: Props) {
  const [preview, setPreview] = useState<string>('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const openPicker = () => inputRef.current?.click()

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, designPNGs: { [areaId]: base64 } })
      })
      const data = await res.json()
      if (data?.urls && data.urls[areaId]) {
        setPreview(data.urls[areaId])
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <div className="w-64 h-64 border flex items-center justify-center">
        {preview && (
          <img src={preview} alt="preview" className="max-h-full object-contain" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png"
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={openPicker}
        className="rounded bg-blue-600 text-white px-3 py-1"
      >
        Upload image
      </button>
    </div>
  )
}
