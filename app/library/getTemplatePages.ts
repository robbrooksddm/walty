/**********************************************************************
 * app/lib/getTemplatePages.ts   (—SERVER-ONLY—)
 * Fetch exactly 4 pages from the template draft / published doc and
 * convert every layer with `fromSanity`.
 *********************************************************************/

import { sanityPreview } from '@/sanity/lib/client'
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
    "previewSpec": products[0]->previewSpec,
    "products": products[]->variants[]->{
      _id,
      title,
      "slug": slug.current,
      variantHandle,
      price,
      "printSpec": coalesce(printSpec->, printSpec),
      "showSafeArea": ^.showSafeArea,
      "showProofSafeArea": ^.showProofSafeArea
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

  const raw = await sanityPreview.fetch<{
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
      showSafeArea?: boolean
      showProofSafeArea?: boolean
    }[]
  }>(query, params)

  const pages = Array.isArray(raw?.pages) && raw.pages.length === 4
    ? raw.pages
    : EMPTY

  const names = ['front', 'inner-L', 'inner-R', 'back'] as const

// ─── DEBUG – show what actually came back from Sanity ───
console.log(
  '\n▶ getTemplatePages raw =\n',
  JSON.stringify(raw, null, 2),
  '\n',
)

  const rawProducts = Array.isArray(raw?.products) ? raw.products.filter(Boolean) : []
  const spec = (rawProducts[0]?.printSpec || undefined) as PrintSpec | undefined
  console.log('\u25BA getTemplatePages spec =', JSON.stringify(spec, null, 2))
  const previewSpec = raw?.previewSpec as PreviewSpec | undefined

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