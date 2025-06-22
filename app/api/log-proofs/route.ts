import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    console.log('[basket proofs]', JSON.stringify(data, null, 2))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[log-proofs]', err)
    return NextResponse.json({ error: 'bad input' }, { status: 400 })
  }
}
