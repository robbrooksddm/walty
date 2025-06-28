import { fabric } from 'fabric'

/**
 * Position a DOM overlay to match a Fabric object.
 * Used for hover/selection outlines outside the canvas.
 */
export function syncOutline(
  obj: fabric.Object,
  el: HTMLDivElement,
  canvas: HTMLCanvasElement,
  scale: number,
) {
  obj.setCoords()
  const center = obj.getCenterPoint()
  const w = obj.getScaledWidth()
  const h = obj.getScaledHeight()
  const canvasRect = canvas.getBoundingClientRect()

  el.style.left = `${canvasRect.left + (center.x - w / 2) * scale}px`
  el.style.top = `${canvasRect.top + (center.y - h / 2) * scale}px`
  el.style.width = `${w * scale}px`
  el.style.height = `${h * scale}px`
  el.style.transform = `rotate(${obj.angle || 0}deg)`
  el.style.transformOrigin = 'center'
}
