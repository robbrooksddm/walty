/**********************************************************************
 * FabricCanvas.tsx — one Fabric canvas (front · inner-L · inner-R · back)
 *********************************************************************/
'use client';

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

/* ──────────────────────────────────────────────────────────────────
   1 ▪ guard every Fabric call that might receive a null context
   ──────────────────────────────────────────────────────────────── */
if (!(fabric as any).__nullCtxSafe) {
  const protect = (proto: any, fn: string, passCtx = false) => {
    const orig = proto[fn];
    if (!orig) return;
    proto[fn] = function (ctx: CanvasRenderingContext2D | null, ...rest: any[]) {
      if (!ctx) return;                          // swallow null ctx
      // eslint-disable-next-line prefer-spread
      return passCtx ? orig.call(this, ctx, ...rest) : orig.call(this, ctx);
    };
  };

  [fabric.Canvas.prototype, fabric.StaticCanvas.prototype].forEach(p => {
    protect(p, 'clearContext');
    protect(p, 'renderCanvas', true);
  });

  for (const m of ['save', 'restore'] as const) {
    const orig = (CanvasRenderingContext2D.prototype as any)[m];
    (CanvasRenderingContext2D.prototype as any)[m] = function (...a: any[]) {
      if (!this) return;
      // eslint-disable-next-line prefer-spread
      orig.apply(this, a);
    };
  }
  (fabric as any).__nullCtxSafe = true;
}

/* 2 ▪ skip renderTopLayer when its ctxTop is null (happens on blur) */
if (!(fabric as any).__nullTopSafe) {
  const orig = (fabric.Canvas.prototype as any).renderTopLayer;
  if (orig) {
    (fabric.Canvas.prototype as any).renderTopLayer = function (...a: any[]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore runtime field
      if (!this.contextTop) return;
      // eslint-disable-next-line prefer-spread
      return orig.apply(this, a);
    };
  }
  (fabric as any).__nullTopSafe = true;
}

