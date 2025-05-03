/**********************************************************************
 * FabricCanvas.tsx — renders one printable page with Fabric.js
 * (stable • correct z-order • live-save • TS-clean)
 * --------------------------------------------------------------------
 * 2025-05-03  patch-live-2  + AI placeholder handling
 *********************************************************************/
'use client'

import {useEffect, useRef} from 'react'
import {fabric}            from 'fabric'
import {useEditor}         from './EditorStore'
import {fromSanity}        from '../library/layerAdapters'

/* ---------- size helpers ---------------------------------------- */
const DPI = 300
const mm  = (n: number) => (n / 25.4) * DPI
const TRIM_W_MM = 150
const TRIM_H_MM = 214
const BLEED_MM  = 3
const PAGE_W = Math.round(mm(TRIM_W_MM + BLEED_MM * 2))
const PAGE_H = Math.round(mm(TRIM_H_MM + BLEED_MM * 2))
const PREVIEW_W = 420
const PREVIEW_H = Math.round(PAGE_H * PREVIEW_W / PAGE_W)
const SCALE     = PREVIEW_W / PAGE_W

fabric.Object.prototype.cornerSize      = Math.round(4 / SCALE)
// @ts-ignore runtime only
fabric.Object.prototype.touchCornerSize = Math.round(4 / SCALE)

/* ---------- types ------------------------------------------------ */
export interface Layer {
  type :'image'|'text'
  src?:string; assetId?:string; width?:number; height?:number
  text?:string; fontSize?:number; fontFamily?:string
  fontWeight?:any; fontStyle?:any; underline?:boolean
  fill?:string; textAlign?:string; lineHeight?:number
  opacity?:number
  x:number; y:number; scaleX?:number; scaleY?:number
  selectable?:boolean; editable?:boolean
  layerIndex?:number
  _isAI?:boolean                 // ← internal flag
  [k:string]:any
}
export interface TemplatePage { name:string; layers:Layer[] }

export const getActiveTextbox = (fc:fabric.Canvas|null) =>
  fc && (fc.getActiveObject() as any)?.type === 'textbox'
    ? (fc.getActiveObject() as fabric.Textbox)
    : null

const hex = (c='#000') =>
  c.length===4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c.toLowerCase()

/* ---------- tiny undo / redo ------------------------------------ */
const _hist:fabric.Object[][]=[]; let _ptr=-1
const snap = (fc:fabric.Canvas)=>{
  _hist.splice(_ptr+1)
  _hist.push(fc.getObjects().map(o=>o.toObject()))
  _ptr = _hist.length-1
}
export const undo = (fc:fabric.Canvas)=>{
  if(_ptr<=0) return
  _ptr--
  fc.loadFromJSON({objects:_hist[_ptr]},()=>fc.renderAll())
}
export const redo = (fc:fabric.Canvas)=>{
  if(_ptr>=_hist.length-1) return
  _ptr++
  fc.loadFromJSON({objects:_hist[_ptr]},()=>fc.renderAll())
}

/* ---------- safe-area guides ------------------------------------ */
const addGuides = (fc:fabric.Canvas)=>{
  fc.getObjects().filter(o=>(o as any)._guide).forEach(o=>fc.remove(o))
  const inset   = mm(8 + BLEED_MM)
  const strokeW = mm(0.5)
  const dash    = [mm(3)]
  const make = (xy:[number,number,number,number]) =>
    Object.assign(
      new fabric.Line(xy,{
        stroke:'#34d399',
        strokeWidth:strokeW,
        strokeDashArray:dash,
        selectable:false, evented:false, excludeFromExport:true,
      }),
      {_guide:true}
    )
  ;[
    make([inset,           inset,           PAGE_W-inset, inset]),
    make([PAGE_W-inset,    inset,           PAGE_W-inset, PAGE_H-inset]),
    make([PAGE_W-inset,    PAGE_H-inset,    inset,        PAGE_H-inset]),
    make([inset,           PAGE_H-inset,    inset,        inset]),
  ].forEach(l=>fc.add(l))
}

