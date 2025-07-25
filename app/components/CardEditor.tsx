'use client'

import { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react'
import { fabric }                       from 'fabric'

import { useEditor, setEditorSpec }     from './EditorStore'
if (typeof window !== 'undefined') (window as any).useEditor = useEditor // debug helper

import LayerPanel                       from './LayerPanel'
import FabricCanvas, {
  pageW,
  pageH,
  EXPORT_MULT,
  setPrintSpec,
  setPreviewSpec,
  setSafeInset,
  setSafeInsetPx,
  PrintSpec,
  PreviewSpec,
  previewW,
  previewH,
} from './FabricCanvas'
import TextToolbar                      from './TextToolbar'
import ImageToolbar                     from './ImageToolbar'
import EditorCommands                   from './EditorCommands'
import SelfieDrawer                     from './SelfieDrawer'
import CropDrawer                      from './CropDrawer'
import PreviewModal                    from './PreviewModal'
import AddToBasketDialog               from './AddToBasketDialog'
import { generateCardMockups, Mockup } from '@/lib/generateCardMockups'
import { CropTool }                     from '@/lib/CropTool'
import WaltyEditorHeader                from './WaltyEditorHeader'
import type { TemplatePage }            from './FabricCanvas'
import type { TemplateProduct }         from '@/app/library/getTemplatePages'
import { SEL_COLOR }                    from '@/lib/fabricDefaults'


/* ---------- helpers ------------------------------------------------ */
type Section = 'front' | 'inside' | 'back'
type PageIdx = 0 | 1 | 2 | 3
type Mode    = 'staff' | 'customer'
export type SaveFn = (
  pages: TemplatePage[],
  coverImageId?: string,
) => void | Promise<void>

const EMPTY: TemplatePage[] = [
  { name: 'front'  , layers: [] },
  { name: 'inner-L', layers: [] },
  { name: 'inner-R', layers: [] },
  { name: 'back'   , layers: [] },
]

/* ---------- tiny coach-mark component ------------------------------ */
function CoachMark({ anchor, onClose }: { anchor: DOMRect | null; onClose: () => void }) {
  if (!anchor) return null
  return (
    <div
      className="fixed z-40 animate-fade-in"
      style={{ top: anchor.top - 10, left: anchor.right + 12 }}
    >
      <div className="relative bg-gray-800 text-white rounded-lg shadow-lg px-4 py-3 max-w-[220px] text-sm leading-snug">
        Want to star in this poster?
        <br />Upload your photo!
        <button
          onClick={onClose}
          className="absolute top-1.5 right-2 opacity-70 hover:opacity-100"
        >
          ✕
        </button>
        <div className="absolute -left-2 top-6 w-0 h-0 border-y-8 border-y-transparent border-r-[12px] border-r-gray-800" />
      </div>
  </div>
 )
}

/* ────────────────────────────────────────────────────────────────── */
export interface CardEditorProps {
  initialPages: TemplatePage[] | undefined
  templateId?: string
  slug: string
  title: string
  coverImage?: string
  printSpec?: PrintSpec
  previewSpec?: PreviewSpec
  products?: TemplateProduct[]
  proofUrl?: string
  mode?: Mode
  onSave?: SaveFn
}

export default function CardEditor({
  initialPages,
  templateId,
  slug,
  title,
  coverImage,
  printSpec,
  previewSpec,
  products = [],
  proofUrl = '',
  mode = 'customer',
  onSave,
}: CardEditorProps) {
  if (printSpec) {
    setPrintSpec(printSpec)
    setEditorSpec(printSpec)
    console.log('\u25BA CardEditor spec =', JSON.stringify(printSpec, null, 2))
  } else {
    console.warn('CardEditor missing printSpec')
  }
  if (previewSpec) {
    setPreviewSpec(previewSpec)
  }
  useEffect(() => {
    if (!printSpec || !previewSpec) return

    // 1️⃣  explicit safe insets from the preview spec
    if (previewSpec.safeInsetXPx || previewSpec.safeInsetYPx) {
      setSafeInsetPx(previewSpec.safeInsetXPx ?? 0, previewSpec.safeInsetYPx ?? 0)
      return
    }

    if (!products.length) return
    const baseW = printSpec.trimWidthIn + printSpec.bleedIn * 2
    const baseH = printSpec.trimHeightIn + printSpec.bleedIn * 2
    const baseRatio = baseW / baseH
    const ratios = products
      .filter(p => p.showSafeArea)
      .map(p => p.printSpec)
      .filter(Boolean)
      .map(s => (s!.trimWidthIn + s!.bleedIn * 2) / (s!.trimHeightIn + s!.bleedIn * 2))
    if (!ratios.length) return
    const minRatio = Math.min(...ratios)
    let safeW = baseW
    let safeH = baseH
    if (minRatio < baseRatio) {
      safeW = baseH * minRatio
    } else if (minRatio > baseRatio) {
      safeH = baseW / minRatio
    }
    const insetX = (baseW - safeW) / 2 + printSpec.bleedIn + 0.125
    const insetY = (baseH - safeH) / 2 + printSpec.bleedIn + 0.125
    setSafeInset(insetX, insetY)
  }, [printSpec, previewSpec, products])
  /* 1 ─ hydrate Zustand once ------------------------------------- */
  useEffect(() => {
    useEditor.getState().setPages(
      Array.isArray(initialPages) && initialPages.length === 4 ? initialPages : EMPTY,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* 2 ─ store selectors ------------------------------------------ */
  const pages       = useEditor(s => s.pages)
  const setActive   = useEditor(s => s.setActive)
  const addText     = useEditor(s => s.addText)
  const addImage    = useEditor(s => s.addImage)
  const updateLayer = useEditor(s => s.updateLayer)
  const undo = useEditor(s => s.undo)
  const redo = useEditor(s => s.redo)


  /* 3 ─ page selection ------------------------------------------ */
  const [activeIdx, setActiveIdx] = useState<PageIdx>(0)
  const section: Section =
    activeIdx === 0 ? 'front' :
    activeIdx === 3 ? 'back'  : 'inside'
  useEffect(() => { setActive(activeIdx) }, [activeIdx, setActive])

  /* 4 ─ Fabric canvases ------------------------------------------ */
  const [canvasMap, setCanvasMap] =
    useState<(fabric.Canvas | null)[]>([null, null, null, null])
  const onReady = (idx: number, fc: fabric.Canvas | null) =>
    setCanvasMap(list => { const next = [...list]; next[idx] = fc; return next })
  const activeFc = canvasMap[activeIdx]

  /* ensure any active selection is cleared before switching pages */
  const gotoPage = (idx: PageIdx) => {
    canvasMap.forEach(fc => {
      if (fc) {
        fc.discardActiveObject()
        fc.requestRenderAll()
      }
    })
    setActiveIdx(idx)
  }

  const [thumbs, setThumbs] = useState<string[]>(['', '', '', ''])

  const THUMB_MULT = 0.25
  const THUMB_DELAY = 300
  const thumbTimer = useRef<NodeJS.Timeout | null>(null)
  const lastThumb = useRef(0)

  const updateThumbFromCanvas = (idx: number, fc: fabric.Canvas) => {
    const run = () => {
      try {
        if (!(fc as any).lowerCanvasEl) return
        fc.renderAll()
        requestAnimationFrame(() => {
          try {
            const canvasEl = fc.toCanvasElement(THUMB_MULT)
            canvasEl.toBlob(
              blob => {
                if (!blob) return
                const url = URL.createObjectURL(blob)
                setThumbs(prev => {
                  const next = [...prev]
                  next[idx] = url
                  return next
                })
              },
              'image/jpeg',
              0.8,
            )
          } catch (err) {
            console.error('thumb blob failed', err)
          }
        })
      } catch (err) {
        console.error('thumb failed', err)
      }
    }
    const now = Date.now()
    if (now - lastThumb.current > THUMB_DELAY) {
      lastThumb.current = now
      run()
    } else {
      if (thumbTimer.current) clearTimeout(thumbTimer.current)
      thumbTimer.current = setTimeout(() => {
        lastThumb.current = Date.now()
        run()
      }, THUMB_DELAY)
    }
  }

  const updateThumb = (idx: number) => {
    const fc = canvasMap[idx]
    if (fc) updateThumbFromCanvas(idx, fc)
  }

  useLayoutEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ pageIdx: number; canvas: fabric.Canvas }>).detail
      if (detail.canvas && detail.pageIdx === activeIdx) {
        updateThumbFromCanvas(detail.pageIdx, detail.canvas)
      }
    }
    document.addEventListener('card-canvas-rendered', handler)
    return () => document.removeEventListener('card-canvas-rendered', handler)
  }, [activeIdx])

  useEffect(() => {
    canvasMap.forEach((fc, idx) => {
      if (fc && !thumbs[idx]) updateThumbFromCanvas(idx, fc)
    })
  }, [canvasMap])

  useEffect(() => {
    updateThumb(activeIdx)
  }, [pages, activeIdx])

  const [activeType, setActiveType] = useState<'text' | 'image' | null>(null)
  useEffect(() => {
    const fc = activeFc
    if (!fc) return
    const update = () => {
      const obj = fc.getActiveObject() as any
      const t = obj ? obj.type : null
      setActiveType(t === 'textbox' ? 'text' : t === 'image' ? 'image' : null)
    }
    update()
    fc.on('selection:created', update)
      .on('selection:updated', update)
      .on('selection:cleared', update)
    return () => {
      fc.off('selection:created', update)
        .off('selection:updated', update)
        .off('selection:cleared', update)
    }
  }, [activeFc])

  /* track cropping state per page */
  const [cropping, setCropping] =
    useState<[boolean, boolean, boolean, boolean]>([false, false, false, false])
  const handleCroppingChange = (idx: number, state: boolean) => {
    setCropping(prev => {
      const next = [...prev] as typeof prev
      next[idx] = state
      return next
    })
    if (idx === activeIdx) setCropMode(state)
  }

  const isCropMode   = useEditor(s => s.isCropMode)
  const setCropMode  = useEditor(s => s.setCropMode)

  /* 5 ─ save ------------------------------------------------------ */
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
    canvasMap.forEach(fc => {
      const tool = (fc as any)?._cropTool as CropTool | undefined
      if (tool?.isActive) tool.commit()
    })
    canvasMap.forEach(fc => {
      const sync = (fc as any)?._syncLayers as (() => void) | undefined
      if (sync) sync()
    })
    const finalPages = useEditor.getState().pages
      let coverImageId: string | undefined
      const fc = canvasMap[0]
      if (fc) {
        try {
          console.log('Fabric canvas px', fc.getWidth(), fc.getHeight())
          console.log('Expected page px', pageW(), pageH())
          console.log('Export multiplier', EXPORT_MULT())
          const dataUrl = fc.toDataURL({
            format: 'jpeg',
            quality: 0.8,
            multiplier: EXPORT_MULT(),
          })
          const res = await fetch(dataUrl)
          const blob = await res.blob()
          const form = new FormData()
          form.append('file', new File([blob], 'cover.jpg', { type: blob.type }))
          const up = await fetch('/api/upload', { method: 'POST', body: form })
          if (up.ok) {
            const json = await up.json()
            coverImageId = json.assetId
          }
        } catch (err) {
          console.error('cover upload failed', err)
        }
      }
      await onSave(finalPages, coverImageId)
    }
    finally { setSaving(false) }
  }

