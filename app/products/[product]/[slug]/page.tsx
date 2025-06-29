import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { sanityPreview } from '@/sanity/lib/client'
import { getTemplatePages } from '@/app/library/getTemplatePages'
import ProductTabs from '@/components/ProductTabs'

export default async function ProductPage({ params }: { params: { product: string; slug: string } }) {
  const { slug } = params

  const meta = await sanityPreview.fetch<{title:string;description:string;coverImage?:any}>(
    `*[_type=="cardTemplate" && slug.current==$s][0]{title,description,coverImage}`,
    { s: slug }
  )
  if (!meta) return notFound()

  const { pages } = await getTemplatePages(slug)

  const images = pages.map(p => {
    const img = p.layers.find(l => l.type === 'image' && l.src) as {src:string} | undefined
    return img?.src
  }).filter(Boolean) as string[]

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-serif font-bold text-center">{meta.title}</h1>

      <div className="flex gap-4 overflow-x-auto">
        {images.map((src, i) => (
          <Image key={i} src={src} alt="" width={300} height={420} className="rounded shadow" />
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 justify-center">
          {['Digital Card','Mini Card','Classic Card','Giant Card'].map(label => (
            <button key={label} className="border px-3 py-1 rounded-full" disabled>
              {label}
            </button>
          ))}
        </div>
        <Link href={`/cards/${slug}/customise`} className="block text-center bg-[--walty-orange] text-white font-semibold py-3 rounded">
          Personalise this card
        </Link>
      </div>

      <ProductTabs description={meta.description || ''} />
    </main>
  )
}
