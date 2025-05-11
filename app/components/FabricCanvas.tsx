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
const SEL_COLOR = '#8b5cf6'                      // same purple you use

;(fabric.Object.prototype as any).cornerSize      = Math.round(4 / SCALE)
;(fabric.Object.prototype as any).touchCornerSize = Math.round(4 / SCALE)
;(fabric.Object.prototype as any).borderColor       = SEL_COLOR
;(fabric.Object.prototype as any).borderDashArray   = [6 / SCALE, 4 / SCALE]
;(fabric.Object.prototype as any).borderScaleFactor = 1     // 1-pixel stroke
;(fabric.Object.prototype as any).cornerStrokeColor = SEL_COLOR


/* ------------------------------------------------------------------ *
 *  Fabric-layer types  •  2025-06-11
 *    –  NEW  ImageSrc helper alias (string | SanityImageRef | null)
 *    –  src is now   src?: ImageSrc        (allows the temporary null)
 *    –  tighter docs + small alphabetic re-order for readability
 * ------------------------------------------------------------------ */

/** What a Sanity-stored image reference looks like once the asset
 *  has been uploaded or when the document is fetched back from Studio.
 */
export interface SanityImageRef {
  _type : 'image'
  asset : { _type: 'reference'; _ref: string }
}

/** Anything the canvas can draw as an image _right now_ */
export type ImageSrc = string | SanityImageRef | null

/** A single canvas layer (image | text) */
export interface Layer {
  /* ---- layer kind ------------------------------------------------ */
  type: 'image' | 'text'

  /* ---- IMAGE specific ------------------------------------------- */
  /**  
   * `string`   → direct CDN / blob URL  
   * `object`   → Sanity asset reference (after upload / fetch)  
   * `null`     → “nothing yet” placeholder while the upload is in-flight  
   */
  src?: ImageSrc

  /**  
   * Always-safe CDN URL.  Added as soon as the upload succeeds so the
   * editor never has to “wait” for Sanity to resolve the reference.
   */
  srcUrl?:  string

  /** `image-…` ID returned by `/api/upload` */
  assetId?: string

  /* ---- SHARED geometry / style ---------------------------------- */
  x: number
  y: number
  width:  number
  height?: number

  opacity?:   number
  scaleX?:    number
  scaleY?:    number
  selectable?:boolean
  editable?:  boolean
  locked?:    boolean

  /* ---- TEXT specific -------------------------------------------- */
  text?:        string
  fill?:        string
  fontSize?:    number
  fontFamily?:  string
  fontStyle?:   '' | 'normal' | 'italic' | 'oblique'
  fontWeight?:  string | number
  underline?:   boolean
  textAlign?:   'left' | 'center' | 'right'
  lineHeight?:  number

  /* ---- AI placeholder bookkeeping ------------------------------- */
  _isAI?: boolean

  /** Allow future ad-hoc properties without TypeScript complaints */
  [k: string]: any
}

/** A single page inside the greeting-card template */
export interface TemplatePage {
  name:   string
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

const getSrcUrl = (raw: Layer): string | undefined => {
    /* 1 — explicit override from the editor */
    if (raw.srcUrl) return raw.srcUrl
  
    /* 2 — plain string already means “loadable url / blob” */
    if (typeof raw.src === 'string') return raw.src
  
    /* 3 — Sanity image reference → build the CDN url */
    if (raw.src && raw.src.asset?._ref) {
      const id = raw.src.asset._ref             // image-xyz-2000x2000-png
        .replace('image-', '')                  // xyz-2000x2000-png
        .replace(/\-(png|jpg|jpeg|webp)$/, '')  // xyz-2000x2000
      return `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/production/${id}.png`
    }
  
    /* nothing usable yet */
    return undefined
  }                   // can’t resolve yet


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

/* ── 1 ▸ Canvas bootstrap ─────────────────────────────────── */
const fc = new fabric.Canvas(canvasRef.current, {
  backgroundColor       : '#fff',
  width                 : PAGE_W,
  height                : PAGE_H,
  preserveObjectStacking: true,
})
addBackdrop(fc)
fc.setViewportTransform([SCALE, 0, 0, SCALE, 0, 0])
fc.setWidth(PREVIEW_W)
fc.setHeight(PREVIEW_H)
;(window as any).fc = fc                                 // dev helper

/* helper: physical-pixel dash & padding ------------------- */
const PAD  = 4 / SCALE                    // 4 CSS-px margin all around
const dash = (gap:number) => [gap / SCALE, (gap - 2) / SCALE]

/* ── 2 ▸ Hover overlay only ─────────────────────────────── */
const hoverHL = new fabric.Rect({
  originX:'left', originY:'top', strokeUniform:true,
  fill:'transparent',
  stroke:'#a78bfa',               // lighter purple
  strokeWidth:1 / SCALE,
  strokeDashArray:dash(4),
  selectable:false, evented:false, visible:false,
  excludeFromExport:true,
})
fc.add(hoverHL)
hoverRef.current = hoverHL

/* ── 3 ▸ Selection lifecycle (no extra overlay) ─────────── */
let scrollHandler: (() => void) | null = null

fc.on('selection:created', () => {
  hoverHL.visible = false            // hide leftover hover rectangle
  fc.requestRenderAll()
  scrollHandler = () => fc.requestRenderAll()
  window.addEventListener('scroll', scrollHandler, { passive:true })
})
.on('selection:cleared', () => {
  if (scrollHandler) { window.removeEventListener('scroll', scrollHandler); scrollHandler = null }
})

/* also hide hover during any transform of the active object */
fc.on('object:moving',   () => { hoverHL.visible = false })
  .on('object:scaling',  () => { hoverHL.visible = false })
  .on('object:rotating', () => { hoverHL.visible = false })

/* ── 4 ▸ Hover outline (only when NOT the active object) ─── */
fc.on('mouse:over', e => {
  const t = e.target as fabric.Object | undefined
  if (!t || (t as any)._guide || t === hoverHL) return
  if (fc.getActiveObject() === t) return           // skip active selection

  const box = t.getBoundingRect(true, true)
  hoverHL.set({
    width : box.width  + PAD * 2,
    height: box.height + PAD * 2,
    left  : box.left  - PAD,
    top   : box.top   - PAD,
    visible: true,
  })
  hoverHL.setCoords()
  hoverHL.bringToFront()
  fc.requestRenderAll()
})
.on('mouse:out', () => {
  hoverHL.visible = false
  fc.requestRenderAll()
})

addGuides(fc)                                 // green safe-zone guides
  /* ── 4.5 ▸ Fabric ➜ Zustand sync ──────────────────────────── */
  fc.on('object:modified', e=>{
    isEditing.current = true
    useEditor.getState().pushHistory()
    const t = e.target as any
    if (t?.layerIdx === undefined) return

    const d: Partial<Layer> = {
      x      : t.left,
      y      : t.top,
      scaleX : t.scaleX,
      scaleY : t.scaleY,
    }
    if (t.type === 'image') Object.assign(d, {
      width  : t.getScaledWidth(),
      height : t.getScaledHeight(),
    })
    if (t.type === 'textbox') Object.assign(d, {
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
    updateLayer(pageIdx, t.layerIdx, d)
    setTimeout(()=>{ isEditing.current = false })
  })

  fc.on('text:changed', e=>{
    const t = e.target as any
    if (t?.layerIdx === undefined) return
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
      width      : t.getScaledWidth(),
      height     : t.getScaledHeight(),
    })
    setTimeout(()=>{ isEditing.current = false })
  })