/* 6 ─ selfie drawer ------------------------------------------------- */
const [drawerOpen, setDrawerOpen]           = useState(false)
const [aiPlaceholderId, setAiPlaceholderId] = useState<string | null>(null)

/* preview modal state */
const [previewOpen, setPreviewOpen] = useState(false)
const [previewImgs, setPreviewImgs] = useState<string[]>([])

/* add-to-basket modal state */
const [basketOpen, setBasketOpen] = useState(false)
const [basketMockups, setBasketMockups] = useState<Record<'mini'|'classic'|'giant', Mockup> | null>(null)

/* listen for the event FabricCanvas now emits */
useEffect(() => {
  const open = (e: Event) => {
    const id =
      (e as CustomEvent<{ placeholderId: string | null }>).detail
        ?.placeholderId ?? null
    setAiPlaceholderId(id)
    setDrawerOpen(true)
  }
  document.addEventListener('open-selfie-drawer', open)
  return () => document.removeEventListener('open-selfie-drawer', open)
}, [])

// start-crop → begin crop tool and enter crop mode
useEffect(() => {
  const handler = () => {
    const fc = canvasMap[activeIdx]
    if (!fc) return
    const obj = fc.getActiveObject() as any
    if (!obj || obj.type !== 'image' || obj.locked) return
    const tool = (fc as any)._cropTool as CropTool | undefined
    if (tool && !tool.isActive) {
      tool.begin(obj)
      setCropping(prev => { const n = [...prev] as typeof prev; n[activeIdx] = true; return n })
      setCropMode(true)
    }
  }
  document.addEventListener('start-crop', handler)
  return () => document.removeEventListener('start-crop', handler)
}, [canvasMap, activeIdx])

