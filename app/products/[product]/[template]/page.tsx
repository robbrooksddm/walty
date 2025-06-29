import Image from 'next/image'
import Link from 'next/link'
import { sanityFetch } from '@/lib/sanityClient'
import { urlFor } from '@/sanity/lib/image'
import ProductTabs from '@/app/components/ProductTabs'

interface PageData {
  title: string
  description?: string
  pages?: { layers?: any[] }[]
  products?: { title: string; variantHandle: string }[]
}

export default async function ProductPage({
  params,
}: {
  params: { product: string; template: string }
}) {
  const { template } = params
  const query = `*[_type=="cardTemplate" && slug.current==$slug][0]{
    title,
    description,
    pages[]{ layers[0]{ _type, src, srcUrl, asset-> } },
    products[]->{ title, variantHandle }
  }`
  const data = await sanityFetch<PageData>(query, { slug: template })
  if (!data) return null

  const images = (data.pages || [])
    .map(p => {
      const l = p.layers?.[0]
      if (!l) return null
      if (l.asset) return urlFor(l.asset).width(480).url()
      if (l.src) return typeof l.src === 'string' ? l.src : urlFor(l.src).width(480).url()
      if (l.srcUrl) return l.srcUrl
      return null
    })
    .filter(Boolean) as string[]

  const variants = (data.products || []).map(p => ({ label: p.title, handle: p.variantHandle }))

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="grid grid-cols-2 gap-4">
          {images.map((src, i) => (
            <Image key={i} src={src} alt={data.title} width={300} height={420} className="w-full h-auto rounded shadow" />
          ))}
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold mb-4">{data.title}</h1>
          {variants.length > 0 && (
            <ul className="space-y-2 mb-6">
              {variants.map(v => (
                <li key={v.handle} className="flex items-center gap-2">
                  <input type="radio" name="variant" id={v.handle} />
                  <label htmlFor={v.handle}>{v.label}</label>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/cards/${template}/customise`} className="block text-center bg-[--walty-orange] text-white font-semibold py-3 rounded">
            Personalise →
          </Link>
        </div>
      </div>
      <ProductTabs description={data.description || ''} />
    </main>
  )
}

