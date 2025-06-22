'use client'
import CheckoutClient from './CheckoutClient'
import { useBasket } from '@/lib/useBasket'
import { CARD_SIZES } from './sizeOptions'

export default function CheckoutPage() {
  const { items } = useBasket()

  const cartItems = items.map((it) => ({
    id: it.id,
    coverUrl: it.image,
    proofs: it.proofs,
    title: it.title,
    sku: it.slug,
    variant: it.variant,
    qty: it.qty,
    price: typeof it.price === 'number'
      ? it.price
      : CARD_SIZES.find((s) => s.id === it.variant)?.price ?? 0,
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

  return <CheckoutClient initialItems={cartItems} initialAddresses={addresses} />;
}
