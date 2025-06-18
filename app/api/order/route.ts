import { NextRequest, NextResponse } from 'next/server'
import { getProdigiPayload } from '@/commerce/getProdigiPayload'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { variantHandle, fulfilHandle, assets, address, copies = 1 } = await req.json()
    if (typeof variantHandle !== 'string' || typeof fulfilHandle !== 'string' || !Array.isArray(assets)) {
      return NextResponse.json({ error: 'bad input' }, { status: 400 })
    }

    const payload = await getProdigiPayload(variantHandle, fulfilHandle, assets, copies)

    const order = {
      shippingMethod: payload.shippingMethod,
      recipient: address || null,
      items: [ {
        sku: payload.sku,
        copies: payload.copies,
        sizing: payload.sizing,
        assets: payload.assets,
      } ]
    }

    return NextResponse.json(order)
  } catch (err) {
    console.error('[order]', err)
    return NextResponse.json({ error: 'server-error' }, { status: 500 })
  }
}
