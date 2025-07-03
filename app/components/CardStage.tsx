/**********************************************************************
 * CardStage.tsx – preview/editor canvas for a single page (Konva)
 *********************************************************************/
'use client';

import {
  Stage,
  Layer,
  Text,
  Rect,
  Image as KImage,
  Transformer,
} from 'react-konva';
import { useRef, useEffect, useState } from 'react';
import type { Transformer as KonvaTransformer } from 'konva/lib/shapes/Transformer';

/* ------------------------------------------------------------------ */
/* helper – Konva passes this to boundBoxFunc                         */
type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

/* tiny hook – preload & memoise an image --------------------------- */
const useImage = (src: string) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const i = new window.Image();
    i.src = src;
    i.onload = () => setImg(i);
  }, [src]);
  return img;
};

/* public layer spec ------------------------------------------------ */
export type LayerSpec =
  | ({
      type: 'text';
      editable?: boolean;
    } & import('konva/lib/shapes/Text').TextConfig)
  | {
      type: 'image';
      src: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
      editable?: boolean;
    };

/* ================================================================ */
export default function CardStage({
  page,
  selectedIdx,
  onSelect,
  onChange,
}: {
  page: { width?: number; height?: number; layers: LayerSpec[] };
  selectedIdx: number | null;
  onSelect: (idx: number | null) => void;
  onChange: (layers: LayerSpec[]) => void;
}) {
  const textRef = useRef<any>(null);
  const trRef   = useRef<KonvaTransformer | null>(null);

  /* attach transformer when selection changes -------------------- */
  useEffect(() => {
    if (
      selectedIdx !== null &&
      page.layers[selectedIdx]?.type === 'text' &&
      textRef.current &&
      trRef.current
    ) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIdx, page.layers]);

  /* single-layer renderer ---------------------------------------- */
  const renderLayer = (layer: LayerSpec, idx: number) => {
    /* TEXT -------------------------------------------------------- */
    if (layer.type === 'text') {
      const isSel = idx === selectedIdx;

      return (
        <Text
          key={idx}
          ref={isSel ? textRef : undefined}
          {...layer}
          draggable={layer.editable ?? false}
          onClick={() => onSelect(idx)}
          onTap={() => onSelect(idx)}
          onDblClick={() => {
            if (!layer.editable) return;
            const t = prompt('New text', layer.text);
            if (!t) return;
            onChange(
              page.layers.map((l, i) =>
                i === idx ? { ...l, text: t } : l,
              ),
            );
          }}
          /* ------ transform helpers ------------------------------- */
          onTransformStart={(e) => {
            const node = e.target as any;
            node.setAttr('initW', layer.width ?? node.width());
            node.setAttr('initF', layer.fontSize ?? 24);
          }}
          onTransform={(e) => {
            const node   = e.target as any;
            const anchor = trRef.current?.getActiveAnchor();

            const initW = node.getAttr('initW') as number;
            const initF = node.getAttr('initF') as number;

            const sx = node.scaleX();
            node.scale({ x: 1, y: 1 }); // reset

            if (anchor === 'middle-left' || anchor === 'middle-right') {
              node.width(initW * sx);
            } else {
              node.width(initW * sx);
              node.fontSize(initF * sx);
            }
          }}
          onTransformEnd={(e) => {
            const node   = e.target as any;
            const anchor = trRef.current?.getActiveAnchor();
            const newW   = node.width();
            const newF =
              anchor === 'middle-left' || anchor === 'middle-right'
                ? layer.fontSize ?? 24
                : node.fontSize();

            onChange(
              page.layers.map((l, i) =>
                i === idx ? { ...l, width: newW, fontSize: newF } : l,
              ),
            );
          }}
          onDragEnd={(e) => {
            const { x, y } = e.target.position();
            onChange(
              page.layers.map((l, i) =>
                i === idx ? { ...l, x, y } : l,
              ),
            );
          }}
        />
      );
    }

    /* IMAGE ------------------------------------------------------- */
    const imgNode = useImage(layer.src);

    return (
      <KImage
        key={idx}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        draggable={layer.editable ?? false}
        onClick={() => onSelect(null)}
        image={imgNode ?? undefined}
        onDragEnd={(e) => {
          const { x, y } = e.target.position();
          onChange(
            page.layers.map((l, i) =>
              i === idx ? { ...l, x, y } : l,
            ),
          );
        }}
      />
    );
  };

  /* canvas dims --------------------------------------------------- */
  const W = page.width ?? 600;
  const H = page.height ?? 800;

  return (
    <Stage
      width={W}
      height={H}
      className="flex-grow border bg-white"
      onClick={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
    >
      <Layer>{page.layers.map(renderLayer)}</Layer>

      {/* outline + handles for selected text ----------------------- */}
      {selectedIdx !== null && page.layers[selectedIdx]?.type === 'text' && (
        <Layer>
          <Rect
            {...{
              ...(page.layers[selectedIdx] as any),
              width:  undefined,
              height: undefined,
            }}
            stroke="deepskyblue"
            strokeWidth={4}
            listening={false}
          />
          <Transformer
            ref={trRef}
            enabledAnchors={[
              'top-left', 'top-right', 'bottom-left', 'bottom-right',
              'middle-left', 'middle-right',
            ]}
            boundBoxFunc={(oldBox: Box, newBox: Box) => {
              const anchor = trRef.current?.getActiveAnchor();
              const keepRatio =
                anchor !== 'middle-left' && anchor !== 'middle-right';

              if (keepRatio) {
                const ratio = oldBox.height / oldBox.width;
                newBox.height = newBox.width * ratio;
              } else {
                newBox.height = oldBox.height;
              }
              return newBox;
            }}
          />
        </Layer>
      )}
    </Stage>
  );
}