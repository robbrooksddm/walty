"use client";

/**********************************************************************
 * LayerPanel.tsx – Walty‑styled sidebar: upload, add text/image, reorder
 *********************************************************************/

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Upload as UploadIcon,
  Trash2,
  GripVertical,
} from "lucide-react";
import { useEditor } from "./EditorStore";

/*────────────────────────────    Sortable row    ──*/
function Row({ id, idx }: { id: string; idx: number }) {
  const layer = useEditor((s) => s.pages[s.activePage]?.layers[idx]);
  const remove = useEditor((s) => s.deleteLayer);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!layer) return null;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 rounded-lg border border-walty-teal/40 px-2 py-1 text-sm hover:bg-walty-orange/10"
    >
      {/* drag handle */}
      <button
        {...listeners}
        {...attributes}
        className="cursor-grab text-walty-teal hover:text-walty-orange"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* name */}
      <span className="flex-1 truncate text-walty-teal">
        {layer.type === "text" ? (
          (layer.text ?? "text").slice(0, 20)
        ) : (
          <img
            src={
              layer.srcUrl ||
              (typeof layer.src === "string" ? layer.src : undefined)
            }
            alt="layer"
            width={48}
            height={48}
            className="inline-block h-12 w-12 object-cover rounded"
          />
        )}
      </span>

      {/* delete */}
      <button
        onClick={() => remove(idx)}
        className="opacity-0 transition-opacity group-hover:opacity-100 text-walty-teal hover:text-walty-orange"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

/*────────────────────────────    Panel    ──*/
export default function LayerPanel() {
  const { pages, activePage } = useEditor();
  const reorder = useEditor((s) => s.reorder);
  const addImage = useEditor((s) => s.addImage);
  const addText = useEditor((s) => s.addText);
  const [open, setOpen] = useState(true);

  if (!pages[activePage]) return null;
  const ids = pages[activePage].layers.map((_, i) => i.toString());

  /* drag‑and‑drop */
  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id)
      reorder(+e.active.id, +e.over.id);
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-20 h-full w-60 bg-[--walty-cream] shadow-lg transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-56"
      }`}
    >
      {/* slide toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-5 top-1/2 flex h-12 w-5 -translate-y-1/2 items-center justify-center rounded-r-lg bg-walty-brown text-walty-cream"
      >
        {open ? "◀" : "▶"}
      </button>

      {/* upload */}
      <label className="m-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-walty-teal/50 p-4 text-walty-teal hover:bg-walty-orange/5">
        <UploadIcon className="h-8 w-8" />
        <span className="font-medium">Upload</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) addImage(f);
            e.currentTarget.value = "";
          }}
        />
      </label>

      {/* add buttons */}
      <div className="mx-4 mb-4 flex flex-col gap-3">
        <button
          onClick={() => addText()}
          className="flex items-center gap-2 rounded-lg bg-walty-mustard px-3 py-2 font-semibold text-walty-brown hover:bg-walty-mustard/90"
        >
          <Plus className="h-4 w-4" /> Add Text
        </button>
        <button
          onClick={() => {
            document.querySelector<HTMLInputElement>("#hidden-file-input")?.click();
          }}
          className="flex items-center gap-2 rounded-lg bg-walty-mustard px-3 py-2 font-semibold text-walty-brown hover:bg-walty-mustard/90"
        >
          <Plus className="h-4 w-4" /> Add Image
        </button>
      </div>

      {/* layer list */}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="scrollbar-hidden flex h-[calc(100%-330px)] flex-col gap-1 overflow-y-auto px-4 pb-6">
            {ids.map((id, i) => (
              <Row key={id} id={id} idx={i} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </aside>
  );
}
