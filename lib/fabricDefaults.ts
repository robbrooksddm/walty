/*  fabricDefaults.ts  */
import { fabric } from 'fabric';

/* ————— constants ————— */
export const SCALE        = 420 / 1772;        // or the real SCALE you compute
export const SEL_COLOR    = '#2EC4B6';         // brand teal – shared everywhere
export const HANDLE_SHADOW = 'rgba(0,0,0,0.15)';
export const HANDLE_BLUR   = 1 / SCALE;

/* ————— global Fabric defaults ————— */
(fabric.Object.prototype as any).cornerSize        = Math.round(3 / SCALE);
(fabric.Object.prototype as any).touchCornerSize   = Math.round(3 / SCALE);
(fabric.Object.prototype as any).borderScaleFactor = 1;
(fabric.Object.prototype as any).borderColor       = 'transparent';
(fabric.Object.prototype as any).borderDashArray   = [];
(fabric.Object.prototype as any).cornerStrokeColor = 'transparent';
(fabric.Object.prototype as any).cornerColor       = 'transparent';
(fabric.Object.prototype as any).transparentCorners= true;
(fabric.Object.prototype as any).hasBorders        = false;
(fabric.Object.prototype as any).cornerStyle       = 'circle';

/* ───────────────── helpers ──────────────────────────────── */

// add a faint drop-shadow to any control renderer
function withShadow (
  render: fabric.Control['render'],
): fabric.Control['render'] {
  return function (
    this: fabric.Control,
    ctx, left, top, style, target,
  ) {
    ctx.save();
    ctx.shadowColor = HANDLE_SHADOW;
    ctx.shadowBlur  = HANDLE_BLUR;
    (render as any).call(this, ctx, left, top, style, target);
    ctx.restore();
  };
}

// horizontal pill handle
const pillControl: fabric.Control['render'] = function (
  this: fabric.Control,
  ctx, left, top, style: any, obj,
) {
  style = style || {};
  const s = this.sizeX || style.cornerSize || obj.cornerSize;
  const w = s * 1.6, h = s * 0.4, r = h / 2;

  ctx.save();
  ctx.fillStyle   = style.cornerColor       || obj.cornerColor;
  ctx.strokeStyle = style.cornerStrokeColor || obj.cornerStrokeColor;
  ctx.lineWidth   = 1;
  ctx.translate(left, top);
  ctx.rotate(fabric.util.degreesToRadians(obj.angle ?? 0));

  ctx.beginPath();
  ctx.moveTo(-w/2 + r, -h/2); ctx.lineTo(w/2 - r, -h/2);
  ctx.quadraticCurveTo( w/2, -h/2,  w/2, -h/2 + r);
  ctx.lineTo( w/2,  h/2 - r); ctx.quadraticCurveTo( w/2,  h/2,  w/2 - r,  h/2);
  ctx.lineTo(-w/2 + r,  h/2); ctx.quadraticCurveTo(-w/2,  h/2, -w/2,  h/2 - r);
  ctx.lineTo(-w/2, -h/2 + r); ctx.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2);
  ctx.closePath();

  (ctx as any)[obj.transparentCorners ? 'stroke' : 'fill']();
  if (!obj.transparentCorners) ctx.stroke();
  ctx.restore();
};

// vertical pill (re-uses the horizontal pill, but rotated 90°)
const pillControlV: fabric.Control['render'] = function (
  this: fabric.Control,
  ctx, left, top, style, obj,
) {
  ctx.save();
  ctx.translate(left, top);
  ctx.rotate(fabric.util.degreesToRadians((obj.angle ?? 0) + 90));
  pillControl.call(this, ctx, 0, 0, style, obj);
  ctx.restore();
};

/* ───────────────── wire everything once ─────────────────── */

const utils = (fabric as any).controlsUtils;   // hidden Fabric helpers

// top & bottom – horizontal pill
['mt','mb'].forEach(pos => {
  (fabric.Object.prototype as any).controls[pos].render =
    withShadow(pillControl);
});

// left & right – 90° pill
['ml','mr'].forEach(pos => {
  (fabric.Object.prototype as any).controls[pos].render =
    withShadow(pillControlV);
});

// rotation handle
(fabric.Object.prototype as any).controls.mtr.render =
  withShadow(utils.renderCircleControl);
// move rotation handle below the object
(fabric.Object.prototype as any).controls.mtr.y = 0.5;
(fabric.Object.prototype as any).controls.mtr.offsetY = 30 / SCALE;

// corner circles
['tl','tr','bl','br'].forEach(pos => {
  (fabric.Object.prototype as any).controls[pos].render =
    withShadow(utils.renderCircleControl);
});