import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { sanityPreview } from '@/sanity/lib/client'
import { buildSpread } from './buildSpread'

export const runtime = 'nodejs'

interface Overlay extends sharp.OverlayOptions {
  /** Global opacity for the overlay; sharp's types omit this */
  opacity?: number
}

export const dynamic = 'force-dynamic'

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
            spreadLayout?: {
              spreadWidth: number
              spreadHeight: number
              panels: {
                name: string
                page: string
                order: number
                bleed?: {
                  top?: boolean
                  right?: boolean
                  bottom?: boolean
                  left?: boolean
                }
              }[]
            }
          } | null
        }>(
          `*[_type=="cardProduct" && slug.current==$sku][0]{"spec":coalesce(printSpec->, printSpec)}`,
          { sku },
        )
      : null
    const finalSpec = specRes?.spec ?? null
    if (
      !finalSpec ||
      !finalSpec.spreadLayout ||
      typeof finalSpec.spreadLayout.spreadWidth !== 'number' ||
      typeof finalSpec.spreadLayout.spreadHeight !== 'number'
    ) {
      return NextResponse.json(
        { error: `Print spec not found/invalid for SKU ${sku}` },
        { status: 500 },
      )
    }

    const px = (n: number) => Math.round(n * finalSpec.dpi)
    const pageW = px(finalSpec.trimWidthIn + finalSpec.bleedIn * 2)
    const pageH = px(finalSpec.trimHeightIn + finalSpec.bleedIn * 2)

    const layout = finalSpec.spreadLayout
    const panels = Array.isArray(layout.panels)
      ? [...layout.panels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : []

    const sheetW = px(layout.spreadWidth)
    const sheetH = px(layout.spreadHeight)

    const edge = {
      top:    panels.slice(0, 2).some(p => p?.bleed?.top !== false),
      bottom: panels.slice(2).some(p => p?.bleed?.bottom !== false),
      left:   [panels[0], panels[2]].some(p => p?.bleed?.left !== false),
      right:  [panels[1], panels[3]].some(p => p?.bleed?.right !== false),
    }

    const pageMap: Record<string, sharp.Sharp> = {}
    const bufferMap: Record<string, Buffer> = {}
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
        bufferMap[name] = await img.jpeg({ quality: 100, chromaSubsampling: '4:4:4' }).toBuffer()
      }
    }

    if (Array.isArray(layout.panels) && layout.panels.length === 4) {
      const { blob, filename: fName } = await buildSpread(
        bufferMap,
        {
          dpi: finalSpec.dpi,
          spreadLayout: layout,
          trimWidthIn: finalSpec.trimWidthIn,
          trimHeightIn: finalSpec.trimHeightIn,
          bleedIn: finalSpec.bleedIn,
        },
        esc(id),
        sku ?? 'proof',
      )
      return new NextResponse(blob, {
        headers: {
          'content-type': 'image/jpeg',
          'content-disposition': `attachment; filename="${fName}"`,
        },
      })
    }

    const comps: Overlay[] = []
    const positions = [
      { left: 0,      top: 0 },
      { left: pageW,  top: 0 },
      { left: 0,      top: pageH },
      { left: pageW,  top: pageH },
    ]

    panels.forEach((p, idx) => {
      const img = pageMap[p.page || p.name]
      if (!img) return
      const buf = bufferMap[p.page || p.name];
      if (buf) {
        comps.push({ input: buf, left: positions[idx].left, top: positions[idx].top } as Overlay);
      }
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

    const name =
      typeof filename === 'string' && filename
        ? filename
        : `${id}-${sku ?? 'proof'}.jpg`
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
