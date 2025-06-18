import CheckoutClient from './CheckoutClient'
import { sanityFetch } from '@/lib/sanityClient'
import { urlFor } from '@/sanity/lib/image'

export default async function CheckoutPage() {
  // Fetch a couple of live card templates to populate the basket
  const products = await sanityFetch<{
    _id: string
    title: string
    slug: { current: string }
    coverImage?: any
  }[]>(
    `*[_type=="cardTemplate" && isLive==true]{_id,title,slug,coverImage}[0...2]`
  )

  const items = products.map((p) => ({
    id: p._id,
    coverUrl: p.coverImage ? urlFor(p.coverImage).width(160).height(224).url() : '',
    title: p.title,
    sku: p.slug.current,
    variant: 'classic',
    qty: 1,
    price: 3.5,
  }))

  const addresses = [
    {
      id: 'a1',
      name: 'Alice Example',
      line1: '1 Apple Way',
      city: 'London',
      postcode: 'N1 1AA',
      country: 'UK',
    },
    {
      id: 'a2',
      name: 'Bob Example',
      line1: '2 Orange Road',
      city: 'Bristol',
      postcode: 'BS1 2BB',
      country: 'UK',
    },
  ];

  return <CheckoutClient initialItems={items} initialAddresses={addresses} />;
}
