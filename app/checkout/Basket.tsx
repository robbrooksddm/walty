"use client";
import Image from 'next/image';
import { useState } from 'react';
import { Address, CartItem } from './CheckoutClient';
import { CARD_SIZES } from './sizeOptions';

interface BasketProps {
  items: CartItem[];
  addresses: Address[];
  onQtyChange: (id: string, qty: number) => void;
  onVariantChange: (id: string, variant: string) => void;
  onAddressChange: (id: string, addressId: string) => void;
  onAddNew: (itemId: string) => void;
}

export default function Basket({
  items,
  addresses,
  onQtyChange,
  onVariantChange,
  onAddressChange,
  onAddNew,
}: BasketProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <h2 className="font-recoleta text-xl text-walty-teal">Your Basket</h2>
      {items.map((item) => (
        <div key={item.id} className="flex gap-4 items-start bg-white p-4 rounded-md shadow-card">
          <div className="w-20 h-28 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
            <Image src={item.coverUrl} alt="" width={80} height={112} className="object-cover w-full h-full" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="font-medium text-walty-teal">{item.title}</div>
            <div className="text-sm text-gray-600">SKU: {item.sku}</div>
            <div className="text-sm text-gray-600">£{item.price.toFixed(2)} each</div>
            <div className="relative mt-2">
              <label className="block text-sm font-recoleta text-walty-teal mb-1">Size</label>
              {(() => {
                const selected = CARD_SIZES.find((s) => s.id === item.variant) || CARD_SIZES[0];
                return (
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={() => setOpenId(openId === item.id ? null : item.id)}
                      className="flex items-center justify-between gap-2 bg-walty-cream border border-walty-teal text-walty-teal rounded-md px-3 py-1 min-w-[180px]"
                    >
                      <span className="flex items-center gap-1">
                        <selected.Icon className="w-4 h-4" />
                        {selected.label}
                      </span>
                      <span className="font-sans">£{selected.price.toFixed(2)}</span>
                    </button>
                    {openId === item.id && (
                      <ul className="absolute z-10 mt-1 w-full rounded-md border border-walty-teal bg-walty-cream shadow-card">
                        {CARD_SIZES.map((opt) => (
                          <li key={opt.id}>
                            <button
                              type="button"
                              onClick={() => {
                                onVariantChange(item.id, opt.id);
                                setOpenId(null);
                              }}
                              className={`flex w-full items-center justify-between gap-2 px-3 py-2 hover:bg-walty-orange/20 ${
                                opt.id === item.variant ? 'bg-walty-orange/20' : ''
                              }`}
                            >
                              <span className="flex items-center gap-1 font-recoleta text-walty-teal">
                                <opt.Icon className="w-4 h-4" />
                                {opt.label}
                              </span>
                              <span className="font-sans text-walty-teal">£{opt.price.toFixed(2)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-sm font-recoleta text-walty-teal">Qty</label>
              <input
                type="number"
                min={1}
                value={item.qty}
                onChange={(e) => onQtyChange(item.id, Math.max(1, Number(e.target.value)))}
                className="w-16 border rounded p-1 text-sm"
              />
            </div>
            <div className="mt-2">
              <label className="block text-sm font-recoleta text-walty-teal mb-1">Ship to</label>
              <select
                value={item.addressId || ''}
                onChange={(e) => {
                  if (e.target.value === 'new') onAddNew(item.id);
                  else onAddressChange(item.id, e.target.value);
                }}
                className="w-full border rounded p-2 text-sm"
              >
                <option value="">Select address...</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} – {a.city}
                  </option>
                ))}
                <option value="new">Add new address…</option>
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
