//ToolFlipImage.tsx

"use client";
import { useRef, useState } from "react";
import { fabric } from "fabric";
import IconButton from "./IconButton";
import Popover from "./Popover";

/* same custom mirror icons we use elsewhere */
import { MirrorH, MirrorV } from "./icons";      // export them from one place

interface Props {
  img: fabric.Image;
  mutate: (p: Partial<fabric.Image>) => void;
}

export default function ToolFlipImage({ img, mutate }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {/* trigger */}
      <IconButton
        ref={btnRef}
        Icon={MirrorH}
        label="Flip image"
        onClick={() => setOpen(o => !o)}
        active={open}
      />

{/* pop-over content */}
<Popover anchor={btnRef.current} open={open} onClose={() => setOpen(false)}>
  <button
    className="flex w-full items-center gap-2 rounded-lg px-3 py-2
               text-sm hover:bg-walty-orange/10 focus:outline-none
               focus-visible:ring-2 focus-visible:ring-walty-orange"
    onClick={() => { mutate({ flipX: !(img as any).flipX }); setOpen(false); }}
  >
    <MirrorH className="h-5 w-5 shrink-0" />
    Flip horizontal
  </button>

  <button
    className="flex w-full items-center gap-2 rounded-lg px-3 py-2
               text-sm hover:bg-walty-orange/10 focus:outline-none
               focus-visible:ring-2 focus-visible:ring-walty-orange"
    onClick={() => { mutate({ flipY: !(img as any).flipY }); setOpen(false); }}
  >
    <MirrorV className="h-5 w-5 shrink-0" />
    Flip vertical
  </button>
</Popover>
    </>
  );
}