import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { sanityPreview } from '@/sanity/lib/client'

interface Overlay extends sharp.OverlayOptions {
  /** Global opacity for the overlay; sharp's types omit this */
  opacity?: number
}

export const dynamic = 'force-dynamic'

const SPECS = {
  'greeting-card-giant'  : { trimWidthIn: 9, trimHeightIn: 11.6667, bleedIn: 0.125, dpi: 300 },
  'greeting-card-classic': { trimWidthIn: 5, trimHeightIn: 7, bleedIn: 0.125, dpi: 300 },
  'greeting-card-mini'   : { trimWidthIn: 4, trimHeightIn: 6, bleedIn: 0.125, dpi: 300 },
} as const

function esc(s: string) {
  return s.replace(/[&<>]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]!))
}

export async function POST(req: NextRequest) {
  try {
    const { pages, pageImages, id, sku, filename } = (await req.json()) as {
      pages: any[]
      pageImages?: string[]
      id: string
      sku?: string
      filename?: string
    }
    if ((!Array.isArray(pages) && !Array.isArray(pageImages)) || typeof id !== 'string') {
      return NextResponse.json({ error: 'bad input' }, { status: 400 })
    }

    const specRes = sku
      ? await sanityPreview.fetch<{
          spec: {
            trimWidthIn: number
            trimHeightIn: number
            bleedIn: number
            dpi: number
            edgeBleed?: {
              top?: boolean
              right?: boolean
              bottom?: boolean
              left?: boolean
            }
            spreadLayout?: {
              spreadWidth: number
              spreadHeight: number
              foldX: number
              panelOrder: string[]
            }
          } | null
        }>(
          `*[_type=="cardProduct" && slug.current==$sku][0]{"spec":coalesce(printSpec->, printSpec)}`,
          { sku },
        )
      : null
    const spec = specRes?.spec ?? null
    const fallback = sku ? SPECS[sku as keyof typeof SPECS] : undefined
    const finalSpec = spec ?? fallback
    if (!finalSpec) {
      return NextResponse.json({ error: 'spec not found' }, { status: 404 })
    }

    const px = (n: number) => Math.round(n * finalSpec.dpi)
    const pageW = px(finalSpec.trimWidthIn + finalSpec.bleedIn * 2)
    const pageH = px(finalSpec.trimHeightIn + finalSpec.bleedIn * 2)

    const layout = finalSpec.spreadLayout ?? {
      spreadWidth : (finalSpec.trimWidthIn + finalSpec.bleedIn * 2) * 2,
      spreadHeight: (finalSpec.trimHeightIn + finalSpec.bleedIn * 2) * 2,
      foldX: finalSpec.trimWidthIn + finalSpec.bleedIn,
      panelOrder: ['front', 'inner-L', 'inner-R', 'back'],
    }

    const sheetW = px(layout.spreadWidth)
    const sheetH = px(layout.spreadHeight)
    const foldPx = px(layout.foldX)

    const edge = finalSpec.edgeBleed ?? { top: true, right: true, bottom: true, left: true }

    const pageMap: Record<string, sharp.Sharp> = {}
    if (Array.isArray(pageImages)) {
      for (let i = 0; i < Math.min(4, pageImages.length); i++) {
        const data = pageImages[i]
        if (!data) continue
        const m = data.match(/^data:image\/\w+;base64,/)
        const buf = Buffer.from(data.replace(m ? m[0] : '', ''), 'base64')
        let img = sharp(buf).ensureAlpha()
        const meta = await img.metadata()
        if (meta.width !== pageW || meta.height !== pageH) {
          img = img.resize(pageW, pageH)
        }
        const name = pages[i]?.name || `page-${i}`
        pageMap[name] = img
      }
    }

    const comps: Overlay[] = []
    const positions = [
      { left: 0, top: 0 },
      { left: foldPx, top: 0 },
      { left: 0, top: pageH },
      { left: foldPx, top: pageH },
    ]

    layout.panelOrder.forEach((name, idx) => {
      const img = pageMap[name]
      if (!img) return
      comps.push({ input: img, left: positions[idx].left, top: positions[idx].top } as Overlay)
    })

    let outImg = sharp({ create: { width: sheetW, height: sheetH, channels: 4, background: '#ffffff' } }).composite(comps)

    const cropL = edge.left ? 0 : px(finalSpec.bleedIn)
    const cropR = edge.right ? 0 : px(finalSpec.bleedIn)
    const cropT = edge.top ? 0 : px(finalSpec.bleedIn)
    const cropB = edge.bottom ? 0 : px(finalSpec.bleedIn)

    if (cropL || cropR || cropT || cropB) {
      outImg = outImg.extract({ left: cropL, top: cropT, width: sheetW - cropL - cropR, height: sheetH - cropT - cropB })
    }

    const out = await outImg.jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer()

    const name = filename && typeof filename === 'string' ? filename : 'proof.jpg'
    return new NextResponse(out, {
      headers: {
        'content-type': 'image/jpeg',
        'content-disposition': `attachment; filename="${name}"`,
      },
    })
  } catch (err) {
    console.error('[proof]', err)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
