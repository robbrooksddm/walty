import { Square, RectangleHorizontal, Expand, Image } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface CardSize {
  id: string
  label: string
  price: number
  Icon: LucideIcon
}

export const CARD_SIZES: CardSize[] = [
  { id: 'digital', label: 'Digital Card', price: 0, Icon: Image },
  { id: 'gc-mini', label: 'Mini Card', price: 2.5, Icon: Square },
  { id: 'gc-classic', label: 'Classic Card', price: 3.5, Icon: RectangleHorizontal },
  { id: 'gc-large', label: 'Giant Card', price: 5, Icon: Expand },
]
