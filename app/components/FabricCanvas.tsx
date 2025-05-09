/**********************************************************************
 * FabricCanvas.tsx — renders one printable page with Fabric.js
 * ---------------------------------------------------------------
 * 2025‑05‑10 • Final polish
 *   – Ghost outline always visible (no hover fade logic)
 *   – Cleaned up listeners & comments
 *   – Retains Coach‑mark anchor via data‑ai‑placeholder
 *********************************************************************/
'use client'

import { useEffect, useRef } from 'react'
import { fabric }            from 'fabric'
import { useEditor }         from './EditorStore'
import { fromSanity }        from '@/app/library/layerAdapters'

/* ---------- size helpers ---------------------------------------- */
const DPI       = 300
const mm        = (n: number) => (n / 25.4) * DPI
const TRIM_W_MM = 150
const TRIM_H_MM = 214
const BLEED_MM  = 3
const PAGE_W    = Math.round(mm(TRIM_W_MM + BLEED_MM * 2))
const PAGE_H    = Math.round(mm(TRIM_H_MM + BLEED_MM * 2))
const PREVIEW_W = 420
const PREVIEW_H = Math.round(PAGE_H * PREVIEW_W / PAGE_W)
const SCALE     = PREVIEW_W / PAGE_W

/* ---------- Fabric tweak: bigger handles ------------------------ */
;(fabric.Object.prototype as any).cornerSize      = Math.round(4 / SCALE)
;(fabric.Object.prototype as any).touchCornerSize = Math.round(4 / SCALE)

/* ---------- types ------------------------------------------------ */

/** What a Sanity image-reference looks like once it’s saved in Studio */
export interface SanityImageRef {
  _type : 'image'
  asset : { _type:'reference'; _ref:string }
}

export interface Layer {
  /** Fabric object kind */
  type : 'image' | 'text'

  /** Image source
   *  • string  → direct CDN / blob URL  
   *  • object  → Sanity asset reference returned by uploads or Studio
   */
  src?: string | SanityImageRef
  assetId?: string               // “image-…” id returned from /api/upload
  width?:  number
  height?: number

  /* ─ text-specific props ─ */
  text?: string
  fontSize?:   number
  fontFamily?: string
  fontWeight?: any
  fontStyle?:  any
  underline?:  boolean
  fill?:       string
  textAlign?:  string
  lineHeight?: number

  /* ─ common props ─ */
  opacity?: number
  x: number
  y: number
  scaleX?: number
  scaleY?: number
  selectable?: boolean
  editable?:   boolean
  locked?:     boolean

  /* ─ AI placeholder bookkeeping ─ */
  _isAI?: boolean

  /** allow future ad-hoc properties without TS complaints */
  [k: string]: any
}

export interface TemplatePage {
  name  : string
  layers: Layer[]
}

/* ---------- helpers --------------------------------------------- */
export const getActiveTextbox = (fc: fabric.Canvas | null) =>
  fc && (fc.getActiveObject() as any)?.type === 'textbox'
    ? (fc.getActiveObject() as fabric.Textbox)
    : null

