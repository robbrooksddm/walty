/**********************************************************************
 * CardEditor.tsx  ⟩  WYSIWYG editor for a 4-page greeting card
 * ────────────────────────────────────────────────────────────────────
 *  ▸ Staff  mode  – toolbar includes upload / font controls
 *  ▸ Customer mode – toolbar hides advanced controls
 *
 *  Public API  ───────────────────────────────────────────────────────
 *    <CardEditor
 *       initialPages = {TemplatePage[]}   // exactly 4 objects
 *       mode         = "staff" | "customer"
 *       onSave?      = (json: string) => Promise<void> | void
 *    />
 *********************************************************************/
'use client'

import { useEffect, useState }          from 'react'
import { fabric }                       from 'fabric'

import { useEditor }                    from './EditorStore'
import LayerPanel                       from './LayerPanel'
import FabricCanvas, { undo, redo }     from './FabricCanvas'
import TextToolbar                      from './TextToolbar'
import type { TemplatePage }            from './FabricCanvas'

/* ───────────────────────────── helpers ──────────────────────────── */
type Section  = 'front' | 'inside' | 'back'
type PageIdx  = 0 | 1 | 2 | 3
type Mode     = 'staff' | 'customer'
export type SaveFn = (layersJSON: string) => void | Promise<void>

/* Guaranteed fallback: four empty pages */
const EMPTY_PAGES: TemplatePage[] = [
  { name: 'front',    layers: [] },
  { name: 'inner-L',  layers: [] },
  { name: 'inner-R',  layers: [] },
  { name: 'back',     layers: [] },
]

/* ───────────────────────── component ────────────────────────────── */
export default function CardEditor ({
  initialPages,
  mode = 'customer',
  onSave,
}: {
  initialPages : TemplatePage[] | undefined
  mode?        : Mode
  onSave?      : SaveFn
}) {
  /* 1 ─ write pages into Zustand exactly *once* (SSR-safe) */
  useEffect(() => {
    const pages =
      Array.isArray(initialPages) && initialPages.length === 4
        ? initialPages
        : EMPTY_PAGES
    useEditor.getState().setPages(pages)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])                                  // ← empty deps ➜ run once

  /* 2 ─ reactive state from the store */
  const pages     = useEditor(s => s.pages)
  const setActive = useEditor(s => s.setActive)
  const addText   = useEditor(s => s.addText)
  const addImage  = useEditor(s => s.addImage)

  /* 3 ─ which section is visible? */
  const [section, setSection] = useState<Section>('front')
  const activeIdx: PageIdx =
    section === 'front'  ? 0 :
    section === 'inside' ? 1 : 3

  useEffect(() => { setActive(activeIdx) }, [activeIdx, setActive])

  /* 4 ─ keep a map { pageIdx ➜ Fabric.Canvas } for undo/redo */
  const [canvasMap, setCanvasMap] =
    useState<(fabric.Canvas | null)[]>([null, null, null, null])

  const onReady = (idx: number, fc: fabric.Canvas | null) =>
    setCanvasMap(list => { const next = [...list]; next[idx] = fc; return next })

  const activeFc = canvasMap[activeIdx]

  /* 5 ─ saving */
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try   { await onSave(JSON.stringify(pages.map(p => p.layers))) }
    finally { setSaving(false) }
  }

  /* 6 ─ still hydrating pages? show a lightweight loader */
  if (pages.length !== 4) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        loading template…
      </div>
    )
  }

  /* 7 ─ UI */
  const box = 'flex-shrink-0 w-[420px]'

  return (
    <div className="flex h-screen">
      {/* ▸ sidebar (layers + upload) */}
      <LayerPanel />

      {/* ▸ main column */}
      <div className="flex-1 flex flex-col">
        {/* toolbar */}
        <TextToolbar
          canvas   ={activeFc}
          addText  ={addText}
          addImage ={addImage}
          onUndo   ={() => activeFc && undo(activeFc)}
          onRedo   ={() => activeFc && redo(activeFc)}
          onSave   ={handleSave}
          mode     ={mode}
          saving   ={saving}
        />

        {/* section tabs */}
        <nav className="flex justify-center gap-8 py-3 text-sm font-medium">
          {(['front','inside','back'] as Section[]).map(lbl => (
            <button
              key={lbl}
              onClick={() => setSection(lbl)}
              className={
                section === lbl
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                  : 'text-gray-500 hover:text-gray-800'
              }
            >{lbl.replace(/^./, c => c.toUpperCase())}</button>
          ))}
        </nav>

        {/* canvases */}
        <div className="flex-1 flex justify-center items-start overflow-auto
                        bg-gray-100 dark:bg-gray-900 pt-6 gap-6">
          {/* Front */}
          <div className={section === 'front' ? box : 'hidden'}>
            <FabricCanvas
              pageIdx={0}
              page   ={pages[0]}
              onReady={fc => onReady(0, fc)}
            />
          </div>

          {/* Inside (L + R) */}
          <div className={section === 'inside' ? 'flex gap-6' : 'hidden'}>
            <div className={box}>
              <FabricCanvas pageIdx={1} page={pages[1]} onReady={fc => onReady(1, fc)} />
            </div>
            <div className={box}>
              <FabricCanvas pageIdx={2} page={pages[2]} onReady={fc => onReady(2, fc)} />
            </div>
          </div>

          {/* Back */}
          <div className={section === 'back' ? box : 'hidden'}>
            <FabricCanvas pageIdx={3} page={pages[3]} onReady={fc => onReady(3, fc)} />
          </div>
        </div>

        {/* thumbnails */}
        <div className="flex justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 text-xs">
          {(['FRONT','INNER-L','INNER-R','BACK'] as const).map((lbl,i)=>(
            <button
              key={lbl}
              className={`thumb ${
                (section==='front'&&i===0)||
                (section==='inside'&&(i===1||i===2))||
                (section==='back'&&i===3)
                  ? 'thumb-active':''}`}
              onClick={()=>setSection(i===0?'front':i===3?'back':'inside')}
            >{lbl}</button>
          ))}
        </div>
      </div>
    </div>
  )
}