/**********************************************************************
 * layerAdapters.ts – Sanity ⇄ Fabric-editor conversions
 * --------------------------------------------------------------------
 * 2025-05-30
 *  • supports `aiLayer` (face-swap placeholder)
 *  • keeps round-trip metadata so nothing is lost on save
 *********************************************************************/

import { urlFor }     from '@/sanity/lib/image'
import type { Layer } from '@/app/components/FabricCanvas'

/* ---------- helpers ------------------------------------------------ */
const imgUrl = (src: any): string | undefined =>
       src?._ref            ? urlFor(src).url()   // GROQ asset ref
     : typeof src === 'string' ? src              // plain URL
     : undefined

/* =================================================================== */
/* 1 ▸ Sanity ➜ Fabric (fromSanity)                                    */
/* =================================================================== */
export function fromSanity(raw: any): Layer | null {
  if (!raw?._type) return null

  /* ①  AI face-swap placeholder -------------------------------- */
  if (raw._type === 'aiLayer') {
    const locked   = !!raw.locked
    const spec     = raw.source               // ↖ reference to aiPlaceholder
    const refImage = spec?.refImage

    return {
      /* what Fabric needs to render */
      type : 'image',
      src  : refImage ? urlFor(refImage).url() : '/ai-placeholder.png',
      x    : raw.x ?? 100,
      y    : raw.y ?? 100,
      width : raw.w,
      height: raw.h,
      scaleX: raw.scaleX,
      scaleY: raw.scaleY,
      selectable: !locked,
      editable  : !locked,

      /* bookkeeping for round-trip */
      _type : 'aiLayer',
      _key  : raw._key,
      _isAI : true,
      locked,
      /** SelfieDrawer reads this when calling /api/variants */
      placeholderId: spec?._id ?? spec?._ref ?? null,
    } as Layer & { _isAI: true }
  }

  /* ②  editable / background image ----------------------------- */
  if (raw._type === 'editableImage' || raw._type === 'bgImage') {
    return {
      type : 'image',
      src  : imgUrl(raw.src)        // modern docs
          ?? imgUrl(raw)            // very old docs
          ?? raw.srcUrl,            // ancient docs
      x      : raw.x ?? 0,
      y      : raw.y ?? 0,
      width  : raw.w,
      height : raw.h,
      scaleX : raw.scaleX,
      scaleY : raw.scaleY,
      selectable: raw._type !== 'bgImage',
      editable  : raw._type !== 'bgImage',
    }
  }

  /* ③  editable text ------------------------------------------- */
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

  /* unknown layer type – skip it */
  return null
}

/* =================================================================== */
/* 2 ▸ Fabric ➜ Sanity (toSanity)                                      */
/* =================================================================== */
export function toSanity(layer: Layer | any): any {
  /* keep AI placeholder as-is (strip editor-only flags) */
  if (layer?._type === 'aiLayer') {
    const { _isAI, selectable, editable, ...keep } = layer
    return keep
  }

  /* other native Sanity objects – strip editor-only fields */
  if (layer?._type) {
    const { _isAI, type, selectable, editable, src, assetId, ...rest } = layer
    return rest
  }

  /* images back to editableImage -------------------------------- */
  if (layer.type === 'image') {
    const obj: any = {
      _type : 'editableImage',
      x : layer.x, y : layer.y, w : layer.width, h : layer.height,
    }
    if (layer.scaleX && layer.scaleX !== 1) obj.scaleX = layer.scaleX
    if (layer.scaleY && layer.scaleY !== 1) obj.scaleY = layer.scaleY
    if (layer.assetId) obj.src = { _type: 'reference', _ref: layer.assetId }
    return obj
  }

  /* text back to editableText ----------------------------------- */
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

  /* safeguard – should never be reached */
  return {}
}