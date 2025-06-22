'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useBasket } from '@/lib/useBasket'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  title: string
  coverUrl: string
  products?: { title: string; variantHandle: string }[]
  onAdd?: (variant: string) => void
  generateProofUrl?: (variant: string) => Promise<string | null>
}

const DEFAULT_OPTIONS = [
  { label: 'Digital Card', handle: 'digital' },
  { label: 'Mini Card', handle: 'gc-mini' },
  { label: 'Classic Card', handle: 'gc-classic' },
  { label: 'Giant Card', handle: 'gc-large' },
]

export default function AddToBasketDialog({ open, onClose, slug, title, coverUrl, products, onAdd, generateProofUrl }: Props) {
  const { addItem } = useBasket()

  const options =
    products?.filter((p): p is { title: string; variantHandle: string } =>
      Boolean(p && p.title && p.variantHandle),
    ).map(p => ({ label: p.title, handle: p.variantHandle })) ??
    DEFAULT_OPTIONS

  const handleSelect = async (variant: string) => {
    let proof = ''
    if (generateProofUrl) {
      try {
        const url = await generateProofUrl(variant)
        if (typeof url === 'string' && url) proof = url
        else {
          console.warn('Proof generation failed for', variant)
          return
        }
      } catch (err) {
        console.error('proof generation', err)
        return
      }
    }

    if (!proof) return
    addItem({ slug, title, variant, image: coverUrl, proof })
    onAdd?.(variant)
    onClose()
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClose={onClose}
      >
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
          <Dialog.Panel className="relative z-10 bg-white rounded shadow-lg w-[min(90vw,420px)] p-6 space-y-6">
            <h2 className="font-domine text-xl text-[--walty-teal]">Choose an option</h2>
            <ul className="space-y-2">
              {options.map((opt) => (
                <li key={opt.handle}>
                  <button
                    onClick={() => handleSelect(opt.handle)}
                    className="w-full flex items-center justify-between border rounded-md p-3 border-gray-300 hover:bg-[--walty-cream]"
                  >
                    <span>{opt.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-end pt-2">
              <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2">Back to editor</button>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  )
}
