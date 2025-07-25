/**********************************************************************
 * layerAdapters.ts – Sanity ⇄ Fabric-editor conversions
 * --------------------------------------------------------------------
 * 2025-05-30  • supports aiLayer (face-swap placeholder)
 *            • round-trips opacity / scale / w / h
 *********************************************************************/

import { urlFor }     from '@/sanity/lib/image'
import type { Layer, PrintSpec } from '@/app/components/FabricCanvas'


/* ---------- helpers ---------------------------------------------- */
const DEFAULT_SPEC: PrintSpec = {
  trimWidthIn : 5,
  trimHeightIn: 7,
  bleedIn     : 0.125,
  dpi         : 300,
}

const pageDims = (spec?: PrintSpec | null) => {
  const s = spec ?? DEFAULT_SPEC
  return {
    PAGE_W: Math.round((s.trimWidthIn + s.bleedIn * 2) * s.dpi),
    PAGE_H: Math.round((s.trimHeightIn + s.bleedIn * 2) * s.dpi),
  }
}

/* ───────── helpers ──────────────────────────────────────────────── */
function isSanityRef(src:any): src is { _type:'image'; asset:{ _ref:string } } {
    return src && typeof src === 'object' && src._type === 'image' && src.asset?._ref
  }
  
  const imgUrl = (src:any):string|undefined =>
         isSanityRef(src)        ? urlFor(src).url()        // new path
       : typeof src === 'string' ? src                      // plain URL
       : undefined

/* ================================================================== */
/* 1 ▸ Sanity → Fabric (fromSanity)                                   */
/* ================================================================== */
export function fromSanity(raw: any, spec: PrintSpec = DEFAULT_SPEC): Layer | null {
  if (!raw?._type) return null
  const { PAGE_W, PAGE_H } = pageDims(spec)

/* ① AI face-swap placeholder ---------------------------------- */
if (raw._type === 'aiLayer') {
  const locked   = !!raw.locked
  const spec     = raw.source            // ← ref to aiPlaceholder
  const refImage = spec?.refImage

  return {
    /* what Fabric needs */
    type :'image',
    src  : refImage ? urlFor(refImage).url() : '/ai-placeholder.png',
    x : raw.x ?? 100,
    y : raw.y ?? 100,
    width : raw.w,
    height: raw.h,
    leftPct:   typeof raw.leftPct === 'number' ? raw.leftPct : ((raw.x ?? 0) / PAGE_W) * 100,
    topPct:    typeof raw.topPct  === 'number' ? raw.topPct  : ((raw.y ?? 0) / PAGE_H) * 100,
    widthPct:  typeof raw.widthPct  === 'number' ? raw.widthPct  : (raw.w != null ? (raw.w / PAGE_W) * 100 : undefined),
    heightPct: typeof raw.heightPct === 'number' ? raw.heightPct : (raw.h != null ? (raw.h / PAGE_H) * 100 : undefined),
    scaleX: raw.scaleX,
    scaleY: raw.scaleY,
    ...(raw.angle != null && { angle: raw.angle }),
    ...(raw.flipX != null && { flipX: raw.flipX }),
    ...(raw.flipY != null && { flipY: raw.flipY }),
    selectable: !locked,
    editable  : !locked,

    /* round-trip bookkeeping */
    _type : 'aiLayer',
    _key  : raw._key,
    _isAI : true,
    locked,
    source: raw.source,          // ← ⭐ keep the reference !
  } as Layer & { _isAI: true }
}

  /* ② editable / bg image -------------------------------------- */
  if (raw._type === 'editableImage' || raw._type === 'bgImage') {
    const locked = !!raw.locked
    return {
      type :'image',
      src  : imgUrl(raw.src) ?? imgUrl(raw) ?? raw.srcUrl,
      x : raw.x ?? 0,
      y : raw.y ?? 0,
      width : raw.w,
      height: raw.h,
      leftPct:   typeof raw.leftPct === 'number' ? raw.leftPct : ((raw.x ?? 0) / PAGE_W) * 100,
      topPct:    typeof raw.topPct  === 'number' ? raw.topPct  : ((raw.y ?? 0) / PAGE_H) * 100,
      widthPct:  typeof raw.widthPct  === 'number' ? raw.widthPct  : (raw.w != null ? (raw.w / PAGE_W) * 100 : undefined),
      heightPct: typeof raw.heightPct === 'number' ? raw.heightPct : (raw.h != null ? (raw.h / PAGE_H) * 100 : undefined),
      scaleX: raw.scaleX,
      scaleY: raw.scaleY,
      ...(raw.angle  != null && { angle: raw.angle }),
      ...(raw.flipX != null && { flipX: raw.flipX }),
      ...(raw.flipY != null && { flipY: raw.flipY }),
      ...(raw.cropX != null && { cropX: raw.cropX }),
      ...(raw.cropY != null && { cropY: raw.cropY }),
      ...(raw.cropW != null && { cropW: raw.cropW }),
      ...(raw.cropH != null && { cropH: raw.cropH }),
      opacity: raw.opacity,
      selectable: raw._type !== 'bgImage' && !locked,
      editable  : raw._type !== 'bgImage' && !locked,
      locked,
    }
  }

  /* ③ editable text -------------------------------------------- */
  if (raw._type === 'editableText') {
    const locked = !!raw.locked
    return {
      type :'text',
      text : raw.text ?? '',
      x : raw.x ?? 0,
      y : raw.y ?? 0,
      width : typeof raw.width === 'number'
                ? raw.width
                : parseFloat(String(raw.width)) ||
                    (raw.widthPct != null ? (raw.widthPct / 100) * PAGE_W : 200),
      height: typeof raw.height === 'number'
                ? raw.height
                : parseFloat(String(raw.height)) ||
                    (raw.heightPct != null ? (raw.heightPct / 100) * PAGE_H : undefined),
      leftPct:   typeof raw.leftPct === 'number' ? raw.leftPct : ((raw.x ?? 0) / PAGE_W) * 100,
      topPct:    typeof raw.topPct  === 'number' ? raw.topPct  : ((raw.y ?? 0) / PAGE_H) * 100,
      widthPct:  typeof raw.widthPct  === 'number' ? raw.widthPct  : (raw.width  != null ? (parseFloat(String(raw.width))  / PAGE_W) * 100 : undefined),
      heightPct: typeof raw.heightPct === 'number' ? raw.heightPct : (raw.height != null ? (parseFloat(String(raw.height)) / PAGE_H) * 100 : undefined),
      fontSize  : typeof raw.fontSize === 'number'
                    ? raw.fontSize
                    : parseFloat(String(raw.fontSize)) || 32,
      fontFamily: raw.fontFamily ?? 'Arial',
      fontWeight: raw.fontWeight ?? 'normal',
      fontStyle : raw.fontStyle  ?? 'normal',
      underline : raw.underline  ?? false,
      fill      : raw.fill       ?? '#000',
      textAlign : raw.textAlign  ?? 'left',
      lineHeight: typeof raw.lineHeight === 'number'
                    ? raw.lineHeight
                    : parseFloat(String(raw.lineHeight)) || 1.16,
      opacity   : raw.opacity,
      scaleX    : raw.scaleX,
      scaleY    : raw.scaleY,
      ...(raw.angle != null && { angle: raw.angle }),
      selectable: !locked,
      editable  : !locked,
      locked,
    }
  }

  /* unknown layer – skip it */
  return null
}

