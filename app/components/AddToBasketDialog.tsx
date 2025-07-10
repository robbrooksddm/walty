'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useBasket } from '@/lib/useBasket'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  title: string
  coverUrl: string
  products?: { title: string; variantHandle: string }[]
  onAdd?: (variant: string) => void
  generateProofUrls?: (variants: string[]) => Promise<Record<string, string>>
  generateMockups?: () => Promise<Record<string, string>>
}

const DEFAULT_OPTIONS = [
  { label: 'Digital Card', handle: 'digital' },
  { label: 'Mini Card', handle: 'gc-mini' },
  { label: 'Classic Card', handle: 'gc-classic' },
  { label: 'Giant Card', handle: 'gc-large' },
]

const SIZE_DIMENSIONS: Record<string, { w: number; h: number }> = {
  'gc-mini': { w: 130, h: 190 },
  'gc-classic': { w: 160, h: 225 },
  'gc-large': { w: 270, h: 380 },
}

export default function AddToBasketDialog({ open, onClose, slug, title, coverUrl, products, onAdd, generateProofUrls, generateMockups }: Props) {
  const [choice, setChoice] = useState<string | null>(null)
  const [mockups, setMockups] = useState<Record<string,string>|null>(null)
  const [mockupLoading, setMockupLoading] = useState(false)
  const { addItem } = useBasket()

  useEffect(() => {
    if (open && generateMockups) {
      setMockupLoading(true)
      generateMockups()
        .then((m) => setMockups(m))
        .catch(() => setMockups(null))
        .finally(() => setMockupLoading(false))
    } else if (!open) {
      setMockups(null)
    }
  }, [open, generateMockups])

  const options =
    products?.filter((p): p is { title: string; variantHandle: string } =>
      Boolean(p && p.title && p.variantHandle),
    ).map(p => ({ label: p.title, handle: p.variantHandle })) ??
    DEFAULT_OPTIONS

  useEffect(() => {
    if (open) {
      const initial = options.find(o => o.handle !== 'digital')?.handle || options[0]?.handle || null
      setChoice(initial)
    }
  }, [open, options])

  const handleAdd = async () => {
    if (!choice) return

    let proof = ''
    let proofs: Record<string, string> = {}
    if (generateProofUrls) {
      try {
        const urls = await generateProofUrls(options.map(o => o.handle))
        proofs = urls
        const url = urls[choice]
        if (typeof url === 'string' && url) {
          proof = url
        } else {
          console.warn('Proof generation failed for', choice)
          return
        }
      } catch (err) {
        console.error('proof generation', err)
        return
      }
    }

    if (!proof) return
    addItem({ slug, title, variant: choice, image: coverUrl, proofs })
    onAdd?.(choice)
    onClose()
    setChoice(null)
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
            <h2 className="font-recoleta text-xl text-[--walty-teal]">Choose an option</h2>
            <div className="w-full flex justify-center relative">
              {mockupLoading && <div className="py-12">Generating preview…</div>}
              {!mockupLoading && mockups && (
                <div className="relative">
                  <img src="/mockups/cards/Card_mockups_room_background.jpg" alt="room" className="w-full h-auto" />
                  {choice && mockups[choice] && (
                    <motion.img
                      key={choice}
                      src={mockups[choice]}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      initial={false}
                      animate={{ width: SIZE_DIMENSIONS[choice].w, height: SIZE_DIMENSIONS[choice].h }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    />
                  )}
                </div>
              )}
            </div>
            <ul className="space-y-2">
              {options.map((opt) => (
                <li key={opt.handle}>
                  <button
                    onClick={() => setChoice(opt.handle)}
                    className={`w-full flex items-center justify-between border rounded-md p-3 ${choice === opt.handle ? 'border-[--walty-orange] bg-[--walty-cream]' : 'border-gray-300'}`}
                  >
                    <span>{opt.label}</span>
                    {choice === opt.handle && <Check className="text-[--walty-orange]" size={20} />}
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
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  )
}
