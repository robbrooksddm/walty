'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

function iconFor(handle: string): string {
  if (handle.includes('mini')) return 'mini_card_icon.svg'
  if (handle.includes('large')) return 'giant_card_icon.svg'
  return 'classic_card_icon.svg'
}

interface Variant {
  title: string
  variantHandle: string
  slug: string
  price: number
  blurb?: string
}

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
  const [pageIdx, setPageIdx] = useState(0)

  return (
    <main className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
        <div className="space-y-2 flex flex-col items-center">
          <Image
            src={images[pageIdx]}
            width={300}
            height={420}
            alt={`page ${pageIdx + 1}`}
            className="rounded shadow w-[300px] h-auto"
          />
          <div className="flex gap-2 mt-2">
            {images.map((src, i) => (
              <button
                key={i}
                className={`thumb ${pageIdx === i ? 'thumb-active' : ''}`}
                onClick={() => setPageIdx(i)}
              >
                <Image
                  src={src}
                  width={70}
                  height={98}
                  alt={`page ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          <ul className="space-y-2">
            {variants.map(v => (
              <li key={v.variantHandle}>
                <label
                  className={`flex items-center gap-4 border rounded-md p-3 w-full justify-between ${
                    selected === v.variantHandle ? 'border-[--walty-orange] bg-[--walty-cream]' : 'border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <Image src={`/icons/${iconFor(v.variantHandle)}`} alt="" width={40} height={40} />
                    <div className="flex-1">
                      <div className="font-medium">{v.title}</div>
                      {v.blurb && <div className="text-sm text-gray-500">{v.blurb}</div>}
                      <div className="text-sm font-semibold">£{v.price.toFixed(2)}</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="variant"
                    value={v.variantHandle}
                    checked={selected === v.variantHandle}
                    onChange={() => setSelected(v.variantHandle)}
                    className="accent-[--walty-orange]"
                  />
                </label>
              </li>
            ))}
          </ul>
          <Link
            href={`/cards/${slug}/customise`}
            className="mt-2 block w-full rounded bg-[--walty-orange] px-6 py-3 text-center text-white"
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
