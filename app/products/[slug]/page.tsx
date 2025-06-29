import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTemplatePages } from '@/app/library/getTemplatePages'
import { sanityFetch } from '@/lib/sanityClient'
import { urlFor } from '@/sanity/lib/image'
import ProductTabs from '@/components/products/ProductTabs'

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const { pages, products } = await getTemplatePages(slug)
  const tpl = await sanityFetch<{title:string;description?:string}>(
    `*[_type=="cardTemplate" && slug.current==$slug][0]{title,description}`,
    { slug }
  )
  if (!tpl) return notFound()

  function firstImageSrc(page:any): string | undefined {
    const layer = page.layers.find((l:any) => l.srcUrl || l.src)
    if (!layer) return undefined
    if (layer.srcUrl) return layer.srcUrl
    if (layer.src) return urlFor(layer.src).width(600).height(800).url()
    return undefined
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{tpl.title}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {pages.map((p, i) => {
          const src = firstImageSrc(p)
          return src ? (
            <Image key={i} src={src} alt="" width={300} height={400} className="rounded shadow" />
          ) : null
        })}
      </div>

      {products && (
        <form className="mb-6 space-y-2">
          <p className="font-semibold">Choose a product</p>
          {products.map((p, idx) => (
            <label key={p._id} className="block">
              <input type="radio" name="variant" defaultChecked={idx===0} className="mr-2" />
              {p.title}
            </label>
          ))}
        </form>
      )}

      <Link
        href={`/cards/${slug}/customise`}
        className="block text-center bg-pink-600 text-white py-3 rounded-md font-semibold mb-6"
      >
        Personalise →
      </Link>

      <ProductTabs description={tpl.description} />
    </main>
  )
}
