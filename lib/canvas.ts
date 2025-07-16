// lib/canvas.ts
import type * as NodeCanvas from 'canvas'

let canvasMod: typeof NodeCanvas | null = null
try {
  canvasMod = require('canvas') as typeof NodeCanvas
} catch {
  try {
    canvasMod = require('@napi-rs/canvas') as typeof NodeCanvas
  } catch {
    canvasMod = null
  }
}

if (!canvasMod) {
  throw new Error('canvas-not-installed')
}

const { createCanvas: _createRawCanvas, loadImage, Image } = canvasMod

export function createCanvas (width: number, height: number) {
  const canvas = _createRawCanvas(width, height) as any
  canvas.addEventListener ??= () => {}
  canvas.removeEventListener ??= () => {}
  canvas.style ??= {}
  return canvas
}

export { loadImage, Image }
