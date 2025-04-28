/**********************************************************************
 * CardEditor.tsx – Front • Inside • Back editor
 *********************************************************************/
'use client';

import { useEffect, useState } from 'react';
import { fabric } from 'fabric';

import { useEditor }   from './EditorStore';
import LayerPanel      from './LayerPanel';
import type { TemplatePage } from './FabricCanvas';      // type-only → no runtime
import FabricCanvas, { undo, redo } from './FabricCanvas';
import TextToolbar    from './TextToolbar';

/* page-label helpers */
type Section = 'front' | 'inside' | 'back';
type PageIdx  = 0 | 1 | 2 | 3;
type Mode     = 'staff' | 'customer';

/* ================================================================ */
export default function CardEditor({
  initialPages,
  mode = 'customer',
}: {
  initialPages: TemplatePage[];
  mode?: Mode;
}) {
  /* 1 ▪ inject template once ---------------------------------- */
  useEffect(() => {
    if (initialPages?.length === 4) useEditor.getState().setPages(initialPages);
  }, [initialPages]);

  /* 2 ▪ data + helpers from the store -------------------------- */
  const pages     = useEditor(s => s.pages);
  const setActive = useEditor(s => s.setActive);
  const addText   = useEditor(s => s.addText);
  const addImage  = useEditor(s => s.addImage);

  /* 3 ▪ which section is visible? ------------------------------ */
  const [section, setSection] = useState<Section>('front');
  const activeIdx: PageIdx =
    section === 'front'  ? 0 :
    section === 'inside' ? 1 : 3;
  useEffect(() => setActive(activeIdx), [activeIdx, setActive]);

  /* 4 ▪ page-idx → Fabric instance (for undo/redo) ------------- */
  const [canvasMap, setCanvasMap] = useState<(fabric.Canvas|null)[]>([null,null,null,null]);
  const onReady = (idx:number, fc:fabric.Canvas|null) =>
    setCanvasMap(m => { const c=[...m]; c[idx]=fc; return c; });
  const activeFc = canvasMap[activeIdx] ?? null;

  /* 5 ▪ loading guard ------------------------------------------ */
  if (pages.length !== 4) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        loading template…
      </div>
    );
  }

  const box = 'flex-shrink-0 w-[420px]';

  /* 6 ▪ JSX ---------------------------------------------------- */
  return (
    <div className="flex h-screen">
      {/* sidebar */}
      <LayerPanel />

      {/* main column */}
      <div className="flex-1 flex flex-col">
        {/* toolbar */}
        <TextToolbar
          canvas={activeFc}
          addText={addText}
          addImage={addImage}
          onUndo={() => activeFc && undo(activeFc)}
          onRedo={() => activeFc && redo(activeFc)}
          onSave={() => {}}
          mode={mode}
        />

        {/* page tabs */}
        <nav className="flex justify-center gap-8 py-3 text-sm font-medium">
          {(['front','inside','back'] as Section[]).map(lbl => (
            <button key={lbl} onClick={()=>setSection(lbl)}
              className={section===lbl
                ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                : 'text-gray-500 hover:text-gray-800'}>
              {lbl.replace(/^./,c=>c.toUpperCase())}
            </button>
          ))}
        </nav>

        {/* canvases */}
        <div className="flex-1 flex justify-center items-start overflow-auto
                        bg-gray-100 dark:bg-gray-900 pt-6 gap-6">

          {/* Front */}
          <div className={section==='front'?box:'hidden'}>
            <FabricCanvas pageIdx={0} page={pages[0]} onReady={fc=>onReady(0,fc)}/>
          </div>

          {/* Inside (L+R) */}
          <div className={section==='inside'?'flex gap-6':'hidden'}>
            <div className={box}>
              <FabricCanvas pageIdx={1} page={pages[1]} onReady={fc=>onReady(1,fc)}/>
            </div>
            <div className={box}>
              <FabricCanvas pageIdx={2} page={pages[2]} onReady={fc=>onReady(2,fc)}/>
            </div>
          </div>

          {/* Back */}
          <div className={section==='back'?box:'hidden'}>
            <FabricCanvas pageIdx={3} page={pages[3]} onReady={fc=>onReady(3,fc)}/>
          </div>
        </div>

        {/* thumbnails */}
        <div className="flex justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 text-xs">
          {(['FRONT','INNER-L','INNER-R','BACK'] as const).map((lbl,i)=>(
            <button key={lbl}
              className={`thumb ${
                (section==='front'  && i===0)||
                (section==='inside' && (i===1||i===2))||
                (section==='back'   && i===3) ? 'thumb-active':''}`}
              onClick={()=>setSection(i===0?'front':i===3?'back':'inside')}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}