"use client";
import { useState } from "react";

export default function ProductTabs({ description }: { description?: string }) {
  const [tab, setTab] = useState<'desc' | 'delivery'>('desc');
  return (
    <div>
      <div className="flex border-b mb-4">
        <button
          onClick={() => setTab('desc')}
          className={`px-4 py-2 font-semibold ${tab==='desc' ? 'border-b-2 border-[--walty-orange]' : ''}`}
        >
          Description
        </button>
        <button
          onClick={() => setTab('delivery')}
          className={`px-4 py-2 font-semibold ${tab==='delivery' ? 'border-b-2 border-[--walty-orange]' : ''}`}
        >
          Delivery
        </button>
      </div>
      {tab === 'desc' ? (
        <p>{description || 'No description available.'}</p>
      ) : (
        <p>Orders are printed within 2 working days and shipped via Royal Mail.</p>
      )}
    </div>
  );
}
