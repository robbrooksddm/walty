declare module '@/lib/WebGL1Renderer' {
  import { WebGLRenderer, WebGLRendererParameters } from 'three'
  export class WebGL1Renderer extends WebGLRenderer {
    constructor(parameters?: WebGLRendererParameters);
  }
  export default WebGL1Renderer
}
