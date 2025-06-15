import { createCanvas, loadImage } from 'canvas'

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

  const canvas = createCanvas(spreadPxW, spreadPxH)
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, spreadPxW, spreadPxH)

  const panels = [...spreadLayout.panels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const pageW = Math.floor(spreadPxW / 2)
  const pageH = Math.floor(spreadPxH / 2)

  const posMap: Record<string, { x: number; y: number }> = {
    'Outer rear' : { x: 0,      y: 0 },
    'Outer front': { x: pageW,  y: 0 },
    'Inside back': { x: 0,      y: pageH },
    'Inside front':{ x: pageW,  y: pageH },
  }

  for (let i = 0; i < panels.length && i < pages.length; i++) {
    const panel = panels[i]
    const buf = pages[i]
    const pos = posMap[panel.name]
    if (!buf || !pos) continue
    const img = await loadImage(buf)
    ctx.drawImage(img, pos.x, pos.y, pageW, pageH)
    console.log(`  paste ${panel.name} → [${pos.x}, ${pos.y}]`)
  }

  const blob = canvas.toBuffer('image/jpeg', { quality: 0.95 })
  const filename = `${templateSlug}-${sku}.jpg`

  return { blob, filename, mime: 'image/jpeg' }
}
