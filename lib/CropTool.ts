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
  private onChange?: (state: boolean) => void
  private img     : fabric.Image | null = null
  private frame   : fabric.Group | null = null
  private masks   : fabric.Object[] = [];    // dark overlay
  private frameScaling = false;              // TRUE only while frame is being resized
  private ratio: number | null = null
  /** original bitmap state before cropping */
  private orig: { left:number; top:number; cropX:number; cropY:number; width:number; height:number; } | null = null;
  /** store control visibility so it can be restored */
  private prevControls: Record<string, boolean> | null = null;
  /** canvas size before cropping */
  private baseW = 0;
  private baseH = 0;
  private baseZoom = 1;
  private panX = 0;
  private panY = 0;
  private wrapStyles: { w:string; h:string; mw:string; mh:string; transform:string } | null = null;
  private wrapper: HTMLElement | null = null;
  private scrollLeft = 0;
  private scrollTop = 0;
  /** clean‑up callbacks to run on `teardown()` */
  private cleanup: Array<() => void> = [];

  constructor (fc: fabric.Canvas, scale: number, selColour: string,
               onChange?: (state: boolean) => void) {
    this.fc      = fc
    this.SCALE   = scale
    this.SEL     = selColour
    this.onChange= onChange
  }

  public setRatio (r: number | null) {
    this.ratio = r
    if (this.frame) {
      this.fc.uniformScaling   = r !== null
      this.frame.lockScalingX  = false
      this.frame.lockScalingY  = false
      this.frame.selectable    = true
      this.frame.evented       = true
      this.frame.hasControls   = true
      this.fc.setActiveObject(this.frame)
    }
  }

  /* ─────────────── public API ──────────────────────────────────── */
  public begin (img: fabric.Image) {
    if (this.isActive) return

    // ensure a clean slate on every new crop session
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];

    this.isActive = true
    this.onChange?.(true)
    this.img      = img
    // allow freeform scaling of the crop window
    const prevUniformScaling = this.fc.uniformScaling
    const prevUniScaleKey    = this.fc.uniScaleKey
    this.fc.uniformScaling = false
    this.fc.uniScaleKey    = 'none'
    this.cleanup.push(() => {
      this.fc.uniformScaling = prevUniformScaling
      this.fc.uniScaleKey    = prevUniScaleKey
    })
    // manual drag state
    let isDraggingImage = false;
    let dragOrig   = { x: 0, y: 0 };   // pointer world‑coords at drag start
    let imgOrigPos = { x: 0, y: 0 };   // img.left/top at drag start
    let restoreFrameSelectable: boolean | undefined;
    let restoreFrameEvented:    boolean | undefined;

    // which edges stay locked while the user scales the frame
    // which corner stays fixed while the user scales the frame
    let anchorCorner: 'tl' | 'tr' | 'bl' | 'br' | null = null
    let anchorPos = { x: 0, y: 0 }
    // which edges stay locked while the user scales the bitmap
    let imgEdge: { left?: number; top?: number; right?: number; bottom?: number } = {};

    // remember original crop for cancel()
    this.orig = {
      left  : img.left ?? 0,
      top   : img.top  ?? 0,
      cropX : img.cropX ?? 0,
      cropY : img.cropY ?? 0,
      width : img.width ?? 0,
      height: img.height ?? 0,
    };

    /* ① expand bitmap to its natural size (keep on‑screen scale) */
    const imgEl  = img.getElement() as HTMLImageElement
    const nat = { w: imgEl.naturalWidth  || img.width!,
                  h: imgEl.naturalHeight || img.height! }
    const { cropX=0, cropY=0, width=nat.w, height=nat.h } = img

    const prevLockUniScaling = img.lockUniScaling
    const prevCenteredScaling = img.centeredScaling
    const prevHasBorders = img.hasBorders
    const prevLockRotation = img.lockRotation
    img.set({
      left  : (img.left ?? 0) - cropX * (img.scaleX ?? 1),
      top   : (img.top  ?? 0) - cropY * (img.scaleY ?? 1),
      width : nat.w,
      height: nat.h,
      cropX : 0,
      cropY : 0,
      lockRotation   : true,
      lockScalingFlip: true,
      lockUniScaling : true,
      centeredScaling: false,
      hasControls    : true,
      selectable     : true,
      evented        : true,
    }).setCoords()

    /* temporarily enlarge the canvas so the full image stays visible */
    this.baseW = this.fc.getWidth()
    this.baseH = this.fc.getHeight()
    this.baseZoom = this.fc.getZoom()
    const wrapper = (this.fc as any).wrapperEl as HTMLElement | undefined
    if (wrapper) {
      this.wrapper = wrapper
      this.scrollLeft = wrapper.scrollLeft
      this.scrollTop = wrapper.scrollTop
      this.wrapStyles = {
        w : wrapper.style.width,
        h : wrapper.style.height,
        mw: wrapper.style.maxWidth,
        mh: wrapper.style.maxHeight,
        transform: wrapper.style.transform,
      }
    }
    const br = img.getBoundingRect(true, true)

    const offsetX = Math.max(0, -br.left) * this.SCALE
    const offsetY = Math.max(0, -br.top)  * this.SCALE

    if (offsetX || offsetY) {
      this.fc.relativePan(new fabric.Point(offsetX, offsetY))
      this.panX = offsetX
      this.panY = offsetY
      if (wrapper) {
        wrapper.style.transform = `translate(${-offsetX}px, ${-offsetY}px)`
      }
    }

    const needW = Math.max(this.baseW + offsetX,
                           offsetX + (br.left + br.width) * this.SCALE)
    const needH = Math.max(this.baseH + offsetY,
                           offsetY + (br.top + br.height) * this.SCALE)
    if (needW > this.baseW || needH > this.baseH) {
      this.fc.setWidth(needW)
      this.fc.setHeight(needH)
      if (wrapper) {
        wrapper.style.width = `${needW}px`
        wrapper.style.height = `${needH}px`
        wrapper.style.maxWidth = `${needW}px`
        wrapper.style.maxHeight = `${needH}px`
      }
    }
    this.cleanup.push(() => {
      img.lockUniScaling  = prevLockUniScaling
      img.centeredScaling = prevCenteredScaling
      img.hasBorders      = prevHasBorders
      img.lockRotation    = prevLockRotation
    })
    /* hide the rotate ("mtr") and side controls while cropping */
    const vis = (img as any)._controlsVisibility || {}
    this.prevControls = {
      mtr: vis.mtr ?? true,
      ml : vis.ml  ?? true,
      mr : vis.mr  ?? true,
      mt : vis.mt  ?? true,
      mb : vis.mb  ?? true,
    }
    img.setControlsVisibility({
      mtr: false,          // hide rotation
      ml : false, mr : false,      // hide middle-left / middle-right
      mt : false, mb : false       // hide middle-top / middle-bottom
    });
    img.hasBorders  = false
    img.borderColor = this.SEL          // keep consistent style if shown
    img.borderDashArray = []           // solid border

    /* ② persistent crop window */
    const fx = (img.left ?? 0) + cropX * (img.scaleX ?? 1)
    const fy = (img.top  ?? 0) + cropY * (img.scaleY ?? 1)
    const fw =  width    * (img.scaleX ?? 1)
    const fh =  height   * (img.scaleY ?? 1)

    const grid = { stroke:'#ffffff22', strokeWidth:1/this.SCALE,
                   selectable:false, evented:false }

    this.frame = new fabric.Group([
      new fabric.Rect({ left:0, top:0, width:fw, height:fh,
        fill:'',
        perPixelTargetFind:false,   // relax pixel-perfect hit-testing
        evented:false,
        stroke:'transparent', strokeWidth:0,
        strokeUniform:true }),
    ],{
      left:fx, top:fy, originX:'left', originY:'top',
      angle: img.angle || 0,              // match image rotation
      selectable:true, evented:true,  lockRotation:true,   // controls work; interior clicks fall through
      hasBorders:false, 
      lockMovementX:true,  lockMovementY:true,   // window position stays fixed
      lockScalingX:false, lockScalingY:false, 
      //centeredScaling:true,            // scale outward from centre
      transparentCorners:false,
      subTargetCheck: true,          // let clicks inside the rectangle fall through
    })
    // ---- replace default controls with 4 small white “L” handles ----
    // slightly larger "L" handles for easier grabbing
    const sizePx = 4 / this.SCALE;

    /** Draw a single L‑shape, rotated for each corner */
    const drawL = (
      ctx : CanvasRenderingContext2D,
      left: number,
      top : number,
      rot : number,                                  // radians
    ) => {
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(rot);
      ctx.lineWidth   = 0.5 / this.SCALE;
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.35)';          // subtle outline
      ctx.shadowBlur  = 3 / this.SCALE;
      ctx.beginPath();
      ctx.moveTo(0,  0);
      ctx.lineTo(0,  sizePx * 0.8);    // vertical down from origin
      ctx.moveTo(0,  0);
      ctx.lineTo(sizePx * 0.8, 0);     // horizontal right
      ctx.stroke();
      ctx.restore();
    };

    /** corner control factory with proper orientation */
    const mkCorner = (x: number, y: number) =>
      new fabric.Control({
        x, y,
        offsetX: 0, offsetY: 0,
        // enlarge hit‑box for easier grabbing
        sizeX: 12 / this.SCALE,
        sizeY: 12 / this.SCALE,
        // use Fabric helpers (cast to `any` to silence TS)
        cursorStyleHandler: (fabric as any).controlsUtils.scaleCursorStyleHandler,
        actionHandler     : (fabric as any).controlsUtils.scalingEqually,
        actionName        : 'scale',   // ensure Fabric treats this as scaling, not drag
        render            : () => {},  // hide canvas handles – DOM overlay shows them
      });

    // keep only the 4 corner controls; no sides, no rotation
    (this.frame as any).controls = {
      tl: mkCorner(-0.5, -0.5),
      tr: mkCorner( 0.5, -0.5),
      br: mkCorner( 0.5,  0.5),
      bl: mkCorner(-0.5,  0.5),
    } as Record<string, fabric.Control>;

    /* ③ add both to canvas and keep z‑order intuitive              */
    this.fc.add(this.frame)
    /* 2‑b ─ dim everything outside the crop window -------------------- */
    const mask = new fabric.Path('M 0 0 Z', {
      fill: 'rgba(0,0,0,0.4)', selectable: false, evented: false,
      originX: 'left', originY: 'top',
      absolutePositioned: true, fillRule: 'evenodd',
      excludeFromExport: true,
    });
    this.masks = [mask];
    this.fc.add(mask);
    // make sure crop elements stay on top
    this.frame.bringToFront();
    this.updateMasks();

    // Enforce minimum scale from the outset
    this.clamp(true);

    this.fc.setActiveObject(this.frame)

    /* ------------------------------------------------------------------
     *  DOM‑level pointer capture – runs *before* Fabric's own handler.
     *  Whichever corner the user pressed (bitmap OR frame) becomes the
     *  active object, so the drag starts without an extra click.
     * ------------------------------------------------------------------ */
    /* ------- Canva‑style dynamic handle visibility --------------------
       All handles are visible until the user grabs one.  While dragging,
       only the active object (bitmap OR frame) shows its controls; the
       moment the mouse is released we restore both sets.               */
    const beforeHandler = (e: fabric.IEvent) => {
      const t = (e as any).transform?.target as fabric.Object | undefined;
      if (!t || (t !== this.img && t !== this.frame)) return;

      // Hide both sets first…
      if (this.img)   this.img.hasControls = false;
      if (this.frame) this.frame.hasControls = false;

      // …then re‑enable the one that is actually being transformed
      t.hasControls = true;

      // If the user begins scaling the crop frame, remember the
      // *opposite* edges so they remain fixed during the drag.
      if (t === this.frame && (e as any).transform?.action === 'scale') {
        const c = (e as any).transform.corner;             // 'tl', 'tr', 'br', 'bl'
        const f = this.frame!;
        const left   = f.left!;
        const top    = f.top!;
        const w      = f.width!  * f.scaleX!;
        const h      = f.height! * f.scaleY!;
        const angle  = (f.angle || 0) * Math.PI / 180;
        const cos    = Math.cos(angle);
        const sin    = Math.sin(angle);

        const tl = { x: left,           y: top };
        const tr = { x: left + w * cos, y: top + w * sin };
        const bl = { x: left - h * sin, y: top + h * cos };
        const br = { x: tr.x - h * sin, y: tr.y + h * cos };

        switch (c) {
          case 'br':
            anchorCorner = 'tl';
            anchorPos = tl;
            break;
          case 'tl':
            anchorCorner = 'br';
            anchorPos = br;
            break;
          case 'tr':
            anchorCorner = 'bl';
            anchorPos = bl;
            break;
          case 'bl':
            anchorCorner = 'tr';
            anchorPos = tr;
            break;
        }
        // 🔒 Freeze the photo's position so scaling the frame can't drag it.
        if (this.img) {
          this.img.lockMovementX = true;
          this.img.lockMovementY = true;
        }
      } else if (t === this.img && (e as any).transform?.action === 'scale') {
        const c = (e as any).transform.corner as string | undefined;
        const i = this.img!;
        const left   = i.left!;
        const top    = i.top!;
        const right  = left + i.getScaledWidth();
        const bottom = top  + i.getScaledHeight();

        imgEdge = {};
        switch (c) {
          case 'br':
            imgEdge.left = left;
            imgEdge.top  = top;
            break;
          case 'tl':
            imgEdge.right  = right;
            imgEdge.bottom = bottom;
            break;
          case 'tr':
            imgEdge.left   = left;
            imgEdge.bottom = bottom;
            break;
          case 'bl':
            imgEdge.top   = top;
            imgEdge.right = right;
            break;
        }
      }
    };

    const upHandler = () => {
      if (this.frame) {
        this.frame.bringToFront();
      }
      if (this.img)   {
        this.img.hasControls = true;
        this.img.setCoords();
      }
      if (this.frame) {
        this.frame.hasControls = true;
        this.frame.setCoords();
      }
      this.updateMasks();
      // keep the mask in front of the photo for consistent dimming
      this.masks.forEach(m => m.bringToFront?.());
      this.frame?.bringToFront();
      this.fc.requestRenderAll();            // refresh immediately
    };

    this.fc.on('before:transform', beforeHandler);
    this.fc.on('mouse:up', upHandler);

    // ----------------------------------------
    // Pointer down: decide what the user wants
    // ----------------------------------------
    const downHandler = (e: fabric.IEvent) => {
      if (!this.isActive || !this.img || !this.frame) return;

      const target  = e.target as fabric.Object | undefined;
      const pointer = this.fc.getPointer(e.e as any, false);

      // Reliable corner hit‑test (e.corner isn’t yet set on mouse:down)
      const findCorner = (fabric as any).controlsUtils?.findCorner;
      let hitCorner  = findCorner
        ? findCorner(this.frame, pointer, 30 / this.SCALE)   // 30 px tolerance
        : (e as any).corner;                                 // fallback

      // Fabric sometimes returns null before the first render; fall back to
      // e.corner if it’s already set (e.g. during rapid double‑clicks)
      if (!hitCorner && (e as any).corner) {
        // normalise to 'tl' / 'tr' / 'bl' / 'br' just like findCorner()
        hitCorner = (e as any).corner;
      }

      /* 1️⃣  Pointer landed on a corner control → let Fabric scale immediately */
      if (hitCorner) {
        if (this.fc.getActiveObject() !== this.frame) {
          this.fc.setActiveObject(this.frame);        // be sure!
        }
        return;                                       // Fabric runs transform
      }

      /* 2️⃣  Clicked the frame’s interior (or directly on the bitmap) — start panning */
      const hitImage = target === this.img;

      /* Fallback: check pointer against the frame’s bounding box so an
         interior click is recognised even when `containsPoint()` fails
         (e.g. event target is null because the frame is non‑evented).  */
      const br = this.frame.getBoundingRect(true, true);
      const inBox = pointer.x >= br.left && pointer.x <= br.left + br.width &&
                    pointer.y >= br.top  && pointer.y <= br.top  + br.height;

      const insideWindow = !hitCorner && (hitImage || inBox);

      if (insideWindow) {
      // Temporarily turn off the frame so pointer events fall through to bitmap
          this.frameScaling = false;
      restoreFrameSelectable = this.frame.selectable;
      restoreFrameEvented    = this.frame.evented;
      this.frame.selectable  = false;
      this.frame.evented     = false;

        isDraggingImage = true;
        dragOrig.x     = pointer.x;
        dragOrig.y     = pointer.y;
        imgOrigPos.x   = this.img.left!;
        imgOrigPos.y   = this.img.top!;

        // Activate bitmap so arrow keys etc. reflect its state
        if (this.fc.getActiveObject() !== this.img) {
          this.fc.setActiveObject(this.img);
        }

        // Block Fabric from starting any transform on the frame
        e.e?.preventDefault?.();
        e.e?.stopPropagation?.();
      }
    };

    // ------------------------------------------------
    // Pointer move: if we’re in panning mode, relocate
    // ------------------------------------------------
    const moveHandler = (e: fabric.IEvent) => {
        if (this.frameScaling) return;
      if (!isDraggingImage || !this.img) return;

      const pointer = this.fc.getPointer(e.e as any, false);
      const dx = pointer.x - dragOrig.x;
      const dy = pointer.y - dragOrig.y;

      this.img.set({ left: imgOrigPos.x + dx,
                     top : imgOrigPos.y + dy });

      this.clamp();                 // keep photo covering the window
      this.img.setCoords();
      this.updateMasks();
      // keep dim overlay & frame visible over the photo
      this.masks.forEach(m => m.bringToFront?.());
      this.frame?.bringToFront();
      this.fc.requestRenderAll();
    };

    // ----------------------------------------
    // Pointer up: stop any manual image drag
    // ----------------------------------------
    const upStopDrag = () => {
      // Restore frame interactivity after drag finishes
      if (restoreFrameSelectable !== undefined) this.frame!.selectable = restoreFrameSelectable;
      if (restoreFrameEvented    !== undefined) this.frame!.evented    = restoreFrameEvented;
      restoreFrameSelectable = restoreFrameEvented = undefined;
      this.frameScaling = false;
      isDraggingImage = false;
    };

    this.fc.on('mouse:down',  downHandler);
    this.fc.on('mouse:move',  moveHandler);
    this.fc.on('mouse:up',    upStopDrag);

    this.cleanup.push(() => {
      this.fc.off('mouse:down', downHandler);
      this.fc.off('mouse:move', moveHandler);
      this.fc.off('mouse:up',   upStopDrag);
    });

    // remember for teardown
    this.cleanup.push(() => {
      this.fc.off('before:transform', beforeHandler);
      this.fc.off('mouse:up', upHandler);
    });


    /* ------------------------------------------------------------
     *  Ensure corner data is up‑to‑date once a transform finishes.
     *  Fabric fires `object:modified` after scaling/moving ends,
     *  guaranteeing the object’s final scaleX/scaleY/left/top are
     *  committed.  Calling `setCoords()` here realigns both the
     *  object’s bounding box *and* its per‑corner control cache.
     * ----------------------------------------------------------- */
    const modifiedHandler = (e: fabric.IEvent) => {
      const t = e.target as fabric.Object | undefined;
      if (!t || (t !== this.img && t !== this.frame)) return;

      t.setCoords();
      if (t === this.img) this.clamp();          // keep entire photo filling the frame
      if (this.img)   this.img.hasControls = true;
      if (this.frame) this.frame.hasControls = true;
      this.updateMasks();
      this.fc.requestRenderAll();
    };

    this.fc.on('object:modified', modifiedHandler);
    this.cleanup.push(() =>
      this.fc.off('object:modified', modifiedHandler)
    );

    /* ④ dual‑handle rendering + clamping */
    // draw both control sets every frame
    this.fc.on('after:render', this.renderBoth)

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
      .on('moving', () => {
        this.clampFrame();            // keep frame inside bitmap
        this.frame!.setCoords();
        this.updateMasks(); 
      })
      .on('scaling', () => {
        const f = this.frame!;
        const w = f.width!  * f.scaleX!;
        const h = f.height! * f.scaleY!;
        const angle = (f.angle || 0) * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        let newLeft = f.left!;
        let newTop  = f.top!;
        switch (anchorCorner) {
          case 'tl':
            newLeft = anchorPos.x;
            newTop  = anchorPos.y;
            break;
          case 'br':
            newLeft = anchorPos.x - w * cos + h * sin;
            newTop  = anchorPos.y - w * sin - h * cos;
            break;
          case 'tr':
            newLeft = anchorPos.x - w * cos;
            newTop  = anchorPos.y - w * sin;
            break;
          case 'bl':
            newLeft = anchorPos.x + h * sin;
            newTop  = anchorPos.y - h * cos;
            break;
        }

        f.set({ left: newLeft, top: newTop });
        this.clampFrame();            // keep window within bitmap limits
        this.frame!.setCoords();
        this.updateMasks();
        this.frameScaling = true;       // flag ON while corner is dragged
        // no extra requestRenderAll() – avoids double clear of contextTop
      })
      .on('scaled', () => {
        // 🔓 Re‑enable normal movement on the bitmap
        if (this.img) {
          this.img.lockMovementX = false;
          this.img.lockMovementY = false;
        }
        this.clampFrame();            // enforce bounds once scale is done
        this.frame!.setCoords();
        // restore both handle sets
        this.frame!.hasControls = true;
        if (this.img) this.img.hasControls = true;
        this.updateMasks();
        this.frameScaling = false;   // flag OFF once user releases the mouse
        anchorCorner = null;
        this.fc.requestRenderAll();
      });

    // while scaling we just repaint; we update coordinates only once when the
    // gesture ends (object:scaled) so the math uses the final scale factors.
    img
      .on('moving', () => {
        // keep the photo within the crop window as it drags
        this.clamp();
        this.img!.setCoords();
        this.updateMasks();        // automatic redraw already in flight
      })
      .on('scaling', (e: fabric.IEvent) => {
        // defer min-size enforcement until 'scaled' to avoid jitter
        const i = this.img!;
        // 🔒 Keep aspect ratio locked (uniform scaling) during drag
        if (i.lockUniScaling) {
          i.scaleY = i.scaleX;
        }
        // --- Determine the absolute minimum uniform scale for this tick ----
        // 1) basic frame‑fit scale (width / height only)
        const f = this.frame!;
        const minSX = (f.width!  * f.scaleX!) / i.width!;
        const minSY = (f.height! * f.scaleY!) / i.height!;
        let neededScale = Math.max(minSX, minSY);

        // 2) coverage scale – depends on which edges are locked this drag
        const fLeft   = f.left!;
        const fTop    = f.top!;
        const fRight  = fLeft + f.width!  * f.scaleX!;
        const fBottom = fTop  + f.height! * f.scaleY!;

        // The bitmap edge that stays fixed during this gesture (taken from imgEdge)
        // If left is locked, the bitmap's left won't move; so its right must reach fRight
        if (imgEdge.left !== undefined) {
          const needW = fRight - imgEdge.left;
          neededScale = Math.max(neededScale, needW / i.width!);
        }
        // If right is locked, its left must reach fLeft
        if (imgEdge.right !== undefined) {
          const needW = imgEdge.right - fLeft;
          neededScale = Math.max(neededScale, needW / i.width!);
        }
        // If top is locked, its bottom must reach fBottom
        if (imgEdge.top !== undefined) {
          const needH = fBottom - imgEdge.top;
          neededScale = Math.max(neededScale, needH / i.height!);
        }
        // If bottom is locked, its top must reach fTop
        if (imgEdge.bottom !== undefined) {
          const needH = imgEdge.bottom - fTop;
          neededScale = Math.max(neededScale, needH / i.height!);
        }

        if (i.scaleX! < neededScale) {
          i.scaleX = i.scaleY = neededScale;
          const t = (e as any).transform;
          if (t) t.scaleX = t.scaleY = neededScale; // keep Fabric’s live transform synced
        }
        // Make absolutely sure the bitmap still covers the frame mid‑gesture
        this.clamp(true);
        const w = i.width!  * i.scaleX!;
        const h = i.height! * i.scaleY!;
        if (imgEdge.left   !== undefined) i.left = imgEdge.left;
        if (imgEdge.top    !== undefined) i.top  = imgEdge.top;
        if (imgEdge.right  !== undefined) i.left = imgEdge.right  - w;
        if (imgEdge.bottom !== undefined) i.top  = imgEdge.bottom - h;

        i.setCoords();
        this.updateMasks();
        this.frameScaling = true;       // ON while photo itself is scaling
        // Fabric’s own transform loop is already rendering each tick
      })
      .on('scaled', () => {
        imgEdge = {};
        this.frameScaling = false;   // OFF at end of gesture
        this.clamp(true);            // final clamp at end of gesture
        this.img!.setCoords();
        // restore both handle sets now that the gesture is finished
        this.img!.hasControls = true;
        if (this.frame) this.frame.hasControls = true;
        this.updateMasks();
        this.fc.requestRenderAll();
      });

    // remove object event listeners when crop ends
    this.cleanup.push(() => {
      this.frame?.off('moving');
      this.frame?.off('scaling');
      this.frame?.off('scaled');
      img.off('moving');
      img.off('scaling');
      img.off('scaled');
    });
  }

  public cancel () {
    if (this.isActive && this.img && this.orig) {
      this.img.set({
        left  : this.orig.left,
        top   : this.orig.top,
        cropX : this.orig.cropX,
        cropY : this.orig.cropY,
        width : this.orig.width,
        height: this.orig.height,
      }).setCoords();
      this.fc.setActiveObject(this.img);
      this.img.fire('modified');
      this.fc.fire('object:modified', { target: this.img } as any);
    }
    this.teardown(false);
  }

  public commit () {
    if (this.isActive && this.img && this.frame) {
      const { img, frame } = this;
      const sX = img.scaleX ?? 1;
      const sY = img.scaleY ?? 1;
      const cropX = (frame.left! - img.left!) / sX;
      const cropY = (frame.top!  - img.top!)  / sY;
      const cropW = frame.width!  * frame.scaleX! / sX;
      const cropH = frame.height! * frame.scaleY! / sY;

      img.set({
        left  : frame.left!,
        top   : frame.top!,
        cropX : cropX,
        cropY : cropY,
        width : cropW,
        height: cropH,
      }).setCoords();

      this.fc.setActiveObject(img);
      img.fire('modified');
      this.fc.fire('object:modified', { target: img } as any);
    }
    this.teardown(true);
  }

  /** Abort cropping without firing any events */
  public abort () {
    this.teardown(false);
  }

  /* ─────────────── internal helpers ────────────────────────────── */
  private teardown (keep:boolean) {
    if (!this.isActive) return

    // run and clear any on‑crop listeners
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];

    this.fc.off('after:render', this.renderBoth)
    if (this.frame) this.fc.remove(this.frame)
    this.masks.forEach(r => this.fc.remove(r));
    this.masks = [];
    if (!keep) this.fc.discardActiveObject()
    this.fc.requestRenderAll()
    if (this.baseW && this.baseH) {
      const zoomRatio = this.fc.getZoom() / this.baseZoom
      this.fc.setWidth(this.baseW * zoomRatio)
      this.fc.setHeight(this.baseH * zoomRatio)
      const wrap = (this.fc as any).wrapperEl as HTMLElement | undefined
      if (wrap && this.wrapStyles) {
        const w  = parseFloat(this.wrapStyles.w)  || 0
        const h  = parseFloat(this.wrapStyles.h)  || 0
        const mw = parseFloat(this.wrapStyles.mw) || 0
        const mh = parseFloat(this.wrapStyles.mh) || 0
        if (w)  wrap.style.width = `${w * zoomRatio}px`
        if (h)  wrap.style.height = `${h * zoomRatio}px`
        if (mw) wrap.style.maxWidth = `${mw * zoomRatio}px`
        if (mh) wrap.style.maxHeight = `${mh * zoomRatio}px`
        wrap.style.transform = this.wrapStyles.transform
      }
      this.baseW = 0
      this.baseH = 0
      this.baseZoom = 1
      this.wrapStyles = null
    }
    if (this.panX || this.panY) {
      this.fc.relativePan(new fabric.Point(-this.panX, -this.panY))
      if (this.wrapper) {
        this.wrapper.scrollLeft = this.scrollLeft
        this.wrapper.scrollTop  = this.scrollTop
        if (this.wrapStyles) {
          this.wrapper.style.transform = this.wrapStyles.transform
        }
      }
      this.panX = 0
      this.panY = 0
      this.wrapper = null
      this.scrollLeft = 0
      this.scrollTop = 0
    }
    // ensure any leftover overlay is cleared
    const ctx = (this.fc as any).contextTop
    if (ctx) this.fc.clearContext(ctx)

    if (this.img) {
      if (this.prevControls) {
        this.img.setControlsVisibility(this.prevControls)
        this.prevControls = null
      }
      this.img.lockMovementX = false
      this.img.lockMovementY = false
      // allow free resizing again
      this.img.minScaleLimit = 0
    }
    this.frame    = null
    this.img      = null
    this.orig     = null
    this.isActive = false
    this.onChange?.(false)
  }

  /* keep bitmap inside frame */
  private clamp = (force = false, reposition = true) => {
    if (!force && this.frameScaling) return;
    if (!this.img || !this.frame) return
    const { img, frame } = this
    const minSX = frame.width!*frame.scaleX! / img.width!
    const minSY = frame.height!*frame.scaleY! / img.height!
    const minScale = Math.max(minSX, minSY)
    img.minScaleLimit = minScale

    if ((img.scaleX ?? 1) < minScale) {
      img.scaleX = img.scaleY = minScale
    } else if (img.lockUniScaling) {
      img.scaleY = img.scaleX
    }

    if (reposition) {
      const angle = (frame.angle || 0) * Math.PI / 180
      const cos = Math.cos(-angle)
      const sin = Math.sin(-angle)

      const fw = frame.width! * frame.scaleX!
      const fh = frame.height! * frame.scaleY!
      const iw = img.getScaledWidth()
      const ih = img.getScaledHeight()

      let ix = (img.left! - frame.left!) * cos - (img.top! - frame.top!) * sin
      let iy = (img.left! - frame.left!) * sin + (img.top! - frame.top!) * cos

      ix = Math.min(0, Math.max(fw - iw, ix))
      iy = Math.min(0, Math.max(fh - ih, iy))

      const newLeft = frame.left! + ix * Math.cos(angle) - iy * Math.sin(angle)
      const newTop  = frame.top!  + ix * Math.sin(angle) + iy * Math.cos(angle)

      img.set({ left: newLeft, top: newTop })
    }
    img.setCoords()
  }

  /* keep frame inside bitmap */
  private clampFrame = () => {
    if (!this.img || !this.frame) return
    const { img, frame } = this

    const angle = (img.angle || 0) * Math.PI / 180
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)

    const iw = img.getScaledWidth()
    const ih = img.getScaledHeight()
    const fw = frame.width! * frame.scaleX!
    const fh = frame.height! * frame.scaleY!

    let fx = (frame.left! - img.left!) * cos - (frame.top! - img.top!) * sin
    let fy = (frame.left! - img.left!) * sin + (frame.top! - img.top!) * cos

    if (fx < 0) fx = 0
    if (fy < 0) fy = 0
    if (fx + fw > iw) frame.scaleX! *= (iw - fx) / fw
    if (fy + fh > ih) frame.scaleY! *= (ih - fy) / fh

    fx = Math.min(fx, iw - fw)
    fy = Math.min(fy, ih - fh)

    const newLeft = img.left! + fx * Math.cos(angle) - fy * Math.sin(angle)
    const newTop  = img.top!  + fx * Math.sin(angle) + fy * Math.cos(angle)

    frame.set({ left: newLeft, top: newTop })

    // Update bitmap's minimum scale so it can never shrink smaller
    const minSX = (frame.width! * frame.scaleX!) / img.width!
    const minSY = (frame.height! * frame.scaleY!) / img.height!
    img.minScaleLimit = Math.max(minSX, minSY)

    frame.setCoords()
  }

  private updateMasks = () => {
    if (!this.frame || this.masks.length === 0) return

    const vpt = this.fc.viewportTransform || [1, 0, 0, 1, 0, 0]
    const zoom = vpt[0] || 1

    const viewLeft = -vpt[4] / zoom
    const viewTop  = -vpt[5] / zoom

    const w = this.fc.getWidth()  / zoom
    const h = this.fc.getHeight() / zoom

    const f = this.frame
    const angle = (f.angle || 0) * Math.PI / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const fw = f.width! * f.scaleX!
    const fh = f.height! * f.scaleY!
    const fx = f.left!
    const fy = f.top!

    const tl = { x: fx,             y: fy }
    const tr = { x: fx + fw * cos,  y: fy + fw * sin }
    const bl = { x: fx - fh * sin,  y: fy + fh * cos }
    const br = { x: tr.x - fh * sin, y: tr.y + fh * cos }

    const path = [
      `M ${viewLeft} ${viewTop}`,
      `L ${viewLeft + w} ${viewTop}`,
      `L ${viewLeft + w} ${viewTop + h}`,
      `L ${viewLeft} ${viewTop + h}`,
      'Z',
      `M ${tl.x} ${tl.y}`,
      `L ${tr.x} ${tr.y}`,
      `L ${br.x} ${br.y}`,
      `L ${bl.x} ${bl.y}`,
      'Z'
    ].join(' ')

    // replace existing mask with updated path
    this.fc.remove(this.masks[0])
    const mask = new fabric.Path(path, {
      fill: 'rgba(0,0,0,0.4)',
      originX: 'left', originY: 'top',
      absolutePositioned: true,
      selectable: false, evented: false,
      fillRule: 'evenodd', excludeFromExport: true,
    })
    this.masks[0] = mask
    this.fc.add(mask)
    this.frame.bringToFront()
  }

    /** Minimum uniform scale so the image fully covers the crop window,
   *  taking the current left/top gap into account.
   */
    private coverScale = () => {
      if (!this.img || !this.frame) return 1;
      const { img, frame } = this;
  
      const frameRight  = frame.left! + frame.width!  * frame.scaleX!;
      const frameBottom = frame.top!  + frame.height! * frame.scaleY!;
      const imgLeft     = img.left!;
      const imgTop      = img.top!;
  
      const needW = frameRight  - imgLeft;  // width needed to reach frame’s right edge
      const needH = frameBottom - imgTop;   // height needed to reach frame’s bottom edge
  
      return Math.max(needW / img.width!, needH / img.height!);
    }

  /* draw controls for both objects each frame */
  private renderBoth = () => {
    if (!this.img || !this.frame) return

    // Always refresh corner caches before drawing controls so they track
    // live transforms even after repeated scale gestures.
    this.img.setCoords();
    this.frame.setCoords();

        const ctx = (this.fc as any).contextTop
        if (!ctx) return;            // canvas disposed or not yet initialised
        /* Fabric doesn’t always wipe contextTop if it draws nothing of its own.
           Clear it ourselves before redrawing both control sets. */
        this.fc.clearContext(ctx)

    ctx.save()
    const vpt = this.fc.viewportTransform;
    if (vpt) {
      //          a     b     c     d     e     f
      ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);
    }      // draw in the same space as Fabric
    /* ---- Persistent bitmap outline while cropping ---- */
    // Only the DOM overlay should show the active border and handles.
    // Skip drawing Fabric's own outline to avoid duplicate borders.
    if (this.img?.hasControls)   this.img.drawControls(ctx);
    if (this.frame?.hasControls) this.frame.drawControls(ctx);
    ctx.restore()
  }
}