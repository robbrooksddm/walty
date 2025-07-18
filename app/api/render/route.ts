// app/api/render/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sanity, sanityPreview }     from '@/sanity/lib/client'
import puppeteer                     from 'puppeteer'

export const runtime = 'nodejs'          // keep in the Node runtime
export const dynamic = 'force-dynamic'   // don’t statically optimize

export async function POST (req: NextRequest) {
  try {
    /* ─── 1 · validate body ─── */
    const { variantId, designPNGs } = await req.json()
    if (typeof variantId !== 'string' || typeof designPNGs !== 'object')
      return NextResponse.json({ error: 'bad input' }, { status: 400 })

    /* ─── 2 · fetch visualVariant from Sanity ─── */
    const query = `*[_type=="visualVariant" &&
      (_id==$id || variant->slug.current==$id)][0]{
        "model":  mockupSettings.model.asset->url,
        "areas":  mockupSettings.printAreas[]{ id, mesh },
        "camera": mockupSettings.cameras[0]{
          posX, posY, posZ,
          targetX, targetY, targetZ,
          fov
        }
      }`
    const client  = process.env.SANITY_READ_TOKEN ? sanityPreview : sanity
    const variant = await client.fetch(query, { id: variantId })

    if (!variant?.model)
      return NextResponse.json({ error: 'variant-not-found' }, { status: 404 })

    /* pick first design PNG & mesh name */
    const areaId  = Object.keys(designPNGs)[0]
    const pngData = designPNGs[areaId]
    const meshName =
      variant.areas?.find(a => a.id === areaId)?.mesh || `PrintArea-${areaId}`

    /* ─── 3 · fetch GLB so CORS isn't an issue ─── */
    const glbRes = await fetch(variant.model)
    if (!glbRes.ok)
      throw new Error(`failed to fetch model: ${glbRes.status}`)
    const glbBuf = await glbRes.arrayBuffer()
    const glbUrl =
      'data:model/gltf-binary;base64,' + Buffer.from(glbBuf).toString('base64')

    /* ─── 4 · launch headless Chrome ─── */
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox'],               // <-- works on Lambda / Vercel
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1024, height: 1024 })

    /* ─── 5 · inject import map and render script ─── */
    const html = `<!DOCTYPE html>
      <html>
        <body></body>
        <script type="importmap">
          {
            "imports": {
              "three": "https://unpkg.com/three@0.178.0/build/three.module.js"
            }
          }
        </script>
        <script type="module">
          import * as THREE from 'three';
          import { GLTFLoader } from 'https://unpkg.com/three@0.178.0/examples/jsm/loaders/GLTFLoader.js';
          (async () => {
          const scene = new THREE.Scene();
          scene.add(new THREE.AmbientLight(0xffffff, 1));
          const cam = new THREE.PerspectiveCamera(
            ${variant.camera?.fov ?? 35}, 1, 0.1, 100
          );
          cam.position.set(
            ${variant.camera?.posX ?? 2},
            ${variant.camera?.posY ?? 2},
            ${variant.camera?.posZ ?? 2}
          );
          cam.lookAt(
            ${variant.camera?.targetX ?? 0},
            ${variant.camera?.targetY ?? 0},
            ${variant.camera?.targetZ ?? 0}
          );

          const renderer = new THREE.WebGLRenderer({ alpha: true });
          renderer.setSize(1024, 1024);
          document.body.appendChild(renderer.domElement);

          const gltfLoader = new GLTFLoader();
          const gltf = await gltfLoader.loadAsync('${glbUrl}');
          scene.add(gltf.scene);

          const texLoader = new THREE.TextureLoader();
          const tex = await texLoader.loadAsync('${pngData}');
          const mesh = gltf.scene.getObjectByName('${meshName}');
          if (mesh && mesh.material) {
            mesh.material.map = tex;
            mesh.material.needsUpdate = true;
          }

          renderer.render(scene, cam);
          window.__png = renderer.domElement.toDataURL('image/png');
        })();
        </script>
      </html>`

    page.on('console', msg => console.log('[render page]', msg.text()))
    page.on('pageerror', err => console.error('[render page]', err))

    await page.setContent(html, { waitUntil: 'networkidle0' })

    await page.waitForFunction('window.__png', { timeout: 120000 })
    const dataUrl = await page.evaluate('window.__png')
    await browser.close()

    /* ─── 6 · respond ─── */
    return NextResponse.json({
      urls: { [areaId]: dataUrl }
    })
  } catch (err) {
    console.error('[render]', err)
    return NextResponse.json({ error: 'server-error' }, { status: 500 })
  }
}