/* ---------- component ------------------------------------------- */
interface Props{
  pageIdx:number
  page?:TemplatePage
  onReady:(fc:fabric.Canvas|null)=>void
}

export default function FabricCanvas({pageIdx,page,onReady}:Props){
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fcRef     = useRef<fabric.Canvas|null>(null)
  const hoverRef  = useRef<fabric.Rect|null>(null)
  const hydrating = useRef(false)
  const isEditing = useRef(false)

  /* Zustand actions */
  const setPageLayers = useEditor(s=>s.setPageLayers)
  const updateLayer   = useEditor(s=>s.updateLayer)

  /* ---------- mount once --------------------------------------- */
  useEffect(()=>{
    if(!canvasRef.current) return
    const fc = new fabric.Canvas(canvasRef.current,{
      backgroundColor:'#fff',
      width:PAGE_W, height:PAGE_H,
      preserveObjectStacking:true,
    })
    fc.setViewportTransform([SCALE,0,0,SCALE,0,0])
    fc.setWidth(PREVIEW_W); fc.setHeight(PREVIEW_H)
    if(typeof window!=='undefined') (window as any).fc = fc

    /* purple hover outline */
    const hl = new fabric.Rect({
      left:0, top:0, width:10, height:10,
      fill:'transparent',
      stroke:'#8b5cf6',
      strokeWidth:2/SCALE,
      strokeDashArray:[6/SCALE,4/SCALE],
      selectable:false, evented:false, visible:false,
      excludeFromExport:true,
    })
    hoverRef.current = hl
    fc.add(hl)

    addGuides(fc)

    /* selection / hover */
    fc.on('selection:created', ()=>hl.visible=false)
      .on('selection:updated', ()=>hl.visible=false)
      .on('selection:cleared', ()=>hl.visible=false)

    fc.on('mouse:over', e=>{
      const t=e.target as any
      if(!t||t._guide) return
      hl.set({
        width : t.width * t.scaleX,
        height: t.height* t.scaleY,
        left  : t.left,
        top   : t.top,
        visible:true,
      })
      fc.requestRenderAll()
    })
    fc.on('mouse:out', ()=>{hl.visible=false; fc.requestRenderAll()})

    /* history */
    fc.on('object:added',   ()=>snap(fc))
    fc.on('object:removed', ()=>snap(fc))

    /* live-update sync */
    fc.on('object:modified', e=>{
      isEditing.current = true
      snap(fc)

      const t = e.target as any
      if(!t||t.layerIdx===undefined) return
      const data:Partial<Layer> = {
        x:t.left, y:t.top, scaleX:t.scaleX, scaleY:t.scaleY,
      }
      if(t.type==='textbox'){
        Object.assign(data,{text:t.text,fontSize:t.fontSize,fill:t.fill})
      }
      if(t.type==='image'){
        Object.assign(data,{width:t.width*t.scaleX,height:t.height*t.scaleY})
      }
      updateLayer(pageIdx, t.layerIdx, data)
      setTimeout(()=>{isEditing.current=false},0)
    })

    /* real-time typing */
    fc.on('text:changed', e=>{
      isEditing.current = true
      const t = e.target as any
      if(!t||t.layerIdx===undefined) return
      updateLayer(pageIdx, t.layerIdx, {
        text:t.text, fontSize:t.fontSize, fill:t.fill,
        width:t.width*t.scaleX, height:t.height*t.scaleY,
      })
      setTimeout(()=>{ isEditing.current = false }, 0)
    })

    fcRef.current = fc
    onReady(fc)
    return ()=>{ onReady(null); fc.dispose() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  /* ---------- redraw on page change ----------------------------- */
  useEffect(()=>{
    const fc = fcRef.current
    if(!fc||!page) return

    if(isEditing.current) return       // guard against self-trigger

    hydrating.current = true
    fc.clear()
    hoverRef.current && fc.add(hoverRef.current)

    /* bottom → top to preserve z-order */
    for(let idx=page.layers.length-1; idx>=0; idx--){
          const raw = page.layers[idx]
      
          // (1) If it’s already an editor layer → use it
          // (2) otherwise convert Sanity → editor
          let ly: Layer | null =
            raw && (raw as any).type
              ? (raw as Layer)
              : fromSanity(raw)
      
          /* ── special-case AI placeholder ──────────────────────────── */
          if (raw?._type === 'aiPlaceholder' && ly) {
            ly = {
              ...raw,                 // keeps prompt, refImage, locked …
              ...ly,                  // + rendering props (src / x / y…)
              _isAI : true,
            }
          }
      if(!ly) continue

      /* -- IMAGE -------------------------------------------------- */
      if(ly.type==='image' && ly.src){
        const opts = ly.src.startsWith('data:')||ly.src.startsWith('blob:')
                      ? undefined
                      : {crossOrigin:'anonymous'}

        fabric.Image.fromURL(ly.src, img=>{
          const i = img instanceof fabric.Image ? img : new fabric.Image(img)

          /* auto-scale if none provided */
          if(ly.scaleX==null||ly.scaleY==null){
            const s=Math.min(1,PAGE_W/i.width!,PAGE_H/i.height!)
            i.scale(s)
          }else{
            i.set({scaleX:ly.scaleX, scaleY:ly.scaleY})
          }

          i.set({
            left:ly.x, top:ly.y,
            originX:'left', originY:'top',
            selectable:ly.selectable??true,
            evented   :ly.editable  ??true,
            opacity   :ly.opacity   ??1,
          })

                     /* AI placeholder ──────────────────────────────────────────────── */
if (ly._isAI) {
  // keep whatever fromSanity decided (locked ⇒ false / editable ⇒ true)
  i.set({
    selectable : ly.selectable ?? false,
    evented    : ly.editable   ?? false,
    hasControls: ly.selectable ?? false,   // hide corners when locked
  })

  /* add a DOM marker so the coach-mark can find it */
  const el = (i as fabric.Image).getElement()
  el?.setAttribute('data-ai-placeholder', '')
}

          ;(i as any).layerIdx = idx
          const insertPos = fc.getObjects()
            .findIndex(o=>(o as any).layerIdx!==undefined &&
                         (o as any).layerIdx < idx)
          fc.insertAt(i, insertPos===-1 ? fc.getObjects().length : insertPos, false)
          i.setCoords()
        }, opts)
        continue
      }

      /* -- TEXT --------------------------------------------------- */
      if(ly.type==='text' && ly.text){
        const tb = new fabric.Textbox(ly.text,{
          left:ly.x, top:ly.y,
          originX:'left', originY:'top',
          width     :ly.width     ?? 200,
          fontSize  :ly.fontSize  ?? Math.round(32/SCALE),
          fontFamily:ly.fontFamily?? 'Arial',
          fontWeight:ly.fontWeight?? 'normal',
          fontStyle :ly.fontStyle ?? 'normal',
          underline :!!ly.underline,
          fill      :hex(ly.fill??'#000'),
          textAlign :ly.textAlign ?? 'left',
          lineHeight:ly.lineHeight??1.16,
          opacity   :ly.opacity??1,
          selectable:ly.selectable??true,
          editable  :ly.editable??true,
          scaleX:ly.scaleX??1,
          scaleY:ly.scaleY??1,
          lockScalingFlip:true,
        })
        ;(tb as any).layerIdx = idx
        fc.add(tb)
      }
    }

    addGuides(fc)
    hoverRef.current?.bringToFront()
    fc.requestRenderAll()
    hydrating.current = false
  },[page])

  /* ---------- render ------------------------------------------- */
  return (
    <canvas
      ref   ={canvasRef}
      width ={PREVIEW_W}
      height={PREVIEW_H}
      className="border w-full h-auto max-w-[420px]"
    />
  )
}