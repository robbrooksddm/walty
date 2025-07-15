import MockupClient from './MockupClient'
import { sanityPreview } from '@/sanity/lib/client'

export default async function MockupTestPage({ params }: { params: { variantId: string }}) {
  const { variantId } = params
  const data = await sanityPreview.fetch(
    `*[_type=="visualVariant" && (variant._ref==$id || variant->slug.current==$id || _id==$id)][0]{
      title,
      mockupSettings{ printAreas }
    }`,
    { id: variantId }
  )

  const areaId = data?.mockupSettings?.printAreas?.[0]?.id || 'wrap'

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">{data?.title || variantId}</h1>
      <MockupClient variantId={variantId} areaId={areaId} />
    </main>
  )
}
