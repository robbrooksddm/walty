'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import { Check } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (sku: string) => void
}

const OPTIONS = [
  { label: 'Single card', sku: 'single' },
  { label: 'Pack of 5', sku: 'pack5' },
  { label: 'Pack of 10', sku: 'pack10' },
  { label: 'Pack of 20', sku: 'pack20' },
]

export default function AddToBasketDialog({ open, onClose, onAdd }: Props) {
  const [choice, setChoice] = useState<string | null>(null)

  const handleAdd = () => {
    if (choice) {
      onAdd(choice)
    }
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 flex items-center justify-center" onClose={onClose}>
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="bg-white rounded shadow-lg w-[min(90vw,420px)] p-6 space-y-6">
            <h2 className="font-domine text-xl text-[--walty-teal]">Choose an option</h2>
            <ul className="space-y-2">
              {OPTIONS.map((opt) => (
                <li key={opt.sku}>
                  <button
                    onClick={() => setChoice(opt.sku)}
                    className={`w-full flex items-center justify-between border rounded-md p-3 ${choice === opt.sku ? 'border-[--walty-orange] bg-[--walty-cream]' : 'border-gray-300'}`}
                  >
                    <span>{opt.label}</span>
                    {choice === opt.sku && <Check className="text-[--walty-orange]" size={20} />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-4 pt-2">
              <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2">Back to editor</button>
              <button
                onClick={handleAdd}
                disabled={!choice}
                className={`rounded-md px-4 py-2 font-semibold text-white ${choice ? 'bg-[--walty-orange] hover:bg-orange-600' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Add to basket
              </button>
            </div>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  )
}
