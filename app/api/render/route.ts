// app/api/render/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sanity, sanityPreview }     from '@/sanity/lib/client'
import puppeteer                     from 'puppeteer'
import sharp                         from 'sharp'

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
        "hdr":    mockupSettings.hdr.asset->url,
        "areas":  mockupSettings.printAreas[]{ id, mesh },
        "camera": mockupSettings.cameras[0]
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

    /* optional HDR/EXR environment */
    let hdrUrl = ''
    let hdrExt = ''
    if (variant.hdr) {
      const hdrRes = await fetch(variant.hdr)
      if (!hdrRes.ok)
        throw new Error(`failed to fetch hdr: ${hdrRes.status}`)
      const hdrBuf = await hdrRes.arrayBuffer()
      hdrUrl =
        'data:application/octet-stream;base64,' + Buffer.from(hdrBuf).toString('base64')
      hdrExt = variant.hdr.split('.').pop()?.toLowerCase() ?? ''
    }

    /* ─── 4 · launch headless Chrome ─── */
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox'],               // <-- works on Lambda / Vercel
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 2048, height: 2048 })

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
          import { RGBELoader } from 'https://unpkg.com/three@0.178.0/examples/jsm/loaders/RGBELoader.js';
          import { EXRLoader } from 'https://unpkg.com/three@0.178.0/examples/jsm/loaders/EXRLoader.js';
          import { RectAreaLight } from 'three';
          import { RectAreaLightUniformsLib } from 'https://unpkg.com/three@0.178.0/examples/jsm/lights/RectAreaLightUniformsLib.js';
          (async () => {
          RectAreaLightUniformsLib.init();
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
          renderer.setSize(2048, 2048);
          document.body.appendChild(renderer.domElement);

          // physically correct lighting & tone mapping
          renderer.useLegacyLights = false;
          renderer.physicallyCorrectLights = true;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.5;

          // three-point rectangular lighting setup
          const key = new RectAreaLight(0xffffff, 55, 1.0, 1.0);
          key.position.set(1.5, 2.5, 1.5);
          key.lookAt(0, 1, 0);
          scene.add(key);

          const fill = new RectAreaLight(0xffffff, 15, 1.2, 1.2);
          fill.position.set(-2.0, 1.8, 2.5);
          fill.lookAt(0, 1, 0);
          scene.add(fill);

          const rim = new RectAreaLight(0xffffff, 25, 0.6, 0.6);
          rim.position.set(0.0, -0.2, -2.0);
          rim.lookAt(0, 0, 0);
          scene.add(rim);

          if ('${hdrUrl}' !== '') {
            let env;
            if ('${hdrExt}' === 'exr') {
              const exrLoader = new EXRLoader();
              env = await exrLoader.loadAsync('${hdrUrl}');
            } else {
              const hdrLoader = new RGBELoader();
              env = await hdrLoader.loadAsync('${hdrUrl}');
            }
            env.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = env;
            scene.background = new THREE.Color(0xffffff);
            scene.environment.encoding = THREE.RGBEEncoding;
            scene.environmentIntensity = 0.75;
          }

          const gltfLoader = new GLTFLoader();
          const gltf = await gltfLoader.loadAsync('${glbUrl}');
          scene.add(gltf.scene);

          const texLoader = new THREE.TextureLoader();
          const tex = await texLoader.loadAsync('${pngData}');
          const mesh = gltf.scene.getObjectByName('${meshName}');
          if (mesh && mesh.material) {
            mesh.material.map = tex;
            mesh.material.roughness = 0.15;
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
    const bigDataUrl = await page.evaluate('window.__png')
    await browser.close()

    /* downscale to 1024x1024 for crisper edges */
    const pngBuf = Buffer.from(bigDataUrl.split(',')[1], 'base64')
    const resizedBuf = await sharp(pngBuf)
      .resize(1024, 1024)
      .png()
      .toBuffer()
    const dataUrl = 'data:image/png;base64,' + resizedBuf.toString('base64')

    /* ─── 6 · respond ─── */
    return NextResponse.json({
      urls: { [areaId]: dataUrl }
    })
  } catch (err) {
    console.error('[render]', err)
    return NextResponse.json({ error: 'server-error' }, { status: 500 })
  }
}
