/**********************************************************************
 * FabricCanvas.tsx — renders one printable page with Fabric.js
 * (stable, no-flicker version)
 *********************************************************************/
'use client'

import { useEffect, useRef } from 'react'
import { fabric }            from 'fabric'
import { useEditor }         from './EditorStore'

/* ------------------------------------------------------------------ */
/* geometry & scale                                                  */
const PAGE_W = 1240, PAGE_H = 1748
const PREVIEW_W = 420
const PREVIEW_H = Math.round(PAGE_H * PREVIEW_W / PAGE_W)
const SCALE      = PREVIEW_W / PAGE_W

fabric.Object.prototype.cornerSize      = Math.round(4 / SCALE)
// @ts-ignore runtime-only prop
fabric.Object.prototype.touchCornerSize = Math.round(4 / SCALE)

/* ------------------------------------------------------------------ */
/* shared types                                                       */
export interface Layer {
  type : 'image' | 'text'
  /* image */ src?:string;width?:number;height?:number
  /* text  */ text?:string;fontSize?:number;fontFamily?:string
              fontWeight?:any;fontStyle?:any;underline?:boolean;fill?:string
  /* geom  */ x:number;y:number;scaleX?:number;scaleY?:number
  selectable?:boolean;editable?:boolean;[k:string]:any
}
export interface TemplatePage { name:string; layers:Layer[] }

/* helper ----------------------------------------------------------- */
export const getActiveTextbox = (fc:fabric.Canvas|null)=>
  fc && (fc.getActiveObject() as any)?.type==='textbox'
    ? (fc.getActiveObject() as fabric.Textbox)
    : null

const hex = (c='#000')=>c.length===4
  ?`#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`:c.toLowerCase()

/* very small history impl – good enough for dev-server use ---------- */
const _hist:fabric.Object[][]=[]; let _ptr=-1
const snap=(fc:fabric.Canvas)=>{
  _hist.splice(_ptr+1); _hist.push(fc.getObjects().map(o=>o.toObject()))
  _ptr=_hist.length-1
}
export const undo=(fc:fabric.Canvas)=>{
  if(_ptr<=0)return
  _ptr--; fc.loadFromJSON({objects:_hist[_ptr]},()=>fc.renderAll())
}
export const redo=(fc:fabric.Canvas)=>{
  if(_ptr>=_hist.length-1)return
  _ptr++; fc.loadFromJSON({objects:_hist[_ptr]},()=>fc.renderAll())
}

/* ------------------------------------------------------------------ */
/*              React component                                      */
/* ------------------------------------------------------------------ */
interface Props{
  pageIdx:number
  page?:TemplatePage
  onReady:(fc:fabric.Canvas|null)=>void
}

