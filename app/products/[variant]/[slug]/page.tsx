import Image from 'next/image'
import Link from 'next/link'
import { Tab } from '@headlessui/react'
import { notFound } from 'next/navigation'
import { sanityPreview } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'

interface Variant {
  title: string
  slug: string
  variantHandle: string
}

interface PageData {
  image?: any
}

interface TemplateData {
  title: string
  description?: string
  coverImage?: any
  products?: Variant[]
  pages?: PageData[]
}

const query = `
*[_type=="cardTemplate" && slug.current==$slug][0]{
  title,
  description,
  coverImage,
  pages[]{"image": layers[_type=="image"][0].src.asset->},
  products[]->{title, slug, variantHandle}
}
`

export default async function ProductPage({
  params,
}: {
  params: { variant: string; slug: string }
}) {
  const { variant, slug } = params
  const data = await sanityPreview.fetch<TemplateData>(query, { slug })
  if (!data) notFound()

  const images = (data.pages || [])
    .map(p => p.image ? urlFor(p.image).width(600).height(800).url() : null)
    .filter(Boolean) as string[]
  if (data.coverImage) {
    const coverUrl = urlFor(data.coverImage).width(600).height(800).url()
    if (!images.length) images.push(coverUrl)
    else images.unshift(coverUrl)
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 grid grid-cols-2 gap-4">
          {images.map((src, i) => (
            <Image key={i} src={src} alt={`page ${i+1}`} width={300} height={400} className="w-full h-auto rounded shadow" />
          ))}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4">{data.title}</h1>
          <div className="space-y-2 mb-6">
            {(data.products || []).map(v => (
              <label key={v.slug} className="block">
                <input type="radio" name="variant" value={v.slug} defaultChecked={v.slug===variant} className="mr-2" />
                {v.title}
              </label>
            ))}
          </div>
          <Link href={`/cards/${slug}/customise`} className="inline-block bg-pink-600 text-white px-6 py-3 rounded text-center">
            Personalise →
          </Link>
        </div>
      </div>

      <Tab.Group as="div" className="mt-10">
        <Tab.List className="flex gap-4 border-b">
          <Tab className={({selected})=>selected? 'pb-2 border-b-2 border-pink-600':'pb-2 border-b-2 border-transparent'}>Description</Tab>
          <Tab className={({selected})=>selected? 'pb-2 border-b-2 border-pink-600':'pb-2 border-b-2 border-transparent'}>Delivery</Tab>
        </Tab.List>
        <Tab.Panels className="mt-4">
          <Tab.Panel>
            {data.description || 'No description available.'}
          </Tab.Panel>
          <Tab.Panel>
            Delivery information will appear here.
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </main>
  )
}
