/**********************************************************************
 * FabricCanvas.tsx — renders one printable page with Fabric.js
 * Features: purple hover-outline, undo/redo, Delete/Cut/Copy/Paste,
 *           image-visibility fix (setCoords + sendToBack)
 *********************************************************************/
'use client';

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

/* ------------------------------------------------------------------ */
/* 1 ▪ Runtime-safety patches – avoid “null context” errors during HMR */
/* ------------------------------------------------------------------ */
if (!(fabric as any).__patchedForNullCtx) {
  const guard = (proto: any, fn: string, passCtx = false) => {
    const orig = proto[fn];
    if (!orig) return;
    proto[fn] = function (ctx: CanvasRenderingContext2D | null, ...rest: any[]) {
      if (!ctx) return;
      // eslint-disable-next-line prefer-spread
      return passCtx ? orig.call(this, ctx, ...rest) : orig.call(this, ctx);
    };
  };

  [fabric.Canvas.prototype, fabric.StaticCanvas.prototype].forEach((p) => {
    guard(p, 'clearContext');
    guard(p, 'renderCanvas', true);
  });

  (fabric as any).__patchedForNullCtx = true;
}

if (!(fabric as any).__patchedForNullTop) {
  const orig = (fabric.Canvas.prototype as any).renderTopLayer;
  (fabric.Canvas.prototype as any).renderTopLayer = function (...a: any[]) {
    // @ts-ignore runtime field
    if (!this.contextTop) return;
    // eslint-disable-next-line prefer-spread
    return orig.apply(this, a);
  };
  (fabric as any).__patchedForNullTop = true;
}

/* ------------------------------------------------------------------ */
/* 2 ▪ Constants & helpers                                            */
/* ------------------------------------------------------------------ */
const PAGE_W = 1240;
const PAGE_H = 1748;
const PREVIEW_W = 420;
const PREVIEW_H = Math.round((PAGE_H * PREVIEW_W) / PAGE_W);
const SCALE = PREVIEW_W / PAGE_W;

fabric.Object.prototype.cornerSize = Math.round(4 / SCALE);
// @ts-ignore runtime property only
fabric.Object.prototype.touchCornerSize = Math.round(4 / SCALE);

export interface Layer {
  type: 'image' | 'text';
  /* image */
  src?: string;
  width?: number; height?: number;
  /* text  */
  text?: string; fontSize?: number; fill?: string;
  /* shared */
  x: number; y: number;
  editable?: boolean; selectable?: boolean;
}
export interface TemplatePage { name: string; layers: Layer[] }

