'use client'
import { useState } from 'react'

interface Props {
  variantId: string
  areaId: string
}

export default function MockupClient({ variantId, areaId }: Props) {
  const [preview, setPreview] = useState<string>('')

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
      // The render API returns an object keyed by camera name
      // (e.g. { hero: 'data:image/png;base64,...' }). Grab the first
      // available URL rather than expecting a specific key.
      const url = data?.urls && Object.values<string>(data.urls)[0]
      if (url) {
        setPreview(url)
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
      <input type="file" accept="image/png" onChange={handleChange} />
    </div>
  )
}
