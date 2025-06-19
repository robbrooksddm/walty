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

    console.log('asset urls →', assets)

    const payload = await getProdigiPayload(variantHandle, fulfilHandle, assets, copies)

    let recipient: any = null
    if (address) {
      const { id, name, line1, city, postcode, country } = address
      recipient = {
        name,
        ...(id ? { id } : {}),
        address: {
          line1,
          townOrCity: city,
          postalOrZipCode: postcode,
          countryCode: country === 'UK' ? 'GB' : country,
        },
      }
    }

    const order = {
      shippingMethod: payload.shippingMethod,
      recipient,
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

    console.log('Posting order to Prodigi \u2192', order)

    const resp = await fetch(`${PRODIGI_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PRODIGI_API_KEY,
      },
      body: JSON.stringify(order),
    })

    const text = await resp.text()
    console.log('Prodigi raw response \u2192', resp.status, text)

    if (resp.ok && resp.headers.get('content-type')?.includes('application/json')) {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: resp.status })
    }

    return new NextResponse(text, { status: resp.status })
  } catch (err) {
    console.error('[order]', err)
    return NextResponse.json({ error: 'server-error' }, { status: 500 })
  }
}
