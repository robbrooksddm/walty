/**********************************************************************
 * layerAdapters.ts – Sanity ⇆ Editor conversions
 * --------------------------------------------------------------------
 * 2025-05-07
 *  ✓ no more `srcUrl` in data sent back to Sanity
 *  ✓ keeps prompt / refImage / locked on AI placeholders
 *  ✓ adds hidden scaleX / scaleY only when ≠ 1 (so Studio never warns)
 *********************************************************************/

import {urlFor}   from '@/sanity/lib/image'
import type {Layer} from '@/app/components/FabricCanvas'

/* ───────────────────────── helpers ────────────────────────────── */
function imageUrl(src: any): string | undefined {
  if (src?._ref)                 return urlFor(src).url()   // GROQ asset
  if (typeof src === 'string')   return src                 // plain URL
  return undefined
}

/* ────────────── Sanity ➜ Editor (fromSanity) ─────────────────── */
export function fromSanity(raw: any): Layer | null {
  if (!raw?._type) return null

  /* ── AI placeholder ─────────────────────────────────────────── */
  if (raw._type === 'aiPlaceholder') {
    const locked = Boolean(raw.locked)

    return {
      /* rendering */
      type :'image',
      src  : raw.refImage ? urlFor(raw.refImage).url()
                          : '/ai-placeholder.png',
      x     : raw.x ?? 100,
      y     : raw.y ?? 100,
      width : raw.w ?? 300,
      height: raw.h,
      scaleX: raw.scaleX,
      scaleY: raw.scaleY,
      selectable: !locked,
      editable  : !locked,

      /* round-trip metadata */
      prompt   : raw.prompt ?? '',
      refImage : raw.refImage,
      locked,
      _type    : 'aiPlaceholder',
      _key     : raw._key,
      _isAI    : true,
    } as Layer
  }

  /* ── editable / background image ────────────────────────────── */
  if (raw._type === 'editableImage' || raw._type === 'bgImage') {
    return {
      type :'image',
      src  : imageUrl(raw.src)          // new docs: field = asset ref
          ?? imageUrl(raw)              // legacy: whole object is ref
          ?? raw.srcUrl,                // very old docs
      x     : raw.x ?? 0,
      y     : raw.y ?? 0,
      width : raw.w,
      height: raw.h,
      scaleX: raw.scaleX,
      scaleY: raw.scaleY,
      selectable: raw._type !== 'bgImage',
    }
  }

  /* ── editable text ──────────────────────────────────────────── */
  if (raw._type === 'editableText') {
    return {
      type :'text',
      text : raw.text ?? '',
      x    : raw.x ?? 0,
      y    : raw.y ?? 0,
      width: raw.width ?? 200,
      fontSize  : raw.fontSize,
      fontFamily: raw.fontFamily,
      fontWeight: raw.fontWeight,
      fontStyle : raw.fontStyle,
      underline : raw.underline,
      fill      : raw.fill,
      textAlign : raw.textAlign,
      lineHeight: raw.lineHeight,
    }
  }

  return null
}

/* ────────────── Editor ➜ Sanity (toSanity) ───────────────────── */
export function toSanity(layer: Layer | any): any {
  /* ---------- AI placeholder stays untouched ---------- */
  if (layer?._type === 'aiPlaceholder') {
    const { _isAI, selectable, editable, ...keep } = layer as any
    return keep
  }
  /* Already a Sanity object (AI placeholder etc.) */
  if (layer?._type) {
    const {
      _isAI, type, selectable, editable, src, assetId,   // editor-only
      ...rest
    } = layer
    return rest
  }

  /* image -------------------------------------------------------- */
  if (layer.type === 'image') {
    const obj: any = {
      _type : 'editableImage',
      x: layer.x, y: layer.y, w: layer.width, h: layer.height,
    }
    if (layer.scaleX && layer.scaleX !== 1) obj.scaleX = layer.scaleX
    if (layer.scaleY && layer.scaleY !== 1) obj.scaleY = layer.scaleY
    if (layer.assetId) {
      obj.src = { _type: 'reference', _ref: layer.assetId }
    }
    return obj
  }

  /* text --------------------------------------------------------- */
  if (layer.type === 'text') {
    return {
      _type :'editableText',
      text  : layer.text,
      x:layer.x, y:layer.y, width:layer.width,
      fontSize  : layer.fontSize,
      fontFamily: layer.fontFamily,
      fontWeight: layer.fontWeight,
      fontStyle : layer.fontStyle,
      underline : layer.underline,
      fill      : layer.fill,
      textAlign : layer.textAlign,
      lineHeight: layer.lineHeight,
    }
  }

  return {}          // safeguard – shouldn’t be hit
}