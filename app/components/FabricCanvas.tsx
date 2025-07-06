/**********************************************************************
 * FabricCanvas.tsx — renders one printable page with Fabric.js
 * ---------------------------------------------------------------
 * 2025‑05‑10 • Final polish
 *   – Ghost outline always visible (no hover fade logic)
 *   – Cleaned up listeners & comments
 *   – Retains Coach‑mark anchor via data‑ai‑placeholder
 *********************************************************************/
'use client'

import { useEffect, useRef, useState } from 'react'
import { fabric }            from 'fabric'
import { useEditor }         from './EditorStore'
import { fromSanity }        from '@/app/library/layerAdapters'
import '@/lib/fabricDefaults'
import { SEL_COLOR } from '@/lib/fabricDefaults';
import { CropTool } from '@/lib/CropTool'
import { enableSnapGuides } from '@/lib/useSnapGuides'
import ContextMenu from './ContextMenu'
import QuickActionBar from './QuickActionBar'

/* ---------- print spec ----------------------------------------- */
export interface PrintSpec {
  trimWidthIn: number
  trimHeightIn: number
  bleedIn: number
  dpi: number
  spreadLayout?: {
    spreadWidth: number
    spreadHeight: number
    panels: {
      name: string
      page: string
      order: number
      bleed?: {
        top?: boolean
        right?: boolean
        bottom?: boolean
        left?: boolean
      }
    }[]
  }
}

export interface PreviewSpec {
  previewWidthPx: number
  previewHeightPx: number
  maxMobileWidthPx?: number
  safeInsetXPx?: number
  safeInsetYPx?: number
}

let currentSpec: PrintSpec = {
  trimWidthIn: 5,
  trimHeightIn: 7,
  bleedIn: 0.125,
  dpi: 300,
}

let currentPreview: PreviewSpec = {
  previewWidthPx: 420,
  previewHeightPx: 580,
  safeInsetXPx: 0,
  safeInsetYPx: 0,
}

let safeInsetXIn = 0
let safeInsetYIn = 0
let SAFE_X = 0
let SAFE_Y = 0

function recompute() {
  PAGE_W = Math.round((currentSpec.trimWidthIn + currentSpec.bleedIn * 2) * currentSpec.dpi)
  PAGE_H = Math.round((currentSpec.trimHeightIn + currentSpec.bleedIn * 2) * currentSpec.dpi)
  PREVIEW_W = currentPreview.previewWidthPx
  PREVIEW_H = currentPreview.previewHeightPx
  SCALE = PREVIEW_W / PAGE_W
  PAD = 0
  // compute safe-zone after scaling so rounding happens in preview pixels
  const safeXPreview = safeInsetXIn * currentSpec.dpi * SCALE
  const safeYPreview = safeInsetYIn * currentSpec.dpi * SCALE
  SAFE_X = Math.round(safeXPreview) / SCALE
  SAFE_Y = Math.round(safeYPreview) / SCALE
}

export const setPrintSpec = (spec: PrintSpec) => {
  console.log('FabricCanvas setSpec', spec.trimWidthIn, spec.trimHeightIn)
  currentSpec = spec
  recompute()
}

export const setSafeInset = (xIn: number, yIn: number) => {
  safeInsetXIn = xIn
  safeInsetYIn = yIn
  recompute()
}

export const setSafeInsetPx = (xPx: number, yPx: number) => {
  const scale = SCALE || (PREVIEW_W / PAGE_W)
  safeInsetXIn = xPx / (currentSpec.dpi * scale)
  safeInsetYIn = yPx / (currentSpec.dpi * scale)
  recompute()
}

export const setPreviewSpec = (spec: PreviewSpec) => {
  currentPreview = spec
  recompute()
}

/* ---------- size helpers ---------------------------------------- */
let PREVIEW_W = currentPreview.previewWidthPx

let PAGE_W = 0
let PAGE_H = 0
let PREVIEW_H = currentPreview.previewHeightPx
let SCALE = 1
let PAD = 0
const ROT_OFF = 32
const SEL_BORDER = 2

recompute()

const mm = (n: number) => (n / 25.4) * currentSpec.dpi

export const pageW = () => PAGE_W
export const pageH = () => PAGE_H
export const previewW = () => PREVIEW_W
export const previewH = () => PREVIEW_H
export const EXPORT_MULT = () => {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  return (1 / SCALE) / dpr
}

// 4 CSS-px padding used by the hover outline
const dash = (gap: number) => [gap / SCALE, (gap - 2) / SCALE];

const makeId = () => Math.random().toString(36).slice(2, 9);

/* ---------- shared clipboard helpers ------------------------------ */
type Clip = { json: any[]; nudge: number };
export const clip: Clip = { json: [], nudge: 0 };

export const allObjs = (o: fabric.Object) =>
  (o as any).type === 'activeSelection'
    ? [(o as any), ...((o as any)._objects as fabric.Object[])]
    : [o];

export const PROPS = [
  'src', 'srcUrl', 'assetId', '__src',
  'text', 'fontSize', 'fontFamily', 'fill',
  'fontWeight', 'fontStyle', 'underline',
  'textAlign', 'lineHeight', 'opacity', 'lines',
  'scaleX', 'scaleY', 'width', 'height',
  'locked', 'selectable', 'left', 'top',
];





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
  /** stable ID used for drag‑and‑drop */
  uid?: string
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

  /** optional cropping rectangle (in image pixels) */
  cropX?: number
  cropY?: number
  cropW?: number
  cropH?: number

  /* ---- SHARED geometry / style ---------------------------------- */
  x: number
  y: number
  width:  number
  height?: number

  /** geometry relative to the full canvas (0–100 %) */
  leftPct?:   number
  topPct?:    number
  widthPct?:  number
  heightPct?: number

  /** image flips */
  flipX?:     boolean
  flipY?:     boolean

  opacity?:   number
  scaleX?:    number
  scaleY?:    number
  /** rotation in degrees */
  angle?:     number
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
  /** Wrapped lines as computed by Fabric */
  lines?:       string[]

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
/* ----------another helper --------------------------------------------- */
const discardSelection = (fc: fabric.Canvas) => {
  fc.discardActiveObject();   // removes the wrapper
  fc.requestRenderAll();
};

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
  const fc   = img.canvas as fabric.Canvas | null
  const vt   = fc?.viewportTransform || [SCALE, 0, 0, SCALE, 0, 0]
  const scale = vt[0]
  const posX  = window.scrollX + canvasRect.left + vt[4] + left * scale
  const posY  = window.scrollY + canvasRect.top  + vt[5] + top  * scale
  ghost.style.left   = `${posX}px`
  ghost.style.top    = `${posY}px`
  ghost.style.width  = `${width  * scale}px`
  ghost.style.height = `${height * scale}px`
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

/* ── 1 ▸ TWO NEW TINY HELPERS ─────────────────────────────────── */

