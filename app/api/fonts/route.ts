import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 86400 // cache for 1 day
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const key = process.env.GOOGLE_FONTS_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'Missing GOOGLE_FONTS_API_KEY' }, { status: 500 })
  }
  const popular = req.nextUrl.searchParams.has('popular')
  const startParam = req.nextUrl.searchParams.get('start')
  const limitParam = req.nextUrl.searchParams.get('limit')
  const start = startParam ? parseInt(startParam, 10) : 0
  const limit = limitParam ? parseInt(limitParam, 10) : popular ? 100 : undefined

  const baseUrl = `https://www.googleapis.com/webfonts/v1/webfonts?key=${key}&fields=items(family,category)`
  const url = popular ? `${baseUrl}&sort=popularity` : baseUrl
  const res = await fetch(url)
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch Google Fonts' }, { status: 500 })
  }
  const data = await res.json()
  let fonts = Array.isArray(data.items)
    ? data.items.map((f: any) => ({ name: f.family, category: f.category }))
    : []
  if (typeof limit === 'number') {
    fonts = fonts.slice(start, start + limit)
  } else if (start) {
    fonts = fonts.slice(start)
  }
  return NextResponse.json(fonts)
}