export default function FabricCanvas({pageIdx,page,onReady}:Props){

  /* refs --------------------------------------------------------- */
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const fcRef    =useRef<fabric.Canvas|null>(null)
  const hoverRef =useRef<fabric.Rect|null>(null)
  const hydrating=useRef(false)

  /* Zustand setter ---------------------------------------------- */
  const setPageLayers=useEditor(s=>s.setPageLayers)

  /* ①  mount Fabric once ---------------------------------------- */
  useEffect(()=>{
    if(!canvasRef.current) return

    const fc=new fabric.Canvas(canvasRef.current,{
      backgroundColor:'#fff',
      width:PAGE_W,height:PAGE_H,
    })
    fc.setViewportTransform([SCALE,0,0,SCALE,0,0])
    fc.setWidth (PREVIEW_W)
    fc.setHeight(PREVIEW_H)

    /* expose for debug, remove in prod */
    ;(window as any).__fabric=fc

    /* purple hover rectangle ------------------------------------ */
    const hl=new fabric.Rect({
      left:0,top:0,width:10,height:10,
      fill:'transparent',stroke:'#8b5cf6',
      strokeWidth:2/SCALE,strokeDashArray:[6/SCALE,4/SCALE],
      selectable:false,evented:false,visible:false,
      excludeFromExport:true,
    })
    hoverRef.current=hl
    fc.add(hl)

    fc.on('mouse:over',e=>{
      if((e.target as any)?.type!=='textbox')return
      const {left,top,width,height}=(e.target as fabric.Object)
        .getBoundingRect(true,true)
      hl.set({left,top,width,height,visible:true})
      hl.bringToFront(); fc.renderAll()
    }).on('mouse:out',e=>{
      if((e.target as any)?.type!=='textbox')return
      hl.set('visible',false); fc.renderAll()
    })

    /* ---------- sync → Zustand (debounced) --------------------- */
    const objToLayer=(o:fabric.Object):Layer=>{
      const b=o.toObject() as any
      if(o.type==='image') b.src=(o as fabric.Image).getSrc()
      return {...b,
        type:o.type==='textbox'?'text':'image',
        x:b.left??0,y:b.top??0,
        scaleX:b.scaleX,scaleY:b.scaleY,
      }
    }
    let timer:ReturnType<typeof setTimeout>|null=null
    const sync=()=>{
      if(hydrating.current) return
      if(timer) clearTimeout(timer)
      timer=setTimeout(()=>{
        setPageLayers(pageIdx,fc.getObjects().map(objToLayer))
        timer=null
      },100)
    }

    /* history + sync on real edits ------------------------------ */
    fc.on('object:modified', ()=>{snap(fc);sync()})
      .on('text:changed',          sync)
      .on('text:editing:exited',   sync)

    snap(fc)                       // initial snapshot

    fcRef.current=fc; onReady(fc)
    return()=>{ onReady(null); fc.dispose() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  /* ②  redraw whenever page prop changes ------------------------ */
  useEffect(()=>{
    const fc=fcRef.current
    if(!fc||!page) return

    hydrating.current=true
    fc.clear(); if(hoverRef.current) fc.add(hoverRef.current)

    page.layers.forEach(ly=>{

      /* ------ IMAGE ------------------------------------------- */
      if(ly.type==='image'&&ly.src){
        const opts=ly.src.startsWith('data:')||ly.src.startsWith('blob:')
          ? undefined : {crossOrigin:'anonymous'}

        const add=(img:fabric.Image|HTMLImageElement)=>{
          const i=img instanceof fabric.Image?img:new fabric.Image(img)
          if(ly.scaleX==null||ly.scaleY==null){
            const s=Math.min(1,PAGE_W/i.width!,PAGE_H/i.height!)
            i.scale(s)
          }else i.set({scaleX:ly.scaleX,scaleY:ly.scaleY})

          i.set({
            left:ly.x,top:ly.y,originX:'left',originY:'top',
            selectable:ly.selectable??true,evented:ly.editable??true,
          })
          fc.add(i); i.setCoords(); i.sendToBack()   // always under text
        }

        fabric.Image.fromURL(ly.src,add,opts)
        return                                          // next layer
      }

      /* ------ TEXT -------------------------------------------- */
      if(ly.type==='text'&&ly.text){
        const tb=new fabric.Textbox(ly.text,{
          left:ly.x,top:ly.y,originX:'left',originY:'top',
          width:ly.width??200,
          fontSize  :ly.fontSize   ??Math.round(32/SCALE),
          fontFamily:ly.fontFamily ??'Arial',
          fontWeight:ly.fontWeight ??'normal',
          fontStyle :ly.fontStyle  ??'normal',
          underline :!!ly.underline,
          fill      :hex(ly.fill??'#000'),
          selectable:ly.selectable ??true,
          editable  :ly.editable   ??true,
          scaleX:ly.scaleX??1,scaleY:ly.scaleY??1,
          lockScalingFlip:true,
        })
        fc.add(tb); tb.bringToFront()
        hoverRef.current?.bringToFront()
      }
    })

    fc.requestRenderAll()
    hydrating.current=false
  },[page])

  /* ③ render ---------------------------------------------------- */
  return(
    <canvas ref={canvasRef}
            width={PREVIEW_W} height={PREVIEW_H}
            className="border w-full h-auto max-w-[420px]"/>
  )
}