  /* ── 5 ▸ Clipboard + keyboard shortcuts (unchanged logic) ─── */
  const copyBuf:{json:any;offset:number} = { json:null, offset:0 }

  const onKey = (e:KeyboardEvent) => {
    const act = fc.getActiveObject() as any
    const sel = Array.isArray(act?.objects) ? act.objects : act ? [act] : []
    const cmd = e.metaKey || e.ctrlKey

    /* Copy */ if (cmd && e.code==='KeyC'){
      if (!sel.length) return
      copyBuf.json   = sel.map((o:fabric.Object)=>o.toJSON())
      copyBuf.offset = 0; e.preventDefault()
    }
    /* Cut */ else if (cmd && e.code==='KeyX'){
      if (!sel.length) return
      copyBuf.json   = sel.map((o:fabric.Object)=>o.toJSON())
      copyBuf.offset = 0; sel.forEach((o:any)=>fc.remove(o))
      useEditor.getState().pushHistory()
; e.preventDefault()
    }
    /* Paste */ else if (cmd && e.code==='KeyV'){
      if (!copyBuf.json) return
      copyBuf.offset += 10
      fabric.util.enlivenObjects(
        copyBuf.json as any,
        (objs:fabric.Object[])=>{
          objs.forEach(o=>{
            o.set({ left:(o.left??0)+copyBuf.offset,
                    top :(o.top ??0)+copyBuf.offset })
            fc.add(o); o.setCoords()
          })
          useEditor.getState().pushHistory()
        },
        ''                                      // namespace
      )
      e.preventDefault()
    }
    /* Delete */ else if (e.code==='Delete'||e.code==='Backspace'){
      if (!sel.length) return
      sel.forEach((o:any)=>fc.remove(o)); useEditor.getState().pushHistory()
      ; e.preventDefault()
    }
    /* Arrow-nudging */ else if (e.code.startsWith('Arrow')){
      if (!sel.length) return
      const step = e.shiftKey ? 10 : 1
      sel.forEach((o:any)=>{
        if (e.code==='ArrowLeft')  o.left -= step
        if (e.code==='ArrowRight') o.left += step
        if (e.code==='ArrowUp')    o.top  -= step
        if (e.code==='ArrowDown')  o.top  += step
        o.setCoords()
        if (o.layerIdx!==undefined)
          updateLayer(pageIdx,o.layerIdx,{x:o.left,y:o.top})
      })
      fc.requestRenderAll(); useEditor.getState().pushHistory()
      ; e.preventDefault()
    }
  }
  window.addEventListener('keydown', onKey)

  /* ── 6 ▸ Expose canvas & tidy up ──────────────────────────── */
  fcRef.current = fc; onReady(fc)

  return () => {
    window.removeEventListener('keydown', onKey)
    if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
    onReady(null)
    fc.dispose()
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
/* ---------- END mount once ----------------------------------- */



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
if (ly.type === 'image' && (ly.src || ly.srcUrl)) {
  // ① make sure we have a usable URL
  const srcUrl = getSrcUrl(ly);
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