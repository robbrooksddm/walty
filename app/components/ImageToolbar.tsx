// app/components/ImageToolbar.tsx
'use client'

import { useEffect, useState } from 'react'
import { fabric } from 'fabric'
import { useEditor } from './EditorStore'

interface Props {
  canvas: fabric.Canvas | null
  onUndo: () => void
  onRedo: () => void
  onSave: () => void | Promise<void>
  saving: boolean
}

export default function ImageToolbar({ canvas: fc, onUndo, onRedo, onSave, saving }: Props) {
  const [_, force] = useState({})
  const reorder = useEditor(s => s.reorder)
  const updateLayer = useEditor(s => s.updateLayer)
  const activePage = useEditor(s => s.activePage)

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
  const zoom = fc.viewportTransform?.[0] ?? 1       // same scale for X/Y
  const fcH = (fc.getHeight() ?? 0) / zoom
  const fcW = (fc.getWidth() ?? 0) / zoom
  const img = fc.getActiveObject() as fabric.Image | null
  if (!img || (img as any).type !== 'image') return null

  const mutate = (p: Partial<fabric.Image>) => {
    img.set(p); img.setCoords()
    fc.setActiveObject(img); fc.requestRenderAll()
    img.fire('modified'); fc.fire('object:modified', { target: img })
    force({})
  }

  const cycleVertical = () => {
    const { top, height } = img.getBoundingRect(true, true)
    const topPos = 0
    const midPos = fcH / 2 - height / 2
    const botPos = fcH - height
    let current = -1
    if (Math.abs(top - topPos) < 1) current = 0
    else if (Math.abs(top - midPos) < 1) current = 1
    else if (Math.abs(top - botPos) < 1) current = 2
    const next = current === -1 ? 1 : (current + 1) % 3
    const target = next === 0 ? topPos : next === 1 ? midPos : botPos
    mutate({ top: img.top! + (target - top) })
  }

  const cycleHorizontal = () => {
    const { left, width } = img.getBoundingRect(true, true)
    const leftPos = 0
    const midPos = fcW / 2 - width / 2
    const rightPos = fcW - width
    let current = -1
    if (Math.abs(left - leftPos) < 1) current = 0
    else if (Math.abs(left - midPos) < 1) current = 1
    else if (Math.abs(left - rightPos) < 1) current = 2
    const next = current === -1 ? 1 : (current + 1) % 3
    const target = next === 0 ? leftPos : next === 1 ? midPos : rightPos
    mutate({ left: img.left! + (target - left) })
  }

  const toggleLock = () => {
    const locked = !(img as any).locked
    ;(img as any).locked = locked
    img.set({
      lockMovementX: locked,
      lockMovementY: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      lockRotation: locked,
    })
    fc.setActiveObject(img)
    fc.requestRenderAll()
    updateLayer(activePage, (img as any).layerIdx, { locked })
  }

  const sendBackward = () => {
    const idx = (img as any).layerIdx ?? 0
    const newIdx = Math.min(idx + 1, fc.getObjects().length - 1)
    if (newIdx !== idx) {
      reorder(idx, newIdx)
    }
  }

  const bringForward = () => {
    const idx = (img as any).layerIdx ?? 0
    const newIdx = Math.max(idx - 1, 0)
    if (newIdx !== idx) {
      reorder(idx, newIdx)
    }
  }

  return (
    <div className="fixed top-0 inset-x-0 z-30 flex justify-center pointer-events-none select-none">
      <div className="toolbar pointer-events-auto flex flex-wrap items-center gap-2 border bg-white/95 backdrop-blur rounded-md shadow px-3 py-1 max-w-[600px] w-[calc(100%-10rem)]">
        <button onClick={() => document.dispatchEvent(new Event('start-crop'))} className="toolbar-btn">Crop</button>
        <button onClick={() => mutate({ flipX: !img.flipX })} className="toolbar-btn">Flip&nbsp;H</button>
        <button onClick={() => mutate({ flipY: !img.flipY })} className="toolbar-btn">Flip&nbsp;V</button>
        <input type="range" min={0} max={1} step={0.01} value={img.opacity ?? 1} onChange={e => mutate({ opacity: +e.target.value })} className="disabled:opacity-40" />
        <button onClick={cycleVertical} className="toolbar-btn">↕︎</button>
        <button onClick={cycleHorizontal} className="toolbar-btn">↔︎</button>
        <button onClick={() => alert('TODO: remove background')} className="toolbar-btn">BG&nbsp;Remover</button>
        <button onClick={toggleLock} className="toolbar-btn">{(img as any).locked ? '🔒' : '🔓'}</button>
        <button onClick={sendBackward} className="toolbar-btn">Layer&nbsp;↓</button>
        <button onClick={bringForward} className="toolbar-btn">Layer&nbsp;↑</button>
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

