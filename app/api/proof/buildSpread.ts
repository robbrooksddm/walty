import sharp from 'sharp'

export interface Panel {
  name: string
  order: number
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

    console.log(`  extract ${panel.name}: ${width}×${height}`)

    crops[i] = outBuf
    if (!pageWpx) pageWpx = width
    if (!pageHpx) pageHpx = height
  }

  const canvasW = pageWpx * 2
  const canvasH = pageHpx * 2

  console.log(`▶ buildSpread ${canvasW}×${canvasH}`)

  let out = sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).toColourspace('srgb')

  const posMap: Record<string, { left: number; top: number }> = {
    'Outer rear':   { left: 0,       top: 0 },
    'Outer front':  { left: pageWpx, top: 0 },
    'Inside back':  { left: 0,       top: pageHpx },
    'Inside front': { left: pageWpx, top: pageHpx },
  }

  const comps: sharp.OverlayOptions[] = []
  for (let i = 0; i < panels.length && i < crops.length; i++) {
    const panel = panels[i]
    const buf = crops[i]
    const pos = posMap[panel.name]
    if (!buf || !pos) continue
    comps.push({ input: buf, left: pos.left, top: pos.top })
    console.log(`  paste ${panel.name} → [${pos.left}, ${pos.top}]`)
  }

  out = out.composite(comps)

  const blob = await out.jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer()
  const filename = `${templateSlug}-${sku}.jpg`

  return { blob, filename, mime: 'image/jpeg' }
}