/** Convert a Fabric object → our Layer shape */
const objToLayer = (o: fabric.Object): Layer => {
  if ((o as any).type === 'textbox') {
    const t = o as fabric.Textbox
    return {
      uid      : (t as any).uid || makeId(),
      type      : 'text',
      text      : t.text || '',
      x         : t.left || 0,
      y         : t.top  || 0,
      width     : t.width || 200,
      leftPct   : ((t.left || 0) / PAGE_W) * 100,
      topPct    : ((t.top  || 0) / PAGE_H) * 100,
      widthPct  : ((t.width || 200) / PAGE_W) * 100,
      heightPct : (t.getScaledHeight() / PAGE_H) * 100,
      fontSize  : t.fontSize,
      fontFamily: t.fontFamily,
      fontWeight: t.fontWeight,
      fontStyle : t.fontStyle,
      underline : t.underline,
      fill      : t.fill as string,
      textAlign : t.textAlign as any,
      lineHeight: t.lineHeight,
      opacity   : t.opacity,
      scaleX    : t.scaleX,
      scaleY    : t.scaleY,
      angle     : t.angle,
      lines     : t.textLines as string[],
      locked    : (t as any).locked,
    }
  }
  const i = o as fabric.Image
  const srcUrl  = (i as any).__src || i.getSrc?.() || ''
  const assetId = (i as any).assetId as string | undefined

  const layer: Layer = {
    uid   : (i as any).uid || makeId(),
    type   : 'image',
    src    : assetId
               ? { _type:'image', asset:{ _type:'reference', _ref: assetId } }
               : srcUrl,
    srcUrl ,
    assetId,
    x      : i.left  || 0,
    y      : i.top   || 0,
    width  : i.getScaledWidth(),
    height : i.getScaledHeight(),
    leftPct  : ((i.left  || 0) / PAGE_W) * 100,
    topPct   : ((i.top   || 0) / PAGE_H) * 100,
    widthPct : (i.getScaledWidth()  / PAGE_W) * 100,
    heightPct: (i.getScaledHeight() / PAGE_H) * 100,
    opacity: i.opacity,
    scaleX : i.scaleX,
    scaleY : i.scaleY,
    flipX  : (i as any).flipX,
    flipY  : (i as any).flipY,
    angle  : i.angle,
    locked : (i as any).locked,
  }

  if (i.cropX != null) layer.cropX = i.cropX
  if (i.cropY != null) layer.cropY = i.cropY
  if (i.width  != null) layer.cropW = i.width
  if (i.height != null) layer.cropH = i.height

  return layer
}

/** Read every on-canvas object → Layers, update Zustand + history */
const syncLayersFromCanvas = (fc: fabric.Canvas, pageIdx: number) => {
  const objs = fc
    .getObjects()
    .filter(o =>
      !(o as any)._guide &&
      !(o as any)._backdrop &&
      !(o as any).excludeFromExport &&
      (o as any).type !== 'activeSelection'      // skip wrapper
    );                                           // bottom → top

  /* remember original src on pasted images */
  objs.forEach(o => {
    if ((o as any).type === 'image' && !(o as any).__src) {
      (o as any).__src = (o as any).getSrc?.() || (o as any).src;
    }
  });

  /* give every object an up-to-date index */
  objs.forEach((o, i) => ((o as any).layerIdx = i));

  /* stash in Zustand + history */
  const layers = objs.map(objToLayer);
  const store  = useEditor.getState();
  store.setPageLayers(pageIdx, layers);
  store.pushHistory();
};

/* ---------- guides ---------------------------------------------- */
type Mode = 'staff' | 'customer'
type GuideName = 'safe-zone' | 'bleed'

const addGuides = (fc: fabric.Canvas, mode: Mode) => {
  fc.getObjects().filter(o => (o as any)._guide).forEach(o => fc.remove(o))
  const strokeW = mm(0.5)
  const mk = (
    xy: [number, number, number, number],
    name: GuideName,
    color: string,
  ) =>
    Object.assign(
      new fabric.Line(xy, {
        stroke: color,
        strokeWidth: strokeW,
        strokeDashArray: dash(6),
        selectable: false,
        evented: false,
        excludeFromExport: true,
      }),
      { _guide: name },
    )

  if (SAFE_X > 0 || SAFE_Y > 0) {
    const safeX = SAFE_X
    const safeY = SAFE_Y
    ;[
      mk([safeX, safeY, PAGE_W - safeX, safeY], 'safe-zone', '#34d399'),
      mk([PAGE_W - safeX, safeY, PAGE_W - safeX, PAGE_H - safeY], 'safe-zone', '#34d399'),
      mk([PAGE_W - safeX, PAGE_H - safeY, safeX, PAGE_H - safeY], 'safe-zone', '#34d399'),
      mk([safeX, PAGE_H - safeY, safeX, safeY], 'safe-zone', '#34d399'),
    ].forEach(l => fc.add(l))
  }

  // Bleed guides were previously shown for staff users. They are now disabled
  // so the red bleed lines are no longer visible in the editor.
  // if (mode === 'staff') {
  //   const bleed = mm(currentSpec.bleedIn * 25.4)
  //   ;[
  //     mk([bleed, bleed, PAGE_W - bleed, bleed], 'bleed', '#f87171'),
  //     mk([PAGE_W - bleed, bleed, PAGE_W - bleed, PAGE_H - bleed], 'bleed', '#f87171'),
  //     mk([PAGE_W - bleed, PAGE_H - bleed, bleed, PAGE_H - bleed], 'bleed', '#f87171'),
  //     mk([bleed, PAGE_H - bleed, bleed, bleed], 'bleed', '#f87171'),
  //   ].forEach(l => fc.add(l))
  // }
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
  pageIdx    : number
  page?      : TemplatePage
  onReady    : (fc: fabric.Canvas | null) => void
  isCropping?: boolean
  onCroppingChange?: (state: boolean) => void
  zoom?: number
  mode?: Mode
  className?: string
}

