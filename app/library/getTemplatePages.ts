/**********************************************************************
 * app/lib/getTemplatePages.ts   (—SERVER-ONLY—)
 * Fetch exactly 4 pages from the template draft / published doc and
 * convert every layer with `fromSanity`.
 *********************************************************************/

import { sanityPreview, sanity } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { fromSanity } from '@/app/library/layerAdapters'
import type { TemplatePage, PrintSpec, PreviewSpec } from '@/app/components/FabricCanvas'

/* ---------- 4-page fallback so the editor always mounts --------- */
const EMPTY: TemplatePage[] = [
  {name: 'front',    layers: []},
  {name: 'inner-L',  layers: []},
  {name: 'inner-R',  layers: []},
  {name: 'back',     layers: []},
]

export interface TemplateProduct {
  _id: string
  slug: string
  title: string
  variantHandle: string
  price?: number
  printSpec?: PrintSpec
  previewSpec?: PreviewSpec
  safeInsetXPx?: number
  safeInsetYPx?: number
  safeInsetX?: number
  safeInsetY?: number
  showSafeArea?: boolean
  showProofSafeArea?: boolean
}

export interface TemplateData {
  pages: TemplatePage[]
  coverImage?: string
  spec?: PrintSpec
  previewSpec?: PreviewSpec
  products?: TemplateProduct[]
}

/**
 * Accepts a route param (`slug` -or- full `_id` -or- `drafts.<id>`).
 * Returns **exactly 4 pages** with all layers converted to editor
 * format.  Never throws – fallbacks to an empty structure instead.
 */
export async function getTemplatePages(
  idOrSlug: string,
): Promise<TemplateData> {
  /* 1 ─ pick the first match by _id or slug */
  const query = /* groq */ `
  *[
    _type == "cardTemplate" &&
    (
      _id == $key      ||
      _id == $draftKey ||
      slug.current == $key
    )
  ] | order(_updatedAt desc)[0]{
    coverImage,
    "previewSpec": products[0]->previewSpec{
      ...,
      "safeInsetXPx": safeInsetXPx,
      "safeInsetYPx": safeInsetYPx,
      "safeInsetX": safeInsetX,
      "safeInsetY": safeInsetY,
    },
    "products": products[]->variants[]->{
      _id,
      title,
      "slug": slug.current,
      variantHandle,
      price,
      "printSpec": coalesce(printSpec->, printSpec),
      "previewSpec": ^.^.previewSpec,
      "safeInsetXPx": ^.^.previewSpec.safeInsetXPx,
      "safeInsetYPx": ^.^.previewSpec.safeInsetYPx,
      "safeInsetX": ^.^.previewSpec.safeInsetX,
      "safeInsetY": ^.^.previewSpec.safeInsetY,
      "showSafeArea": ^.^.showSafeArea,
      "showProofSafeArea": ^.^.showProofSafeArea
    },
    pages[]{
      layers[]{
        ...,                       // keep every native field
        // if this layer has a reference called “source”, pull it in-line:
        "source": source->{
          _id,
          prompt,
          refImage                // we only need these three
        }
      }
    }
  }
`

  const params = {
    key:      idOrSlug,
    draftKey: idOrSlug.startsWith('drafts.') ? idOrSlug : `drafts.${idOrSlug}`,
  }

  const client = process.env.SANITY_READ_TOKEN ? sanityPreview : sanity
  const raw = await client.fetch<{
    pages?: any[]
    coverImage?: any
    previewSpec?: PreviewSpec
    products?: {
      _id: string
      title: string
      slug: string
      variantHandle: string
      price?: number
      printSpec?: PrintSpec
      previewSpec?: PreviewSpec
      safeInsetXPx?: number
      safeInsetYPx?: number
      safeInsetX?: number
      safeInsetY?: number
      showSafeArea?: boolean
      showProofSafeArea?: boolean
    }[]
  }>(query, params)

  const pages = Array.isArray(raw?.pages) && raw.pages.length === 4
    ? raw.pages
    : EMPTY

  const names = ['front', 'inner-L', 'inner-R', 'back'] as const

  const rawProducts = Array.isArray(raw?.products) ? raw.products.filter(Boolean) : []
  const spec = (rawProducts[0]?.printSpec || undefined) as PrintSpec | undefined

  let previewSpec: PreviewSpec | undefined = raw?.previewSpec
  if (!previewSpec && rawProducts[0]?.previewSpec) {
    previewSpec = { ...rawProducts[0].previewSpec }
  }

  let prodPxX: number | undefined
  let prodPxY: number | undefined
  let prodInX: number | undefined
  let prodInY: number | undefined
  for (const p of rawProducts) {
    if (prodPxX === undefined && p.safeInsetXPx !== undefined) prodPxX = p.safeInsetXPx
    if (prodPxY === undefined && p.safeInsetYPx !== undefined) prodPxY = p.safeInsetYPx
    if (prodInX === undefined && p.safeInsetX !== undefined) prodInX = p.safeInsetX
    if (prodInY === undefined && p.safeInsetY !== undefined) prodInY = p.safeInsetY
  }

  if (!previewSpec) previewSpec = {
    previewWidthPx: 420,
    previewHeightPx: 580,
  }

  if (previewSpec) {
    if (previewSpec.safeInsetXPx === undefined) previewSpec.safeInsetXPx = prodPxX
    if (previewSpec.safeInsetYPx === undefined) previewSpec.safeInsetYPx = prodPxY
    if (previewSpec.safeInsetX === undefined) previewSpec.safeInsetX = prodInX
    if (previewSpec.safeInsetY === undefined) previewSpec.safeInsetY = prodInY
  }

  if (previewSpec && spec) {
    if (previewSpec.safeInsetXPx === undefined && previewSpec.safeInsetX !== undefined) {
      previewSpec.safeInsetXPx = previewSpec.safeInsetX * spec.dpi
    }
    if (previewSpec.safeInsetYPx === undefined && previewSpec.safeInsetY !== undefined) {
      previewSpec.safeInsetYPx = previewSpec.safeInsetY * spec.dpi
    }
  }

  const pagesOut = names.map((name, i) => ({
    name,
    layers: (pages[i]?.layers ?? [])
      .map(l => fromSanity(l, spec))
      .filter(Boolean),
  })) as TemplatePage[]

  const coverImage = raw?.coverImage ? urlFor(raw.coverImage).url() : undefined
  const products = rawProducts.length ? (rawProducts as TemplateProduct[]) : undefined

  return { pages: pagesOut, coverImage, spec, previewSpec, products }
}
