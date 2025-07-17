// app/api/render/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sanity, sanityPreview } from '@/sanity/lib/client'
import { createCanvas } from '@/lib/canvas'

// ⬇︎ types-only import so we can cast meshes safely
import type { Mesh as ThreeMesh } from 'three'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'

export async function POST (req: NextRequest) {
  try {
    /* ───── 1 · Runtime-load libs ───── */
    const THREE          = await import('three')
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader')
    const { WebGL1Renderer } =
      await import('three/examples/jsm/renderers/WebGL1Renderer.js')
    const { default: gl } = await import(/* webpackIgnore: true */ 'gl')

    const {
      Scene, AmbientLight, TextureLoader,
      PerspectiveCamera, Vector3,            // Mesh removed
    } = THREE

    /* ───── 2 · Validate body ───── */
    const { variantId, designPNGs } = await req.json()
    if (!variantId || typeof variantId !== 'string' ||
        !designPNGs || typeof designPNGs !== 'object') {
      return NextResponse.json({ error: 'bad input' }, { status: 400 })
    }
    const designEntries = Object.entries(designPNGs)
      .filter(([, v]) => typeof v === 'string') as [string, string][]
    if (!designEntries.length) {
      return NextResponse.json({ error: 'no design data' }, { status: 400 })
    }

    /* ───── 3 · Canvas + GL context ───── */
    const width = 1024, height = 1024
    const canvas    = createCanvas(width, height) as any
    const glContext = gl(width, height, { preserveDrawingBuffer: true }) as any

        /* 3-A.1 · Pretend we’re WebGL 1 so Three compiles #version 100 shaders */
        const origGetParameter = glContext.getParameter.bind(glContext)
        glContext.getParameter = (p: number) => {
          if (p === glContext.VERSION)                  return 'WebGL 1.0'
          if (p === glContext.SHADING_LANGUAGE_VERSION) return 'WebGL GLSL ES 1.0'
          return origGetParameter(p)
        }
    
        /* 3-A.2 · Stub VAO calls that headless-gl 8 doesn’t expose */
        if (typeof glContext.createVertexArray !== 'function') {
          glContext.createVertexArray = () => null
          glContext.bindVertexArray   = () => {}
          glContext.deleteVertexArray = () => {}
        }
    
        /* 3-A.3 · Fake OES_standard_derivatives so dFdx/dFdy compile */
        const origGetExtension = glContext.getExtension.bind(glContext)
        glContext.getExtension = (name: string) =>
          name === 'OES_standard_derivatives' ? {} : origGetExtension(name)

        /* 3-A.4 · Provide empty texImage3D for WebGL1 contexts */
        if (typeof glContext.texImage3D !== 'function') {
          glContext.texImage3D = () => {}
        }

    /* 3-B · Browser-DOM poly-fill so ImageLoader works in Node */
    const { Image } = await import('@/lib/canvas')
    ;(globalThis as any).Image = Image

        // -- add event-listener stubs (cast to any to silence TS)
        const imgProto = Image.prototype as any
        if (!imgProto.addEventListener) {
          imgProto.addEventListener    = () => {}
          imgProto.removeEventListener = () => {}
        }



    ;(globalThis as any).document = {
      createElement:   () => new Image(),
      createElementNS: () => new Image(),
    }

    const renderer = new WebGL1Renderer({
      antialias: false,
      canvas,
      context: glContext as unknown as WebGLRenderingContext,
    })
    renderer.setSize(width, height)

    /* ───── 4 · Scene & model ───── */
    const scene = new Scene()
    scene.add(new AmbientLight(0xffffff))

    const loader = new GLTFLoader()

    const query = `*[_type=="visualVariant"
      && (variant._ref==$id || variant->slug.current==$id || _id==$id)][0]{
        "modelUrl": mockupSettings.model.asset->url,
        "areas":    mockupSettings.printAreas[]{id, mesh},
        "camera":   mockupSettings.cameras[0]
      }`
    const params  = { id: variantId }
    const client  = process.env.SANITY_READ_TOKEN ? sanityPreview : sanity
    const variant = await client.fetch<{
      modelUrl?: string
      areas?: { id: string; mesh?: string }[]
      camera?: {
        name?: string; posX?: number; posY?: number; posZ?: number
        targetX?: number; targetY?: number; targetZ?: number; fov?: number
      }
    }>(query, params)

    if (!variant?.modelUrl) {
      return NextResponse.json({ error: 'variant-not-found' }, { status: 404 })
    }

    const modelResp = await fetch(variant.modelUrl)
    if (!modelResp.ok) {
      return NextResponse.json({ error: 'model-download' }, { status: 500 })
    }
    const modelBuffer = await modelResp.arrayBuffer()
    const gltf = await new Promise<any>((res, rej) =>
      loader.parse(modelBuffer as ArrayBuffer, '', res, rej)
    )
    scene.add(gltf.scene)


    /* apply PNG textures */
    const texLoader = new TextureLoader()
    for (const [areaId, dataUrl] of designEntries) {
      const pngData  = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      const texture  = texLoader.load(`data:image/png;base64,${pngData}`)
      const meshName =
        variant.areas?.find(a => a.id === areaId)?.mesh || `PrintArea-${areaId}`
      const mesh = gltf.scene.getObjectByName(meshName) as ThreeMesh
      if (mesh?.material && (mesh.material as any).map) {
        (mesh.material as any).map = texture
        ;(mesh.material as any).needsUpdate = true
      }
    }

    /* ───── 5 · Camera & render ───── */
    const cam = variant.camera
    const camera = new PerspectiveCamera(
      cam?.fov ?? 35, width / height, 0.1, 100
    )
    camera.position.set(cam?.posX ?? 2, cam?.posY ?? 2, cam?.posZ ?? 2)
    camera.lookAt(new Vector3(
      cam?.targetX ?? 0, cam?.targetY ?? 0, cam?.targetZ ?? 0
    ))

    renderer.render(scene, camera)

    /* ───── 6 · Encode & return ───── */
    const buffer = canvas.toBuffer('image/png')
    const urls   = {
      [cam?.name ?? 'default']: `data:image/png;base64,${buffer.toString('base64')}`,
    }
    return NextResponse.json({ urls })
  } catch (err) {
    console.error('[render]', err)
    return NextResponse.json({ error: 'server-error' }, { status: 500 })
  }
}
