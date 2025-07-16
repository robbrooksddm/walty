// lib/canvas.ts
import type * as NodeCanvas from 'canvas'

let canvasLib: typeof NodeCanvas | null = null

try {
  canvasLib = require('canvas') as typeof NodeCanvas
} catch {
  try {
    const alt = '@napi-rs/canvas'
    canvasLib = eval('require')(alt) as typeof NodeCanvas
  } catch {
    canvasLib = null
  }
}

export function createCanvas (width: number, height: number) {
  if (!canvasLib) throw new Error('canvas-not-installed')
  const canvas = canvasLib.createCanvas(width, height) as any
  canvas.addEventListener ??= () => {}
  canvas.removeEventListener ??= () => {}
  canvas.style ??= {}
  return canvas
}

export const loadImage = canvasLib?.loadImage as typeof NodeCanvas.loadImage | undefined
