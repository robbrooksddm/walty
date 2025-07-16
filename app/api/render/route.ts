import { NextRequest, NextResponse } from 'next/server'
import { sanity, sanityPreview } from '@/sanity/lib/client'

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { createCanvas } = await import(/* webpackIgnore: true */ 'canvas').catch(
      err => {
        console.error('[render] missing canvas module', err)
        throw new Error('missing-canvas')
      }
    )
    const { default: gl } = await import(/* webpackIgnore: true */ 'gl').catch(err => {
      console.error('[render] missing gl module', err)
      throw new Error('missing-gl')
    })
    const THREE = await import(/* webpackIgnore: true */ 'three').catch(err => {
      console.error('[render] missing three module', err)
      throw new Error('missing-three')
    })
    const { GLTFLoader } = await import(
      /* webpackIgnore: true */ 'three/examples/jsm/loaders/GLTFLoader.js'
    )
    const { variantId, designPNGs } = await req.json()
    if (!variantId || typeof variantId !== 'string' || !designPNGs || typeof designPNGs !== 'object') {
      return NextResponse.json({ error: 'bad input' }, { status: 400 })
    }

    const designEntries = Object.entries(designPNGs).filter(([, v]) => typeof v === 'string') as [string, string][]
    if (!designEntries.length) {
      return NextResponse.json({ error: 'no design data' }, { status: 400 })
    }

    const width = 1024
    const height = 1024
    const canvas = createCanvas(width, height)
    const glContext = gl(width, height)
    const renderer = new THREE.WebGLRenderer({ context: glContext as unknown as WebGLRenderingContext, canvas })
    renderer.setSize(width, height)

    const scene = new THREE.Scene()
    scene.add(new THREE.AmbientLight(0xffffff))

    const loader = new GLTFLoader()

    const query = `*[_type=="visualVariant" && (variant._ref==$id || variant->slug.current==$id || _id==$id)][0]{
      "modelUrl": mockupSettings.model.asset->url,
      "areas": mockupSettings.printAreas[]{id, mesh},
      "camera": mockupSettings.cameras[0]
    }`
    const params = { id: variantId }
    const client = process.env.SANITY_READ_TOKEN ? sanityPreview : sanity
    const variant = await client.fetch<{
      modelUrl?: string
      areas?: { id: string; mesh?: string }[]
      camera?: {
        name?: string
        posX?: number
        posY?: number
        posZ?: number
        targetX?: number
        targetY?: number
        targetZ?: number
        fov?: number
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
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.parse(modelBuffer as ArrayBuffer, '', resolve, reject)
    })
    scene.add(gltf.scene)

    const textureLoader = new THREE.TextureLoader()
    const urls: Record<string, string> = {}
    for (const [areaId, dataUrl] of designEntries) {
      const pngData = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      const buf = Buffer.from(pngData, 'base64')
      const texture = textureLoader.load(`data:image/png;base64,${buf.toString('base64')}`)
      const meshName =
        variant.areas?.find(a => a.id === areaId)?.mesh || `PrintArea-${areaId}`
      const mesh = gltf.scene.getObjectByName(meshName) as THREE.Mesh
      if (mesh && mesh.material && (mesh.material as any).map) {
        ;(mesh.material as any).map = texture
        ;(mesh.material as any).needsUpdate = true
      }
    }

    const camDef = variant.camera
    const fov = camDef?.fov ?? 35
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100)
    camera.position.set(
      camDef?.posX ?? 2,
      camDef?.posY ?? 2,
      camDef?.posZ ?? 2
    )
    const target = new THREE.Vector3(
      camDef?.targetX ?? 0,
      camDef?.targetY ?? 0,
      camDef?.targetZ ?? 0
    )
    camera.lookAt(target)
    const cameraName = camDef?.name || 'default'

    renderer.render(scene, camera)

    const buffer = canvas.toBuffer('image/png')
    const out = `data:image/png;base64,${buffer.toString('base64')}`
    urls[cameraName] = out
    return NextResponse.json({ urls })
  } catch (err) {
    console.error('[render]', err)
    const msg =
      err instanceof Error ? err.message : typeof err === 'string' ? err : ''
    if (msg === 'missing-canvas' || msg === 'missing-gl' || msg === 'missing-three') {
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    return NextResponse.json({ error: 'server-error' }, { status: 500 })
  }
}