const hex = (c = '#000') => c.length === 4
  ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`
  : c.toLowerCase()

const syncGhost = (
  img   : fabric.Image,
  ghost : HTMLDivElement,
  canvas: HTMLCanvasElement,
) => {
  const canvasRect = canvas.getBoundingClientRect()
  const { left, top, width, height } = img.getBoundingRect()

  ghost.style.left   = `${canvasRect.left + left   * SCALE}px`
  ghost.style.top    = `${canvasRect.top  + top    * SCALE}px`
  ghost.style.width  = `${width  * SCALE}px`
  ghost.style.height = `${height * SCALE}px`
}

const getSrcUrl = (src: string | { _type:'image'; asset:{ _ref:string } } | undefined): string | undefined =>
  typeof src === 'string'
    ? src                              // already a URL / blob
    : src && src.asset?._ref           // Sanity image ref → build the CDN URL
      ? `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/production/${src.asset._ref.replace('image-','').replace('-png','').replace('-jpg','')}.png`
      : undefined                      // can’t resolve yet

/* ---------- undo / redo ----------------------------------------- */
const _hist: fabric.Object[][] = []
let   _ptr  = -1
const snap = (fc: fabric.Canvas) => {
  _hist.splice(_ptr + 1)
  _hist.push(fc.getObjects().map(o => o.toObject()))
  _ptr = _hist.length - 1
}
export const undo = (fc: fabric.Canvas) => {
  if (_ptr <= 0) return
  _ptr--; fc.loadFromJSON({ objects: _hist[_ptr] }, () => fc.renderAll())
}
export const redo = (fc: fabric.Canvas) => {
  if (_ptr >= _hist.length - 1) return
  _ptr++; fc.loadFromJSON({ objects: _hist[_ptr] }, () => fc.renderAll())
}

/* ---------- guides ---------------------------------------------- */
const addGuides = (fc: fabric.Canvas) => {
  fc.getObjects().filter(o => (o as any)._guide).forEach(o => fc.remove(o))
  const inset = mm(8 + BLEED_MM)
  const strokeW = mm(0.5)
  const dash = [mm(3)]
  const mk = (xy: [number, number, number, number]) =>
    Object.assign(new fabric.Line(xy, {
      stroke: '#34d399', strokeWidth: strokeW, strokeDashArray: dash,
      selectable: false, evented: false, excludeFromExport: true,
    }), { _guide: true })
  ;[
    mk([inset, inset, PAGE_W - inset, inset]),
    mk([PAGE_W - inset, inset, PAGE_W - inset, PAGE_H - inset]),
    mk([PAGE_W - inset, PAGE_H - inset, inset, PAGE_H - inset]),
    mk([inset, PAGE_H - inset, inset, inset]),
  ].forEach(l => fc.add(l))
}

/* ---------- white backdrop -------------------------------------- */
const addBackdrop = (fc: fabric.Canvas) => {
  // only add it once
  if (fc.getObjects().some(o => (o as any)._backdrop)) return

  const bg = new fabric.Rect({
    left   : 0,
    top    : 0,
    width  : PAGE_W,
    height : PAGE_H,
    fill   : '#ffffff',         // ← solid white
    selectable       : false,
    evented          : false,
    excludeFromExport: true,
  })
  ;(bg as any)._backdrop = true   // flag so we don’t add twice

  bg.sendToBack()
  fc.add(bg)
}


/* ---------- component ------------------------------------------- */
interface Props {
  pageIdx : number
  page?   : TemplatePage
  onReady : (fc: fabric.Canvas | null) => void
}

export default function FabricCanvas ({ pageIdx, page, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fcRef     = useRef<fabric.Canvas | null>(null)
  const hoverRef  = useRef<fabric.Rect | null>(null)
  const hydrating = useRef(false)
  const isEditing = useRef(false)

  const setPageLayers = useEditor(s => s.setPageLayers)
  const updateLayer   = useEditor(s => s.updateLayer)

  /* ---------- mount once --------------------------------------- */
  useEffect(() => {
    if (!canvasRef.current) return

    const fc = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#fff', width: PAGE_W, height: PAGE_H,
      preserveObjectStacking: true,
    })
    /*addCheckerboard(fc)*/
    addBackdrop(fc)
    fc.setViewportTransform([SCALE, 0, 0, SCALE, 0, 0])
    fc.setWidth(PREVIEW_W); fc.setHeight(PREVIEW_H)
    ;(window as any).fc = fc  // dev helper

    /* purple hover outline */
    const hl = new fabric.Rect({
      left: 0, top: 0, width: 10, height: 10, fill: 'transparent',
      stroke: '#8b5cf6', strokeWidth: 2 / SCALE,
      strokeDashArray: [6 / SCALE, 4 / SCALE],
      selectable: false, evented: false, visible: false,
      excludeFromExport: true,
    })
    hoverRef.current = hl; fc.add(hl)

    addGuides(fc)

    fc.on('selection:created', () => hl.visible = false)
      .on('selection:updated', () => hl.visible = false)
      .on('selection:cleared', () => hl.visible = false)

    fc.on('mouse:over', e => {
      const t = e.target as any
      if (!t || t._guide) return
      hl.set({
        width : t.width  * t.scaleX,
        height: t.height * t.scaleY,
        left  : t.left,
        top   : t.top,
        visible: true,
      })
      fc.requestRenderAll()
    })
    fc.on('mouse:out', () => { hl.visible = false; fc.requestRenderAll() })

    /* history & cleanup */
    fc.on('object:added',   () => snap(fc))
    fc.on('object:removed', e => {
      snap(fc)
      const g = (e.target as any)?._ghost as HTMLDivElement | undefined
      g?.remove()
    })

    /* Fabric ➜ Zustand sync */
    fc.on('object:modified', e => {
      isEditing.current = true; snap(fc)
      const t = e.target as any
      if (t?.layerIdx === undefined) return

        /* ---------- common geometry ---------------------------- */
  const d: Partial<Layer> = {
    x: t.left, y: t.top,
    scaleX: t.scaleX,  // ✨  remember explicit scale
    scaleY: t.scaleY,
  }
  /* ---------- images ------------------------------------- */
  if (t.type === 'image') {
    Object.assign(d, {
      width : t.width  * t.scaleX,
      height: t.height * t.scaleY,
    })
  }
  /* ---------- text --------------------------------------- */
  if (t.type === 'textbox') {
    Object.assign(d, {
      text       : t.text,
      fontSize   : t.fontSize,
      fontFamily : t.fontFamily,
      fontWeight : t.fontWeight,
      fontStyle  : t.fontStyle,
      underline  : t.underline,
      fill       : t.fill,
      textAlign  : t.textAlign,
      lineHeight : t.lineHeight,
      opacity    : t.opacity,
    })
  }

      updateLayer(pageIdx, t.layerIdx, d)
      setTimeout(() => { isEditing.current = false })
    })

    fc.on('text:changed', e => {
      const t = e.target as any
      if (t?.layerIdx === undefined) return
      
              /* ✨ shield the redraw-effect while the user is typing */
        isEditing.current = true
            
        updateLayer(pageIdx, t.layerIdx, {
            text       : t.text,
            fontSize   : t.fontSize,
            fontFamily : t.fontFamily,
            fontWeight : t.fontWeight,
            fontStyle  : t.fontStyle,
            underline  : t.underline,
            fill       : t.fill,
            textAlign  : t.textAlign,
            lineHeight : t.lineHeight,
            opacity    : t.opacity,
            width : t.width  * t.scaleX,
            height: t.height * t.scaleY,
          })
            /* allow redraw again after this frame */
            setTimeout(() => { isEditing.current = false })
    })

    fcRef.current = fc; onReady(fc)
    return () => { onReady(null); fc.dispose() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  /* ---------- redraw on page change ----------------------------- */
  useEffect(() => {
    const fc = fcRef.current
    if (!fc || !page) return
    if (isEditing.current) return

    hydrating.current = true
    fc.clear(); hoverRef.current && fc.add(hoverRef.current)

    /* bottom ➜ top keeps original z-order */
    for (let idx = page.layers.length - 1; idx >= 0; idx--) {
      const raw = page.layers[idx]
      const ly: Layer | null = (raw as any).type ? raw as Layer : fromSanity(raw)
      if (!ly) continue

/* ---------- IMAGES --------------------------------------------- */
if (ly.type === 'image' && ly.src) {
  // ① make sure we have a usable URL
  const srcUrl = getSrcUrl(ly.src);
  if (!srcUrl) continue;                 // nothing we can render yet

  // ② CORS flag only for http/https URLs
  const opts = srcUrl.startsWith('http') ? { crossOrigin: 'anonymous' } : undefined;

  fabric.Image.fromURL(srcUrl, rawImg => {
    const img = rawImg instanceof fabric.Image ? rawImg : new fabric.Image(rawImg);
    /* … the rest of your existing code … */

          /* scale */
          if (ly.scaleX == null || ly.scaleY == null) {
            const s = Math.min(1, PAGE_W / img.width!, PAGE_H / img.height!)
            img.scale(s)
          } else {
            img.set({ scaleX: ly.scaleX, scaleY: ly.scaleY })
          }

          /* shared props */
          img.set({
            left: ly.x, top: ly.y, originX: 'left', originY: 'top',
            selectable: ly.selectable ?? true,
            evented: ly.editable ?? true,
            opacity: ly.opacity ?? 1,
          })

          /* ---------- AI placeholder extras -------------------------------- */
if (raw._type === 'aiLayer') {
  const spec = raw.source
  const locked = !!ly.locked
  img.set({ selectable: !locked, evented: !locked, hasControls: !locked })

  /* ✨  SINGLE click — open the Selfie-drawer and pass the ref-ID */
  img.on('mouseup', () => {
    const plId = spec?._ref ?? spec?._id ?? null
    document.dispatchEvent(
      new CustomEvent('open-selfie-drawer', { detail: { placeholderId: plId } })
    )
  })



            // ─── open the Selfie Drawer on click ─────────────────────────
img.on('mouseup', () => {
  // make sure it’s still an AI placeholder
  if ((img as any)._isAI || ly._isAI) {
    useEditor.getState().setDrawerState('idle');   // <- OPEN drawer
  }
  
});

            let ghost = (img as any)._ghost as HTMLDivElement | undefined
            if (!ghost) {
              ghost = document.createElement('div')
              ghost.className = 'ai-ghost'
              ghost.setAttribute('data-ai-placeholder', '')  // CoachMark anchor
              ghost.style.opacity = '0'          // hidden until hover

              ghost.innerHTML = `
                <div class="ai-ghost__center">
                  <svg width="44" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2
                             2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Click to replace face</span>
                </div>`

              ;(img as any)._ghost = ghost
              document.body.appendChild(ghost)

              /* Fade-in on Fabric hover */
              img.on('mouseover', () => { ghost!.style.opacity = '1' })
              img.on('mouseout',  () => { ghost!.style.opacity = '0' })
            }

            const doSync = () => canvasRef.current && ghost && syncGhost(img, ghost, canvasRef.current)
            doSync()
            img.on('moving',   doSync)
               .on('scaling',  doSync)
               .on('rotating', doSync)

            /* hide overlay when actively selected */
            fc.on('selection:created', e => {
              if (e.target === img) ghost!.style.display = 'none'
            })
            fc.on('selection:cleared', () => { ghost!.style.display = '' })

            /* hide overlay when coach-mark is dismissed */
            document.addEventListener('ai-coach-dismiss', () => {
              ghost!.style.display = 'none'
            })
          }

          /* keep z-order */
          ;(img as any).layerIdx = idx
          const pos = fc.getObjects().findIndex(o =>
            (o as any).layerIdx !== undefined && (o as any).layerIdx < idx)
          fc.insertAt(img, pos === -1 ? fc.getObjects().length : pos, false)
          img.setCoords()
        }, opts)
        continue
      }

      /* ---------- TEXT ---------------------------------------- */
      if (ly.type === 'text' && ly.text) {
        const tb = new fabric.Textbox(ly.text, {
          left: ly.x, top: ly.y, originX: 'left', originY: 'top',
          width: ly.width ?? 200,
          fontSize: ly.fontSize ?? Math.round(32 / SCALE),
          fontFamily: ly.fontFamily ?? 'Arial',
          fontWeight: ly.fontWeight ?? 'normal',
          fontStyle: ly.fontStyle ?? 'normal',
          underline: !!ly.underline,
          fill: hex(ly.fill ?? '#000'),
          textAlign: ly.textAlign ?? 'left',
          lineHeight: ly.lineHeight ?? 1.16,
          opacity: ly.opacity ?? 1,
          selectable: ly.selectable ?? true,
          editable: ly.editable ?? true,
          scaleX: ly.scaleX ?? 1, scaleY: ly.scaleY ?? 1,
          lockScalingFlip: true,
        })
        ;(tb as any).layerIdx = idx
        fc.add(tb)
      }
    }

    addGuides(fc)
    hoverRef.current?.bringToFront()
    fc.requestRenderAll(); hydrating.current = false
  }, [page])

  /* ---------- render ----------------------------------------- */
  return (
    <canvas
      ref={canvasRef}
      width={PREVIEW_W}
      height={PREVIEW_H}
      className="border w-full h-auto max-w-[420px]"
    />
  )
}