export default function FabricCanvas ({ pageIdx, page, onReady, isCropping = false, onCroppingChange, zoom = 1, mode = 'customer', className = '' }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const fcRef        = useRef<fabric.Canvas | null>(null)
  const maskRectsRef = useRef<fabric.Rect[]>([]);
  const hoverRef     = useRef<fabric.Rect | null>(null)
  const hydrating    = useRef(false)
  const isEditing    = useRef(false)

  const hoverDomRef  = useRef<HTMLDivElement | null>(null)
  const selDomRef    = useRef<HTMLDivElement | null>(null)
  const cropDomRef   = useRef<HTMLDivElement | null>(null)

  const containerRef = useRef<HTMLElement | null>(null)

  const cropToolRef = useRef<CropTool | null>(null)
  const croppingRef = useRef(false)
  const transformingRef = useRef(false)

  const savedInteractivityRef = useRef(
    new WeakMap<fabric.Object, { sel: boolean; evt: boolean }>()
  )

  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [actionPos, setActionPos] = useState<{ x: number; y: number } | null>(null)
  const actionTimerRef = useRef<NodeJS.Timeout | null>(null)



  const setPageLayers = useEditor(s => s.setPageLayers)
  const updateLayer   = useEditor(s => s.updateLayer)

  const toggleActiveLock = () => {
    const fc = fcRef.current
    if (!fc) return
    const active = fc.getActiveObject() as fabric.Object | undefined
    if (!active) return
    const locked = !!(active as any).locked
    const next = !locked
    ;(active as any).locked = next
    active.set({
      lockMovementX: next,
      lockMovementY: next,
      lockScalingX : next,
      lockScalingY : next,
      lockRotation : next,
    })
    fc.requestRenderAll()
    if ((active as any).layerIdx !== undefined) {
      updateLayer(pageIdx, (active as any).layerIdx, { locked: next })
    }
    setActionPos(pos => (pos ? { ...pos } : null))
  }

  const handleMenuAction = (a: import('./ContextMenu').MenuAction) => {
    const fc = fcRef.current
    if (!fc) return
    const active = fc.getActiveObject() as fabric.Object | undefined
    const locked = (active as any)?.locked
    switch (a) {
      case 'cut':
        if (active && !locked) {
          clip.json = [active.toJSON(PROPS)]
          clip.nudge = 0
          allObjs(active).forEach(o => fc.remove(o))
          syncLayersFromCanvas(fc, pageIdx)
        }
        break
      case 'copy':
        if (active) {
          clip.json = [active.toJSON(PROPS)]
          clip.nudge = 0
        }
        break
      case 'paste':
        if (clip.json.length) {
          clip.nudge += 10
          fabric.util.enlivenObjects(clip.json, (objs: fabric.Object[]) => {
            const root = objs[0]
            root.set({ left: (root.left ?? 0) + clip.nudge, top: (root.top ?? 0) + clip.nudge })
            root.setCoords()
            if ((root as any).type === 'group') {
              const g = root as fabric.Group
              const kids = g._objects as fabric.Object[]
              kids.forEach(o => fc.add(o))
              fc.remove(g)
              const sel = new fabric.ActiveSelection(kids, { canvas: fc } as any)
              fc.setActiveObject(sel)
            } else {
              fc.add(root)
              fc.setActiveObject(root)
            }
            fc.requestRenderAll()
            syncLayersFromCanvas(fc, pageIdx)
          }, '')
        }
        break
      case 'duplicate':
        if (active && !locked) {
          clip.json = [active.toJSON(PROPS)]
          clip.nudge += 10
          fabric.util.enlivenObjects(clip.json, (objs: fabric.Object[]) => {
            const root = objs[0]
            root.set({ left: (root.left ?? 0) + clip.nudge, top: (root.top ?? 0) + clip.nudge })
            root.setCoords()
            if ((root as any).type === 'group') {
              const g = root as fabric.Group
              const kids = g._objects as fabric.Object[]
              kids.forEach(o => fc.add(o))
              fc.remove(g)
              const sel = new fabric.ActiveSelection(kids, { canvas: fc } as any)
              fc.setActiveObject(sel)
            } else {
              fc.add(root)
              fc.setActiveObject(root)
            }
            fc.requestRenderAll()
            syncLayersFromCanvas(fc, pageIdx)
          }, '')
        }
        break
      case 'bring-forward':
        if (active) {
          fc.bringForward(active)
          fc.requestRenderAll()
          syncLayersFromCanvas(fc, pageIdx)
        }
        break
      case 'send-backward':
        if (active) {
          fc.sendBackwards(active)
          fc.requestRenderAll()
          syncLayersFromCanvas(fc, pageIdx)
        }
        break
      case 'bring-to-front':
        if (active) {
          fc.bringToFront(active)
          fc.requestRenderAll()
          syncLayersFromCanvas(fc, pageIdx)
        }
        break
      case 'send-to-back':
        if (active) {
          fc.sendToBack(active)
          fc.requestRenderAll()
          syncLayersFromCanvas(fc, pageIdx)
        }
        break
      case 'align':
        if (active) {
          const fcH = PREVIEW_H
          const fcW = PREVIEW_W
          const { width, height } = active.getBoundingRect(true, true)
          active.set({ left: fcW / 2 - width / 2, top: fcH / 2 - height / 2 })
          active.setCoords()
          fc.requestRenderAll()
          syncLayersFromCanvas(fc, pageIdx)
        }
        break
      case 'delete':
        if (active && !locked) {
          allObjs(active).forEach(o => fc.remove(o))
          syncLayersFromCanvas(fc, pageIdx)
        }
        break
      case 'crop':
        if (active && !locked) {
          document.dispatchEvent(new Event('start-crop'))
        }
        break
    }
    setMenuPos(null)
  }

/* ---------- mount once --------------------------------------- */
useEffect(() => {
  if (!canvasRef.current) return

  // Create Fabric using the <canvas> element’s own dimensions
  // – we’ll work in full‑size page units and simply scale the viewport.
  const fc = new fabric.Canvas(canvasRef.current!) as fabric.Canvas & { upperCanvasEl: HTMLCanvasElement };
  fc.backgroundColor = '#fff';
  fc.preserveObjectStacking = true;

  /* create DOM overlays for hover & selection */
  const hoverEl = document.createElement('div');
  hoverEl.className = 'sel-overlay';
  hoverEl.style.display = 'none';
  document.body.appendChild(hoverEl);
  hoverDomRef.current = hoverEl;
  (hoverEl as any)._object = null;

  const selEl = document.createElement('div');
  selEl.className = 'sel-overlay interactive';
  selEl.style.display = 'none';
  document.body.appendChild(selEl);
  selDomRef.current = selEl;
  (selEl as any)._object = null;

  const cropEl = document.createElement('div');
  cropEl.className = 'sel-overlay interactive';
  cropEl.style.display = 'none';
  document.body.appendChild(cropEl);
  cropDomRef.current = cropEl;
  (cropEl as any)._object = null;

  const selCorners  = ['tl','tr','br','bl','ml','mr','mt','mb','rot'] as const;
  const cropCorners = ['tl','tr','br','bl','ml','mr','mt','mb'] as const;
  const handleMap: Record<string, HTMLDivElement> = {};
  selCorners.forEach(c => {
    const h = document.createElement('div');
    h.className =
      c === 'rot'
        ? 'handle rot'
        : `handle ${['ml','mr','mt','mb'].includes(c) ? 'side' : 'corner'} ${c}`;
    h.dataset.corner = c === 'rot' ? 'mtr' : c;
    selEl.appendChild(h);
    handleMap[c] = h;
  });
  (selEl as any)._handles = handleMap;

  const sizeBubble = document.createElement('div');
  sizeBubble.className = 'size-bubble';
  sizeBubble.style.display = 'none';
  document.body.appendChild(sizeBubble);
  (selEl as any)._sizeBubble = sizeBubble;

  const rotBubble = document.createElement('div');
  rotBubble.className = 'rot-bubble';
  rotBubble.style.display = 'none';
  document.body.appendChild(rotBubble);
  (selEl as any)._rotBubble = rotBubble;

  const cropHandles: Record<string, HTMLDivElement> = {};
  cropCorners.forEach(c => {
    const h = document.createElement('div');
    h.className = `handle ${['ml','mr','mt','mb'].includes(c) ? 'side' : 'corner'} ${c}`;
    h.dataset.corner = c;
    cropEl.appendChild(h);
    cropHandles[c] = h;
  });
  (cropEl as any)._handles = cropHandles;

  const forward = (ev: PointerEvent | MouseEvent, dx = 0, dy = 0) => ({
    clientX   : ev.clientX + dx,
    clientY   : ev.clientY + dy,
    button    : ev.button,
    buttons   : 'buttons' in ev ? ev.buttons : 0,
    ctrlKey   : ev.ctrlKey,
    shiftKey  : ev.shiftKey,
    altKey    : ev.altKey,
    metaKey   : ev.metaKey,
    bubbles   : true,
    cancelable: true,
  });

  const forwardMouse = (ev: MouseEvent) => ({
    clientX   : ev.clientX,
    clientY   : ev.clientY,
    button    : ev.button,
    buttons   : ev.buttons,
    ctrlKey   : ev.ctrlKey,
    shiftKey  : ev.shiftKey,
    altKey    : ev.altKey,
    metaKey   : ev.metaKey,
    bubbles   : true,
    cancelable: true,
  });

  const bridge = (e: PointerEvent) => {
    const corner = (e.target as HTMLElement | null)?.dataset.corner
    const vt = fc.viewportTransform || [1, 0, 0, 1, 0, 0]
    const scale = vt[0]
    const offset = PAD * scale
    const dx = corner?.includes('l') ? offset : corner?.includes('r') ? -offset : 0
    const dy = corner?.includes('t') ? offset : corner?.includes('b') ? -offset : 0

    const down = new MouseEvent('mousedown', forward(e, dx, dy))
    fc.upperCanvasEl.dispatchEvent(down)
    const move = (ev: PointerEvent) =>
      fc.upperCanvasEl.dispatchEvent(new MouseEvent('mousemove', forward(ev, dx, dy)))
    const up = (ev: PointerEvent) => {
      fc.upperCanvasEl.dispatchEvent(new MouseEvent('mouseup', forward(ev, dx, dy)))
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
    e.preventDefault()
  }
  const onSelDown = (e: PointerEvent) => {
    const obj = (selEl as any)._object as fabric.Object | null
    if (obj) fc.setActiveObject(obj)
    bridge(e)
  }
  const onCropDown = (e: PointerEvent) => {
    const obj = (cropEl as any)._object as fabric.Object | null
    if (obj) fc.setActiveObject(obj)
    bridge(e)
  }
  selEl.addEventListener('pointerdown', onSelDown)
  cropEl.addEventListener('pointerdown', onCropDown)

  selEl.addEventListener('dblclick', e => {
    fc.upperCanvasEl.dispatchEvent(new MouseEvent('dblclick', forwardMouse(e)))
  })
  cropEl.addEventListener('dblclick', e => {
    fc.upperCanvasEl.dispatchEvent(new MouseEvent('dblclick', forwardMouse(e)))
  })

  const relayMove = (ev: PointerEvent) =>
    fc.upperCanvasEl.dispatchEvent(new MouseEvent('mousemove', forward(ev)))
  selEl.addEventListener('pointermove', relayMove)
  cropEl.addEventListener('pointermove', relayMove)

  const raiseSel = () => {
    if (!croppingRef.current || !cropDomRef.current) return
    selEl.style.zIndex = '41'
    cropDomRef.current.style.zIndex = '40'
  }
  const raiseCrop = () => {
    if (!croppingRef.current || !cropDomRef.current) return
    cropDomRef.current.style.zIndex = '41'
    selEl.style.zIndex = '40'
  }
  selEl.addEventListener('pointerenter', raiseSel)
  cropEl.addEventListener('pointerenter', raiseCrop)

  const ctxMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = fc.findTarget(e, true) as fabric.Object | null;
    if (target) fc.setActiveObject(target);
    setMenuPos({ x: e.clientX, y: e.clientY });
  };
  fc.upperCanvasEl.addEventListener('contextmenu', ctxMenu);
  selEl.addEventListener('contextmenu', ctxMenu);
  cropEl.addEventListener('contextmenu', ctxMenu);
 
/* --- keep Fabric’s wrapper the same size as the visible preview --- */
  const container = canvasRef.current!.parentElement as HTMLElement | null;
  if (container) {
    const pad = 4 * zoom;
    container.style.padding  = `${pad}px`;
    container.style.overflow = 'visible';

    // keep the ref so scroll listeners work
    containerRef.current = container;
  }

  fc.setWidth(PREVIEW_W)
  fc.setHeight(PREVIEW_H)
  addBackdrop(fc);
  // keep the preview scaled to the configured width
  fc.setViewportTransform([SCALE * zoom, 0, 0, SCALE * zoom, 0, 0]);
  enableSnapGuides(fc, PAGE_W, PAGE_H);

  /* keep event coordinates aligned with any scroll/resize */
  const updateOffset = () => fc.calcOffset();
  updateOffset();
  window.addEventListener('scroll', updateOffset, { passive: true, capture: true });
  window.addEventListener('resize', updateOffset);
  containerRef.current?.addEventListener('scroll', updateOffset, { passive: true, capture: true });

  const isolateCrop = (active: boolean) => {
    const map = savedInteractivityRef.current
    const tool = cropToolRef.current as any
    const allowed = new Set<fabric.Object>()
    if (active) {
      if (tool?.img) allowed.add(tool.img)
      if (tool?.frame) allowed.add(tool.frame)
      fc.getObjects().forEach(o => {
        if (allowed.has(o)) return
        map.set(o, { sel: o.selectable, evt: o.evented })
        o.selectable = false
        o.evented = false
      })
      fc.discardActiveObject()
    } else {
      fc.getObjects().forEach(o => {
        const prev = map.get(o)
        if (prev) {
          o.selectable = prev.sel
          o.evented = prev.evt
        }
      })
      savedInteractivityRef.current = new WeakMap()
    }
    fc.requestRenderAll()
  }

  /* ── Crop‑tool wiring ────────────────────────────────────── */
  // create a reusable crop helper and keep it in a ref
  const crop = new CropTool(fc, SCALE, SEL_COLOR, state => {
    croppingRef.current = state
    isolateCrop(state)
    onCroppingChange?.(state)
  })
  cropToolRef.current = crop;
  ;(fc as any)._cropTool = crop;
  (fc as any)._syncLayers = () => syncLayersFromCanvas(fc, pageIdx);

  // double‑click on an <image> starts cropping
  const dblHandler = (e: fabric.IEvent) => {
    const tgt = e.target as fabric.Object | undefined;
    if (tgt && (tgt as any).type === 'image' && !(tgt as any).locked) {
      cropToolRef.current?.begin(tgt as fabric.Image);
    }
  };
  fc.on('mouse:dblclick', dblHandler);

  // ESC cancels, ENTER commits
  const keyCropHandler = (ev: KeyboardEvent) => {
    if (!cropToolRef.current?.isActive) return;
    if (ev.key === 'Escape') cropToolRef.current.cancel();
    if (ev.key === 'Enter')  cropToolRef.current.commit();
  };
  window.addEventListener('keydown', keyCropHandler);
  /* ───────────────────────────────────────────────────────── */

  /* --- Canva‑style side-handle cropping -------------------- */
  const cropState = new WeakMap<fabric.Image, {
    corner      : string
    startCropX  : number
    startCropY  : number
    startWidth  : number
    startHeight : number
    startLeft   : number
    startTop    : number
    startScaleX : number
    startScaleY : number
    natW        : number
    natH        : number
    startX      : number
    startY      : number
  }>();

  const startCrop = (e: fabric.IEvent) => {
    const t = (e as any).transform?.target as fabric.Image | undefined;
    const c = (e as any).transform?.corner as string | undefined;
    if (!t || t.type !== 'image') return;
    if (!c || !['ml', 'mr', 'mt', 'mb'].includes(c)) {
      cropState.delete(t);
      return;
    }
    const el = t.getElement() as HTMLImageElement;
    const w = t.width || el.naturalWidth || 1;
    const h = t.height || el.naturalHeight || 1;
    const ptr = fc.getPointer((e as any).e);
    cropState.set(t, {
      corner     : c,
      startCropX : t.cropX || 0,
      startCropY : t.cropY || 0,
      startWidth : w,
      startHeight: h,
      startLeft  : t.left || 0,
      startTop   : t.top || 0,
      startScaleX: t.scaleX || 1,
      startScaleY: t.scaleY || 1,
      natW       : el.naturalWidth  || w,
      natH       : el.naturalHeight || h,
      startX     : ptr.x,
      startY     : ptr.y,
    });
  };

  const duringCrop = (e: fabric.IEvent) => {
    const img = e.target as fabric.Image | undefined;
    if (!img || img.type !== 'image') return;
    const st = cropState.get(img);
    if (!st) return;

    const corner = st.corner;
    const ptr    = fc.getPointer((e as any).e);
    const dx = ptr.x - st.startX;
    const dy = ptr.y - st.startY;
    const newW = corner === 'mr'
      ? st.startWidth + dx / st.startScaleX
      : corner === 'ml'
        ? st.startWidth - dx / st.startScaleX
        : st.startWidth;
    const newH = corner === 'mb'
      ? st.startHeight + dy / st.startScaleY
      : corner === 'mt'
        ? st.startHeight - dy / st.startScaleY
        : st.startHeight;

    let cropX = st.startCropX;
    let cropY = st.startCropY;
    let width  = st.startWidth;
    let height = st.startHeight;
    let left   = st.startLeft;
    let top    = st.startTop;
    let scaleX = st.startScaleX;
    let scaleY = st.startScaleY;

    if (corner === 'mr' || corner === 'ml') {
      if (corner === 'mr') {
        const maxW = st.startWidth + (st.natW - (st.startCropX + st.startWidth));
        if (newW <= maxW) {
          width = Math.min(newW, st.natW - st.startCropX);
        } else {
          const baseW = st.natW - st.startCropX;
          const factor = newW / maxW;
          width  = baseW;
          scaleX = st.startScaleX * factor;
          scaleY = st.startScaleY * factor;
          const bottom = st.startTop + st.startHeight * st.startScaleY;
          left   = st.startLeft;
          top    = bottom - st.startHeight * scaleY;
        }
      } else {
        const maxW = st.startWidth + st.startCropX;
        if (newW <= maxW) {
          const diff = st.startWidth - newW;
          cropX = st.startCropX + diff;
          width = newW;
          left  = st.startLeft + diff * st.startScaleX;
        } else {
          const baseW = st.startWidth + st.startCropX;
          const factor = newW / maxW;
          const right  = st.startLeft + st.startWidth * st.startScaleX;
          const bottom = st.startTop + st.startHeight * st.startScaleY;
          cropX  = 0;
          width  = baseW;
          scaleX = st.startScaleX * factor;
          scaleY = st.startScaleY * factor;
          left   = right - width * scaleX;
          top    = bottom - st.startHeight * scaleY;
        }
      }
    } else if (corner === 'mb' || corner === 'mt') {
      if (corner === 'mb') {
        const maxH = st.startHeight + (st.natH - (st.startCropY + st.startHeight));
        if (newH <= maxH) {
          height = Math.min(newH, st.natH - st.startCropY);
        } else {
          const baseH = st.natH - st.startCropY;
          const factor = newH / maxH;
          const center = st.startLeft +
            (st.startWidth * st.startScaleX) / 2;
          height = baseH;
          scaleX = st.startScaleX * factor;
          scaleY = st.startScaleY * factor;
          left   = center - (st.startWidth * scaleX) / 2;
          top    = st.startTop;
        }
      } else {
        const maxH = st.startHeight + st.startCropY;
        if (newH <= maxH) {
          const diff = st.startHeight - newH;
          cropY = st.startCropY + diff;
          height = newH;
          top = st.startTop + diff * st.startScaleY;
        } else {
          const baseH = st.startHeight + st.startCropY;
          const factor = newH / maxH;
          const bottom = st.startTop + st.startHeight * st.startScaleY;
          const center = st.startLeft +
            (st.startWidth * st.startScaleX) / 2;
          cropY  = 0;
          height = baseH;
          scaleX = st.startScaleX * factor;
          scaleY = st.startScaleY * factor;
          left   = center - (st.startWidth * scaleX) / 2;
          top    = bottom - height * scaleY;
        }
      }
    }

    img.set({ cropX, cropY, width, height, left, top, scaleX, scaleY });
    img.setCoords();
    fc.requestRenderAll();
  };

  const endCrop = (e: fabric.IEvent) => {
    const img = e.target as fabric.Image | undefined;
    if (img) cropState.delete(img);
  };

  fc.on('before:transform', startCrop);
  fc.on('object:scaling', duringCrop);
  fc.on('object:scaled', endCrop);

 

/* ── 2 ▸ Hover overlay only ─────────────────────────────── */
const hoverHL = new fabric.Rect({
  originX:'left', originY:'top', strokeUniform:true,
  fill:'transparent',
  stroke:SEL_COLOR,
  strokeWidth:1 / SCALE,
  strokeDashArray:[],
  selectable:false, evented:false, visible:false,
  excludeFromExport:true,
})
fc.add(hoverHL)
hoverRef.current = hoverHL

/* ── 3 ▸ Selection lifecycle (DOM overlay) ─────────── */
let scrollHandler: (() => void) | null = null
let hoverScrollHandler: (() => void) | null = null

const drawOverlay = (
  obj: fabric.Object,
  el: HTMLDivElement & {
    _handles?: Record<string, HTMLDivElement>
    _object?: fabric.Object | null
  }
) => {
  const box  = obj.getBoundingRect(true, true)
  const rect = canvasRef.current!.getBoundingClientRect()
  const vt   = fc.viewportTransform || [1, 0, 0, 1, 0, 0]
  const scale = vt[0]
  const c = containerRef.current
  const scrollX = c?.scrollLeft ?? 0
  const scrollY = c?.scrollTop ?? 0

  const cx = box.left + box.width / 2
  const cy = box.top + box.height / 2
  const w = obj.getScaledWidth() + PAD * 2
  const h = obj.getScaledHeight() + PAD * 2
  const left =
    window.scrollX + scrollX + rect.left + vt[4] + (cx - w / 2) * scale
  const top =
    window.scrollY + scrollY + rect.top + vt[5] + (cy - h / 2) * scale
  const width = w * scale
  const height = h * scale
  el.style.left   = `${left}px`
  el.style.top    = `${top}px`
  el.style.width  = `${width}px`
  el.style.height = `${height}px`
  el.style.transformOrigin = '50% 50%'
  el.style.transform = `rotate(${obj.angle || 0}deg)`
  el._object = obj
  if (el._handles) {
    const h = el._handles
    const half  = SEL_BORDER / 2
    const midX  = Math.round(width  / 2)
    const midY  = Math.round(height / 2)
    const leftX = Math.round(half)
    const rightX = Math.round(width - half)
    const topY   = Math.round(half)
    const botY   = Math.round(height - half)
    h.tl.style.left = `${leftX}px`;  h.tl.style.top = `${topY}px`
    h.tr.style.left = `${rightX}px`; h.tr.style.top = `${topY}px`
    h.br.style.left = `${rightX}px`; h.br.style.top = `${botY}px`
    h.bl.style.left = `${leftX}px`;  h.bl.style.top = `${botY}px`
    h.ml.style.left = `${leftX}px`;  h.ml.style.top = `${midY}px`
    h.mr.style.left = `${rightX}px`; h.mr.style.top = `${midY}px`
    h.mt.style.left  = `${midX}px`
    h.mt.style.top   = `${topY}px`
    h.mb.style.left  = `${midX}px`
    h.mb.style.top   = `${botY}px`
    if (h.rot) {
      h.rot.style.left = `${midX}px`
      h.rot.style.top  = `${Math.round(botY + ROT_OFF)}px`
    }
  }
  return { left, top, width, height }
}

const syncSel = () => {
  const obj = fc.getActiveObject() as fabric.Object | undefined
  if (!selDomRef.current || !canvasRef.current) return
  const selEl  = selDomRef.current as HTMLDivElement & { _handles?: Record<string, HTMLDivElement>; _object?: fabric.Object | null }
  const cropEl = cropDomRef.current as HTMLDivElement & { _handles?: Record<string, HTMLDivElement>; _object?: fabric.Object | null } | null

  const tool = cropToolRef.current as any
  if (croppingRef.current && tool?.isActive && tool.img && tool.frame) {
    const img   = tool.img as fabric.Object
    const frame = tool.frame as fabric.Object
    // whichever is active uses selEl; the other uses cropEl
    selEl.style.zIndex = '41'
    cropEl && (cropEl.style.zIndex = '40')
    if (obj === frame) {
      drawOverlay(frame, selEl)
      selEl._object = frame
      selEl.classList.add('crop-window')
      if (cropEl) {
        cropEl.style.display = 'block'
        drawOverlay(img, cropEl)
        cropEl._object = img
        cropEl.classList.remove('crop-window')
      }
    } else {
      drawOverlay(img, selEl)
      selEl._object = img
      selEl.classList.remove('crop-window')
      if (cropEl) {
        cropEl.style.display = 'block'
        drawOverlay(frame, cropEl)
        cropEl._object = frame
        cropEl.classList.add('crop-window')
      }
    }
    if (selEl._handles)
      ['ml','mr','mt','mb','rot'].forEach(k => selEl._handles![k].style.display = 'none')
    if (cropEl && cropEl._handles)
      ['ml','mr','mt','mb'].forEach(k => cropEl._handles![k].style.display = 'none')
    selEl.style.display = 'block'
    setActionPos(null)
    return
  }

  selEl.classList.remove('crop-window')
  cropEl && cropEl.classList.remove('crop-window')

cropEl && (cropEl.style.display = 'none', cropEl._object = null);
if (!obj) return;

const box = drawOverlay(obj, selEl);   // redraw green outline
selEl._object = obj;

/* ── quick-action overlay ──────────────────────────── */
if (transformingRef.current) {
  setActionPos(null);                 // hide while dragging
} else {
  setActionPos({                      // centre the toolbar
    x: box.left + box.width / 2,
    y: box.top - 8,
  });
}

/* ── stable branch: keep side-handles visible ──────── */
if (selEl._handles) {
  ['ml', 'mr', 'mt', 'mb', 'rot'].forEach(k =>
    selEl._handles![k].style.display = 'block'
  );
}
}

const syncHover = () => {
  if (!hoverDomRef.current || !canvasRef.current) return
  const obj = (hoverDomRef.current as any)._object as fabric.Object | null
  if (!obj) return
  drawOverlay(obj, hoverDomRef.current as HTMLDivElement & { _object?: fabric.Object | null })
}

  const showSizeBubble = (obj: fabric.Object | undefined, ev: fabric.IEvent | undefined) => {
    if (!obj || !selDomRef.current || !ev) return
    const bubble = (selDomRef.current as any)._sizeBubble as HTMLDivElement | undefined
    if (!bubble) return
    bubble.textContent = `w:${Math.round(obj.getScaledWidth())} h:${Math.round(obj.getScaledHeight())}`
    const e = ev.e as MouseEvent | PointerEvent | undefined
    const x = e?.clientX ?? 0
    const y = e?.clientY ?? 0
    bubble.style.left = `${x + 30}px`
    bubble.style.top = `${y + 30}px`
    bubble.style.display = 'block'
  }

const hideSizeBubble = () => {
  if (!selDomRef.current) return
  const bubble = (selDomRef.current as any)._sizeBubble as HTMLDivElement | undefined
  if (bubble) bubble.style.display = 'none'
}

const showRotBubble = (obj: fabric.Object | undefined, ev: fabric.IEvent | undefined) => {
  if (!obj || !selDomRef.current || !ev) return
  const bubble = (selDomRef.current as any)._rotBubble as HTMLDivElement | undefined
  if (!bubble) return
  let angle = obj.angle || 0
  angle = ((angle % 360) + 360) % 360
  if (angle > 180) angle -= 360
  bubble.textContent = `${Math.round(angle)}\u00B0`
  const e = ev.e as MouseEvent | PointerEvent | undefined
  const x = e?.clientX ?? 0
  const y = e?.clientY ?? 0
  bubble.style.left = `${x + 30}px`
  bubble.style.top = `${y + 30}px`
  bubble.style.display = 'block'
}

const hideRotBubble = () => {
  if (!selDomRef.current) return
  const bubble = (selDomRef.current as any)._rotBubble as HTMLDivElement | undefined
  if (bubble) bubble.style.display = 'none'
}

const filterLockedSelection = () => {
  const act = fc.getActiveObject() as fabric.Object | undefined
  if (act && (act as any).type === 'activeSelection') {
    const as = act as fabric.ActiveSelection
    const objs = as.getObjects()
    const unlocked = objs.filter(o => !(o as any).locked)
    if (unlocked.length !== objs.length) {
      fc.discardActiveObject()
      if (unlocked.length === 1) {
        fc.setActiveObject(unlocked[0])
      } else if (unlocked.length > 1) {
        const sel = new fabric.ActiveSelection(unlocked, { canvas: fc } as any)
        fc.setActiveObject(sel)
      }
      fc.requestRenderAll()
    }
  }
}

fc.on('selection:created', () => {
  filterLockedSelection()
  hoverHL.visible = false
  fc.requestRenderAll()
  selDomRef.current && (selDomRef.current.style.display = 'block')
  if (croppingRef.current && cropDomRef.current) {
    cropDomRef.current.style.display = 'block'
  }
  syncSel()
  requestAnimationFrame(syncSel)
  scrollHandler = () => {
    fc.calcOffset()
    syncSel()
    syncHover()
  }
  window.addEventListener('scroll', scrollHandler, { passive: true, capture: true })
  window.addEventListener('resize', scrollHandler)
  containerRef.current?.addEventListener('scroll', scrollHandler, { passive: true, capture: true })
})
  .on('selection:updated', () => { filterLockedSelection(); syncSel() })
  .on('selection:cleared', () => {
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
    window.removeEventListener('resize', scrollHandler);
    containerRef.current?.removeEventListener('scroll', scrollHandler);
    scrollHandler = null;
  }
  selDomRef.current  && (selDomRef.current.style.display  = 'none');
  cropDomRef.current && (cropDomRef.current.style.display = 'none');
  setActionPos(null);     // from quick-action branch
  hideSizeBubble();       // from stable branch
  hideRotBubble();
})


/* also hide hover during any transform of the active object */
const handleAfterRender = () => {
  fc.calcOffset()
  requestAnimationFrame(() => {
    syncSel()
    syncHover()
  })
}

fc.on('object:moving', () => {
  hoverHL.visible         = false;
  transformingRef.current = true;
  if (actionTimerRef.current) {
    clearTimeout(actionTimerRef.current);
    actionTimerRef.current = null;
  }
  requestAnimationFrame(syncSel);
  hideSizeBubble();                  // moving never shows the bubble
  hideRotBubble();
})

.on('object:scaling', e => {
  hoverHL.visible         = false;
  transformingRef.current = true;
  if (actionTimerRef.current) {
    clearTimeout(actionTimerRef.current);
    actionTimerRef.current = null;
  }
  requestAnimationFrame(syncSel);
  showSizeBubble(e.target as fabric.Object, e);   // live size read-out
  hideRotBubble();
})

.on('object:rotating', e => {
  hoverHL.visible         = false;
  transformingRef.current = true;
  if (actionTimerRef.current) {
    clearTimeout(actionTimerRef.current);
    actionTimerRef.current = null;
  }
  requestAnimationFrame(syncSel);
  hideSizeBubble();                  // hide during rotation
  showRotBubble(e.target as fabric.Object, e);
})

.on('object:scaled', e => {
  hoverHL.visible = false;
  hideSizeBubble();
  hideRotBubble();
  requestAnimationFrame(() => requestAnimationFrame(syncSel));
})

  .on('object:modified', () => {
    if (transformingRef.current) {
      transformingRef.current = false
      setActionPos(null)
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current)
      actionTimerRef.current = window.setTimeout(() => {
        requestAnimationFrame(() => requestAnimationFrame(syncSel))
      }, 250)
    }
    hideRotBubble()
  })
  .on('mouse:up', () => {
    if (transformingRef.current) {
      transformingRef.current = false
      setActionPos(null)
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current)
      actionTimerRef.current = window.setTimeout(syncSel, 250)
    }
    hideSizeBubble()
    hideRotBubble()
  })
  .on('after:render',    handleAfterRender)

