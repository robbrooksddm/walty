'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { useBasket } from '@/lib/useBasket'
import type { Mockup } from '@/lib/generateCardMockups'

const ICONS: Record<string, string> = {
  'gc-mini': '/icons/mini_card_icon.svg',
  'gc-classic': '/icons/classic_card_icon.svg',
  'gc-large': '/icons/giant_card_icon.svg',
}

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  title: string
  coverUrl: string
  products?: {
    title: string
    variantHandle: string
    blurb?: string
    price?: number
  }[]
  onAdd?: (variant: string) => void
  generateProofUrls?: (variants: string[]) => Promise<Record<string, string>>
  mockups?: Record<'mini' | 'classic' | 'giant', Mockup>
}

const DEFAULT_OPTIONS = [
  { label: 'Digital Card', handle: 'digital' },
  { label: 'Mini Card', handle: 'gc-mini' },
  { label: 'Classic Card', handle: 'gc-classic' },
  { label: 'Giant Card', handle: 'gc-large' },
]

const SIZE_MAP: Record<string, 'mini' | 'classic' | 'giant'> = {
  mini: 'mini',
  classic: 'classic',
  giant: 'giant',
  'gc-mini': 'mini',
  'gc-classic': 'classic',
  'gc-large': 'giant',
}

const BG_W = 2000
const BG_H = 1333
const ROOM_BG = '/mockups/cards/Card_mockups_room_background.jpg'

export default function AddToBasketDialog({ open, onClose, slug, title, coverUrl, products, onAdd, generateProofUrls, mockups }: Props) {
  const [choice, setChoice] = useState<string | null>(null)
  const { addItem } = useBasket()

  const options =
    products?.filter((p): p is {
      title: string
      variantHandle: string
      blurb?: string
      price?: number
    } => Boolean(p && p.title && p.variantHandle)) ??
    []

  const opts = options.length
    ? options
    : DEFAULT_OPTIONS.map(o => ({ label: o.label, handle: o.handle }))

  const size = SIZE_MAP[choice ?? 'gc-classic']
  const preview = mockups ? mockups[size] : undefined

  const handleAdd = async () => {
    if (!choice) return

    let proof = ''
    let proofs: Record<string, string> = {}
    if (generateProofUrls) {
      try {
        const urls = await generateProofUrls(opts.map(o => o.variantHandle ?? o.handle))
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
          <Dialog.Panel className="relative z-10 bg-white rounded shadow-lg w-[min(90vw,480px)] overflow-hidden">
            <div className="relative w-full">
              <img src={ROOM_BG} alt="room" className="w-full h-auto" />
              {preview && (
                <img
                  src={preview.image}
                  alt="preview"
                  className="absolute"
                  style={{
                    top: `${(preview.box.y / BG_H) * 100}%`,
                    left: `${(preview.box.x / BG_W) * 100}%`,
                    width: `${(preview.box.width / BG_W) * 100}%`,
                    height: `${(preview.box.height / BG_H) * 100}%`,
                    transition:
                      'all 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
                  }}
                />
              )}
            </div>
            <div className="p-6 space-y-4">
              <h2 className="font-recoleta text-xl text-[--walty-teal]">Choose an option</h2>
              <ul className="space-y-2">
                {opts.map((opt) => {
                  const handle = (opt as any).variantHandle ?? (opt as any).handle
                  const label  = opt.title ?? (opt as any).label
                  const price  = (opt as any).price
                  const blurb  = (opt as any).blurb
                  return (
                    <li key={handle}>
                      <label
                        className={`flex items-center gap-3 px-3 py-2 border-2 rounded-md cursor-pointer ${choice === handle ? 'border-[--walty-orange] bg-[#f3dea8]' : 'border-gray-300 bg-[#F7F3EC]'}`}
                      >
                        <Image
                          src={ICONS[handle] ?? '/icons/classic_card_icon.svg'}
                          alt=""
                          width={40}
                          height={40}
                        />
                        <div className="flex-1 flex flex-col space-y-0.5">
                          <div className="font-bold">{label}</div>
                          {blurb && <p className="text-sm text-gray-600">{blurb}</p>}
                          {typeof price === 'number' && <div className="font-normal">£{price.toFixed(2)}</div>}
                        </div>
                        <input
                          type="radio"
                          name="size"
                          value={handle}
                          checked={choice === handle}
                          onChange={() => setChoice(handle)}
                          className="accent-[--walty-orange]"
                        />
                      </label>
                    </li>
                  )
                })}
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
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  )
}
