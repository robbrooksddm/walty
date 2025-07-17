// lib/webgl1Renderer.ts
import { WebGLRenderer, WebGLRendererParameters } from 'three'

export default class WebGL1Renderer extends WebGLRenderer {
  constructor (params?: WebGLRendererParameters) {
    super(params)
    ;(this as any).isWebGL2 = false
  }
}
