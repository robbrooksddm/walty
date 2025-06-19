import { NextRequest, NextResponse } from 'next/server'
import { getProdigiPayload } from '@/commerce/getProdigiPayload'

const PRODIGI_BASE = process.env.PRODIGI_BASE_URL ||
  'https://api.sandbox.prodigi.com/v4.0'
const PRODIGI_API_KEY = process.env.PRODIGI_API_KEY || ''

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
    if (!PRODIGI_API_KEY) {
      console.warn('PRODIGI_API_KEY not configured; returning order JSON')
      return NextResponse.json(order)
    }

    const resp = await fetch(`${PRODIGI_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PRODIGI_API_KEY,
      },
      body: JSON.stringify(order),
    })

    const body = await resp.json()
    if (!resp.ok) {
      console.error('Prodigi error \u2192', {
        status: resp.status,
        code: body.errors?.[0]?.code,
        msg: body.errors?.[0]?.message,
        field: body.errors?.[0]?.field,
      })
      throw new Error('Prodigi order failed')
    }

    return NextResponse.json(body, { status: resp.status })
  } catch (err) {
    console.error('[order]', err)
    return NextResponse.json({ error: 'server-error' }, { status: 500 })
  }
}
