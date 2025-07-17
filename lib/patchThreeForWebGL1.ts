import * as THREE from 'three'

let patched = false

export default function patchThreeForWebGL1() {
  if (patched) return
  patched = true

  const origWebGLProgram = (THREE as any).WebGLProgram
  if (typeof origWebGLProgram === 'function') {
    ;(THREE as any).WebGLProgram = function (
      renderer: any,
      cacheKey: any,
      parameters: any,
      bindingStates: any
    ) {
      if (!renderer.capabilities.isWebGL2) {
        parameters.glslVersion = null
      }
      return origWebGLProgram.call(this, renderer, cacheKey, parameters, bindingStates)
    }
  }

  const origWebGLShader = (THREE as any).WebGLShader
  if (typeof origWebGLShader === 'function') {
    ;(THREE as any).WebGLShader = function (
      gl: WebGLRenderingContext,
      type: number,
      source: string
    ) {
      if (source.startsWith('#version 300 es')) {
        source = source.replace('#version 300 es', '')
        source = source.replace(/\bin\b/g, 'attribute')
        source = source.replace(/\bout\b/g, 'varying')
      }
      source = source.replace(/precision highp .*sampler3D;\n/g, '')
      source = source.replace(/precision highp .*sampler2DArray.*\n/g, '')
      return origWebGLShader.call(this, gl, type, source)
    }
  }
}
