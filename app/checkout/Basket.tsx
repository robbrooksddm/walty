"use client";
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Trash2, Wrench, Copy as CopyIcon } from 'lucide-react';
import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Address, CartItem } from './CheckoutClient';
import { CARD_SIZES } from './sizeOptions';

interface BasketProps {
  items: CartItem[];
  addresses: Address[];
  onQtyChange: (id: string, qty: number) => void;
  onVariantChange: (id: string, variant: string) => void;
  onAddressChange: (id: string, addressId: string) => void;
  onAddNew: (itemId: string) => void;
  onRemove: (id: string) => void;
}

export default function Basket({
  items,
  addresses,
  onQtyChange,
  onVariantChange,
  onAddressChange,
  onAddNew,
  onRemove,
}: BasketProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <h2 className="font-recoleta text-xl text-walty-teal">Your Basket</h2>
      {items.map((item) => {
        const selected = CARD_SIZES.find((s) => s.id === item.variant) || CARD_SIZES[0];
        return (
          <div key={item.id} className="relative flex gap-4 items-start bg-white p-4 rounded-md shadow-card">
            <button
              type="button"
              onClick={() => setRemoveId(item.id)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="flex-shrink-0">
              <div className="w-[140px] h-[196px] overflow-hidden rounded-md bg-gray-100">
                <Image src={item.coverUrl} alt="" width={140} height={196} className="object-cover w-full h-full" />
              </div>
              <div className="mt-1 flex flex-col items-start text-sm text-walty-teal">
                <Link href={`/cards/${item.sku}/customise`} className="hover:underline flex items-center gap-1">
                  <Wrench className="w-4 h-4" />
                  Review &amp; Tweak
                </Link>
                <Link href={`/cards/${item.sku}/customise?copy=1`} className="hover:underline flex items-center gap-1">
                  <CopyIcon className="w-4 h-4" />
                  Copy &amp; Customise
                </Link>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="font-recoleta font-bold text-walty-teal text-2xl">£{selected.price.toFixed(2)}</div>
              <div className="relative mt-2 ml-auto w-fit">
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === item.id ? null : item.id)}
                    className="flex items-center justify-between gap-2 bg-walty-cream border border-walty-teal text-walty-teal rounded-md px-3 py-2.5 min-w-[216px]"
                  >
                    <span className="flex items-center gap-1">
                      <selected.Icon className="w-4 h-4" />
                      {selected.label}
                    </span>
                    <ChevronDown className="w-4 h-4" />
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
                            className={`flex w-full items-center justify-between gap-2 px-3 py-3 hover:bg-walty-orange/20 ${
                              opt.id === item.variant ? 'bg-walty-orange/20' : ''
                            }`}
                          >
                            <span className="flex items-center gap-1 font-recoleta text-walty-teal">
                              <opt.Icon className="w-4 h-4" />
                              {opt.label}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-sm font-recoleta text-walty-teal">Qty</label>
              <select
                value={item.qty}
                onChange={(e) => onQtyChange(item.id, Number(e.target.value))}
                className="w-16 border rounded p-1 text-sm"
              >
                {Array.from({ length: 99 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
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
        );
      })}
      {removeId && (
        <Transition.Root show={true} as={Fragment}>
          <Dialog as="div" className="fixed inset-0 z-50 flex items-center justify-center" onClose={() => setRemoveId(null)}>
            <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="relative z-10 bg-white rounded shadow-lg w-[min(90vw,420px)] p-6 space-y-4">
                <Dialog.Title className="font-recoleta text-lg text-walty-teal">Remove item?</Dialog.Title>
                <p className="text-sm">You're about to remove the product from your basket and will lose any customisations made to it.</p>
                <div className="flex justify-end gap-4 pt-2">
                  <button onClick={() => setRemoveId(null)} className="rounded-md border border-gray-300 px-4 py-2">No, return to basket</button>
                  <button onClick={() => { removeId && onRemove(removeId); setRemoveId(null); }} className="rounded-md bg-walty-orange text-walty-cream px-4 py-2">Yes, remove</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </Dialog>
        </Transition.Root>
      )}
    </div>
  );
}
