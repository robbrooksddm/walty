// app/components/ImageToolbar.tsx
'use client'

import { useEffect, useState } from 'react'
import { fabric } from 'fabric'

interface Props {
  canvas: fabric.Canvas | null
  onUndo: () => void
  onRedo: () => void
  onSave: () => void | Promise<void>
  saving: boolean
}

export default function ImageToolbar({ canvas: fc, onUndo, onRedo, onSave, saving }: Props) {
  const [_, force] = useState({})

  useEffect(() => {
    if (!fc) return
    const tick = () => force({})
    fc.on('selection:created', tick)
      .on('selection:updated', tick)
      .on('selection:cleared', tick)
    return () => {
      fc.off('selection:created', tick)
        .off('selection:updated', tick)
        .off('selection:cleared', tick)
    }
  }, [fc])

  if (!fc) return null
  const img = fc.getActiveObject() as fabric.Image | null
  if (!img || (img as any).type !== 'image') return null

  const mutate = (p: Partial<fabric.Image>) => {
    img.set(p); img.setCoords()
    fc.setActiveObject(img); fc.requestRenderAll()
    img.fire('modified'); fc.fire('object:modified', { target: img })
    force({})
  }

  const cycleVertical = () => {
    const h = img.getScaledHeight()
    const canvasH = fc.getHeight() ?? fc.height ?? 0
    const top = img.top ?? 0
    const alignTop = 0
    const alignMiddle = (canvasH - h) / 2
    const alignBottom = canvasH - h
    const current =
      Math.abs(top - alignTop) < 1
        ? 0
        : Math.abs(top - alignMiddle) < 1
        ? 1
        : Math.abs(top - alignBottom) < 1
        ? 2
        : 0
    const next = (current + 1) % 3
    const newTop = next === 0 ? alignTop : next === 1 ? alignMiddle : alignBottom
    mutate({ top: newTop })
  }

  const cycleHorizontal = () => {
    const w = img.getScaledWidth()
    const canvasW = fc.getWidth() ?? fc.width ?? 0
    const left = img.left ?? 0
    const alignLeft = 0
    const alignMiddle = (canvasW - w) / 2
    const alignRight = canvasW - w
    const current =
      Math.abs(left - alignLeft) < 1
        ? 0
        : Math.abs(left - alignMiddle) < 1
        ? 1
        : Math.abs(left - alignRight) < 1
        ? 2
        : 0
    const next = (current + 1) % 3
    const newLeft = next === 0 ? alignLeft : next === 1 ? alignMiddle : alignRight
    mutate({ left: newLeft })
  }

  return (
    <div className="fixed top-0 inset-x-0 z-30 flex justify-center pointer-events-none select-none">
      <div className="toolbar pointer-events-auto flex flex-wrap items-center gap-2 border bg-white/95 backdrop-blur rounded-md shadow px-3 py-1 max-w-[600px] w-[calc(100%-10rem)]">
        <button onClick={() => document.dispatchEvent(new Event('start-crop'))} className="toolbar-btn">Crop</button>
        <button onClick={() => mutate({ flipX: !img.flipX })} className="toolbar-btn">Flip H</button>
        <button onClick={() => mutate({ flipY: !img.flipY })} className="toolbar-btn">Flip V</button>
        <input type="range" min={0} max={1} step={0.01} value={img.opacity ?? 1} onChange={e => mutate({ opacity: +e.target.value })} className="disabled:opacity-40" />
        <button onClick={cycleVertical} className="toolbar-btn">↕︎</button>
        <button onClick={cycleHorizontal} className="toolbar-btn">↔︎</button>
      </div>

      <div className="absolute right-4 top-2 flex gap-4 pointer-events-auto">
        <button onClick={onUndo} className="command-btn">↶ Undo</button>
        <button onClick={onRedo} className="command-btn">↷ Redo</button>
        <button onClick={onSave} disabled={saving} className={`command-btn font-semibold ${saving ? 'opacity-50 cursor-not-allowed' : 'text-blue-600'}`}>
          {saving ? '⏳ Saving…' : '💾 Save'}
        </button>
      </div>
    </div>
  )
}

if (typeof window !== 'undefined' && !document.getElementById('toolbar-css')) {
  const shared = 'border px-2 py-[2px] rounded hover:bg-gray-100 disabled:opacity-40'
  const style = document.createElement('style'); style.id = 'toolbar-css'
  style.innerHTML = `.toolbar-btn{${shared}} .command-btn{${shared}}`
  document.head.appendChild(style)
}

