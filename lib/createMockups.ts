export interface MockupBounds { left:number; top:number; width:number; height:number }

const BACKGROUND = '/mockups/cards/Card_mockups_room_background.jpg'
const SIZES = {
  'gc-mini': {
    overlay: '/mockups/cards/scene_mini_overlay.png',
    mask: '/mockups/cards/mini_mask.png',
    bounds: { left: 0.4165, top: 0.48012, width: 0.17, height: 0.37509 },
  },
  'gc-classic': {
    overlay: '/mockups/cards/scene_classic_overlay.png',
    mask: '/mockups/cards/classic_mask.png',
    bounds: { left: 0.3985, top: 0.4171, width: 0.2105, height: 0.44261 },
  },
  'gc-large': {
    overlay: '/mockups/cards/scene_giant_overlay.png',
    mask: '/mockups/cards/giant_mask.png',
    bounds: { left: 0.3295, top: 0.12678, width: 0.35, height: 0.72918 },
  },
} as const

const W = 2000
const H = 1333

type SizeKey = keyof typeof SIZES

export async function createCardMockups(frontUrl: string): Promise<Record<SizeKey,string>> {
  const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  })

  const design = await load(frontUrl)
  const result: Record<SizeKey,string> = {} as any

  for (const key of Object.keys(SIZES) as SizeKey[]) {
    const info = SIZES[key]
    const [overlay, mask] = await Promise.all([load(info.overlay), load(info.mask)])
    const full = document.createElement('canvas')
    full.width = W
    full.height = H
    const ctx = full.getContext('2d')!
    ctx.drawImage(mask, 0, 0)
    ctx.globalCompositeOperation = 'source-in'
    const b = info.bounds
    ctx.drawImage(design, 0, 0, design.width, design.height, b.left*W, b.top*H, b.width*W, b.height*H)
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(overlay, 0, 0)
    // crop
    const crop = document.createElement('canvas')
    crop.width = b.width*W
    crop.height = b.height*H
    crop.getContext('2d')!.drawImage(full, b.left*W, b.top*H, b.width*W, b.height*H, 0,0,b.width*W,b.height*H)
    result[key] = crop.toDataURL('image/png')
  }
  return result
}

export const mockupBackground = BACKGROUND
export const mockupBounds: Record<SizeKey, MockupBounds> = {
  'gc-mini': SIZES['gc-mini'].bounds,
  'gc-classic': SIZES['gc-classic'].bounds,
  'gc-large': SIZES['gc-large'].bounds,
}
