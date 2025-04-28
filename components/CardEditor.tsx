/**********************************************************************
 * CardEditor.tsx – 3-step UI
 *   • Front (page 0) • Inside (pages 1 & 2) • Back (page 3)
 *********************************************************************/
'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { fabric } from 'fabric';

import FabricCanvas, {
  TemplatePage, undo, redo,
} from './FabricCanvas';
import TextToolbar from './TextToolbar';

/* ─────────── helpers ─────────── */
type Section = 'front' | 'inside' | 'back';
type PageIdx  = 0 | 1 | 2 | 3;
type Mode     = 'staff' | 'customer';

/* ─────────── global store ─────── */
interface EditorState {
  pages   : TemplatePage[];
  setPages: (p: TemplatePage[]) => void;
  addText : (idx: PageIdx) => void;
}

const useEditor = create<EditorState>((set) => ({
  pages: [],
  setPages: (p) => set({ pages: p }),

  addText: (idx) =>
    set((s) => {
      if (!s.pages[idx]) return s;
      const pages  = [...s.pages];
      const layers = [...pages[idx].layers];

      layers.push({
        type:'text', text:'New text', x:100, y:100,
        width:300, fontSize:120, fill:'#000',
        editable:true, selectable:true,
      });
      pages[idx] = { ...pages[idx], layers };
      return { pages };
    }),
}));

/* =================== COMPONENT =================== */
export default function CardEditor({
  initialPages, mode = 'customer',
}: { initialPages: TemplatePage[]; mode?: Mode }) {

  /* inject template once ---------------------------------------- */
  useEffect(() => {
    if (initialPages?.length === 4) {
      useEditor.getState().setPages(initialPages);
    }
  }, [initialPages]);

  const pages   = useEditor((s) => s.pages);
  const addText = useEditor((s) => s.addText);

  /* track which section (tab) is shown -------------------------- */
  const [section, setSection] = useState<Section>('front');
  const activeIdx: PageIdx =
    section === 'front'  ? 0 :
    section === 'inside' ? 1 : 3;

  /* map <physical page idx> ➜ Fabric instance ------------------- */
  const [canvasMap, setCanvasMap] = useState<(fabric.Canvas|null)[]>([null,null,null,null]);
  const onReady = (idx: number, fc: fabric.Canvas | null) =>
    setCanvasMap((m) => { const copy = [...m]; copy[idx] = fc; return copy; });

  const activeFc = canvasMap[activeIdx] ?? null;

  /* guard until template loaded --------------------------------- */
  if (pages.length !== 4) {
    return <div className="h-screen flex items-center justify-center text-gray-500">
             loading template…
           </div>;
  }

  const box = 'flex-shrink-0 w-[420px]';

  return (
    <div className="h-screen flex flex-col">

      {/* toolbar */}
      <TextToolbar
        canvas={activeFc}
        addText={() => addText(activeIdx)}
        onUndo={() => activeFc && undo(activeFc)}
        onRedo={() => activeFc && redo(activeFc)}
        onSave={() => {}}
        mode={mode}
      />

      {/* top nav */}
      <nav className="flex justify-center gap-8 py-3 text-sm font-medium">
        {(['front','inside','back'] as Section[]).map(lbl => (
          <button key={lbl} onClick={() => setSection(lbl)}
            className={section===lbl
              ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
              : 'text-gray-500 hover:text-gray-800'}>
            {lbl.replace(/^./, c => c.toUpperCase())}
          </button>
        ))}
      </nav>

      {/* canvases */}
      <div className="flex-1 flex justify-center items-start overflow-auto
                      bg-gray-100 dark:bg-gray-900 pt-6 gap-6">

        {/* Front */}
        <div className={section==='front' ? box : 'hidden'}>
          <FabricCanvas pageIdx={0} page={pages[0]} onReady={(fc)=>onReady(0,fc)}/>
        </div>

        {/* Inside (L + R) */}
        <div className={section==='inside' ? 'flex gap-6' : 'hidden'}>
          <div className={box}>
            <FabricCanvas pageIdx={1} page={pages[1]} onReady={(fc)=>onReady(1,fc)}/>
          </div>
          <div className={box}>
            <FabricCanvas pageIdx={2} page={pages[2]} onReady={(fc)=>onReady(2,fc)}/>
          </div>
        </div>

        {/* Back */}
        <div className={section==='back' ? box : 'hidden'}>
          <FabricCanvas pageIdx={3} page={pages[3]} onReady={(fc)=>onReady(3,fc)}/>
        </div>
      </div>

      {/* thumbnails */}
      <div className="flex justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 text-xs">
        {(['FRONT','INNER-L','INNER-R','BACK'] as const).map((lbl,i)=>(
          <button key={lbl}
            className={`thumb ${(section==='front' && i===0)||
                                (section==='inside'&&(i===1||i===2))||
                                (section==='back' && i===3)
                                ? 'thumb-active':''}`}
            onClick={()=>{
              if(i===0) setSection('front');
              else if(i===3) setSection('back');
              else setSection('inside');
            }}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}