export function patchThreeForWebGL1(THREE: any) {
  const origShader = THREE.WebGLShader
  const downgrade = (source: string): string => {
    return source
      .replace(/^#version 300 es\s*\n/, '#version 100\n')
      .replace(/^\s*#define attribute in\s*\n/mg, '')
      .replace(/^\s*#define varying out\s*\n/mg, '')
      .replace(/^\s*#define varying in\s*\n/mg, '')
      .replace(/^\s*#define texture2D texture\s*\n/mg, '')
      .replace(/^\s*#define textureCube texture\s*\n/mg, '')
      .replace(/^\s*#define texture2DProj textureProj\s*\n/mg, '')
      .replace(/^\s*#define texture2DLodEXT textureLod\s*\n/mg, '')
      .replace(/^\s*#define texture2DProjLodEXT textureProjLod\s*\n/mg, '')
      .replace(/^\s*#define textureCubeLodEXT textureLod\s*\n/mg, '')
      .replace(/^\s*#define texture2DGradEXT textureGrad\s*\n/mg, '')
      .replace(/^\s*#define texture2DProjGradEXT textureProjGrad\s*\n/mg, '')
      .replace(/^\s*#define textureCubeGradEXT textureGrad\s*\n/mg, '')
      .replace(/^\s*layout\(location = 0\) out highp vec4 pc_fragColor;\s*\n/mg, '')
      .replace(/^\s*#define gl_FragColor pc_fragColor\s*\n/mg, '')
      .replace(/^\s*#define gl_FragDepthEXT gl_FragDepth\s*\n/mg, '')
  }
  THREE.WebGLShader = function(gl: any, type: any, source: string) {
    return origShader(gl, type, downgrade(source))
  }
}
