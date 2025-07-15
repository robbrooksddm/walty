// app/components/CanvasInner.tsx
'use client';

import { useState, useEffect } from 'react';
import { Stage, Layer, Text, Image as KImage } from 'react-konva';

/* ---------- tiny helper – preload & memoise an image ---------- */
const useImage = (src: string) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const i = new window.Image();
    i.src = src;
    i.onload = () => setImg(i);
  }, [src]);
  return img;
};

export default function CanvasInner() {
  /* ---------- text state ---------- */
  const [texts, setTexts] = useState<
    { id: string; text: string; x: number; y: number }[]
  >([{ id: '1', text: 'Double-click to edit me!', x: 50, y: 50 }]);

  const addText = () =>
    setTexts((p) => [
      ...p,
      { id: crypto.randomUUID?.() ?? String(Date.now()), text: 'New text', x: 80, y: 80 },
    ]);

  const editText = (id: string) => {
    const t = prompt('Enter new text');
    if (t) setTexts((p) => p.map((el) => (el.id === id ? { ...el, text: t } : el)));
  };

  /* ---------- image state ---------- */
  const [images, setImages] = useState<
    { id: string; src: string; x: number; y: number }[]
  >([]);

  const addImage = (file: File) => {
    const url = URL.createObjectURL(file); // local blob URL
    const id  = crypto.randomUUID?.() ?? String(Date.now());
    setImages((p) => [...p, { id, src: url, x: 100, y: 100 }]);
  };

  /* revoke any object-URLs we’ve dropped ----------------------- */
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.src));
    };
  }, [images]);

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
          accept="image/png, image/jpeg"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            if (file) addImage(file);
            e.currentTarget.value = ''; // allow selecting same file again
          }}
          className="text-sm"
        />
      </div>

      {/* canvas */}
      <Stage
        width={600}
        height={400}
        className="border border-gray-400"
        tabIndex={0} /* allow keyboard focus */
      >
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
                setTexts((p) => p.map((el) => (el.id === id ? { ...el, x, y } : el)));
              }}
            />
          ))}

          {/* images */}
          {images.map((img) => {
            const loaded = useImage(img.src);
            return (
              <KImage
                key={img.id}
                x={img.x}
                y={img.y}
                draggable
                image={loaded ?? undefined}
                onDragEnd={(e) => {
                  const { x, y } = e.target.position();
                  setImages((p) =>
                    p.map((el) => (el.id === img.id ? { ...el, x, y } : el)),
                  );
                }}
              />
            );
          })}
        </Layer>
      </Stage>
    </>
  );
}