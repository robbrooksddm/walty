import { WebGLRenderer, WebGLRendererParameters } from 'three'

export class WebGL1Renderer extends WebGLRenderer {
  constructor (parameters?: WebGLRendererParameters) {
    super(parameters)
    ;(this as any).isWebGL1Renderer = true
  }
}

export default WebGL1Renderer
