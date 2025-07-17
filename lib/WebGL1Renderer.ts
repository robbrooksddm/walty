import { WebGLRenderer, type WebGLRendererParameters } from 'three'
import patchThreeForWebGL1 from './patchThreeForWebGL1'

export default class WebGL1Renderer extends WebGLRenderer {
  readonly isWebGL1Renderer = true
  constructor(parameters?: WebGLRendererParameters) {
    super(parameters)
    patchThreeForWebGL1()
    ;(this as any).capabilities.isWebGL2 = false
  }
}
