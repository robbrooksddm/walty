/**************************************************************
 * CropTool – helper to crop Fabric.js images without double‑clicking
 * -------------------------------------------------------------------
 * 2025‑06‑08
 *   • Always shows crop‑window stroke above bitmap
 *   • Bitmap & frame controls are simultaneously draggable
 *********************************************************************/

import { fabric } from 'fabric'

export class CropTool {
  public  isActive = false

  private fc      : fabric.Canvas
  private SCALE   : number
  private SEL     : string
  private img     : fabric.Image | null = null
  private frame   : fabric.Group | null = null
  /** clean‑up callbacks to run on `teardown()` */
  private cleanup: Array<() => void> = [];

  constructor (fc: fabric.Canvas, scale: number, selColour: string) {
    this.fc    = fc
    this.SCALE = scale
    this.SEL   = selColour
  }

  /* ─────────────── public API ──────────────────────────────────── */
  public begin (img: fabric.Image) {
    if (this.isActive) return

    // ensure a clean slate on every new crop session
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];

    this.isActive = true
    this.img      = img

    /* ① expand bitmap to its natural size (keep on‑screen scale) */
    const imgEl  = img.getElement() as HTMLImageElement
    const nat = { w: imgEl.naturalWidth  || img.width!,
                  h: imgEl.naturalHeight || img.height! }
    const { cropX=0, cropY=0, width=nat.w, height=nat.h } = img

    img.set({
      left  : (img.left ?? 0) - cropX * (img.scaleX ?? 1),
      top   : (img.top  ?? 0) - cropY * (img.scaleY ?? 1),
      width : nat.w,
      height: nat.h,
      cropX : 0,
      cropY : 0,
      lockRotation   : true,
      lockScalingFlip: true,
      hasControls    : true,
    }).setCoords()

    /* ② persistent crop window */
    const fx = (img.left ?? 0) + cropX * (img.scaleX ?? 1)
    const fy = (img.top  ?? 0) + cropY * (img.scaleY ?? 1)
    const fw =  width    * (img.scaleX ?? 1)
    const fh =  height   * (img.scaleY ?? 1)

    const grid = { stroke:'#ffffff22', strokeWidth:1/this.SCALE,
                   selectable:false, evented:false }

    this.frame = new fabric.Group([
      new fabric.Rect({ left:0, top:0, width:fw, height:fh,
                        fill:'rgba(0,0,0,0)',
                        stroke:this.SEL, strokeWidth:1/this.SCALE,
                        strokeUniform:true }),
      new fabric.Line([fw/3,0, fw/3,fh], grid),
      new fabric.Line([fw*2/3,0, fw*2/3,fh], grid),
      new fabric.Line([0,fh/3, fw,fh/3], grid),
      new fabric.Line([0,fh*2/3, fw,fh*2/3], grid),
    ],{
      left:fx, top:fy, originX:'left', originY:'top',
      selectable:true, lockRotation:true, lockScalingFlip:true,
      hasBorders:false, transparentCorners:false,
    })
    this.frame.cornerSize = 6/this.SCALE

    /* ③ add both to canvas and keep z‑order intuitive              */
    this.fc.add(this.frame)
    this.img.bringToFront()    // bitmap controls stay usable
    this.frame.bringToFront()  // stroke always visible

    this.fc.setActiveObject(this.frame)

    /* ------------------------------------------------------------------
     *  DOM‑level pointer capture – runs *before* Fabric's own handler.
     *  Whichever corner the user pressed (bitmap OR frame) becomes the
     *  active object, so the drag starts without an extra click.
     * ------------------------------------------------------------------ */
    const onPointerDown = (ev: PointerEvent) => {
      if (!this.isActive || !this.img || !this.frame) return;

      // pointer → canvas coords
      const pt = this.fc.getPointer(ev, false);

      // helper exists at runtime even if not in TS types
      const findCorner = (fabric as any).controlsUtils?.findCorner;
      if (!findCorner) return;

      const hitFrame = findCorner(this.frame, pt, 15 / this.SCALE);
      const hitImg   = findCorner(this.img,   pt, 15 / this.SCALE);

      if (hitFrame && this.fc.getActiveObject() !== this.frame) {
        this.fc.setActiveObject(this.frame);
      } else if (hitImg && this.fc.getActiveObject() !== this.img) {
        this.fc.setActiveObject(this.img);
      }
    };

    // register before Fabric's own listener
    const canvasEl = (this.fc as any).upperCanvasEl as HTMLCanvasElement;
    canvasEl.addEventListener('pointerdown', onPointerDown, { capture: true });