/* ── 4 ▸ Hover outline (only when NOT the active object) ─── */
fc.on('mouse:over', e => {
  const t = e.target as fabric.Object | undefined
  if (!t || (t as any)._guide || t === hoverHL) return
  if (fc.getActiveObject() === t) return           // skip active selection
  hoverDomRef.current && (() => {
    drawOverlay(t, hoverDomRef.current as HTMLDivElement & { _object?: fabric.Object | null })
    ;(hoverDomRef.current as any)._object = t
    hoverDomRef.current.style.display = 'block'
    hoverScrollHandler = () => {
      fc.calcOffset()
      syncHover()
    }
    window.addEventListener('scroll', hoverScrollHandler, { passive: true, capture: true })
    window.addEventListener('resize', hoverScrollHandler)
    containerRef.current?.addEventListener('scroll', hoverScrollHandler, { passive: true, capture: true })
  })()
})
.on('mouse:out', () => {
  hoverHL.visible = false
  hoverDomRef.current && (() => {
    hoverDomRef.current.style.display = 'none'
    ;(hoverDomRef.current as any)._object = null
    if (hoverScrollHandler) {
      window.removeEventListener('scroll', hoverScrollHandler)
      window.removeEventListener('resize', hoverScrollHandler)
      containerRef.current?.removeEventListener('scroll', hoverScrollHandler)
      hoverScrollHandler = null
    }
  })()
  fc.requestRenderAll()
})

