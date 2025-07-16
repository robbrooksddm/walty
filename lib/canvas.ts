// lib/canvas.ts
import type * as NodeCanvas from 'canvas'

let canvasLib: typeof NodeCanvas | null = null

function loadLib(): typeof NodeCanvas | null {
  if (canvasLib) return canvasLib
  try {
    canvasLib = require('canvas') as typeof NodeCanvas
  } catch {
    try {
      canvasLib = require('@napi-rs/canvas') as typeof NodeCanvas
    } catch {
      canvasLib = null
    }
  }
  return canvasLib
}

export function createCanvas(width: number, height: number) {
  const mod = loadLib()
  if (!mod) throw new Error('canvas-not-installed')
  const canvas = mod.createCanvas(width, height) as any
  canvas.addEventListener ??= () => {}
  canvas.removeEventListener ??= () => {}
  canvas.style ??= {}
  return canvas
}

export async function loadImage(src: string) {
  const mod = loadLib()
  if (!mod) throw new Error('canvas-not-installed')
  return mod.loadImage(src)
}