/* 6 b – when the user picks one of the generated variants ----------- */
const handleSwap = (url: string) => {
  const pageIdx = activeIdx                         // current page
  const lyIdx   = pages[pageIdx].layers.findIndex(  // its aiLayer
                    l => l._type === 'aiLayer')
  if (lyIdx === -1) return                          // nothing to swap

  const { x, y, w, h } =
        pages[pageIdx].layers[lyIdx] as any         // keep geometry

  updateLayer(pageIdx, lyIdx, {
    _type : 'editableImage',                        // ← now a normal image
    src   : url,                                    // variant’s CDN URL
    x, y, w, h,
  })

  setDrawerOpen(false)
}

const exitCrop = (commit: boolean) => {
  const fc = canvasMap[activeIdx]
  const tool = (fc as any)?._cropTool as CropTool | undefined
  if (tool?.isActive) {
    commit ? tool.commit() : tool.cancel()
  }
  setCropping(prev => { const n = [...prev] as typeof prev; n[activeIdx] = false; return n })
  setCropMode(false)
}

const setCropRatio = (r: number | null) => {
  const fc = canvasMap[activeIdx]
  if (!fc) return
  const tool = (fc as any)?._cropTool as CropTool | undefined
  const frame = tool ? (tool as any).frame as fabric.Group | null : null
  const img = tool ? (tool as any).img as fabric.Image | null : null
  if (!tool || !tool.isActive || !frame) return
  const ratio = r === null || Number.isNaN(r) ? null : r
  tool.setRatio?.(ratio)

  let w = frame.width! * frame.scaleX!
  let h = frame.height! * frame.scaleY!
  const cX = frame.left! + w / 2
  const cY = frame.top! + h / 2

  if (ratio !== null) {
    const base = Math.max(w, h)
    if (ratio >= 1) {
      w = base
      h = base / ratio
    } else {
      w = base * ratio
      h = base
    }
  }

  if (img) {
    const maxW = img.getScaledWidth()
    const maxH = img.getScaledHeight()
    const scale = Math.min(maxW / w, maxH / h, 1)
    w *= scale
    h *= scale
  }

  const rect = frame.item(0) as fabric.Rect
  rect.set({ left: 0, top: 0, width: w, height: h, scaleX: 1, scaleY: 1 })
  rect.setCoords()

  frame.set({ width: w, height: h, scaleX: 1, scaleY: 1 })
  const g = frame as any
  if (g._calcBounds && g._updateObjectsCoords) {
    g._calcBounds()
    g._updateObjectsCoords()
  }

  let left = cX - w / 2
  let top = cY - h / 2
  if (img) {
    const minL = img.left!
    const minT = img.top!
    const maxL = minL + img.getScaledWidth() - w
    const maxT = minT + img.getScaledHeight() - h
    left = Math.min(Math.max(left, minL), maxL)
    top = Math.min(Math.max(top, minT), maxT)
  }
  frame.set({
    scaleX: 1,
    scaleY: 1,
    left,
    top,
  })
  rect.setCoords()
  frame.setCoords()
  ;(tool as any).clampFrame?.()
  tool['clamp']?.(true)
  ;(tool as any).updateMasks?.()
  fc.setActiveObject(frame)
  fc.requestRenderAll()
}

