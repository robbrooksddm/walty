'use client'
import { useState } from 'react'

export default function ProductTabs({ description }: { description: string }) {
  const [tab, setTab] = useState<'description' | 'delivery'>('description')

  return (
    <div>
      <div className="flex border-b mb-4">
        <button
          onClick={() => setTab('description')}
          className={`px-4 py-2 ${tab==='description'?'border-b-2 border-[--walty-orange]':''}`}
        >
          Description
        </button>
        <button
          onClick={() => setTab('delivery')}
          className={`px-4 py-2 ${tab==='delivery'?'border-b-2 border-[--walty-orange]':''}`}
        >
          Delivery
        </button>
      </div>
      <div className="p-4 bg-gray-50 rounded">
        {tab==='description' ? (
          <p>{description}</p>
        ) : (
          <p>Standard delivery 1-3 days. Worldwide shipping available.</p>
        )}
      </div>
    </div>
  )
}
