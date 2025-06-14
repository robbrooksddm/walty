"use client";
import { useRef, useState, useEffect } from "react";
import { fabric } from "fabric";
import { EyeDropper } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import Popover from "./Popover";
import IconButton from "./IconButton";
import { Palette } from "lucide-react";

interface Props {
  tb: fabric.Textbox | null;
  canvas: fabric.Canvas | null;
  mutate: (p: Partial<fabric.Textbox>) => void;
}

export default function ToolTextColorPicker({ tb, canvas, mutate }: Props) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState("#000000");
  const [docColors, setDocColors] = useState<string[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (tb) setColor(tb.fill as string);
  }, [tb]);

  useEffect(() => {
    if (!open || !canvas) return;
    const colours = Array.from(
      new Set(
        canvas
          .getObjects()
          .map(o => (o as any).fill)
          .filter((c): c is string => typeof c === "string")
      )
    ).filter(c => /^#([0-9a-f]{3}){1,2}$/i.test(c));
    setDocColors(colours as string[]);
  }, [open, canvas]);

  const handleChange = (val: string) => {
    setColor(val);
    if (tb) mutate({ fill: val });
  };

  const handleEyeDropper = async () => {
    if (typeof window !== "undefined" && (window as any).EyeDropper) {
      try {
        const eye = new (window as any).EyeDropper();
        const result = await eye.open();
        handleChange(result.sRGBHex);
      } catch {
        /* cancelled */
      }
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Text colour"
        disabled={!tb}
        onClick={() => tb && setOpen(o => !o)}
        className="h-12 w-12 rounded-lg border border-teal-800/10 shadow disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
        style={{ backgroundColor: tb ? (tb.fill as string) : "#000" }}
      />

      <Popover anchor={btnRef.current} open={open && !!tb} onClose={() => setOpen(false)}>
        <div className="space-y-3 w-52" onKeyDown={e => e.stopPropagation()}>
          <HexColorPicker color={color} onChange={handleChange} aria-label="Choose colour" className="rounded" />
          <input
            type="text"
            value={color}
            onChange={e => handleChange(e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
            aria-label="Hex colour"
          />
          {docColors.length > 0 && (
            <div className="flex flex-wrap gap-1" aria-label="Document colours">
              {docColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleChange(c)}
                  style={{ backgroundColor: c }}
                  className="h-6 w-6 rounded border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
                  aria-label={`Use ${c}`}
                />
              ))}
            </div>
          )}
          {typeof window !== "undefined" && (window as any).EyeDropper && (
            <button
              type="button"
              onClick={handleEyeDropper}
              className="flex items-center gap-1 rounded border px-2 py-1 text-sm hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
            >
              <EyeDropper className="h-4 w-4" /> Pick colour
            </button>
          )}
        </div>
      </Popover>
    </>
  );
}
