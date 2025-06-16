'use client'

import { useBasket } from '@/lib/useBasket'
import Popover from '@/app/components/toolbar/Popover'
import Link from 'next/link'

interface Props {
  anchor: HTMLElement | null
  open: boolean
  onClose: () => void
}

export default function BasketPopover({ anchor, open, onClose }: Props) {
  const { items, removeItem, updateQty } = useBasket()

  return (
    <Popover anchor={anchor} open={open} onClose={onClose}>
      <div className="space-y-3 w-60">
        {items.length === 0 ? (
          <p className="text-sm">Your basket is empty.</p>
        ) : (
          <>
            {items.map((it) => (
              <div
                key={it.sku}
                className="border-b pb-2 last:border-none last:pb-0 flex gap-2"
              >
                <img
                  src="/templates/daisy/daisy-front-cover.jpg"
                  alt="thumbnail"
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{it.sku}</span>
                    <button
                      onClick={() => removeItem(it.sku)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      className="px-2 py-0.5 border rounded"
                      onClick={() => updateQty(it.sku, Math.max(1, it.qty - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={it.qty}
                      onChange={(e) =>
                        updateQty(it.sku, Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-12 border rounded text-center text-sm"
                    />
                    <button
                      className="px-2 py-0.5 border rounded"
                      onClick={() => updateQty(it.sku, it.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <Link
                    href={`/cards/${it.sku}/customise`}
                    className="mt-2 inline-block text-sm text-[--walty-teal] hover:underline"
                  >
                    Preview &amp; customise
                  </Link>
                </div>
              </div>
            ))}
            <Link
              href="/checkout"
              className="block text-center mt-2 rounded-md bg-[--walty-orange] text-[--walty-cream] px-4 py-2 font-semibold hover:bg-orange-600"
            >
              View basket
            </Link>
          </>
        )}
      </div>
    </Popover>
  )
}
