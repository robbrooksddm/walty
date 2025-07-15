export interface BBox { x: number; y: number; width: number; height: number }
export interface Mockup { image: string; box: BBox }

const SIZE_SPECS: Record<'mini' | 'classic' | 'giant', BBox> = {
  mini:    { x: 833, y: 639, width: 340, height: 500 },
  classic: { x: 797, y: 556, width: 421, height: 589 },
  giant:   { x: 658, y: 168, width: 700, height: 972 },
}

const MASKS = {
  mini: '/mockups/cards/mini_mask.png',
  classic: '/mockups/cards/classic_mask.png',
  giant: '/mockups/cards/giant_mask.png',
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = err => reject(err)
    img.src = src
  })
}

export async function generateCardMockups(frontUrl: string) {
  const frontImg = await loadImage(frontUrl)
  const result: Record<'mini' | 'classic' | 'giant', Mockup> = {
    mini: { image: '', box: SIZE_SPECS.mini },
    classic: { image: '', box: SIZE_SPECS.classic },
    giant: { image: '', box: SIZE_SPECS.giant },
  }

  for (const key of ['mini', 'classic', 'giant'] as const) {
    const spec = SIZE_SPECS[key]
    const mask = await loadImage(MASKS[key])
    const canvas = document.createElement('canvas')
    canvas.width = spec.width
    canvas.height = spec.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(frontImg, 0, 0, spec.width, spec.height)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(
      mask,
      spec.x,
      spec.y,
      spec.width,
      spec.height,
      0,
      0,
      spec.width,
      spec.height,
    )
    result[key].image = canvas.toDataURL('image/png')
  }

  return result
}

export const CARD_MOCKUP_SPECS = SIZE_SPECS

