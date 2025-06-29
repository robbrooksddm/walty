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
  const wrapperRect =
    canvas.parentElement?.getBoundingClientRect() ??
    canvas.getBoundingClientRect();

  // 2 - apply to the overlay div  (canvas-space ➜ screen-space)
  ghost.style.left   = `${wrapperRect.left + left   * scale}px`;
  ghost.style.top    = `${wrapperRect.top  + top    * scale}px`;
  ghost.style.width  = `${width  * scale}px`;
  ghost.style.height = `${height * scale}px`;
}
