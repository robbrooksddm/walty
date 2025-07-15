import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { designPNGs } = await req.json()
    if (!designPNGs || typeof designPNGs !== 'object') {
      return NextResponse.json({ error: 'bad input' }, { status: 400 })
    }
    const urls: Record<string, string> = {}
    for (const key of Object.keys(designPNGs)) {
      const src = designPNGs[key]
      if (typeof src === 'string') {
        urls[key] = src
      }
    }
    return NextResponse.json({ urls })
  } catch (err) {
    console.error('[render]', err)
    return NextResponse.json({ error: 'server-error' }, { status: 500 })
  }
}
