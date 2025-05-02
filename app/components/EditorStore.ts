/**********************************************************************
 * EditorStore.ts – single source-of-truth (Zustand)
 * 2025-05-03  • NEW: updateLayer(action) + layerIndex tracking
 *********************************************************************/

import {create} from 'zustand'
import type {Layer, TemplatePage} from './FabricCanvas'

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
  addImage    : (file: File) => Promise<void>
  reorder     : (from: number, to: number) => void
  deleteLayer : (idx: number) => void

  /* NEW – merge live edits from Fabric */
  updateLayer : (pageIdx: number, layerIdx: number, data: Partial<Layer>) => void
}

export const useEditor = create<EditorState>((set, get) => ({
  /* ---------- data -------------------------------------------- */
  pages      : [],
  activePage : 0,

  /* ---------- setters ----------------------------------------- */
  setPages : pages      => set({pages}),
  setActive: activePage => set({activePage}),

  setPageLayers: (pageIdx, layers) =>
    set(state => {
      const pages = [...state.pages]
      if (!pages[pageIdx]) return {pages}
      pages[pageIdx] = {...pages[pageIdx], layers}
      return {pages}
    }),

  /* ---------- actions ----------------------------------------- */
  addText: () =>
    set(state => {
      const i       = state.activePage
      const pages   = [...state.pages]
      const layer   : Layer = {
        type : 'text',
        text : 'New text',
        x    : 100,
        y    : 100,
        width: 200,
      }
      layer.layerIndex = pages[i].layers.length     // ★ track index
      pages[i] = {...pages[i], layers: [...pages[i].layers, layer]}
      return {pages}
    }),

  addImage: async file => {
    /* 1 ▸ optimistic placeholder */
    const tempUrl = URL.createObjectURL(file)
    const i       = get().activePage
    const idx     = get().pages[i]?.layers.length ?? 0
    set(state => {
      const pages = [...state.pages]
      const layer: any = {
        type :'image',
        src  : tempUrl,
        x    : 100,
        y    : 100,
        width: 300,
        layerIndex: idx,                    // ★ track index
      }
      pages[i] = {...pages[i], layers: [layer, ...pages[i].layers]}
      return {pages}
    })

    /* 2 ▸ upload */
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/upload', {method:'POST', body:fd})
      if (!res.ok) {
        console.error('Upload failed', await res.text())
        return
      }
      const {url, assetId} = await res.json()

      /* 3 ▸ replace placeholder with CDN URL */
      set(state => {
        const pages  = [...state.pages]
        const layers = [...pages[i].layers]
        const j      = layers.findIndex(
          l => l.type === 'image' && l.src === tempUrl,
        )
        if (j !== -1) {
          layers[j] = {...layers[j], src: url, assetId}
          pages[i]  = {...pages[i], layers}
        }
        return {pages}
      })
    } catch (err) {
      console.error('Upload error', err)
    }
  },

  updateLayer: (pageIdx, layerIdx, data) =>
    set(state => {
      const pages = [...state.pages]
      const page  = pages[pageIdx]
      if (!page?.layers[layerIdx]) return {pages}
      const layers = [...page.layers]
      layers[layerIdx] = {...layers[layerIdx], ...data}
      pages[pageIdx] = {...page, layers}
      return {pages}
    }),

  reorder: (from, to) =>
    set(state => {
      const i      = state.activePage
      const pages  = [...state.pages]
      const layers = [...pages[i].layers]
      const [moved] = layers.splice(from, 1)
      layers.splice(to, 0, moved)
      pages[i] = {...pages[i], layers}
      return {pages}
    }),

  deleteLayer: idx =>
    set(state => {
      const i      = state.activePage
      const pages  = [...state.pages]
      const layers = [...pages[i].layers]
      layers.splice(idx, 1)
      pages[i] = {...pages[i], layers}
      return {pages}
    }),
}))