/* ───────────────────────── helpers / types / constants ────────── */
const hex = (c = '#000') =>
  c.length === 4
    ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`.toLowerCase()
    : c.toLowerCase();

export interface Layer {
  type: 'image' | 'text';
  /* image */ src?: string;
  /* text  */ text?: string; fontSize?: number; fill?: string;
  width?: number; height?: number;
  x: number; y: number;
  editable?: boolean; selectable?: boolean;
}
export interface TemplatePage { name: string; layers: Layer[] }

const W = 1240, H = 1748;                           // full-res page
const PRE_W = 420, PRE_H = Math.round(H * PRE_W / W);
const SCALE    = PRE_W / W;
const HANDLE   = Math.round( 4 / SCALE);            // tiny handles
const DEF_FONT = Math.round(32 / SCALE);

/* helper type that “knows” .show() / .hide() exist at runtime */
type WithVis<T extends fabric.Object> = T & {
  show: () => void;
  hide: () => void;
};

/* dashed-purple hover rectangle — reused, never exported */
const makeHoverRect = (): WithVis<fabric.Rect> => {
  const r = new fabric.Rect({
    left: 0, top: 0, width: 10, height: 10,
    fill: 'transparent',
    stroke: '#8b5cf6',
    strokeWidth: 2 / SCALE,
    strokeDashArray: [6 / SCALE, 4 / SCALE],
    selectable: false,
    evented: false,
    hoverCursor: 'default',
    excludeFromExport: true,
  }) as WithVis<fabric.Rect>;

  // runtime helpers
  r.show = function () { this.set('visible', true ); };
  r.hide = function () { this.set('visible', false); };

  return r;
};

/* =============================================================== */
export default function FabricCanvas({
  pageIdx, page, onReady,
}: {
  pageIdx : number;
  page    ?: TemplatePage;
  onReady : (fc: fabric.Canvas | null) => void;
}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const fcRef      = useRef<fabric.Canvas | null>(null);
  const hoverRect  = useRef<WithVis<fabric.Rect> | null>(null);

  /* ---------- mount ------------------------------------------------ */
  useEffect(() => {
    if (!canvasRef.current) return;

    const fc = new fabric.Canvas(canvasRef.current, {
      backgroundColor:'#fff',
      width: W, height: H,
    });

    fc.setViewportTransform([SCALE,0,0,SCALE,0,0]);
    fc.setWidth (PRE_W);
    fc.setHeight(PRE_H);

    fabric.Object.prototype.cornerSize      = HANDLE;
    // @ts-ignore — runtime only
    fabric.Object.prototype.touchCornerSize = HANDLE;

    /* dashed outline shown on hover -------------------------------- */
    const hl = makeHoverRect();
    hoverRect.current = hl;
    fc.add(hl); hl.hide();

    fc.on('mouse:over', e => {
      if ((e.target as any)?.type === 'textbox') {
        const { left, top, width, height } = (e.target as fabric.Object)
          .getBoundingRect(true, true);
        hl.set({ left, top, width, height });
        hl.bringToFront(); hl.show(); fc.requestRenderAll();
      }
    }).on('mouse:out', e => {
      if ((e.target as any)?.type === 'textbox') {
        hl.hide(); fc.requestRenderAll();
      }
    });

    /* -------------------------------------------------------------- */
    fcRef.current = fc;
    onReady(fc);

    return () => { onReady(null); fc.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);                                     // once

  /* ---------- draw / redraw --------------------------------------- */
  useEffect(() => {
    const fc = fcRef.current;
    if (!fc || !page) return;

    const hl = hoverRect.current!;
    hl.hide();                                // hide until next hover

    fc.clear();  fc.add(hl);                  // keep outline on canvas

    let pending = 0;
    const done = () => { if (!pending) fc.requestRenderAll(); };

    page.layers.forEach(ly => {
      /* IMAGE ----------------------------------------------------- */
      if (ly.type === 'image' && ly.src) {
        pending++;
        fabric.Image.fromURL(
          ly.src,
          img => {
            const s = Math.min(1, W / img.width!, H / img.height!);
            img.scale(s).set({
              left: ly.x, top: ly.y,
              originX:'left', originY:'top',
              selectable:false, evented:false,
            });
            fc.add(img); img.sendToBack();
            pending--; done();
          },
          { crossOrigin:'anonymous' }
        );
      }

      /* TEXT ------------------------------------------------------ */
      if (ly.type === 'text' && ly.text) {
        const tb = new fabric.Textbox(ly.text, {
          left: ly.x, top: ly.y,
          originX:'left', originY:'top',
          width: ly.width ?? 200,
          fontSize: ly.fontSize ?? DEF_FONT,
          fill: hex(ly.fill),
          selectable: ly.selectable ?? true,
          editable  : ly.editable   ?? true,
          lockScalingFlip: true,
        });

        /* diagonal resize also scales font-size ------------------ */
        let baseW = tb.width!, baseF = tb.fontSize!;
        tb.on('scaling:start', () => { baseW = tb.width!; baseF = tb.fontSize!; });
        tb.on('scaling', () => {
          const c  = (tb as any).__corner as string;       // runtime
          const sx = tb.scaleX ?? 1;
          tb.scale(1);
          tb.set({
            width   : Math.max(40, baseW * sx),
            fontSize: c==='ml'||c==='mr' ? baseF : Math.max(6, baseF * sx),
          });
          tb.initDimensions(); tb.setCoords(); fc.requestRenderAll();
        });

        /* instant re-flow when toolbar mutates props ------------- */
        tb.on('changed', () => { tb.initDimensions(); tb.setCoords(); fc.requestRenderAll(); });

        fc.add(tb);
      }
    });

    done();
  }, [page?.layers]);

  return (
    <canvas
      ref={canvasRef}
      width={PRE_W}
      height={PRE_H}
      className="border max-w-[420px] w-full h-auto"
    />
  );
}

/* ─────────────────── undo / redo helpers ─────────────────────── */
const _hist: fabric.Object[][] = [];  let _ptr = -1;
const snap = (fc: fabric.Canvas) => {
  _hist.splice(_ptr+1);
  _hist.push(fc.getObjects().map(o => o.toObject()));
  _ptr = _hist.length - 1;
};
export function registerHistory(fc: fabric.Canvas) {
  fc.on('object:modified', () => snap(fc))
    .on('object:added',    () => snap(fc));
  snap(fc);                                      // initial
}
export function undo(fc: fabric.Canvas) {
  if (_ptr <= 0) return;
  _ptr--; fc.loadFromJSON({ objects:_hist[_ptr] }, () => fc.renderAll());
}
export function redo(fc: fabric.Canvas) {
  if (_ptr >= _hist.length - 1) return;
  _ptr++; fc.loadFromJSON({ objects:_hist[_ptr] }, () => fc.renderAll());
}

/* expose the current textbox so TextToolbar is always in sync */
export const getActiveTextbox = (fc: fabric.Canvas | null) =>
  fc && (fc.getActiveObject() as any)?.type === 'textbox'
    ? fc.getActiveObject() as fabric.Textbox
    : null;