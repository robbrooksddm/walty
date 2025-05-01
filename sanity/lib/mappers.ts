/* sanity/lib/mappers.ts
   Convert a Sanity **cardTemplate** document → the shape
   <FabricCanvas> expects (TemplatePage[4] → layers[] of Layer objects)
-------------------------------------------------------------------- */
import type {TemplatePage, Layer} from '@/app/components/FabricCanvas'
import {urlFor}                   from './image'

/* ────────────────    Sanity doc types we care about    ─────────── */
type SanityLayer = any

type SanityPage = {
  layers?: SanityLayer[]
}

type CardTemplateDoc = {
  pages?: SanityPage[]           // ← NEW (preferred)
  layers?: SanityLayer[]         // ← OLD (fallback / legacy)
}

/* ───────────── 1 ▸ raw Sanity layer ➜ Fabric layer ───────────── */
function toFabricLayer(raw: SanityLayer): Layer | null {
  /* NEW → if it’s already a Fabric layer coming back from the server,
     pass it straight through so we don’t lose it on reload. */
  if (raw && (raw.type === 'text' || raw.type === 'image')) {
    return raw as Layer
  }

  switch (raw._type) {
    /* ① locked background image (customers can’t touch it) */
    case 'bgImage':
      return {
        type : 'image',
        src  : raw.asset ? urlFor(raw.asset).url() : '',
        x: 0, y: 0,
        selectable: false,
        editable  : false,
      }

    /* ② editable text box */
    case 'editableText':
      return {
        type      : 'text',
        text      : raw.text      ?? 'New text',
        x         : raw.x         ?? 50,
        y         : raw.y         ?? 50,
        fontSize  : raw.fontSize  ?? 32,
        fill      : raw.fill      ?? '#000',
        selectable: true,
        editable  : true,
      }

    /* ③ editable image placeholder */
    case 'editableImage':
      return {
        type      : 'image',
        src       : raw.src ? urlFor(raw.src).url() : '',
        x         : raw.x ?? 0,
        y         : raw.y ?? 0,
        width     : raw.w,
        height    : raw.h,
        selectable: true,
        editable  : true,
      }

    default:
      return null             // unknown → skip it
  }
}

/* ──────────────── 2 ▸ doc ➜ 4 TemplatePages ────────────────────── */
export function templateToFabricPages(doc: CardTemplateDoc): TemplatePage[] {
  /* names must match the order CardEditor expects */
  const pages: TemplatePage[] = [
    {name: 'front'   , layers: []},
    {name: 'inner-L' , layers: []},
    {name: 'inner-R' , layers: []},
    {name: 'back'    , layers: []},
  ]

  /* Preferred shape: pages[i].layers */
  if (doc.pages && doc.pages.length) {
    doc.pages.forEach((p, idx) => {
      p.layers?.forEach(lRaw => {
        const ly = toFabricLayer(lRaw)
        if (ly && pages[idx]) pages[idx].layers.push(ly)
      })
    })
    return pages
  }

  /* Fallback for legacy docs with top-level layers[]  */
  doc.layers?.forEach(lRaw => {
    const ly = toFabricLayer(lRaw)
    if (ly) pages[0].layers.push(ly)      // put everything on “front”
  })

  return pages
}