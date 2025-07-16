// lib/canvas.ts
import type * as NodeCanvas from 'canvas'
const { createCanvas: _createRawCanvas, loadImage } = require('canvas') as typeof NodeCanvas

export function createCanvas (width: number, height: number) {
  const canvas = _createRawCanvas(width, height) as any
  canvas.addEventListener ??= () => {}
  canvas.removeEventListener ??= () => {}
  canvas.style ??= {}
  return canvas
}

export { loadImage }