    // remember so we can clean it up later
    this.cleanup.push(() =>
      canvasEl.removeEventListener('pointerdown', onPointerDown, { capture: true } as any)
    );

    /* ④ dual‑handle rendering + clamping */
    // draw both control sets every frame
    this.fc.on('after:render', this.renderBoth)

    // Make sure the correct object has focus *before* Fabric computes
    // the new transform.  This fires earlier than `mouse:down`.
    this.fc.on('before:transform', (e: fabric.IEvent) => {
      const t = (e as any).transform?.target as fabric.Object | undefined
      if (!t) return
      if (t !== this.img && t !== this.frame) return
      if (this.fc.getActiveObject() === t) return
      this.fc.setActiveObject(t)
    })

    /* ------------------------------------------------------------------
     *  Whenever the user presses the mouse, ensure that whichever object
     *  (crop‑frame OR bitmap) they clicked immediately becomes the active
     *  selection.  This means every drag/scale starts working right away,
     *  without having to click once to select and a second time to resize.
     * ------------------------------------------------------------------ */
    this.fc.on('mouse:down', (e: fabric.IEvent) => {
      if (!this.isActive) return                         // only while cropping
      const t = e.target as fabric.Object | null | undefined
      if (!t) return
      if (t === this.img || t === this.frame) {
        // only switch if it is not already active – avoids redundant renders
        if (this.fc.getActiveObject() !== t) this.fc.setActiveObject(t)
      }
    })

    /* keep FRAME inside bitmap and refresh its corner data */
    this.frame!
      .on('moving',  () => { this.clampFrame(); this.frame!.setCoords() })
      .on('scaling', () => { this.clampFrame(); this.frame!.setCoords() })

    // keep BITMAP inside frame and refresh its corner data
    img
      .on('moving',  () => { this.clamp(); this.img!.setCoords() })
      .on('scaling', () => { this.clamp(); this.img!.setCoords() })
  }

  public cancel () { this.teardown(false) }
  public commit () { this.teardown(true)  }

  /* ─────────────── internal helpers ────────────────────────────── */
  private teardown (keep:boolean) {
    if (!this.isActive) return

    // run and clear any on‑crop listeners
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];

    this.fc.off('after:render', this.renderBoth)
    if (this.frame) this.fc.remove(this.frame)
    if (!keep) this.fc.discardActiveObject()
    this.fc.requestRenderAll()

    this.frame    = null
    this.img      = null
    this.isActive = false
  }

  /* keep bitmap inside frame */
  private clamp = () => {
    if (!this.img || !this.frame) return
    const { img, frame } = this
    const minSX = frame.width!*frame.scaleX! / img.width!
    const minSY = frame.height!*frame.scaleY! / img.height!
    img.scaleX = Math.max(img.scaleX ?? 1, minSX)
    img.scaleY = Math.max(img.scaleY ?? 1, minSY)

    const fx=frame.left!, fy=frame.top!
    const fw=frame.width!*frame.scaleX!, fh=frame.height!*frame.scaleY!
    const iw=img.getScaledWidth(), ih=img.getScaledHeight()
    img.set({
      left: Math.min(fx, Math.max(fx+fw-iw, img.left!)),
      top : Math.min(fy, Math.max(fy+fh-ih, img.top!)),
    }).setCoords()
  }

  /* keep frame inside bitmap */
  private clampFrame = () => {
    if (!this.img || !this.frame) return
    const { img, frame } = this
    const iw = img.getScaledWidth()
    const ih = img.getScaledHeight()

    const minL = img.left!, minT = img.top!
    const maxR = minL + iw, maxB = minT + ih

    if (frame.left! < minL) frame.left = minL
    if (frame.top!  < minT) frame.top  = minT

    const fw = frame.width!*frame.scaleX!, fh = frame.height!*frame.scaleY!
    if (frame.left! + fw > maxR)
      frame.scaleX = (maxR - frame.left!) / frame.width!
    if (frame.top! + fh > maxB)
      frame.scaleY = (maxB - frame.top!) / frame.height!

    frame.setCoords()
  }

  /* draw controls for both objects each frame */
  private renderBoth = () => {
    if (!this.img || !this.frame) return
    const ctx = (this.fc as any).contextTop
    this.fc.clearContext(ctx)

    ctx.save()
    const vpt = this.fc.viewportTransform;
    if (vpt) {
      //          a     b     c     d     e     f
      ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);
    }      // draw in the same space as Fabric
    this.img.drawControls(ctx)
    this.frame.drawControls(ctx)
    ctx.restore()
  }
}