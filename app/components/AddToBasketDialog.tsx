'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { useBasket } from '@/lib/useBasket'

interface Props {
  open: boolean
  onClose: () => void
  slug: string
  title: string
  coverUrl: string
  frontImage?: string | null
  products?: { title: string; variantHandle: string }[]
  onAdd?: (variant: string) => void
  generateProofUrls?: (variants: string[]) => Promise<Record<string, string>>
}

const DEFAULT_OPTIONS = [
  { label: 'Mini Card', handle: 'gc-mini' },
  { label: 'Classic Card', handle: 'gc-classic' },
  { label: 'Giant Card', handle: 'gc-large' },
]

export default function AddToBasketDialog({ open, onClose, slug, title, coverUrl, frontImage, products, onAdd, generateProofUrls }: Props) {
  const [choice, setChoice] = useState<string | null>('gc-classic')
  const [mockups, setMockups] = useState<Record<string, { src: string; rect: { x: number; y: number; w: number; h: number } }>>({})
  const [size, setSize] = useState<'gc-mini' | 'gc-classic' | 'gc-large'>('gc-classic')
  const { addItem } = useBasket()

  const options =
    products?.filter((p): p is { title: string; variantHandle: string } =>
      Boolean(p && p.title && p.variantHandle),
    ).map(p => ({ label: p.title, handle: p.variantHandle })) ??
    DEFAULT_OPTIONS

  const current = mockups[size]

  useEffect(() => {
    if (!open || !frontImage) return
    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image()
        i.onload = () => res(i)
        i.onerror = rej
        i.src = src
      })
    const maskRect = (img: HTMLImageElement) => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const cx = c.getContext('2d')!
      cx.drawImage(img, 0, 0)
      const d = cx.getImageData(0, 0, c.width, c.height).data
      let minX = c.width, minY = c.height, maxX = 0, maxY = 0
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          if (d[(y * c.width + x) * 4 + 3] > 0) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
    }
    ;(async () => {
      const front = await loadImg(frontImage)
      const sizes = ['gc-mini', 'gc-classic', 'gc-large'] as const
      const data: Record<string, { src: string; rect: { x: number; y: number; w: number; h: number } }> = {}
      for (const sz of sizes) {
        const base = sz.replace('gc-', '')
        const [overlay, mask] = await Promise.all([
          loadImg(`/mockups/cards/scene_${base}_overlay.png`),
          loadImg(`/mockups/cards/${base}_mask.png`),
        ])
        const rect = maskRect(mask)
        const c = document.createElement('canvas')
        c.width = rect.w
        c.height = rect.h
        const cx = c.getContext('2d')!
        cx.drawImage(front, 0, 0, rect.w, rect.h)
        cx.globalCompositeOperation = 'destination-in'
        cx.drawImage(mask, -rect.x, -rect.y)
        cx.globalCompositeOperation = 'source-over'
        cx.drawImage(overlay, -rect.x, -rect.y)
        data[sz] = { src: c.toDataURL('image/png'), rect }
      }
      setMockups(data)
    })()
  }, [open, frontImage])

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
            {mockups[size] && (
              <div className="relative">
                <img src="/mockups/cards/Card_mockups_room_background.jpg" alt="room" className="w-full rounded" />
                <img
                  src={mockups[size].src}
                  style={{
                    position: 'absolute',
                    left: current?.rect.x ?? 0,
                    top: current?.rect.y ?? 0,
                    width: current?.rect.w ?? 0,
                    height: current?.rect.h ?? 0,
                    transition: 'all 0.2s ease',
                  }}
                  alt="preview"
                />
              </div>
            )}
            <h2 className="font-recoleta text-xl text-[--walty-teal]">Choose an option</h2>
            <ul className="space-y-2">
              {options.map((opt) => (
                <li key={opt.handle}>
                  <button
                    onClick={() => { setChoice(opt.handle); setSize(opt.handle as 'gc-mini' | 'gc-classic' | 'gc-large') }}
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
