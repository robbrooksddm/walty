/**********************************************************************
 * sanity/lib/mappers.ts
 * Convert a Sanity **cardTemplate** document → the shape that
 * <FabricCanvas> expects (TemplatePage[4] → layers[] of Layer objects)
 **********************************************************************/
import type { TemplatePage, Layer } from '@/app/components/FabricCanvas'
import { urlFor }                   from './image'

/* ────────── helper types (only the bits we access) ────────── */
type SanityLayer = any
type SanityPage  = { layers?: SanityLayer[] }
type CardTemplateDoc = {
  pages? : SanityPage[]     // ← modern structure
  layers?: SanityLayer[]    // ← legacy front-page-only
}

/* ────────────────────────────────────────────────────────────── */
/* 1 ▸ one raw Sanity layer  ➜  one Fabric layer (or null)       */
/* ────────────────────────────────────────────────────────────── */
function toFabricLayer (raw: SanityLayer): Layer | null {
  /* Already converted?  (loaded back from server) */
  if (raw && (raw.type === 'text' || raw.type === 'image')) return raw as Layer

  switch (raw?._type) {
    /* — ① locked background image — */
    case 'bgImage':
      return {
        type : 'image',
        src  : raw.asset ? urlFor(raw.asset).url() : '',
        x: 0, y: 0,
        selectable: false,
        editable  : false,
        width: raw.w ?? 1000,
        height: raw.h ?? 700,
      }

    /* — ② editable text — */
    case 'editableText':
      return {
        type : 'text',
        text : raw.text ?? 'New text',
        x    : raw.x    ?? 50,
        y    : raw.y    ?? 50,
        fontSize : raw.fontSize ?? 32,
        fill     : raw.fill     ?? '#000',
        selectable: true,
        editable  : true,
        width: raw.width ?? 300,
      }

    /* — ③ editable image — */
    case 'editableImage':
      return {
        type  : 'image',
        src   : raw.src ? urlFor(raw.src).url() : '',
        x     : raw.x ?? 0,
        y     : raw.y ?? 0,
        width : raw.w,
        height: raw.h,
        selectable: true,
        editable  : true,
      }

    /* — ④ ⭐ NEW AI face-swap layer (or legacy aiPlaceholder) — */
    case 'aiLayer':
    case 'aiPlaceholder': {
      /* 1️⃣  id of the placeholder spec (draft or published) */
      const ref =
        raw.source?._ref        /* when NOT dereferenced            */
     ?? raw.source?._id         /* when the Studio pop-over fetched  */
      if (!ref) return null     /* malformed – skip it               */

      /* 2️⃣  geometry fallbacks */
      const x = raw.x ?? 50
      const y = raw.y ?? 50
      const w = raw.w ?? 150
      const h = raw.h ?? 150

      /* 3️⃣  thumbnail for the canvas (optional) */
      const thumb =
        raw.source?.refImage?.asset
          ? urlFor(raw.source.refImage).url()
          : '/ai-placeholder.png'

      return {
        type : 'image',
        src  : thumb,
        x, y, width: w, height: h,
        scaleX: raw.scaleX,   // may be undefined
        scaleY: raw.scaleY,
        selectable: !raw.locked,
        editable  : !raw.locked,

        /* metadata used by SelfieDrawer / swap logic */
        _type        : 'aiLayer', 
        _isAI        : true,
        locked       : !!raw.locked,
        placeholderId: ref,      // sent to /api/variants
      } as Layer
    }

    default:
      return null          // unknown type – ignore
  }
}

/* ────────────────────────────────────────────────────────────── */
/* 2 ▸ cardTemplate doc  ➜  exactly 4 TemplatePages              */
/* ────────────────────────────────────────────────────────────── */
export function templateToFabricPages (doc: CardTemplateDoc): TemplatePage[] {
  /* must stay in this order for CardEditor */
  const pages: TemplatePage[] = [
    { name:'front'  , layers:[] },
    { name:'inner-L', layers:[] },
    { name:'inner-R', layers:[] },
    { name:'back'   , layers:[] },
  ]

  /* — modern shape: pages[i].layers — */
  if (doc.pages?.length === 4) {
    doc.pages.forEach((p, idx) => {
      p.layers?.forEach(raw => {
        const ly = toFabricLayer(raw)
        if (ly) pages[idx].layers.push(ly)
      })
    })
    return pages
  }

  /* — legacy fallback: root-level layers[] on “front” — */
  doc.layers?.forEach(raw => {
    const ly = toFabricLayer(raw)
    if (ly) pages[0].layers.push(ly)
  })

  return pages
}