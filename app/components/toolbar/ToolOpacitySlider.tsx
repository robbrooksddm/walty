// ToolOpacitySlider.tsx

"use client";
import { useRef, useState, useEffect } from "react";
import { fabric } from "fabric";
import { Droplet } from "lucide-react";
import Popover    from "./Popover";
import IconButton from "./IconButton";   // forward-ref version

interface Props {
  img: fabric.Image;
  mutate: (p: Partial<fabric.Image>) => void;
  disabled?: boolean;
}

export default function ToolOpacitySlider({ img, mutate, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);   // ⬅️ grab anchor via ref

  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  /* slider handler */
  const handleChange = (v: number) => mutate({ opacity: v });

  return (
    <>
      <IconButton
        ref={btnRef}
        Icon={Droplet}
        label="Opacity"
        active={open}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      />

      <Popover anchor={btnRef.current} open={open && !disabled} onClose={() => setOpen(false)}>
        <label htmlFor="opacity-slider" className="sr-only">
          Image opacity
        </label>
        <input
          id="opacity-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={img.opacity ?? 1}
          onChange={e => handleChange(e.target.valueAsNumber)}
          className="w-52 accent-[--walty-orange]"
        />
      </Popover>
    </>
  );
}