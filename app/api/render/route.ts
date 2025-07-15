import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { createCanvas, Image } from 'canvas'
import gl from 'gl'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { designPNGs } = await req.json()
    if (!designPNGs || typeof designPNGs !== 'object' || typeof designPNGs['wrap'] !== 'string') {
      return NextResponse.json({ error: 'bad input' }, { status: 400 })
    }

    const base64 = designPNGs['wrap'] as string
    const pngData = base64.replace(/^data:image\/\w+;base64,/, '')
    const textureBuffer = Buffer.from(pngData, 'base64')

    const width = 1024
    const height = 1024
    const canvas = createCanvas(width, height)
    const glContext = gl(width, height)
    const renderer = new THREE.WebGLRenderer({ context: glContext as unknown as WebGLRenderingContext, canvas })
    renderer.setSize(width, height)

    const scene = new THREE.Scene()
    scene.add(new THREE.AmbientLight(0xffffff))

    const loader = new GLTFLoader()
    const modelPath = path.join(process.cwd(), 'public', 'mug.glb')
    const modelData = await readFile(modelPath)
    const gltf = await new Promise<THREE.GLTF>((resolve, reject) => {
      loader.parse(modelData.buffer as ArrayBuffer, '', resolve, reject)
    })
    scene.add(gltf.scene)

    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load(`data:image/png;base64,${textureBuffer.toString('base64')}`)
    const mesh = gltf.scene.getObjectByName('PrintArea-wrap') as THREE.Mesh
    if (mesh && mesh.material && (mesh.material as any).map) {
      ;(mesh.material as any).map = texture
      ;(mesh.material as any).needsUpdate = true
    }

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
    camera.position.set(2, 2, 2)
    camera.lookAt(0, 0, 0)

    renderer.render(scene, camera)

    const buffer = canvas.toBuffer('image/png')
    const out = `data:image/png;base64,${buffer.toString('base64')}`
    return NextResponse.json({ urls: { wrap: out } })
  } catch (err) {
    console.error('[render]', err)
    return NextResponse.json({ error: 'server-error' }, { status: 500 })
  }
}
