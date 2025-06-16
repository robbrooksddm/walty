"use client";
import Image from 'next/image';
import { Address, CartItem } from './CheckoutClient';

interface BasketProps {
  items: CartItem[];
  addresses: Address[];
  onQtyChange: (id: string, qty: number) => void;
  onAddressChange: (id: string, addressId: string) => void;
  onAddNew: (itemId: string) => void;
}

export default function Basket({
  items,
  addresses,
  onQtyChange,
  onAddressChange,
  onAddNew,
}: BasketProps) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl text-walty-teal">Your Basket</h2>
      {items.map((item) => (
        <div key={item.id} className="flex gap-4 items-start bg-white p-4 rounded-md shadow-card">
          <div className="w-20 h-28 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
            <Image src={item.coverUrl} alt="" width={80} height={112} className="object-cover w-full h-full" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="font-medium text-walty-teal">{item.title}</div>
            <div className="text-sm text-gray-600">SKU: {item.sku}</div>
            <div className="text-sm text-gray-600">£{item.price.toFixed(2)} each</div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-sm">Qty</label>
              <input
                type="number"
                min={1}
                value={item.qty}
                onChange={(e) => onQtyChange(item.id, Math.max(1, Number(e.target.value)))}
                className="w-16 border rounded p-1 text-sm"
              />
            </div>
            <div className="mt-2">
              <label className="block text-sm mb-1">Ship to</label>
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
