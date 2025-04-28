// app/components/CanvasInner.tsx
"use client";

import { Stage, Layer, Text, Image as KImage } from "react-konva";
import { useState } from "react";

export default function CanvasInner() {
  /* ---------- text state ---------- */
  const [texts, setTexts] = useState<
    { id: string; text: string; x: number; y: number }[]
  >([
    { id: "1", text: "Double-click to edit me!", x: 50, y: 50 },
  ]);

  const addText = () =>
    setTexts((p) => [
      ...p,
      { id: String(Date.now()), text: "New text", x: 80, y: 80 },
    ]);

  const editText = (id: string) => {
    const t = prompt("Enter new text");
    if (t)
      setTexts((p) => p.map((el) => (el.id === id ? { ...el, text: t } : el)));
  };

  /* ---------- image state ---------- */
  const [images, setImages] = useState<
    { id: string; src: string; x: number; y: number }[]
  >([]);

  const addImage = (file: File) => {
    const url = URL.createObjectURL(file);     // local blob URL
    setImages((p) => [
      ...p,
      { id: String(Date.now()), src: url, x: 100, y: 100 },
    ]);
  };

  return (
    <>
      {/* toolbar */}
      <div className="mb-2 space-x-2">
        <button
          className="rounded bg-blue-600 text-white px-3 py-1"
          onClick={addText}
        >
          + Add Text
        </button>

        {/* plain file input for now */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) addImage(file);
            e.currentTarget.value = "";        {/* allow selecting same file again */}
          }}
          className="text-sm"
        />
      </div>

      {/* canvas */}
      <Stage width={600} height={400} className="border border-gray-400">
        <Layer>
          {/* texts */}
          {texts.map(({ id, ...t }) => (
            <Text
              key={id}
              {...t}
              fontSize={24}
              draggable
              onDblClick={() => editText(id)}
              onDragEnd={(e) => {
                const { x, y } = e.target.position();
                setTexts((p) =>
                  p.map((el) => (el.id === id ? { ...el, x, y } : el)),
                );
              }}
            />
          ))}

          {/* images */}
          {images.map((img) => (
            <KImage
              key={img.id}
              x={img.x}
              y={img.y}
              draggable
              image={(() => {
                const i = new window.Image();
                i.src = img.src;
                return i;
              })()}
              onDragEnd={(e) => {
                const { x, y } = e.target.position();
                setImages((p) =>
                  p.map((el) => (el.id === img.id ? { ...el, x, y } : el)),
                );
              }}
            />
          ))}
        </Layer>
      </Stage>
    </>
  );
}