"use client"
import { useState } from 'react'

interface Variant {
  title: string
  slug: { current: string }
}
interface ProductData {
  title: string
  description?: string
  pages: { image?: string }[]
  product: {
    title: string
    variants: Variant[]
  }
}

export default function ProductClient({
  data,
  templateSlug,
}: {
  data: ProductData
  templateSlug: string
}) {
  const [variant, setVariant] = useState(
    data.product.variants[0]?.slug.current || ''
  )
  const [tab, setTab] = useState<'desc' | 'delivery'>('desc')

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex overflow-x-auto gap-4">
        {data.pages.map((p, i) =>
          p.image ? (
            <img
              key={i}
              src={p.image}
              alt="page preview"
              className="w-48 rounded shadow"
            />
          ) : null
        )}
      </div>
      <h1 className="text-2xl font-bold">{data.title}</h1>

      <div className="space-x-4">
        {data.product.variants.map((v) => (
          <label key={v.slug.current} className="inline-flex items-center gap-1">
            <input
              type="radio"
              name="variant"
              value={v.slug.current}
              checked={variant === v.slug.current}
              onChange={() => setVariant(v.slug.current)}
            />
            <span>{v.title}</span>
          </label>
        ))}
      </div>

      <a
        href={`/cards/${templateSlug}/customise`}
        className="block text-center bg-pink-600 text-white py-3 rounded-md font-semibold"
      >
        Personalise →
      </a>

      <div className="mt-6">
        <div className="flex border-b">
          <button
            onClick={() => setTab('desc')}
            className={`px-4 py-2 ${
              tab === 'desc' ? 'border-b-2 font-semibold' : ''
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setTab('delivery')}
            className={`px-4 py-2 ${
              tab === 'delivery' ? 'border-b-2 font-semibold' : ''
            }`}
          >
            Delivery Info
          </button>
        </div>
        <div className="mt-4">
          {tab === 'desc' ? (
            <p>{data.description}</p>
          ) : (
            <p>Delivery information coming soon.</p>
          )}
        </div>
      </div>
    </main>
  )
}
