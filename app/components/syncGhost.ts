/* syncGhost.ts  – position the “ai-ghost” outline over a Fabric.Image
   ------------------------------------------------------------------ */
   import {fabric} from 'fabric';

   /**
    * Keep a <div class="ai-ghost"> perfectly aligned with its Fabric.Image.
    *
    * @param img     The Fabric.Image instance
    * @param ghost   The overlay <div> (already appended to document.body)
    * @param canvas  The <canvas> element for this page
    * @param scale   Canvas → preview scale (SCALE from FabricCanvas)
    */
   export function syncGhost(
     img    : fabric.Image,
     ghost  : HTMLDivElement,
     canvas : HTMLCanvasElement,
     scale  : number,
   ) {
     // 1 - read positions
     const { left, top, width, height } = img.getBoundingRect();
     const canvasRect = canvas.getBoundingClientRect();
   
     // 2 - clamp to canvas bounds (no bleed outside)
     //    Fabric positions can be negative 👉 clamp at 0..PAGE_W/​H
     const clampedLeft   = Math.max(0, Math.min(left,  canvas.width));
     const clampedTop    = Math.max(0, Math.min(top,   canvas.height));
     const clampedWidth  = Math.max(0, Math.min(width,  canvas.width  - clampedLeft));
     const clampedHeight = Math.max(0, Math.min(height, canvas.height - clampedTop));
   
     // 3 - apply to the overlay div  (convert canvas-space ➜ screen-space)
     ghost.style.left   = `${canvasRect.left + clampedLeft   * scale}px`;
     ghost.style.top    = `${canvasRect.top  + clampedTop    * scale}px`;
     ghost.style.width  = `${clampedWidth  * scale}px`;
     ghost.style.height = `${clampedHeight * scale}px`;
   }