/* generate images and show preview */
const handlePreview = () => {
  const imgs: string[] = []
  canvasMap.forEach((fc, i) => {
    if (!fc) return
    const tool = (fc as any)._cropTool as CropTool | undefined
    if (tool?.isActive) tool.commit()
    fc.renderAll()
    console.log('Fabric canvas px', fc.getWidth(), fc.getHeight())
    console.log('Expected page px', pageW(), pageH())
    console.log('Export multiplier', EXPORT_MULT())
    imgs[i] = fc.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: EXPORT_MULT(),
    })
  })
  setPreviewImgs(imgs)
  setPreviewOpen(true)
}

const generateBasketMockups = async () => {
  const fc = canvasMap[0]
  if (!fc) return null
  fc.renderAll()
  const url = fc.toDataURL({ format: 'png', quality: 1, multiplier: EXPORT_MULT() })
  try {
    return await generateCardMockups(url)
  } catch (err) {
    console.error('mockup generation', err)
    return null
  }
}

/* helper – gather pages and rendered images once */
const collectProofData = (showGuides = false) => {
  canvasMap.forEach(fc => {
    const tool = (fc as any)?._cropTool as CropTool | undefined
    if (tool?.isActive) tool.commit()
  })
  canvasMap.forEach(fc => {
    const sync = (fc as any)?._syncLayers as (() => void) | undefined
    if (sync) sync()
  })

  const pages = useEditor.getState().pages
  const pageImages: string[] = []
  canvasMap.forEach(fc => {
    if (!fc) { pageImages.push(''); return }
    const guides = fc.getObjects().filter(o => (o as any)._guide)
    guides.forEach(g => g.set('visible', showGuides))
    fc.renderAll()
    pageImages.push(
      fc.toDataURL({ format: 'png', quality: 1, multiplier: EXPORT_MULT() })
    )
    guides.forEach(g => g.set('visible', true))
  })
  return { pages, pageImages }
}

