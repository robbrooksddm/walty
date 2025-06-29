"use client"

import { useState } from 'react'

export default function ProductTabs({ description }: { description?: string }) {
  const [tab, setTab] = useState<'desc' | 'delivery'>('desc')

  return (
    <div className="mt-8">
      <div className="flex border-b mb-4">
        <button
          onClick={() => setTab('desc')}
          className={`px-4 py-2 ${tab === 'desc' ? 'border-b-2 border-black font-semibold' : ''}`}
        >
          Description
        </button>
        <button
          onClick={() => setTab('delivery')}
          className={`px-4 py-2 ${tab === 'delivery' ? 'border-b-2 border-black font-semibold' : ''}`}
        >
          Delivery
        </button>
      </div>
      <div className="min-h-[80px]">
        {tab === 'desc' ? (
          <p>{description || 'No description available.'}</p>
        ) : (
          <p>Cards are printed and shipped within 2–3 business days.</p>
        )}
      </div>
    </div>
  )
}