addGuides(fc, mode)                           // add guides based on mode
  /* ── 4.5 ▸ Fabric ➜ Zustand sync ──────────────────────────── */
  fc.on('object:modified', e=>{
    hideRotBubble()
    isEditing.current = true
    const t = e.target as any
    if (t?.layerIdx === undefined) return

    const d: Partial<Layer> = {
      x      : t.left,
      y      : t.top,
      scaleX : t.scaleX,
      scaleY : t.scaleY,
      leftPct  : ((t.left  || 0) / PAGE_W) * 100,
      topPct   : ((t.top   || 0) / PAGE_H) * 100,
    }
    if (t.type === 'image') Object.assign(d, {
      width  : t.getScaledWidth(),
      height : t.getScaledHeight(),
      opacity: t.opacity,
      widthPct : (t.getScaledWidth()  / PAGE_W) * 100,
      heightPct: (t.getScaledHeight() / PAGE_H) * 100,
      ...(t.cropX != null && { cropX: t.cropX }),
      ...(t.cropY != null && { cropY: t.cropY }),
      ...(t.width  != null && { cropW: t.width  }),
      ...(t.height != null && { cropH: t.height }),
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
      width      : t.getScaledWidth(),
      height     : t.getScaledHeight(),
      widthPct  : (t.getScaledWidth()  / PAGE_W) * 100,
      heightPct : (t.getScaledHeight() / PAGE_H) * 100,
      lines     : t.textLines as string[],
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
      lines      : t.textLines as string[],
      leftPct    : ((t.left || 0) / PAGE_W) * 100,
      topPct     : ((t.top  || 0) / PAGE_H) * 100,
      widthPct   : (t.getScaledWidth()  / PAGE_W) * 100,
      heightPct  : (t.getScaledHeight() / PAGE_H) * 100,
    })
    setTimeout(()=>{ isEditing.current = false })
  })

