// app/components/EditorStore.ts
import { create } from 'zustand';
import type { TemplatePage } from './FabricCanvas';   // ← correct path

interface EditorState {
  pages      : TemplatePage[];
  activePage : number;
  setPages   : (p: TemplatePage[]) => void;
  setActive  : (idx: number) => void;
  addText    : () => void;
  addImage   : (f: File) => void;
  reorder    : (from: number, to: number) => void;
  delete     : (idx: number) => void;
}

export const useEditor = create<EditorState>((set, get) => ({
  /* data ------------------------------------------------------- */
  pages: [], activePage: 0,
  setPages : (p)   => set({ pages: p }),
  setActive: (idx) => set({ activePage: idx }),

  /* add text --------------------------------------------------- */
  addText: () => set(s => {
    const p = [...s.pages];
    const a = s.activePage;
    p[a] = { ...p[a],
      layers: [...p[a].layers, { type:'text', text:'New text', x:100, y:100, width:200 }],
    };
    return { pages: p };
  }),

 /* add image -------------------------------------------------- */
addImage: (file) => {
  const reader = new FileReader();

  reader.onload = () => {
    const src = reader.result as string;          // <- data:image/…

    set((s) => {
      const p = [...s.pages];
      const a = s.activePage;
      p[a] = {
        ...p[a],
        layers: [{ type:'image', src, x:100, y:100, width:300 }, ...p[a].layers],
      };
      return { pages: p };
    });
  };

  reader.readAsDataURL(file);                     // <- kicks off load
},

  /* drag-reorder (0 = top layer) ------------------------------- */
  reorder: (from, to) => set(s => {
    const p = [...s.pages];
    const a = s.activePage;
    const l = [...p[a].layers];
    const [m] = l.splice(from, 1);
    l.splice(to, 0, m);
    p[a] = { ...p[a], layers: l };
    return { pages: p };
  }),

  /* delete layer ---------------------------------------------- */
  delete: (idx) => set(s => {
    const p = [...s.pages];
    const a = s.activePage;
    const l = [...p[a].layers];
    l.splice(idx, 1);
    p[a] = { ...p[a], layers: l };
    return { pages: p };
  }),
}));