/* ================================================================== */
/* 2 ▸ Fabric → Sanity (toSanity)                                     */
/* ================================================================== */
export function toSanity(layer: Layer | any, spec: PrintSpec = DEFAULT_SPEC): any {
  const { PAGE_W, PAGE_H } = pageDims(spec)

/* ── keep AI placeholder as-is — strip all editor-only props ───────── */
if (layer?._type === 'aiLayer') {
  const {
    _isAI, selectable, editable, src, type,   // editor-only helpers
    width, height,                            // live size from Fabric
    scaleX, scaleY,                           // explicit user scaling
    source,                                   // may contain _id | _ref | full ref
    ...rest                                   // x, y, w, h, locked, _key …
  } = layer;

  console.log('✔ aiLayer toSanity – rest =', rest);

  return {
    ...rest,                                  // keep everything Sanity cares about

    leftPct:   layer.leftPct ?? ((layer.x ?? 0) / PAGE_W) * 100,
    topPct:    layer.topPct  ?? ((layer.y ?? 0) / PAGE_H) * 100,
    widthPct:  layer.widthPct  ?? (width != null ? (width / PAGE_W) * 100 : undefined),
    heightPct: layer.heightPct ?? (height != null ? (height / PAGE_H) * 100 : undefined),

    // ── ensure the reference is in the correct shape ───────────────
    source:
      (source?._ref || source?._id)
        ? { _type: 'reference', _ref: source._ref ?? source._id }
        : undefined,

    // ── convert live size back to schema fields ─────────────────────
    ...(width  != null && { w: width  }),
    ...(height != null && { h: height }),

    // ── persist explicit scale adjustments, if any ─────────────────
    ...(scaleX != null && { scaleX }),
    ...(scaleY != null && { scaleY }),
    ...(layer.angle != null && { angle: layer.angle }),
    ...(layer.flipX != null && { flipX: layer.flipX }),
    ...(layer.flipY != null && { flipY: layer.flipY }),
  };
}

  /* —— native Sanity objects (editableImage / editableText) —— */
  if (layer?._type) {
    const { _isAI, selectable, editable, src, assetId, type, ...rest } = layer
    return {
      ...rest,
      leftPct:   layer.leftPct ?? ((layer.x ?? 0) / PAGE_W) * 100,
      topPct:    layer.topPct  ?? ((layer.y ?? 0) / PAGE_H) * 100,
      widthPct:  layer.widthPct  ?? (layer.width != null ? (layer.width / PAGE_W) * 100 : undefined),
      heightPct: layer.heightPct ?? (layer.height != null ? (layer.height / PAGE_H) * 100 : undefined),
    }
  }

/* —— image layer back to editableImage ——————————————— */
if (layer.type === 'image') {
  delete (layer as any).source          // ← ❶ nix the stray key

  const obj: any = {
    _type: 'editableImage',
    x: layer.x,
    y: layer.y,
    leftPct:   layer.leftPct ?? ((layer.x ?? 0) / PAGE_W) * 100,
    topPct:    layer.topPct  ?? ((layer.y ?? 0) / PAGE_H) * 100,
    widthPct:  layer.widthPct  ?? (layer.width != null ? (layer.width / PAGE_W) * 100 : undefined),
    heightPct: layer.heightPct ?? (layer.height != null ? (layer.height / PAGE_H) * 100 : undefined),
    ...(layer.width  != null && { w: layer.width  }),
    ...(layer.height != null && { h: layer.height }),
    ...(layer.cropX  != null && { cropX: layer.cropX }),
    ...(layer.cropY  != null && { cropY: layer.cropY }),
    ...(layer.cropW  != null && { cropW: layer.cropW }),
    ...(layer.cropH  != null && { cropH: layer.cropH }),
    ...(layer.opacity != null && { opacity: layer.opacity }),
    ...(layer.scaleX  != null && { scaleX: layer.scaleX }),
    ...(layer.scaleY  != null && { scaleY: layer.scaleY }),
    ...(layer.angle   != null && { angle: layer.angle }),
    ...(layer.flipX   != null && { flipX: layer.flipX }),
    ...(layer.flipY   != null && { flipY: layer.flipY }),
    ...(layer.locked != null && { locked: layer.locked }),
  };

/* 1️⃣ Already have assetId → easiest */
if (layer.assetId) {
  obj.src = {
    _type: 'image',
    asset: { _type: 'reference', _ref: layer.assetId },
  };
}
/* 2️⃣ Sanity reference already sitting in layer.src */
else if (layer.src && typeof layer.src === 'object') {
  obj.src = layer.src as any;     // keep it verbatim
}
/* 3️⃣ External URL → keep as raw link */
else if (typeof layer.src === 'string') {
  obj.srcUrl = layer.src;
}

  return obj;
}

  /* —— text layer back to editableText ———————————————— */
  if (layer.type === 'text') {
    return {
      _type :'editableText',
      text : layer.text,
      x : layer.x,
      y : layer.y,
      leftPct:   layer.leftPct ?? ((layer.x ?? 0) / PAGE_W) * 100,
      topPct:    layer.topPct  ?? ((layer.y ?? 0) / PAGE_H) * 100,
      widthPct:  layer.widthPct  ?? (layer.width != null ? (layer.width / PAGE_W) * 100 : undefined),
      heightPct: layer.heightPct ?? (layer.height != null ? (layer.height / PAGE_H) * 100 : undefined),
      width : layer.width,
      height: layer.height,
      fontSize  : typeof layer.fontSize === 'number'
                    ? layer.fontSize
                    : parseFloat(String(layer.fontSize)) || 32,
      fontFamily: layer.fontFamily ?? 'Arial',
      fontWeight: layer.fontWeight ?? 'normal',
      fontStyle : layer.fontStyle  ?? 'normal',
      underline : layer.underline  ?? false,
      fill      : layer.fill       ?? '#000',
      textAlign : layer.textAlign  ?? 'left',
      lineHeight: typeof layer.lineHeight === 'number'
                    ? layer.lineHeight
                    : parseFloat(String(layer.lineHeight)) || 1.16,
      ...(layer.opacity != null && { opacity: layer.opacity }),
      ...(layer.scaleX  != null && { scaleX : layer.scaleX }),
      ...(layer.scaleY  != null && { scaleY : layer.scaleY }),
      ...(layer.angle   != null && { angle : layer.angle }),
      ...(layer.locked != null && { locked: layer.locked }),
    }
  }

  /* fallback (shouldn’t happen) */
  return {}
}