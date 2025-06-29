import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { sanityPreview } from '@/sanity/lib/client'

export default async function ProductTemplatePage({
  params,
}: {
  params: { product: string; template: string }
}) {
  const { product, template } = params

  const tpl = await sanityPreview.fetch<{
    title: string
    slug: { current: string }
    description?: string
    coverImage?: any
    products?: {
      slug: { current: string }
      variants: { title: string; slug: { current: string }; variantHandle: string }[]
    }[]
  }>(
    `*[_type=="cardTemplate" && slug.current==$tpl][0]{
      title,slug,description,coverImage,
      products[]->{slug,title,variants[]->{title,slug,variantHandle}}
    }`,
    { tpl: template },
  )

  if (!tpl) return notFound()

  const productDoc = tpl.products?.find(p => p.slug.current === product)
  const variants = productDoc?.variants ?? []

  const tplData = await getTemplatePages(template)
  const galleryImages = tplData.pages
    .map(p => {
      const img = p.layers.find(l => l.type === 'image') as any
      return img?.src as string | undefined
    })
    .filter(Boolean) as string[]

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {galleryImages.map((src, idx) => (
            <Image
              key={idx}
              src={src}
              alt=""
              width={480}
              height={640}
              className="w-full h-auto rounded shadow"
            />
          ))}
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{tpl.title}</h1>
          {variants.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2">Choose a format</h2>
              <ul className="space-y-1">
                {variants.map(v => (
                  <li key={v.slug.current} className="flex items-center gap-2">
                    <input type="radio" name="variant" defaultChecked={false} />
                    <span>{v.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link
            href={`/cards/${tpl.slug.current}/customise`}
            className="inline-block bg-[--walty-orange] text-white px-6 py-3 rounded-md font-semibold"
          >
            Personalise →
          </Link>
        </div>
      </div>

      <div>
        <Tabs description={tpl.description} />
      </div>
    </main>
  )
}

function Tabs({ description }: { description?: string }) {
  const delivery = 'Standard delivery in 3-5 business days.'
  return (
    <div className="mt-8">
      <div className="border-b flex gap-6 text-sm">
        <span className="pb-2 border-b-2 border-[--walty-orange]">Description</span>
        <span className="pb-2">Delivery</span>
      </div>
      <div className="mt-4 space-y-2">
        <p>{description}</p>
        <p className="hidden">{delivery}</p>
      </div>
    </div>
  )
}
