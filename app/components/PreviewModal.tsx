'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useEffect, useRef, useState } from 'react'

export interface PreviewModalProps {
  open: boolean
  images: string[]
  onClose: () => void
}

export default function PreviewModal({ open, images, onClose }: PreviewModalProps) {
  const [idx, setIdx] = useState(0)
  const startX = useRef<number | null>(null)

  useEffect(() => {
    if (open) setIdx(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    images.forEach(src => { const i = new window.Image(); i.src = src })
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length)
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + images.length) % images.length)
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open, images.length, onClose, images])

  const touchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX }
  const touchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    const thresh = 30
    if (dx > thresh) setIdx(i => (i - 1 + images.length) % images.length)
    if (dx < -thresh) setIdx(i => (i + 1) % images.length)
    startX.current = null
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 flex items-center justify-center" onClose={onClose}>
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
          <div className="relative bg-white rounded shadow-lg overflow-hidden w-[min(90vw,420px)]" onTouchStart={touchStart} onTouchEnd={touchEnd}>
            <img src={images[idx]} alt={`page ${idx+1}`} className="w-full aspect-[3/4] object-contain" />
            {images.length > 1 && (
              <>
                <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-1">‹</button>
                <button onClick={() => setIdx(i => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-1">›</button>
              </>
            )}
            <button onClick={onClose} className="absolute top-2 right-2 text-white bg-black/50 rounded-full px-2">×</button>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  )
}
