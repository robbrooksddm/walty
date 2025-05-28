"use client";

/**
 * Walty-branded image toolbar · May 2025
 * ————————————————————————————————————————
 * • Recoleta font & Walty palette already loaded globally.
 * • Every control is a 44 × 44 px hit-area with teal stroke
 *   and orange hover / active.
 * • Opacity is a Droplet toggle that reveals a slider.
 */

import { useEffect, useState } from "react";
import { fabric } from "fabric";
import { useEditor } from "./EditorStore";
import ToolFlipImage from "./toolbar/ToolFlipImage";

/* lucide-react icons */
import {
  Crop,
  Droplet,
  Eraser,
  Lock,
  Unlock,
  ArrowDownToLine,
  ArrowUpToLine,
  RotateCcw,
  RotateCw,
  Save,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
} from "lucide-react";

/* ───────────────────────── custom flip icons (outline style) ─── */
const MirrorH = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none" {...props}>
    <path d="M8 5 3 12l5 7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 5l5 7-5 7" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const MirrorV = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none" {...props}>
    <path d="M5 8 12 3l7 5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 16l7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="4" y1="12" x2="20" y2="12" />
  </svg>
);

/* ───────────────────────── reusable icon button ─── */
interface IconBtnProps {
  Icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

function IconButton({ Icon, label, onClick, active, disabled }: IconBtnProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-[--walty-orange] focus:ring-offset-1
                  hover:bg-[--walty-orange]/10 disabled:opacity-40
                  ${active ? "bg-[--walty-orange]/10" : ""}`}
    >
      <Icon
        className={`w-6 h-6 stroke-[--walty-teal] transition-colors
                    ${active ? "stroke-[--walty-orange]" : "hover:stroke-[--walty-orange]"}`}
      />
    </button>
  );
}

/* ───────────────────────── main toolbar component ─── */
interface Props {
  canvas: fabric.Canvas | null;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void | Promise<void>;
  saving: boolean;
}

export default function ImageToolbar({ canvas: fc, onUndo, onRedo, onSave, saving }: Props) {
  /* local state / editor wiring */
  const [, force]      = useState({});
  const reorder        = useEditor(s => s.reorder);
  const updateLayer    = useEditor(s => s.updateLayer);
  const activePage     = useEditor(s => s.activePage);
  const [showOpacity, setShowOpacity] = useState(false);

  /* re-render on selection changes */
  useEffect(() => {
    if (!fc) return;

    const tick = () => force({});

    fc.on("selection:created",  tick)
      .on("selection:updated",  tick)
      .on("selection:cleared",  tick);

    return () => {
      fc.off("selection:created",  tick)
        .off("selection:updated",  tick)
        .off("selection:cleared", tick);
    };
  }, [fc]);

  if (!fc) return null;

  /* canvas metrics */
  const zoom = fc.viewportTransform?.[0] ?? 1;
  const fcH  = (fc.getHeight() ?? 0) / zoom;
  const fcW  = (fc.getWidth()  ?? 0) / zoom;

  const img = fc.getActiveObject() as fabric.Image | null;
  if (!img || (img as any).type !== "image") return null;

  /* helper: mutate + refresh */
  const mutate = (p: Partial<fabric.Image>) => {
    img.set(p).setCoords();
    fc.setActiveObject(img);
    fc.requestRenderAll();
    img.fire("modified");
    fc.fire("object:modified", { target: img });
    force({});
  };

  /* page-alignment cycles */
  const cycleVertical = () => {
    const { top, height } = img.getBoundingRect(true, true);
    const pos = [0, fcH / 2 - height / 2, fcH - height];
    mutate({ top: pos[(pos.findIndex(p => Math.abs(top - p) < 1) + 1) % 3] });
  };

  const cycleHorizontal = () => {
    const { left, width } = img.getBoundingRect(true, true);
    const pos = [0, fcW / 2 - width / 2, fcW - width];
    mutate({ left: pos[(pos.findIndex(p => Math.abs(left - p) < 1) + 1) % 3] });
  };

  /* layer lock */
  const locked = Boolean((img as any).locked);
  const toggleLock = () => {
    const next = !locked;
    (img as any).locked = next;
    img.set({
      lockMovementX: next,
      lockMovementY: next,
      lockScalingX : next,
      lockScalingY : next,
      lockRotation : next,
    });
    fc.requestRenderAll();
    updateLayer(activePage, (img as any).layerIdx, { locked: next });
  };

  /* layer order helpers */
  const sendBackward = () => {
    const idx = (img as any).layerIdx ?? 0;
    if (idx < fc.getObjects().length - 1) reorder(idx, idx + 1);
  };
  const bringForward = () => {
    const idx = (img as any).layerIdx ?? 0;
    if (idx > 0) reorder(idx, idx - 1);
  };

  /* ───────────────────────── render ─── */
  return (
    <div className="fixed top-2 inset-x-0 z-30 flex justify-center pointer-events-none select-none">
      {/* main bar */}
      <div className="pointer-events-auto flex flex-wrap items-center gap-2
                      bg-[--walty-cream]/95 backdrop-blur
                      border border-[rgba(0,91,85,.2)] rounded-lg shadow
                      px-3 py-2 max-w-[640px] w-[calc(100%-6rem)]">

        {/* core actions */}
        <IconButton Icon={Crop}    label="Crop"           onClick={() => document.dispatchEvent(new Event("start-crop"))} />
        <ToolFlipImage img={img} mutate={mutate} />

        {/* opacity toggle */}
        <IconButton Icon={Droplet} label="Opacity" active={showOpacity} onClick={() => setShowOpacity(!showOpacity)} />
        {showOpacity && (
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={img.opacity ?? 1}
            onChange={e => mutate({ opacity: +e.target.value })}
            className="w-40 accent-[--walty-orange]"
          />
        )}

        {/* align to page */}
        <IconButton Icon={AlignVerticalJustifyCenter}   label="Align vertical centre"   onClick={cycleVertical} />
        <IconButton Icon={AlignHorizontalJustifyCenter} label="Align horizontal centre" onClick={cycleHorizontal} />

        <div className="border-l border-[rgba(0,91,85,.2)] h-5 mx-1" />

        {/* extras */}
        <IconButton Icon={Eraser}             label="Remove background"    onClick={() => alert("TODO: remove background")} />
        <IconButton Icon={locked ? Unlock : Lock} label={locked ? "Unlock layer" : "Lock layer"} active={locked} onClick={toggleLock} />
        <IconButton Icon={ArrowDownToLine}    label="Send layer backward"   onClick={sendBackward} />
        <IconButton Icon={ArrowUpToLine}      label="Bring layer forward"   onClick={bringForward} />
      </div>

      {/* undo / redo / save cluster */}
      <div className="absolute right-4 top-2 flex gap-3 pointer-events-auto">
        <IconButton Icon={RotateCcw} label="Undo" onClick={onUndo} />
        <IconButton Icon={RotateCw}  label="Redo" onClick={onRedo} />
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`flex items-center gap-1 px-3 py-2 rounded font-semibold
                      ${saving ? "opacity-50 cursor-not-allowed"
                                : "text-[--walty-orange] hover:bg-[--walty-orange]/10"}`}>
          <Save className="w-5 h-5" />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}