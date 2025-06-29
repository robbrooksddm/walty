import { sanityFetch } from '@/lib/sanityClient'
import { notFound } from 'next/navigation'
import ProductClient from './ProductClient'

interface Variant {
  title: string
  slug: {current: string}
}
interface ProductData {
  title: string
  description?: string
  pages: {image?: string}[]
  product?: {
    title: string
    variants: Variant[]
  }
}

export default async function ProductPage({
  params,
}: {
  params: { productSlug: string; templateSlug: string }
}) {
  const query = `*[_type=="cardTemplate" && slug.current==$tpl][0]{
    title,
    description,
    pages[]{
      "image": coalesce(
        layers[_type in ['editableImage','bgImage']][0].src.asset->url,
        layers[_type in ['editableImage','bgImage']][0].srcUrl
      )
    },
    "product": products[]->{
      title,
      variants[]->{title, slug}
    }[slug.current==$prod][0]
  }`
  const data = await sanityFetch<ProductData>(query, { tpl: params.templateSlug, prod: params.productSlug })
  if (!data || !data.product) return notFound()
  return <ProductClient data={data} templateSlug={params.templateSlug} />
}
