'use client'
import { useState } from 'react'

export default function ProductTabs({ description }: { description: string }) {
  const [tab, setTab] = useState<'desc' | 'delivery'>('desc')
  return (
    <div className="space-y-4">
      <div className="flex gap-6 border-b pb-2">
        <button
          onClick={() => setTab('desc')}
          className={`font-semibold ${tab==='desc' ? 'border-b-2 border-[--walty-teal]' : ''}`}
        >
          Description
        </button>
        <button
          onClick={() => setTab('delivery')}
          className={`font-semibold ${tab==='delivery' ? 'border-b-2 border-[--walty-teal]' : ''}`}
        >
          Delivery
        </button>
      </div>
      {tab === 'desc' ? (
        <p>{description || 'No description available.'}</p>
      ) : (
        <p>Delivery information coming soon.</p>
      )}
    </div>
  )
}