/* fetch proof blob for one product */
const fetchProofBlob = async (
  sku: string,
  filename: string,
  pages: any[],
  pageImages: string[],
) => {
  try {
    const res = await fetch('/api/proof', {
      method : 'POST',
      headers: { 'content-type': 'application/json' },
      body   : JSON.stringify({ pages, pageImages, sku, id: templateId ?? slug, filename }),
    })
    if (res.ok) {
      return await res.blob()
    }
  } catch (err) {
    console.error('proof', err)
  }
  return null
}

/* helper – generate proof, upload to Sanity and return its CDN URL */
const generateProofURL = async (variantHandle: string): Promise<string | null> => {
  const product = products.find(p => p.variantHandle === variantHandle)
  const sku = product?.slug ?? variantHandle
  const showGuides = product?.showProofSafeArea ?? false
  if (typeof document !== 'undefined') {
    try {
      if (document.fonts?.status !== 'loaded') {
        await document.fonts.ready
      }
      await new Promise(r => requestAnimationFrame(() => r(null)))
    } catch {
      /* ignore */
    }
  }
  const { pages, pageImages } = collectProofData(showGuides)
  const blob = await fetchProofBlob(sku, `${variantHandle}.jpg`, pages, pageImages)
  if (!blob) return null

  try {
    const form = new FormData()
    form.append('file', new File([blob], `${variantHandle}.jpg`, { type: blob.type }))
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (res.ok) {
      const { url } = await res.json()
      return typeof url === 'string' && url ? url : null
    }
  } catch (err) {
    console.error('proof upload', err)
  }
  return null
}

const generateProofURLs = async (
  handles: string[],
): Promise<Record<string, string>> => {
  const entries = await Promise.all(
    handles.map(async h => [h, await generateProofURL(h)] as const),
  )
  const urls: Record<string, string> = {}
  for (const [h, url] of entries) {
    if (url) urls[h] = url
  }
  if (Object.keys(urls).length === 0) throw new Error('proof generation failed')
  return urls
}

