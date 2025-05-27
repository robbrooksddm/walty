import {notFound} from 'next/navigation'
import {registry} from '@/components/site/registry'
import {sanityFetch} from '@/lib/sanityClient'

export default async function SitePage({params}:{params:{slug?:string[]}}) {
  const slug = params.slug?.join('/') || 'home'
  const query = `*[_type=="page" && slug.current==$slug][0]{title, sections}`
  const page = await sanityFetch<{title:string;sections:any[]}>(query, {slug})

  if (!page) return notFound()

  return (
    <>
      {page.sections?.map((section, idx) => {
        const Section = registry[section._type as keyof typeof registry]
        return Section ? (
          <Section key={section._key || idx} data={section} />
        ) : null
      })}
    </>
  )
}
