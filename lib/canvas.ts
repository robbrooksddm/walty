// lib/canvas.ts
import type * as NodeCanvas from 'canvas'

let CanvasLib: typeof import('canvas') | typeof import('@napi-rs/canvas')
try {
  CanvasLib = require('canvas') as typeof NodeCanvas
} catch {
  try {
    CanvasLib = require('@napi-rs/canvas') as typeof NodeCanvas
  } catch {
    throw new Error('canvas-not-installed')
  }
}

const { createCanvas: _createRawCanvas, loadImage } = CanvasLib

export function createCanvas (width: number, height: number) {
  const canvas = _createRawCanvas(width, height) as any
  canvas.addEventListener ??= () => {}
  canvas.removeEventListener ??= () => {}
  canvas.style ??= {}
  return canvas
}

export { loadImage }
