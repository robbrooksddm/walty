import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'

const DPI = 300
const mm = (n:number) => (n / 25.4) * DPI

const SPECS = {
  'card-7x5': { trimW: 150, trimH: 214, bleed: 3 },
} as const

function esc(s: string) {
  return s.replace(/[&<>]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]!))
}

export async function POST(req: NextRequest) {
  try {
    const { pages, sku } = await req.json() as { pages:any[]; sku:keyof typeof SPECS }
    if (!Array.isArray(pages) || !SPECS[sku]) {
      return NextResponse.json({ error: 'bad input' }, { status: 400 })
    }
    const spec = SPECS[sku]
    const width  = Math.round(mm(spec.trimW + spec.bleed * 2))
    const height = Math.round(mm(spec.trimH + spec.bleed * 2))

    const composites: sharp.OverlayOptions[] = []
    const page = pages[0] || {}
    const layers = Array.isArray(page.layers) ? page.layers : []

    for (const ly of layers) {
      const x = ly.leftPct != null ? (ly.leftPct / 100) * width  : ly.x
      const y = ly.topPct  != null ? (ly.topPct  / 100) * height : ly.y
      const w = ly.widthPct  != null ? (ly.widthPct  / 100) * width  : ly.width
      const h = ly.heightPct != null ? (ly.heightPct / 100) * height : ly.height

      if (ly.type === 'image' && (ly.src || ly.srcUrl)) {
        try {
          const res = await fetch(ly.srcUrl || ly.src)
          const buf = Buffer.from(await res.arrayBuffer())
          const img = await sharp(buf).resize(Math.round(w || 0), Math.round(h || 0)).toBuffer()
          composites.push({ input: img, left: Math.round(x || 0), top: Math.round(y || 0) })
        } catch (err) {
          console.error('img', err)
        }
      } else if (ly.type === 'text') {
        const fs = ly.fontSize || 20
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${Math.round(w || 0)}' height='${Math.round(fs*1.2)}'>`+
          `<text x='0' y='${fs}' font-family='${ly.fontFamily || 'Helvetica'}' font-size='${fs}' font-weight='${ly.fontWeight || ''}' font-style='${ly.fontStyle || ''}' fill='${ly.fill || '#000'}' ${ly.underline ? "text-decoration='underline'" : ''}>${esc(ly.text || '')}</text>`+
          `</svg>`
        composites.push({ input: Buffer.from(svg), left: Math.round(x || 0), top: Math.round(y || 0) })
      }
    }

    let img = sharp({ create: { width, height, channels: 4, background: '#ffffff' } }).composite(composites)

    const masterRatio = width / height
    const targetRatio = (spec.trimW + spec.bleed * 2) / (spec.trimH + spec.bleed * 2)
    if (targetRatio < masterRatio) {
      const cropW = Math.round(height * targetRatio)
      const offsetX = Math.floor((width - cropW) / 2)
      img = img.extract({ left: offsetX, top: 0, width: cropW, height })
               .extend({ left: 0, right: 0, top: 0, bottom: 0, background: '#ffffff' })
    }

    const out = await img.png().toBuffer()
    return new NextResponse(out, { headers: { 'content-type': 'image/png' } })
  } catch (err) {
    console.error('[proof]', err)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
