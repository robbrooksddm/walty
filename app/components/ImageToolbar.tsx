/**
 * Walty‑branded image toolbar · single‑row layout
 * ————————————————————————————————————————
 * • Toolbar itself stays centred.
 * • 48 × 48 px buttons, 24 px icons, 11 px captions.
 * • Uniform 24 px gap (`gap-6`) between buttons inside the bar.
 */

"use client";

import { useEffect, useState } from "react";
import { fabric } from "fabric";
import { useEditor } from "./EditorStore";
import ToolFlipImage     from "./toolbar/ToolFlipImage";
import ToolOpacitySlider from "./toolbar/ToolOpacitySlider";
import IconButton        from "./toolbar/IconButton";

/* lucide-react icons */
import {
  Crop,
  Eraser,
  Lock,
  Unlock,
  ArrowDownToLine,
  ArrowUpToLine,
  RotateCcw,
  RotateCw,
  Trash2,
  Save,
} from "lucide-react";

import {
  AlignToPageVertical,
  AlignToPageHorizontal,
} from "./toolbar/AlignToPage";



/* ───────────────────────── main toolbar component ─── */
interface Props {
  canvas: fabric.Canvas | null;
  saving: boolean;
}

export default function ImageToolbar({ canvas: fc, saving }: Props) {
  /* local state / editor wiring */
  const [, force]      = useState({});
  const reorder        = useEditor(s => s.reorder);
  const updateLayer    = useEditor(s => s.updateLayer);
  const activePage     = useEditor(s => s.activePage);
  const layerCount     = useEditor(s => s.pages[s.activePage]?.layers.length || 0);

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
    if (locked) return
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
    if (locked) return
    const idx = (img as any).layerIdx ?? 0;
    if (idx < layerCount - 1) reorder(idx, idx + 1);
  };
  const bringForward = () => {
    if (locked) return
    const idx = (img as any).layerIdx ?? 0;
    if (idx > 0 && idx <= layerCount - 1) reorder(idx, idx - 1);
  };

  /* remove active image */
  const deleteCurrent = () => {
    if (locked) return
    fc.remove(img);
    fc.requestRenderAll();
  };

  /* ───────────────────────── render ─── */
  return (
    <div
      className="sticky inset-x-0 z-30 flex justify-center pointer-events-none select-none"
      style={{
        top: "var(--walty-header-h)",
        marginTop: "calc(var(--walty-toolbar-h) * -1)",
        height: "var(--walty-toolbar-h)",
      }}
    >
      {/* main bar */}
      <div
        className="pointer-events-auto flex flex-nowrap items-center gap-6
                   bg-white shadow-lg rounded-xl
                   border border-[rgba(0,91,85,.2)] px-4 py-3 max-w-[720px] w-[calc(100%-6rem)]"
      >
        <IconButton Icon={Crop} label="Crop" onClick={() => document.dispatchEvent(new Event("start-crop"))} disabled={locked} />
        <ToolFlipImage img={img} mutate={mutate} disabled={locked} />
        <ToolOpacitySlider img={img} mutate={mutate} disabled={locked} />
        <IconButton Icon={AlignToPageVertical}   label="Center vertical" caption="Center Y" onClick={cycleVertical} disabled={locked} />
        <IconButton Icon={AlignToPageHorizontal} label="Center horizontal" caption="Center X" onClick={cycleHorizontal} disabled={locked} />
        <IconButton Icon={Eraser} label="Remove background" caption="BG Erase" onClick={() => alert("TODO: remove background") } disabled={locked} />
        <IconButton Icon={locked ? Lock : Unlock} label={locked ? "Unlock layer" : "Lock layer"} active={locked} onClick={toggleLock} />
        <IconButton Icon={ArrowDownToLine} label="Send backward" caption="Send ↓" onClick={sendBackward} disabled={locked} />
        <IconButton Icon={ArrowUpToLine}   label="Bring forward" caption="Bring ↑" onClick={bringForward} disabled={locked} />
        <IconButton Icon={Trash2} label="Delete image" caption="Delete" onClick={deleteCurrent} disabled={locked} />
      </div>

    </div>
  );
}