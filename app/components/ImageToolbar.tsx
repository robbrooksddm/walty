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
  mode?: 'staff' | 'customer';
}

export default function ImageToolbar({ canvas: fc, saving, mode = 'customer' }: Props) {
  /* local state / editor wiring */
  const [, force]      = useState({});
  const updateLayer    = useEditor(s => s.updateLayer);
  const activePage     = useEditor(s => s.activePage);
  const layerCount     = useEditor(s => s.pages[s.activePage]?.layers.length || 0);

  /* alignment state */
  const [vIdx, setVIdx] = useState(0);
  const [hIdx, setHIdx] = useState(0);
  const [lastAxis, setLastAxis] = useState<'v' | 'h' | null>(null);

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

  const zoom = fc?.viewportTransform?.[0] ?? 1;
  const fcH  = (fc?.getHeight() ?? 0) / zoom;
  const fcW  = (fc?.getWidth()  ?? 0) / zoom;

  const img = fc?.getActiveObject() as fabric.Image | null | undefined;

  useEffect(() => { setVIdx(0); setHIdx(0); setLastAxis(null); }, [img]);

  if (!fc || !img || (img as any).type !== "image") return null;

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
    const { height } = img.getBoundingRect(true, true);
    const pos = [fcH / 2 - height / 2, fcH - height, 0];
    const idx = lastAxis === 'v' ? vIdx : 0;
    mutate({ top: pos[idx] });
    setVIdx((idx + 1) % 3);
    setLastAxis('v');
  };

  const cycleHorizontal = () => {
    const { width } = img.getBoundingRect(true, true);
    const pos = [fcW / 2 - width / 2, fcW - width, 0];
    const idx = lastAxis === 'h' ? hIdx : 0;
    mutate({ left: pos[idx] });
    setHIdx((idx + 1) % 3);
    setLastAxis('h');
  };

  /* layer lock */
  const locked = Boolean((img as any).locked);
  const toggleLock = () => {
    const next = !locked;
    (img as any).locked = next;
    const isStaff = mode === 'staff';
    img.set({
      lockMovementX: next,
      lockMovementY: next,
      lockScalingX : next,
      lockScalingY : next,
      lockRotation : next,
      selectable   : isStaff || !next,
      evented      : isStaff || !next,
      hasControls  : !next,
    });
    fc.requestRenderAll();
    updateLayer(activePage, (img as any).layerIdx, { locked: next });
  };

  /* layer order helpers */
  const sendBackward = () => {
    if (locked || !fc) return;
    fc.sendBackwards(img);
    fc.setActiveObject(img);
    fc.requestRenderAll();
    img.fire('modified');
    fc.fire('object:modified', { target: img });
    const sync = (fc as any)._syncLayers as (() => void) | undefined;
    sync && sync();
    force({});
  };
  const bringForward = () => {
    if (locked || !fc) return;
    fc.bringForward(img);
    fc.setActiveObject(img);
    fc.requestRenderAll();
    img.fire('modified');
    fc.fire('object:modified', { target: img });
    const sync = (fc as any)._syncLayers as (() => void) | undefined;
    sync && sync();
    force({});
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
        {mode === 'staff' && (
          <IconButton Icon={locked ? Lock : Unlock} label={locked ? 'Unlock layer' : 'Lock layer'} active={locked} onClick={toggleLock} />
        )}
        <IconButton Icon={ArrowDownToLine} label="Send backward" caption="Send ↓" onClick={sendBackward} disabled={locked} />
        <IconButton Icon={ArrowUpToLine}   label="Bring forward" caption="Bring ↑" onClick={bringForward} disabled={locked} />
        <IconButton Icon={Trash2} label="Delete image" caption="Delete" onClick={deleteCurrent} disabled={locked} />
      </div>

    </div>
  );
}