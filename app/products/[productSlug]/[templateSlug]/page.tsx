import { notFound } from 'next/navigation'
import ProductClient from './ProductClient'
import { sanityPreview } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'

export default async function ProductPage({
  params,
}: {
  params: { productSlug: string; templateSlug: string }
}) {
  const { templateSlug } = params
  const data = await sanityPreview.fetch(
    `*[_type=="cardTemplate" && slug.current==$slug][0]{
      title,
      slug,
      description,
      pages[]{ layers[]{ _type, src, srcUrl, bgImage } },
      coverImage,
      "variants": products[]->variants[]->{
        title,
        variantHandle,
        price,
        blurb,
        "slug": slug.current
      }
    }`,
    { slug: templateSlug }
  )

  if (!data) return notFound()

  const images: string[] = []
  if (Array.isArray(data.pages)) {
    for (const p of data.pages) {
      const layer = p?.layers?.find((l: any) => l?.src || l?.bgImage)
      if (layer?.src) images.push(urlFor(layer.src).width(420).height(580).url())
      else if (layer?.bgImage) images.push(urlFor(layer.bgImage).width(420).height(580).url())
    }
  }
  if (!images.length && data.coverImage) {
    images.push(urlFor(data.coverImage).width(420).height(580).url())
  }

  return (
    <ProductClient
      title={data.title}
      slug={data.slug.current}
      description={data.description}
      images={images}
      variants={data.variants || []}
    />
  )
}
