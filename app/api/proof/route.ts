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

    const clamp = (n:number, min:number, max:number) => Math.max(min, Math.min(max, n))
    const composites: sharp.OverlayOptions[] = []
    const page = pages[0] || {}
    const layers = Array.isArray(page.layers) ? page.layers : []

    for (const ly of layers) {
      let x = ly.leftPct != null ? (ly.leftPct / 100) * width  : ly.x
      let y = ly.topPct  != null ? (ly.topPct  / 100) * height : ly.y
      let w = ly.widthPct  != null ? (ly.widthPct  / 100) * width  : ly.width
      let h = ly.heightPct != null ? (ly.heightPct / 100) * height : ly.height

      x = clamp(Math.round(x || 0), 0, width)
      y = clamp(Math.round(y || 0), 0, height)
      w = clamp(Math.round(w || 1), 1, width - x)
      h = clamp(Math.round(h || 1), 1, height - y)

      if (ly.type === 'image' && (ly.src || ly.srcUrl)) {
        try {
          const url = ly.srcUrl || ly.src
          if (typeof url !== 'string' || !/^https?:/i.test(url)) continue
          const res = await fetch(url)
          const buf = Buffer.from(await res.arrayBuffer())
          const img = await sharp(buf)
            .resize(w, h, { fit: 'inside' })
            .toBuffer()
          composites.push({ input: img, left: x, top: y })
        } catch (err) {
          console.error('img', err)
        }
      } else if (ly.type === 'text') {
        const fs = ly.fontSize || 20
        const lines = String(ly.text || '').split('\n')
        const lineH = fs * 1.2
        const svgW = w || Math.round(fs * Math.max(...lines.map(l => l.length)) * 0.6)
        const svgH = h || Math.round(lineH * lines.length)
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${svgW}' height='${svgH}'>`+
          `<text x='0' y='${fs}' font-family='${ly.fontFamily || 'Helvetica'}' font-size='${fs}' font-weight='${ly.fontWeight || ''}' font-style='${ly.fontStyle || ''}' fill='${ly.fill || '#000'}' ${ly.underline ? "text-decoration='underline'" : ''} xml:space='preserve'>${esc(ly.text || '')}</text>`+
          `</svg>`
        composites.push({ input: Buffer.from(svg), left: x, top: y })
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
