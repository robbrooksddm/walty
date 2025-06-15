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
  const { spreadLayout, dpi } = spec
  const spreadPxW = Math.round(spreadLayout.spreadWidth * dpi)
  const spreadPxH = Math.round(spreadLayout.spreadHeight * dpi)

  console.log(`▶ buildSpread ${spreadPxW}×${spreadPxH}`)

  const pageW = Math.floor(spreadPxW / 2)
  const pageH = Math.floor(spreadPxH / 2)

  let out = sharp({
    create: {
      width: spreadPxW,
      height: spreadPxH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).toColourspace('srgb')

  const panels = [...spreadLayout.panels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const posMap: Record<string, { left: number; top: number }> = {
    'Outer rear':   { left: 0,     top: 0 },
    'Outer front':  { left: pageW, top: 0 },
    'Inside back':  { left: 0,     top: pageH },
    'Inside front': { left: pageW, top: pageH },
  }

  const comps: sharp.OverlayOptions[] = []
  for (let i = 0; i < panels.length && i < pages.length; i++) {
    const panel = panels[i]
    const buf = pages[i]
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
