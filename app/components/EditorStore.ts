/**********************************************************************
 * EditorStore.ts – single source-of-truth (Zustand)
 *********************************************************************/
import { create } from 'zustand'
import type { Layer, TemplatePage } from './FabricCanvas'

interface EditorState {
  /* data */
  pages      : TemplatePage[]
  activePage : number

  /* simple setters */
  setPages      : (p: TemplatePage[]) => void
  setActive     : (idx: number) => void
  setPageLayers : (pageIdx: number, layers: Layer[]) => void

  /* actions */
  addText     : () => void
  addImage    : (file: File) => void
  reorder     : (from: number, to: number) => void
  deleteLayer : (idx: number) => void            // ← 🔑 this name is required
}

export const useEditor = create<EditorState>((set, get) => ({
  /* ---------- data -------------------------------------------- */
  pages: [],
  activePage: 0,

  /* ---------- setters ----------------------------------------- */
  setPages : pages          => set({ pages }),
  setActive: activePage     => set({ activePage }),

  /* replace all layers on one page (called by FabricCanvas) */
  setPageLayers: (pageIdx, layers) =>
    set(state => {
      const pages = [...state.pages]
      if (!pages[pageIdx]) return { pages }      // guard
      pages[pageIdx] = { ...pages[pageIdx], layers }
      return { pages }
    }),

  /* ---------- actions ----------------------------------------- */
  addText: () =>
    set(state => {
      const i     = state.activePage
      const pages = [...state.pages]
      pages[i] = {
        ...pages[i],
        layers: [
          ...pages[i].layers,
          { type:'text', text:'New text', x:100, y:100, width:200 },
        ],
      }
      return { pages }
    }),

  addImage: file => {
    const src = URL.createObjectURL(file)
    set(state => {
      const i     = state.activePage
      const pages = [...state.pages]
      pages[i] = {
        ...pages[i],
        layers: [
          { type:'image', src, x:100, y:100, width:300 },
          ...pages[i].layers,                 // put new image on top
        ],
      }
      return { pages }
    })
  },

  reorder: (from, to) =>
    set(state => {
      const i     = state.activePage
      const pages = [...state.pages]
      const layers = [...pages[i].layers]
      const [moved] = layers.splice(from, 1)
      layers.splice(to, 0, moved)
      pages[i] = { ...pages[i], layers }
      return { pages }
    }),

  deleteLayer: idx =>
    set(state => {
      const i     = state.activePage
      const pages = [...state.pages]
      const layers = [...pages[i].layers]
      layers.splice(idx, 1)
      pages[i] = { ...pages[i], layers }
      return { pages }
    }),
}))