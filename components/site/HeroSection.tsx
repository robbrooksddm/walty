import Image from 'next/image'
import {urlFor} from '@/sanity/lib/image'

export type HeroData = {
  heading?: string
  subheading?: string
  image?: any
}

export default function HeroSection({data}: {data: HeroData}) {
  return (
    <section className="py-12 text-center">
      {data.image && (
        <Image
          src={urlFor(data.image).width(1200).url()}
          alt={data.heading ?? ''}
          width={1200}
          height={600}
          className="mx-auto mb-4"
        />
      )}
      {data.heading && <h1 className="text-3xl font-bold">{data.heading}</h1>}
      {data.subheading && (
        <p className="mt-2 text-lg text-gray-600">{data.subheading}</p>
      )}
    </section>
  )
}
