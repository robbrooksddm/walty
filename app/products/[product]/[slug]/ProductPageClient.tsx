'use client'
import { useState } from 'react'

interface Product {
  title: string
  variantHandle: string
}

export default function ProductPageClient({
  gallery,
  title,
  description,
  products,
  editorUrl,
}: {
  gallery: string[]
  title: string
  description?: string
  products?: Product[]
  editorUrl: string
}) {
  const [tab, setTab] = useState<'desc' | 'delivery'>('desc')
  const opts = products && products.length
    ? products.map(p => ({ label: p.title, handle: p.variantHandle }))
    : [
        { label: 'Digital Card', handle: 'digital' },
        { label: 'Mini Card', handle: 'gc-mini' },
        { label: 'Classic Card', handle: 'gc-classic' },
        { label: 'Giant Card', handle: 'gc-large' },
      ]
  const [variant, setVariant] = useState(opts[0].handle)
  return (
    <main className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {gallery.map((src, i) => (
          <img key={i} src={src} alt="" className="w-full rounded" />
        ))}
      </div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="space-y-2">
        {opts.map(o => (
          <label key={o.handle} className="flex items-center gap-2">
            <input
              type="radio"
              name="variant"
              value={o.handle}
              checked={variant === o.handle}
              onChange={() => setVariant(o.handle)}
            />
            {o.label}
          </label>
        ))}
      </div>
      <a
        href={editorUrl}
        className="block text-center bg-pink-600 text-white py-3 rounded mt-4"
      >
        Personalise →
      </a>
      <div>
        <nav className="flex border-b mt-6">
          <button
            onClick={() => setTab('desc')}
            className={`px-4 py-2 ${tab === 'desc' ? 'border-b-2 border-pink-600' : ''}`}
          >
            Description
          </button>
          <button
            onClick={() => setTab('delivery')}
            className={`px-4 py-2 ${tab === 'delivery' ? 'border-b-2 border-pink-600' : ''}`}
          >
            Delivery Info
          </button>
        </nav>
        {tab === 'desc' ? (
          <div className="p-4 whitespace-pre-line">{description || 'No description available.'}</div>
        ) : (
          <div className="p-4">Delivery information coming soon.</div>
        )}
      </div>
    </main>
  )
}
