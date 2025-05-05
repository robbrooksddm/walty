/**********************************************************************
 * EditorStore.ts – single source-of-truth (Zustand)
 * 2025-05-09 • adds Selfie-Drawer state + helpers
 *********************************************************************/
import { create } from 'zustand';
import type { Layer, TemplatePage } from './FabricCanvas';

type DrawerState = 'closed' | 'idle' | 'picked' | 'generating' | 'grid' | 'applying';

interface EditorState {
  /* ─────────────── card data ─────────────── */
  pages      : TemplatePage[];
  activePage : number;

  /* ─────────────── drawer data ───────────── */
  drawerState   : DrawerState;   // finite-state machine
  drawerImages  : string[];      // 4 variant URLs
  drawerProgress: number;        // 0-100 %
  selectedFile? : File;          // raw upload
  choice?       : number;        // index 0-3 selected in grid

  /* ─────────────── setters ──────────────── */
  setPages      : (p: TemplatePage[]) => void;
  setActive     : (idx: number) => void;
  setPageLayers : (page: number, layers: Layer[]) => void;

  setDrawerState: (s: DrawerState) => void;
  setDrawerImgs : (imgs: string[]) => void;
  setProgress   : (n: number) => void;

  /* ─────────────── canvas ↔ sidebar actions ─────────────── */
  addText     : () => void;
  addImage    : (file: File) => Promise<void>;
  updateLayer : (page: number, idx: number, data: Partial<Layer>) => void;
  reorder     : (from: number, to: number) => void;
  deleteLayer : (idx: number) => void;
}

export const useEditor = create<EditorState>((set, get) => ({
  /* ─────────────── card data ─────────────── */
  pages      : [],
  activePage : 0,

  /* ─────────────── drawer defaults ───────── */
  drawerState   : 'idle',
  drawerImages  : [],
  drawerProgress: 0,

  /* ─────────────── generic setters ───────── */
  setPages : pages      => set({ pages }),
  setActive: activePage => set({ activePage }),

  setDrawerState: s     => set({ drawerState: s, drawerProgress: 0 }),
  setDrawerImgs : imgs  => set({ drawerImages: imgs, choice: undefined }),
  setProgress   : n     => set({ drawerProgress: n }),

  /*  FabricCanvas pushes its full layer list on every change  */
  setPageLayers: (pageIdx, layers) =>
    set(state => {
      const pages = [...state.pages];
      if (!pages[pageIdx]) return { pages };
      pages[pageIdx] = { ...pages[pageIdx], layers };
      return { pages };
    }),

  /* ─────────────── editor actions ─────────────── */
  addText: () =>
    set(state => {
      const i     = state.activePage;
      const pages = [...state.pages];
      const layer: Layer = {
        type :'text',
        text :'New text',
        x    : 100,
        y    : 100,
        width: 200,
      };
      pages[i] = { ...pages[i], layers: [...pages[i].layers, layer] };
      return { pages };
    }),

  addImage: async file => {
    /* 1 ▸ optimistic placeholder ------------------------------ */
    const tempUrl = URL.createObjectURL(file);
    const i       = get().activePage;
    set(state => {
      const pages = [...state.pages];
      const layer: Layer = { type:'image', src:tempUrl, x:100, y:100, width:300 };
      pages[i] = { ...pages[i], layers: [...pages[i].layers, layer] };
      return { pages };
    });

    /* 2 ▸ upload then replace --------------------------------- */
    try {
      const fd  = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method:'POST', body:fd });
      if (!res.ok) throw new Error(await res.text());
      const { url, assetId } = await res.json();

      set(state => {
        const pages  = [...state.pages];
        const layers = [...pages[i].layers];
        const j      = layers.findIndex(l =>
                          l.type==='image' && l.src===tempUrl);
        if (j !== -1) layers[j] = { ...layers[j], src:url, assetId };
        pages[i] = { ...pages[i], layers };
        return { pages };
      });
    } catch (err) {
      console.error('Upload error', err);
    }
  },

  /*  merge live edits coming back from FabricCanvas  */
  updateLayer: (pageIdx, idx, data) =>
    set(state => {
      const pages  = [...state.pages];
      const layers = [...pages[pageIdx].layers];
      if (!layers[idx]) return { pages };
      layers[idx] = { ...layers[idx], ...data };
      pages[pageIdx] = { ...pages[pageIdx], layers };
      return { pages };
    }),

  /*  drag-to-reorder in LayerPanel  */
  reorder: (from, to) =>
    set(state => {
      const i      = state.activePage;
      const pages  = [...state.pages];
      const layers = [...pages[i].layers];
      const [moved] = layers.splice(from, 1);
      layers.splice(to, 0, moved);
      pages[i] = { ...pages[i], layers };
      return { pages };
    }),

  /*  delete button in LayerPanel  */
  deleteLayer: idx =>
    set(state => {
      const i      = state.activePage;
      const pages  = [...state.pages];
      const layers = [...pages[i].layers];
      layers.splice(idx, 1);
      pages[i] = { ...pages[i], layers };
      return { pages };
    }),
}));