/* ───────────────── clipboard & keyboard shortcuts ────────────────── */

const onKey = (e: KeyboardEvent) => {
  if (useEditor.getState().activePage !== pageIdx) return
  const active = fc.getActiveObject() as fabric.Object | undefined
  const cmd    = e.metaKey || e.ctrlKey
  const locked = (active as any)?.locked

  /* —— COPY ————————————————————————————————————— */
  if (cmd && e.code === 'KeyC' && active) {
    clip.json  = [(active).toJSON(PROPS)]            // keep the wrapper!
    clip.nudge = 0
    e.preventDefault()
    return
  }

  /* —— CUT —————————————————————————————————————— */
  if (cmd && e.code === 'KeyX' && active && !locked) {
    clip.json  = [(active).toJSON(PROPS)]
    clip.nudge = 0

    /* remove wrapper + every child */
    allObjs(active).forEach(o => fc.remove(o))
    syncLayersFromCanvas(fc, pageIdx)
    e.preventDefault()
    return
  }

  /* —— PASTE ———————————————————————————————————— */
  if (cmd && e.code === 'KeyV' && clip.json.length) {
    clip.nudge += 10                                   // cascade each paste

    fabric.util.enlivenObjects(clip.json, (objs: fabric.Object[]) => {
      const root = objs[0]                             // our wrapper/group

      /* offset once (wrapper carries the children) */
      root.set({
        left: (root.left ?? 0) + clip.nudge,
        top : (root.top  ?? 0) + clip.nudge,
      })
      root.setCoords()

      /* Fabric gives us a Group – break it straight into an ActiveSelection */
      if ((root as any).type === 'group') {
        const g = root as fabric.Group
        const kids = g._objects as fabric.Object[]
        kids.forEach(o => fc.add(o))
        fc.remove(g)                                   // drop the temp group

        const sel = new fabric.ActiveSelection(kids, { canvas: fc } as any)
        fc.setActiveObject(sel)
      } else {
        fc.add(root)
        fc.setActiveObject(root)
      }

      fc.requestRenderAll()
      syncLayersFromCanvas(fc, pageIdx)
    }, '')                                             // namespace = ''
    e.preventDefault()
    return
  }

  /* —— DELETE ——————————————————————————————————— */
  if (!cmd && (e.code === 'Delete' || e.code === 'Backspace') && active && !locked) {
    allObjs(active).forEach(o => fc.remove(o))
    syncLayersFromCanvas(fc, pageIdx)
    e.preventDefault()
    return
  }

  /* —— ARROW-NUDGE ————————————————————————————— */
  if (!cmd && e.code.startsWith('Arrow') && active) {
    const step = e.shiftKey ? 10 : 1
    const dx   = e.code === 'ArrowLeft'  ? -step
               : e.code === 'ArrowRight' ?  step : 0
    const dy   = e.code === 'ArrowUp'    ? -step
               : e.code === 'ArrowDown'  ?  step : 0

    allObjs(active).forEach(o => {
      const nx = (o as any).lockMovementX ? 0 : dx
      const ny = (o as any).lockMovementY ? 0 : dy
      if (nx || ny) {
        o.set({ left: (o.left ?? 0) + nx,
                top : (o.top  ?? 0) + ny })
        o.setCoords()
      }
    })

    fc.requestRenderAll()
    const editRef = (fc as any)._editingRef as { current: boolean } | undefined
    if (editRef) editRef.current = true
    syncLayersFromCanvas(fc, pageIdx)
    setTimeout(() => { if (editRef) editRef.current = false }, 0)
    e.preventDefault()
  }
}

