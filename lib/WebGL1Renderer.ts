import { WebGLRenderer, type WebGLRendererParameters } from 'three'

export default class WebGL1Renderer extends WebGLRenderer {
  readonly isWebGL1Renderer = true
  constructor(parameters?: WebGLRendererParameters) {
    super(parameters)
    ;(this as any).capabilities.isWebGL2 = false
  }
}