/* download proofs for all products */
const handleProofAll = async () => {
  if (!products.length) return
  const JSZip = (await import('jszip')).default

  if (typeof document !== 'undefined') {
    try {
      if (document.fonts?.status !== 'loaded') {
        await document.fonts.ready
      }
      await new Promise(r => requestAnimationFrame(() => r(null)))
    } catch {
      /* ignore */
    }
  }

  const zip = new JSZip()
  for (const p of products) {
    const { pages, pageImages } = collectProofData(p.showProofSafeArea)
    const name = `${p.slug}.jpg`
    const blob = await fetchProofBlob(p.slug, name, pages, pageImages)
    if (blob) zip.file(name, blob)
  }
  const out = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(out)
  const a = document.createElement('a')
  a.href = url
  a.download = 'proofs.zip'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

  /* 7 ─ coach-mark ----------------------------------------------- */
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const [zoom, setZoom] = useState(1)
  const [sliderPos, setSliderPos] = useState(0)
  const zoomRef = useRef(1)
  const targetZoom = useRef(1)
  const animRef = useRef<number>()
  const zoomPointRef = useRef<{ x: number; y: number } | null>(null)

  const sliderToZoom = (pos: number) => {
    const pct = pos < 0 ? 10 + (pos + 1) * 90 : 100 + pos * 400
    return pct / 100
  }

  const zoomToSlider = (z: number) => {
    const pct = z * 100
    return pct < 100 ? (pct - 10) / 90 - 1 : (pct - 100) / 400
  }

  const animateZoom = () => {
    const current = zoomRef.current
    const target = targetZoom.current
    if (Math.abs(current - target) < 0.001) {
      zoomRef.current = target
      setZoom(target)
      canvasMap.forEach(fc => fc?.requestRenderAll())
      animRef.current = undefined
      return
    }
    const next = current + (target - current) * 0.15
    zoomRef.current = next
    const origin = zoomPointRef.current
    canvasMap.forEach(fc => {
      if (!fc) return
      const base = fc.getZoom() / current
      const point = origin
        ? new fabric.Point(origin.x, origin.y)
        : new fabric.Point(fc.getWidth() / 2, fc.getHeight() / 2)
      fc.zoomToPoint(point, base * next)
      fc.requestRenderAll()
    })
    setZoom(next)
    animRef.current = requestAnimationFrame(animateZoom)
  }

  const setZoomSmooth = useCallback((val: number, origin: { x: number; y: number } | null) => {
    zoomPointRef.current = origin
    targetZoom.current = Math.min(Math.max(val, 0.1), 5)
    setSliderPos(zoomToSlider(targetZoom.current))
    if (!animRef.current) animRef.current = requestAnimationFrame(animateZoom)
  }, [])

  const handleZoomIn = useCallback(() => {
    const fc = activeFc
    const origin = fc ? { x: fc.getWidth() / 2, y: fc.getHeight() / 2 } : null
    setZoomSmooth(targetZoom.current + 0.25, origin)
  }, [activeFc, setZoomSmooth])

  const handleZoomOut = useCallback(() => {
    const fc = activeFc
    const origin = fc ? { x: fc.getWidth() / 2, y: fc.getHeight() / 2 } : null
    setZoomSmooth(targetZoom.current - 0.25, origin)
  }, [activeFc, setZoomSmooth])
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current || typeof window === 'undefined') return
    if (localStorage.getItem('ai_coachmark_shown'))      return

    let tries = 0
    const tick = () => {
      const el = document.querySelector('[data-ai-placeholder]') as HTMLElement | null
      if (el) {
        const update = () => setAnchor(el.getBoundingClientRect())
        update()
        window.addEventListener('scroll',  update, { passive:true })
        window.addEventListener('resize', update)
        return
      }
      if (++tries < 15) setTimeout(tick, 200)
    }
    tick()
    ran.current = true
  }, [])

  useEffect(() => {
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        const fc = activeFc
        if (fc) {
          const rect = fc.upperCanvasEl.getBoundingClientRect()
          zoomPointRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        }
        const delta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY
        setZoomSmooth(targetZoom.current * Math.pow(0.999, delta), zoomPointRef.current)
        e.preventDefault()
      }
    }
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          handleZoomIn()
          e.preventDefault()
        }
        if (e.key === '-') {
          handleZoomOut()
          e.preventDefault()
        }
      }
    }
    window.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('keydown', key)
    }
  }, [activeFc, handleZoomIn, handleZoomOut, setZoomSmooth])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !activeFc) return

    const fc = activeFc
    const canvas = fc.upperCanvasEl

    let box: HTMLDivElement | null = null
    let startX = 0
    let startY = 0

    const createBox = (x: number, y: number) => {
      box = document.createElement('div')
      box.style.position = 'fixed'
      box.style.pointerEvents = 'none'
      box.style.zIndex = '40'
      box.style.border = `1px dashed ${SEL_COLOR}`
      box.style.background = 'rgba(46,196,182,0.05)'
      box.style.left = `${x}px`
      box.style.top = `${y}px`
      document.body.appendChild(box)
    }

    const updateBox = (x: number, y: number) => {
      if (!box) return
      const left = Math.min(startX, x)
      const top = Math.min(startY, y)
      const w = Math.abs(x - startX)
      const h = Math.abs(y - startY)
      box.style.left = `${left}px`
      box.style.top = `${top}px`
      box.style.width = `${w}px`
      box.style.height = `${h}px`
    }

    const removeBox = () => {
      box?.remove()
      box = null
    }

    const forward = (ev: PointerEvent | MouseEvent) => ({
      clientX: ev.clientX,
      clientY: ev.clientY,
      button: ev.button,
      buttons: 'buttons' in ev ? (ev as any).buttons : 0,
      ctrlKey: ev.ctrlKey,
      shiftKey: ev.shiftKey,
      altKey: ev.altKey,
      metaKey: ev.metaKey,
      bubbles: true,
      cancelable: true,
    })

    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('canvas')) return
      if (target.closest('button, input, textarea, select, label, a')) return
      if (target.closest('[data-layer-panel]')) return

      startX = e.clientX
      startY = e.clientY
      createBox(startX, startY)

      fc.discardActiveObject()
      fc.requestRenderAll()

      const down = new MouseEvent('mousedown', forward(e))
      canvas.dispatchEvent(down)

      const move = (ev: PointerEvent) => {
        canvas.dispatchEvent(new MouseEvent('mousemove', forward(ev)))
        updateBox(ev.clientX, ev.clientY)
      }
      const up = (ev: PointerEvent) => {
        canvas.dispatchEvent(new MouseEvent('mouseup', forward(ev)))
        removeBox()
        document.removeEventListener('pointermove', move)
        document.removeEventListener('pointerup', up)
      }
      document.addEventListener('pointermove', move)
      document.addEventListener('pointerup', up)
    }

    el.addEventListener('pointerdown', handler)
    return () => {
      el.removeEventListener('pointerdown', handler)
      removeBox()
    }
  }, [activeFc])

  /* 8 ─ loader guard --------------------------------------------- */
  if (pages.length !== 4) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        loading template…
      </div>
    )
  }

  const boxWidth = previewW() * zoom
  const box = `flex-shrink-0 relative`

  /* ---------------- UI ------------------------------------------ */
  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen box-border"
      style={{ paddingTop: "calc(var(--walty-header-h) + var(--walty-toolbar-h))" }}
    >
      <WaltyEditorHeader                     /* ② mount new component */
        onPreview={handlePreview}
        onAddToBasket={async () => {
          const m = await generateBasketMockups()
          if (m) setBasketMockups(m)
          setBasketOpen(true)
        }}
        height={72}                          /* match the design */
      />

      {!isCropMode && (
        <EditorCommands
          onUndo={undo}
          onRedo={redo}
          onSave={handleSave}
          onProof={mode === 'staff' ? handleProofAll : undefined}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          saving={saving}
          mode={mode}
        />
      )}
      
      <div
        className={`flex flex-1 relative bg-[--walty-cream] mx-auto ${
          isCropMode ? '' : 'lg:max-w-6xl'
        }`}
      >
        {/* global overlays */}
        <CoachMark
          anchor={anchor}
          onClose={() => {
            setAnchor(null)
            localStorage.setItem('ai_coachmark_shown', '1')
          }}
        />
        <SelfieDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onUseSelected={handleSwap}
          placeholderId={aiPlaceholderId}   /* ← NEW prop */
        />
        <CropDrawer
          open={isCropMode}
          onCancel={() => exitCrop(false)}
          onApply={() => exitCrop(true)}
          onRatio={setCropRatio}
        />


        {/* sidebar */}
        {!isCropMode && <LayerPanel />}

        {/* main */}
        <div
          className={`flex flex-col flex-1 min-h-0 mx-auto ${
            isCropMode ? 'max-w-none' : 'max-w-[868px]'
          }`}
        >

          {!isCropMode && (activeType === 'text' ? (
            <TextToolbar
              canvas={activeFc}
              addText={addText}
              addImage={addImage}
              mode={mode}
              saving={saving}
            />
          ) : activeType === 'image' ? (
            <ImageToolbar
              canvas={activeFc}
              saving={saving}
              mode={mode}
            />
          ) : (
            <div
              className="sticky inset-x-0 z-30 flex justify-center pointer-events-none select-none"
              style={{
                top: 'var(--walty-header-h)',
                marginTop: 'calc(var(--walty-toolbar-h) * -1)',
                height: 'var(--walty-toolbar-h)',
              }}
            />
          ))}

                    {/* canvases */}
          <div
            className={`flex-1 flex justify-center items-start bg-[--walty-cream] pt-6 gap-6 ${
              isCropMode ? 'overflow-visible' : 'overflow-auto'
            }`}
            onMouseDown={e => {
              if (e.target === e.currentTarget && activeFc) {
                activeFc.discardActiveObject();
                activeFc.requestRenderAll();
              }
            }}
          >
            
            {/* front */}
            <div
              className={section === 'front' ? box : 'hidden'}
              style={{ width: boxWidth }}
              onClick={() => activeIdx !== 0 && gotoPage(0)}
            >
              <FabricCanvas
                pageIdx={0}
                page={pages[0]}
                onReady={fc => onReady(0, fc)}
                isCropping={cropping[0]}
                onCroppingChange={state => handleCroppingChange(0, state)}
                zoom={zoom}
                mode={mode}
              />
              {activeIdx !== 0 && (
                <div className="absolute inset-0 bg-black/30 cursor-pointer" />
              )}
            </div>
            {/* inside */}
            <div className={section === 'inside' ? 'flex gap-0' : 'hidden'}>
              <div
                className={`${box} mr-[-1px]`}
                style={{ width: boxWidth }}
                onClick={() => activeIdx !== 1 && gotoPage(1)}
              >
                <FabricCanvas
                  pageIdx={1}
                  page={pages[1]}
                  onReady={fc => onReady(1, fc)}
                  isCropping={cropping[1]}
                  onCroppingChange={state => handleCroppingChange(1, state)}
                  zoom={zoom}
                  mode={mode}
                  className="rounded-r-none border-r-0"
                />
                {activeIdx !== 1 && (
                  <div className="absolute inset-0 bg-black/30 cursor-pointer" />
                )}
              </div>
              <div
                className={box}
                style={{ width: boxWidth }}
                onClick={() => activeIdx !== 2 && gotoPage(2)}
              >
                <FabricCanvas
                  pageIdx={2}
                  page={pages[2]}
                  onReady={fc => onReady(2, fc)}
                  isCropping={cropping[2]}
                  onCroppingChange={state => handleCroppingChange(2, state)}
                  zoom={zoom}
                  mode={mode}
                  className="rounded-l-none border-l-0"
                />
                {activeIdx !== 2 && (
                  <div className="absolute inset-0 bg-black/30 cursor-pointer" />
                )}
              </div>
            </div>
            {/* back */}
            <div
              className={section === 'back' ? box : 'hidden'}
              style={{ width: boxWidth }}
              onClick={() => activeIdx !== 3 && gotoPage(3)}
            >
              <FabricCanvas
                pageIdx={3}
                page={pages[3]}
                onReady={fc => onReady(3, fc)}
                isCropping={cropping[3]}
                onCroppingChange={state => handleCroppingChange(3, state)}
                zoom={zoom}
                mode={mode}
              />
              {activeIdx !== 3 && (
                <div className="absolute inset-0 bg-black/30 cursor-pointer" />
              )}
            </div>
          </div>

          {/* thumbnails */}
          <div className="thumbnail-bar sticky bottom-0 z-20 flex justify-center gap-2 px-3 py-2 bg-[--walty-cream] text-xs">
            {(['FRONT', 'INNER-L', 'INNER-R', 'BACK'] as const).map((lbl, i) => (
              <button
                key={lbl}
                className={`thumb ${activeIdx === i ? 'thumb-active' : ''}`}
                onClick={() => activeIdx !== i && gotoPage(i as PageIdx)}
              >
                {thumbs[i] ? (
                  <img
                    src={thumbs[i]}
                    alt={lbl}
                    className="h-full w-full object-cover"
                />
              ) : (
                lbl
              )}
              </button>
            ))}
          </div>
        </div>
      </div>
      <PreviewModal
        open={previewOpen}
        images={previewImgs}
        onClose={() => setPreviewOpen(false)}
      />
      <AddToBasketDialog
        open={basketOpen}
        onClose={() => {
          setBasketOpen(false)
          setBasketMockups(null)
        }}
        slug={slug}
        title={title}
        coverUrl={coverImage || ''}
        products={products}
        generateProofUrls={generateProofURLs}
        mockups={basketMockups || undefined}
      />
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white shadow px-3 py-2 rounded">
        <span className="text-xs">{Math.round(zoom * 100)}%</span>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={sliderPos}
          onChange={e => {
            const val = parseFloat(e.currentTarget.value)
            setSliderPos(val)
            const origin = activeFc ? { x: activeFc.getWidth() / 2, y: activeFc.getHeight() / 2 } : null
            setZoomSmooth(sliderToZoom(val), origin)
          }}
          className="h-2 w-32"
        />
      </div>
    </div>
  )
}
