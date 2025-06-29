'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Variant { title: string; variantHandle: string; slug: string }

export default function ProductClient({
  title,
  slug,
  description,
  images,
  variants,
}: {
  title: string
  slug: string
  description?: string
  images: string[]
  variants: Variant[]
}) {
  const [selected, setSelected] = useState<string>('')
  const [tab, setTab] = useState<'desc'|'delivery'>('desc')

  return (
    <main className="p-6 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {images.map((src, i) => (
            <Image key={i} src={src} width={420} height={580} alt={`page ${i+1}`} className="w-full rounded shadow" />
          ))}
        </div>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          <ul className="space-y-2">
            {variants.map(v => (
              <li key={v.variantHandle}>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="variant"
                    value={v.variantHandle}
                    onChange={() => setSelected(v.variantHandle)}
                    className="accent-[--walty-orange]"
                  />
                  {v.title}
                </label>
              </li>
            ))}
          </ul>
          <Link
            href={`/cards/${slug}/customise`}
            className="inline-block bg-[--walty-orange] text-white px-6 py-3 rounded text-center w-full"
          >
            Personalise →
          </Link>
        </div>
      </div>
      <div>
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setTab('desc')}
            className={`pb-2 ${tab==='desc' ? 'border-b-2 border-[--walty-orange]' : ''}`}
          >
            Description
          </button>
          <button
            onClick={() => setTab('delivery')}
            className={`pb-2 ${tab==='delivery' ? 'border-b-2 border-[--walty-orange]' : ''}`}
          >
            Delivery
          </button>
        </div>
        {tab==='desc' && (
          <p className="mt-4 whitespace-pre-wrap">{description || 'No description available.'}</p>
        )}
        {tab==='delivery' && (
          <p className="mt-4">Delivery information coming soon.</p>
        )}
      </div>
    </main>
  )
}
