import { fabric } from 'fabric'

export interface CropRect {
  x:number; y:number; w:number; h:number
}

export interface CropSession {
  commit: () => CropRect
  cancel: () => void
}

export function startImageCrop(fc:fabric.Canvas, img:fabric.Image): CropSession {
  const el = img.getElement() as HTMLImageElement
  const natW = el.naturalWidth || img.width!
  const natH = el.naturalHeight || img.height!

  const crop: CropRect = {
    x: img.cropX ?? 0,
    y: img.cropY ?? 0,
    w: img.width ?? natW,
    h: img.height ?? natH,
  }

  img.set({
    left: (img.left ?? 0) - crop.x * (img.scaleX ?? 1),
    top : (img.top  ?? 0) - crop.y * (img.scaleY ?? 1),
    width:natW, height:natH,
    cropX:0, cropY:0,
    hasControls:true,
    lockRotation:true,
    lockScalingFlip:true,
  }).setCoords()

  const overlay = new fabric.Rect({
    left:(img.left ?? 0)+crop.x*(img.scaleX??1),
    top :(img.top  ?? 0)+crop.y*(img.scaleY??1),
    width:crop.w*(img.scaleX??1),
    height:crop.h*(img.scaleY??1),
    fill:'rgba(0,0,0,0)',
    stroke:'cyan',
    strokeWidth:1,
    strokeUniform:true,
    selectable:false,
    evented:false,
  })
  fc.add(overlay)

  const draw = () => {
    const sx = img.scaleX ?? 1
    const sy = img.scaleY ?? 1
    overlay.set({
      left:(img.left ?? 0)+crop.x*sx,
      top :(img.top  ?? 0)+crop.y*sy,
      width:crop.w*sx,
      height:crop.h*sy,
    }).setCoords()
  }
  fc.on('after:render', draw)

  const moveCorner = (name:string, dx:number, dy:number) => {
    if(name.includes('l')) { crop.x += dx; crop.w -= dx }
    if(name.includes('r')) { crop.w += dx }
    if(name.includes('t')) { crop.y += dy; crop.h -= dy }
    if(name.includes('b')) { crop.h += dy }
    crop.w = Math.max(1, Math.min(crop.w, natW - crop.x))
    crop.h = Math.max(1, Math.min(crop.h, natH - crop.y))
    crop.x = Math.max(0, Math.min(crop.x, natW - crop.w))
    crop.y = Math.max(0, Math.min(crop.y, natH - crop.h))
  }

  const ctrl = (name:string,x:number,y:number) => new fabric.Control({
    x,y,cornerSize:8,
    cursorStyleHandler:(fabric as any).controlsUtils.scaleCursorStyleHandler,
    actionHandler:(evt:any, t:any, ox:number,oy:number)=>{
      const p = img.toLocalPoint(new fabric.Point(evt.x, evt.y))
      const dx = p.x - (crop.x + (name.includes('l')?0:crop.w))
      const dy = p.y - (crop.y + (name.includes('t')?0:crop.h))
      moveCorner(name, dx, dy)
      draw()
      fc.requestRenderAll()
      return true
    }
  })

  img.controls = {
    tl: ctrl('tl',-0.5,-0.5),
    tr: ctrl('tr',0.5,-0.5),
    bl: ctrl('bl',-0.5,0.5),
    br: ctrl('br',0.5,0.5),
  } as any

  const commit = () => {
    fc.off('after:render', draw)
    fc.remove(overlay)
    img.controls = fabric.Image.prototype.controls
    img.set({
      left:(img.left ?? 0)+crop.x*(img.scaleX??1),
      top :(img.top  ?? 0)+crop.y*(img.scaleY??1),
      cropX:crop.x,
      cropY:crop.y,
      width:crop.w,
      height:crop.h,
    }).setCoords()
    fc.requestRenderAll()
    return crop
  }

  const cancel = () => {
    fc.off('after:render', draw)
    fc.remove(overlay)
    fc.requestRenderAll()
  }

  return { commit, cancel }
}
