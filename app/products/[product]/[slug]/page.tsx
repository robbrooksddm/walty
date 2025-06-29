import ProductPageClient from './ProductPageClient'
import { getTemplatePages } from '@/app/library/getTemplatePages'
import { sanityFetch } from '@/lib/sanityClient'
import { urlFor } from '@/sanity/lib/image'

export default async function ProductPage({ params }: { params: { product: string; slug: string } }) {
  const { slug } = params
  const { pages, products } = await getTemplatePages(slug)
  const meta = await sanityFetch<{title:string;description?:string}>(
    `*[_type=="cardTemplate" && slug.current==$s][0]{title,description}`,
    { s: slug }
  )

  const gallery: string[] = []
  for (const page of pages) {
    const img = page.layers?.find((l: any) => l.type === 'image' && l.src)
    if (img?.src) gallery.push(urlFor(img.src).url())
    else if (img?.srcUrl) gallery.push(img.srcUrl)
  }

  return (
    <ProductPageClient
      gallery={gallery}
      title={meta?.title || slug}
      description={meta?.description}
      products={products}
      editorUrl={`/cards/${slug}/customise`}
    />
  )
}
