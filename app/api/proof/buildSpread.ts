import sharp from 'sharp'

export interface Panel {
  name: string
  order: number
  bleed?: {
    top?: boolean
    right?: boolean
    bottom?: boolean
    left?: boolean
  }
}

export interface SpreadLayout {
  spreadWidth: number
  spreadHeight: number
  panels: Panel[]
}

export interface BuildSpreadSpec {
  dpi: number
  spreadLayout: SpreadLayout
  trimWidthIn: number
  trimHeightIn: number
  bleedIn: number
}

export interface SpreadResult {
  blob: Buffer
  filename: string
  mime: string
}

/**
 * Assemble the four page buffers into a full spread.
 */
export async function buildSpread(
  pages: Buffer[],
  spec: BuildSpreadSpec,
  templateSlug: string,
  sku: string,
): Promise<SpreadResult> {
  const { spreadLayout, dpi, trimWidthIn, trimHeightIn, bleedIn } = spec

  const px = (n: number) => Math.round(n * dpi)
  const bleedPx = px(bleedIn)

  const baseW = px(trimWidthIn + bleedIn * 2)
  const baseH = px(trimHeightIn + bleedIn * 2)
  const sheetW = px(spreadLayout.spreadWidth + bleedIn * 2)
  const sheetH = px(spreadLayout.spreadHeight + bleedIn * 2)

  const panels = [...spreadLayout.panels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const crops: Buffer[] = []
  let pageWpx = 0
  let pageHpx = 0

  for (let i = 0; i < panels.length && i < pages.length; i++) {
    const panel = panels[i]
    const buf = pages[i]
    if (!buf) continue
    const bleed = panel.bleed ?? {}
    const cropL = bleed.left === false ? bleedPx : 0
    const cropR = bleed.right === false ? bleedPx : 0
    const cropT = bleed.top === false ? bleedPx : 0
    const cropB = bleed.bottom === false ? bleedPx : 0
    const width = baseW - cropL - cropR
    const height = baseH - cropT - cropB

    const outBuf = await sharp(buf)
      .extract({ left: cropL, top: cropT, width, height })
      .toBuffer()
    const meta = await sharp(outBuf).metadata()

    console.log(`  extract ${panel.name}: ${width}×${height}`)

    if (!pageWpx) {
      pageWpx = width
      pageHpx = height
    } else if (
      (meta.width && meta.width > pageWpx) ||
      (meta.height && meta.height > pageHpx)
    ) {
      throw new Error(
        `page ${panel.name} is larger than ${pageWpx}×${pageHpx} px (got ${meta.width}×${meta.height})`,
      )
    }

    crops[i] = outBuf
  }

  console.log(`▶ buildSpread ${sheetW}×${sheetH}`)

  let out = sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).toColourspace('srgb')

  const comps: sharp.OverlayOptions[] = []
  for (let i = 0; i < panels.length && i < crops.length; i++) {
    const buf = crops[i]
    if (!buf) continue
    const x = i * pageWpx
    comps.push({ input: buf, left: x, top: 0 })
    console.log(`  paste ${panels[i].name} → [${x}, 0]`)
  }

  out = out.composite(comps)

  const blob = await out.jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer()
  const filename = `${templateSlug}-${sku}.jpg`

  return { blob, filename, mime: 'image/jpeg' }
}
