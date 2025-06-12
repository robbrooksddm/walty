import { NextRequest, NextResponse } from 'next/server'
import { fabric } from 'fabric'
import sharp from 'sharp'

const DPI = 300
const mm = (n:number) => (n / 25.4) * DPI

const SPECS = {
  'card-7x5': { trimW: 150, trimH: 214, bleed: 3 },
} as const

export async function POST(req: NextRequest) {
  try {
    const { pages, sku } = await req.json() as { pages:any[]; sku:keyof typeof SPECS }
    if (!Array.isArray(pages) || !SPECS[sku]) {
      return NextResponse.json({ error: 'bad input' }, { status: 400 })
    }
    const spec = SPECS[sku]
    const width  = Math.round(mm(spec.trimW + spec.bleed * 2))
    const height = Math.round(mm(spec.trimH + spec.bleed * 2))
    const canvas = new fabric.StaticCanvas(null, { width, height })

    const page = pages[0] || {}
    const layers = Array.isArray(page.layers) ? page.layers : []
    for (const ly of layers) {
      const x = ly.leftPct != null ? (ly.leftPct / 100) * width  : ly.x
      const y = ly.topPct  != null ? (ly.topPct  / 100) * height : ly.y
      const w = ly.widthPct  != null ? (ly.widthPct  / 100) * width  : ly.width
      const h = ly.heightPct != null ? (ly.heightPct / 100) * height : ly.height
      if (ly.type === 'image' && (ly.src || ly.srcUrl)) {
        await new Promise<void>(resolve => {
          fabric.Image.fromURL(ly.srcUrl || ly.src, img => {
            if (!img) return resolve()
            img.set({ left: x, top: y, originX: 'left', originY: 'top' })
            if (w && h) {
              img.scaleToWidth(w)
              img.scaleToHeight(h)
            }
            canvas.add(img)
            resolve()
          }, { crossOrigin: 'anonymous' })
        })
      } else if (ly.type === 'text') {
        const txt = new fabric.Textbox(ly.text || '', {
          left: x,
          top: y,
          originX: 'left',
          originY: 'top',
          width: w,
          fontSize: ly.fontSize,
          fontFamily: ly.fontFamily,
          fontWeight: ly.fontWeight,
          fontStyle: ly.fontStyle,
          underline: ly.underline,
          fill: ly.fill,
          textAlign: ly.textAlign,
          lineHeight: ly.lineHeight,
          scaleX: ly.scaleX ?? 1,
          scaleY: ly.scaleY ?? 1,
          opacity: ly.opacity ?? 1,
        })
        canvas.add(txt)
      }
    }

    canvas.renderAll()
    const png = Buffer.from(canvas.toDataURL({ format: 'png' }).split(',')[1], 'base64')
    let img = sharp(png)
    const masterRatio = (width) / (height)
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