/* avoid duplicates during hot-reload */
window.removeEventListener('keydown', onKey)
window.addEventListener('keydown', onKey)

  /* ── 6 ▸ Expose canvas & tidy up ──────────────────────────── */
  // expose editing ref so external controls can pause re-hydration
  ;(fc as any)._editingRef = isEditing
  fcRef.current = fc; onReady(fc)

    return () => {
      fc.upperCanvasEl.removeEventListener('contextmenu', ctxMenu)
      window.removeEventListener('keydown', onKey)
      if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('scroll', updateOffset)
      window.removeEventListener('resize', updateOffset)
      containerRef.current?.removeEventListener('scroll', updateOffset)
      // tidy up crop‑tool listeners
      fc.off('mouse:dblclick', dblHandler);
      window.removeEventListener('keydown', keyCropHandler);
      fc.off('before:transform', startCrop);
      fc.off('object:scaling', duringCrop);
      fc.off('object:scaled', endCrop);
      fc.off('after:render', handleAfterRender);
      selEl.removeEventListener('pointerdown', onSelDown)
      cropEl.removeEventListener('pointerdown', onCropDown)
      selEl.removeEventListener('pointerenter', raiseSel)
      cropEl.removeEventListener('pointerenter', raiseCrop)
      onReady(null)
      cropToolRef.current?.abort()
      isolateCrop(false)
      fc.dispose()
      hoverDomRef.current?.remove()
      selDomRef.current?.remove()
      cropDomRef.current?.remove()
      sizeBubble.remove()
      rotBubble.remove()
      if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler)
        window.removeEventListener('resize', scrollHandler)
        containerRef.current?.removeEventListener('scroll', scrollHandler)
      }
      if (hoverScrollHandler) {
        window.removeEventListener('scroll', hoverScrollHandler)
        window.removeEventListener('resize', hoverScrollHandler)
        containerRef.current?.removeEventListener('scroll', hoverScrollHandler)
      }
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
/* ---------- END mount once ----------------------------------- */

  /* ---------- apply zoom -------------------------------------- */
  useEffect(() => {
    const fc = fcRef.current
    const canvas = canvasRef.current
    if (!fc || !canvas) return

    const container = canvas.parentElement as HTMLElement | null
    if (container) {
      const pad = 4 * zoom
      container.style.padding = `${pad}px`
      container.style.overflow = 'visible'
    }

    canvas.style.transform = `scale(${zoom})`
    canvas.style.transformOrigin = 'top left'

    fc.setViewportTransform([SCALE * zoom, 0, 0, SCALE * zoom, 0, 0])
    if (cropToolRef.current) (cropToolRef.current as any).SCALE = SCALE * zoom
    fc.requestRenderAll()
  }, [zoom])

  /* ---------- crop mode toggle ------------------------------ */
  useEffect(() => {
    const fc = fcRef.current
    if (!fc) return

    if (isCropping && !croppingRef.current) {
      const act = fc.getActiveObject() as fabric.Object | undefined
      if (act && (act as any).type === 'image' && !(act as any).locked) {
        document.dispatchEvent(new Event('start-crop'))
      }
    }
  }, [isCropping])



  /* ---------- redraw on page change ----------------------------- */
  useEffect(() => {
    const fc = fcRef.current
    if (!fc || !page) return
    if (isEditing.current || (fc as any)._editingRef?.current) return

    cropToolRef.current?.abort()
    hydrating.current = true
    fc.clear();
    fc.setBackgroundColor('#fff', fc.renderAll.bind(fc));
    hoverRef.current && fc.add(hoverRef.current)

    /* bottom ➜ top keeps original z-order */
    for (let idx = 0; idx < page.layers.length; idx++) {
      const raw = page.layers[idx]
      const ly: Layer | null = (raw as any).type ? raw as Layer : fromSanity(raw, currentSpec)
      if (!ly) continue

      if (ly.leftPct != null) ly.x = (ly.leftPct / 100) * PAGE_W
      if (ly.topPct  != null) ly.y = (ly.topPct  / 100) * PAGE_H
      if (ly.widthPct  != null) ly.width  = (ly.widthPct  / 100) * PAGE_W
      if (ly.heightPct != null) ly.height = (ly.heightPct / 100) * PAGE_H

/* ---------- IMAGES --------------------------------------------- */
if (ly.type === 'image' && (ly.src || ly.srcUrl)) {
  // ① make sure we have a usable URL
  const srcUrl = getSrcUrl(ly);
  if (!srcUrl) continue;                 // nothing we can render yet

  // ② CORS flag only for http/https URLs
  const opts = srcUrl.startsWith('http') ? { crossOrigin: 'anonymous' } : undefined;

  fabric.Image.fromURL(srcUrl, rawImg => {
    const img = rawImg instanceof fabric.Image ? rawImg : new fabric.Image(rawImg);

    // keep original asset info so objToLayer can round-trip it
    (img as any).__src   = srcUrl
    if (ly.assetId) (img as any).assetId = ly.assetId
    if (ly.srcUrl) (img as any).srcUrl = ly.srcUrl

          /* cropping */
          if (ly.cropX != null) img.cropX = ly.cropX
          if (ly.cropY != null) img.cropY = ly.cropY
          if (ly.cropW != null) img.width = ly.cropW
          if (ly.cropH != null) img.height = ly.cropH

          /* scale */
          if (ly.scaleX == null || ly.scaleY == null) {
            const s = Math.min(1, PAGE_W / img.width!, PAGE_H / img.height!)
            img.scale(s)
          } else {
            img.set({ scaleX: ly.scaleX, scaleY: ly.scaleY })
          }

          /* shared props */
          img.set({
            left      : ly.x,
            top       : ly.y,
            originX   : 'left',
            originY   : 'top',
            selectable: ly.selectable ?? true,
            evented   : ly.editable ?? true,
            opacity   : ly.opacity ?? 1,
            flipX     : ly.flipX ?? false,
            flipY     : ly.flipY ?? false,
          })
          img.angle = ly.angle ?? 0

          ;(img as any).locked = ly.locked
          if (ly.locked) {
            img.set({
              lockMovementX: true,
              lockMovementY: true,
              lockScalingX : true,
              lockScalingY : true,
              lockRotation : true,
            })
          }

          /* ---------- AI placeholder extras -------------------------------- */
          let doSync: (() => void) | undefined
          if (raw._type === 'aiLayer') {
            const spec = raw.source
            const locked = !!ly.locked
            img.set({ selectable: !locked, evented: !locked, hasControls: !locked })

 
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
              ghost.style.pointerEvents = 'none' // never block canvas clicks


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

doSync = () =>
  canvasRef.current && ghost && (() => {
    fc.calcOffset()
    syncGhost(img, ghost, canvasRef.current)
  })()
            doSync()
            img.on('moving',   doSync)
               .on('scaling',  doSync)
               .on('rotating', doSync)
               window.addEventListener('scroll', doSync, { passive: true, capture: true })
               window.addEventListener('resize', doSync)
               fc.on('after:render', doSync)
               

            /* hide overlay when actively selected */
            fc.on('selection:created', e => {
              if (e.target === img) ghost!.style.display = 'none'
            })
            fc.on('selection:cleared', () => { ghost!.style.display = '' })

            /* hide overlay when coach-mark is dismissed */
            document.addEventListener('ai-coach-dismiss', () => {
              ghost!.style.display = 'none'
            })

            img.on('removed', () => {
              window.removeEventListener('scroll', doSync)
              window.removeEventListener('resize', doSync)
              fc.off('after:render', doSync)
              ghost?.remove()
            })
          }

          /* keep z-order */
          ;(img as any).layerIdx = idx
          ;(img as any).uid = ly.uid
          fc.insertAt(img, idx, false)
          img.setCoords()
          fc.requestRenderAll()
          doSync?.()
          document.dispatchEvent(
            new CustomEvent('card-canvas-rendered', {
              detail: { pageIdx, canvas: fc },
            })
          )
        }, opts);
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
        tb.angle = ly.angle ?? 0
        ;(tb as any).locked = ly.locked
        if (ly.locked) {
          tb.set({
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX : true,
            lockScalingY : true,
            lockRotation : true,
          })
        }
        ;(tb as any).layerIdx = idx
        ;(tb as any).uid = ly.uid
        fc.insertAt(tb, idx, false)
      }
    }

    addGuides(fc, mode)
    hoverRef.current?.bringToFront()
    fc.requestRenderAll();
    hydrating.current = false
    document.dispatchEvent(
      new CustomEvent('card-canvas-rendered', {
        detail: { pageIdx, canvas: fc },
      })
    )
  }, [page])

  /* ---------- render ----------------------------------------- */
  return (
    <>
      <canvas
        ref={canvasRef}
        width={PREVIEW_W}
        height={PREVIEW_H}
        style={{ width: PREVIEW_W, height: PREVIEW_H, transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        className={`border shadow rounded ${className}`}
      />
      <QuickActionBar
        pos={actionPos}
        onAction={handleMenuAction}
        onMenu={p => setMenuPos(p)}
        locked={Boolean(fcRef.current?.getActiveObject() && (fcRef.current!.getActiveObject() as any).locked)}
        onUnlock={toggleActiveLock}
      />
      {menuPos && (
        <ContextMenu
          pos={menuPos}
          onAction={handleMenuAction}
          onClose={() => setMenuPos(null)}
        />
      )}
    </>
  )
}