const hex = (c = '#000') =>
  c.length === 4
    ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`
    : c.toLowerCase();

/* purple hover rectangle */
type WithVis<T extends fabric.Object> = T & { show(): void; hide(): void };
const makeHoverRect = (): WithVis<fabric.Rect> => {
  const r = new fabric.Rect({
    left: 0, top: 0, width: 10, height: 10,
    fill: 'transparent',
    stroke: '#8b5cf6',
    strokeWidth: 2 / SCALE,
    strokeDashArray: [6 / SCALE, 4 / SCALE],
    selectable: false, evented: false,
    hoverCursor: 'default',
    excludeFromExport: true,
    visible: false,
  }) as WithVis<fabric.Rect>;
  r.show = function () { this.set('visible', true ); };
  r.hide = function () { this.set('visible', false); };
  return r;
};

/* ------------------------------------------------------------------ */
/* 3 ▪ Undo / Redo history                                            */
/* ------------------------------------------------------------------ */
const _hist: fabric.Object[][] = [];
let   _ptr  = -1;
const snap = (fc: fabric.Canvas) => {
  _hist.splice(_ptr + 1);
  _hist.push(fc.getObjects().map(o => o.toObject()));
  _ptr = _hist.length - 1;
};
export const registerHistory = (fc: fabric.Canvas) => {
  fc.on('object:added',    () => snap(fc))
    .on('object:modified', () => snap(fc));
  snap(fc);
};
export const undo = (fc: fabric.Canvas) => {
  if (_ptr <= 0) return;
  _ptr--; fc.loadFromJSON({ objects: _hist[_ptr] }, () => fc.renderAll());
};
export const redo = (fc: fabric.Canvas) => {
  if (_ptr >= _hist.length - 1) return;
  _ptr++; fc.loadFromJSON({ objects: _hist[_ptr] }, () => fc.renderAll());
};
export const getActiveTextbox = (fc: fabric.Canvas | null) =>
  fc && (fc.getActiveObject() as any)?.type === 'textbox'
    ? (fc.getActiveObject() as fabric.Textbox)
    : null;

/* ------------------------------------------------------------------ */
/* 4 ▪ React component                                                */
/* ------------------------------------------------------------------ */
export default function FabricCanvas({
  pageIdx,   // reserved (debug)
  page,
  onReady,
}: {
  pageIdx: number;
  page?: TemplatePage;
  onReady: (fc: fabric.Canvas | null) => void;
}) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const fcRef        = useRef<fabric.Canvas | null>(null);
  const hoverRef     = useRef<WithVis<fabric.Rect> | null>(null);
  const clipboardRef = useRef<fabric.Object | null>(null);

  /* ---------- 4.1 Mount Fabric once --------------------------- */
  useEffect(() => {
    if (!canvasRef.current) return;

    const fc = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#fff',
      width: PAGE_W, height: PAGE_H,
    });
    fc.setViewportTransform([SCALE, 0, 0, SCALE, 0, 0]);
    fc.setWidth(PREVIEW_W); fc.setHeight(PREVIEW_H);

    (window as any).__fabric = fc;

    /* hover outline */
    const hl = makeHoverRect();
    hoverRef.current = hl;
    fc.add(hl);

    fc
      .on('mouse:over', (e) => {
        if ((e.target as any)?.type !== 'textbox') return;
        const { left, top, width, height } =
          (e.target as fabric.Object).getBoundingRect(true, true);
        hl.set({ left, top, width, height });
        hl.bringToFront(); hl.show(); fc.renderAll();
      })
      .on('mouse:out', (e) => {
        if ((e.target as any)?.type !== 'textbox') return;
        hl.hide(); fc.renderAll();
      });

    registerHistory(fc); // enable undo/redo

    /* keyboard shortcuts */
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable) return;

      const mod    = e.metaKey || e.ctrlKey;
      const active = fc.getActiveObject();

      /* Delete */
      if ((e.key === 'Delete' || e.key === 'Backspace') && active) {
        fc.remove(active); fc.discardActiveObject();
        fc.requestRenderAll(); snap(fc); e.preventDefault();
      }

      /* Copy */
      if (mod && /c|C/.test(e.key) && active) {
        active.clone((cl: fabric.Object) => { clipboardRef.current = cl; });
      }

      /* Cut */
      if (mod && /x|X/.test(e.key) && active) {
        active.clone((cl: fabric.Object) => {
          clipboardRef.current = cl;
          fc.remove(active);
          fc.requestRenderAll(); snap(fc);
        });
        e.preventDefault();
      }

      /* Paste */
      if (mod && /v|V/.test(e.key) && clipboardRef.current) {
        clipboardRef.current.clone((cl: fabric.Object) => {
          cl.set({
            left: (active?.left ?? 0) + 20,
            top : (active?.top  ?? 0) + 20,
            evented: true, selectable: true,
          });
          fc.add(cl); fc.setActiveObject(cl);
          fc.requestRenderAll(); snap(fc);
        });
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', onKey);

    /* cleanup on unmount */
    fcRef.current = fc; onReady(fc);
    return () => {
      document.removeEventListener('keydown', onKey);
      onReady(null); fc.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- 4.2 Redraw whenever `page` changes --------------- */
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc || !page) return;

    const hl = hoverRef.current;
    fc.clear(); if (hl) fc.add(hl);  // keep outline layer

    page.layers.forEach((ly) => {

/* IMAGE ───────────────────────────────────────────────────── */
if (ly.type === 'image' && ly.src) {
  /* tidy up any previous blob URL */
  if (ly.src.startsWith('blob:')) URL.revokeObjectURL(ly.src);

  const opts =
    ly.src.startsWith('blob:') ? undefined : { crossOrigin: 'anonymous' };

  fabric.Image.fromURL(
    ly.src,
    (img) => {
      /* 1 ▪ scale to fit printable page */
      const s = Math.min(1, PAGE_W / img.width!, PAGE_H / img.height!);
      img.scale(s).set({
        left: ly.x,
        top:  ly.y,
        originX: 'left',
        originY: 'top',
        selectable: ly.selectable ?? true,
        evented:    ly.editable   ?? true,
      });

      /* 2 ▪ add, position in Z-order */
      fc.add(img);
      img.setCoords();
      (ly.editable === false ? img.sendToBack() : img.bringToFront());
      hoverRef.current?.bringToFront();      // keep purple outline on top

      /* 3 ▪ paint NOW – fixes “invisible until click” */
      fc.renderAll();
    },
    opts,
  );
  return;                                   // ← done with this layer
}

      /* TEXT ---------------------------------------------------- */
      if (ly.type === 'text' && ly.text) {
        const tb = new fabric.Textbox(ly.text, {
          left: ly.x, top: ly.y,
          originX: 'left', originY: 'top',
          width   : ly.width    ?? 200,
          fontSize: ly.fontSize ?? Math.round(32 / SCALE),
          fill    : hex(ly.fill ?? '#000'),
          selectable: ly.selectable ?? true,
          editable  : ly.editable   ?? true,
          lockScalingFlip: true,
        });
        fc.add(tb); tb.bringToFront(); if (hl) hl.bringToFront();
      }
    });

    fc.requestRenderAll();
  }, [page]);

  /* ---------- 4.3 JSX ----------------------------------------- */
  return (
    <canvas
      ref={canvasRef}
      width={PREVIEW_W}
      height={PREVIEW_H}
      className="border w-full h-auto max-w-[420px]"
    />
  );
}