/**********************************************************************
 * TextToolbar.tsx – rich-text controls + Undo · Redo · Save          *
 * keeps focus after every style change (no flicker)                  *
 *********************************************************************/
'use client'

import { useEffect, useState } from 'react'
import { fabric }              from 'fabric'
import { getActiveTextbox }    from './FabricCanvas'

type Mode = 'staff'|'customer'
const fonts = ['Arial','Georgia','monospace','Dingos Stamp']

interface Props{
  canvas   : fabric.Canvas|null
  addText  : () => void
  addImage : (file:File)=>void
  onUndo   : () => void
  onRedo   : () => void
  onSave   : () => void|Promise<void>
  onCrop   : () => void
  canCrop  : boolean
  mode     : Mode
  saving   : boolean
}

export default function TextToolbar(props:Props){
  const {canvas:fc,addText,addImage,onUndo,onRedo,onSave,onCrop,canCrop,mode,saving}=props
  if(!fc) return null

  /* re-render when Fabric selection changes */
  const [_,force] = useState({})
  useEffect(()=>{
    const tick=()=>force({})
    fc.on('selection:created',tick)
      .on('selection:updated',tick)
      .on('selection:cleared',tick)
    return()=>{fc.off('selection:created',tick)
                .off('selection:updated',tick)
                .off('selection:cleared',tick)}
  },[fc])

  const tb = getActiveTextbox(fc)

  /** mutate helper – apply Fabric props, keep focus, fire modified */
  const mutate = (p:Partial<fabric.Textbox>)=>{
    if(!tb) return
    tb.set(p); tb.setCoords()
    fc.setActiveObject(tb); fc.requestRenderAll()
    tb.fire('modified'); fc.fire('object:modified',{target:tb})
    force({})
  }

  /* ---------------------------------------------------------------- */
  return (
    <div className="fixed top-0 inset-x-0 z-30 flex justify-center pointer-events-none select-none">

      {/* ───────── ① MAIN TOOLBAR (staff only) ───────── */}
      {mode==='staff' && (
        <div className="toolbar pointer-events-auto flex flex-wrap items-center gap-2
                        border bg-white/95 backdrop-blur rounded-md shadow px-3 py-1
                        max-w-[800px] w-[calc(100%-10rem)]">

          {/* +Text */}
          <button onClick={addText} className="px-3 py-1 rounded bg-blue-600 text-white
                                               shrink-0 hover:bg-blue-700 active:bg-blue-800">
            + Text
          </button>

          {/* 📷 Image */}
          <label className="relative cursor-pointer">
            <span className="px-3 py-1 rounded bg-emerald-600 text-white shrink-0
                             hover:bg-emerald-700 active:bg-emerald-800">📷 Image</span>
            <input type="file" accept="image/*"
                   className="absolute inset-0 opacity-0 cursor-pointer"
                   onChange={e=>{
                     const f=e.currentTarget.files?.[0]; if(f) addImage(f)
                     e.currentTarget.value=''
                   }}/>
          </label>

          {/* font family */}
          <select disabled={!tb} value={tb?.fontFamily ?? fonts[0]}
                  onChange={e=>mutate({fontFamily:e.target.value})}
                  className="border p-1 rounded min-w-[8rem] disabled:opacity-40">
            {fonts.map(f=><option key={f}>{f}</option>)}
          </select>

          {/* font size */}
          <div className="flex items-center">
            <button disabled={!tb} onClick={()=>mutate({fontSize:Math.max(10,(tb!.fontSize??12)-4)})}
                    className="toolbar-btn rounded-l">−</button>
            <input disabled={!tb} type="number" value={tb?.fontSize ?? ''}
                   onChange={e=>mutate({fontSize:+e.target.value})}
                   className="w-14 border-t border-b p-1 text-center disabled:opacity-40"/>
            <button disabled={!tb} onClick={()=>mutate({fontSize:(tb!.fontSize??12)+4})}
                    className="toolbar-btn rounded-r">+</button>
          </div>

          {/* colour */}
          <input disabled={!tb} type="color" value={tb ? tb.fill as string : '#000000'}
                 onChange={e=>mutate({fill:e.target.value})}
                 className="disabled:opacity-40 h-8 w-8 border p-0"/>

          {/* B / I / U */}
          <button disabled={!tb} onClick={()=>mutate({fontWeight:tb!.fontWeight==='bold'?'normal':'bold'})}
                  className="toolbar-btn font-bold">B</button>
          <button disabled={!tb} onClick={()=>mutate({fontStyle:tb!.fontStyle==='italic'?'normal':'italic'})}
                  className="toolbar-btn italic">I</button>
          <button disabled={!tb} onClick={()=>mutate({underline:!tb!.underline})}
                  className="toolbar-btn underline">U</button>

          {/* Aa / aa / AA */}
          <button disabled={!tb} onClick={()=>mutate({text:tb!.text!.replace(/\b\w/g,c=>c.toUpperCase())})}
                  className="toolbar-btn">Aa</button>
          <button disabled={!tb} onClick={()=>mutate({text:tb!.text!.toLowerCase()})}
                  className="toolbar-btn">aa</button>
          <button disabled={!tb} onClick={()=>mutate({text:tb!.text!.toUpperCase()})}
                  className="toolbar-btn">AA</button>

          {/* align */}
          <select disabled={!tb} value={tb?.textAlign ?? ''}
                  onChange={e=>mutate({textAlign:e.target.value as any})}
                  className="border p-1 rounded disabled:opacity-40">
            <option value="left">←</option>
            <option value="center">↔︎</option>
            <option value="right">→</option>
            <option value="justify">⎯</option>
          </select>

          {/* line-height */}
          <input disabled={!tb} type="number" step={0.1} min={0.5} max={3}
                 value={tb?.lineHeight ?? ''}
                 onChange={e=>mutate({lineHeight:+e.target.value})}
                 className="w-16 border p-1 rounded disabled:opacity-40"/>

          {/* opacity */}
          <input disabled={!tb} type="range" min={0} max={1} step={0.01}
                 value={tb?.opacity ?? 1}
                 onChange={e=>mutate({opacity:+e.target.value})}
                 className="disabled:opacity-40"/>
        </div>
      )}

      {/* ───────── ② COMMANDS ───────── */}
      <div className="absolute right-4 top-2 flex gap-4 pointer-events-auto">
        <button onClick={onUndo} className="command-btn">↶ Undo</button>
        <button onClick={onRedo} className="command-btn">↷ Redo</button>
        <button onClick={onCrop} disabled={!canCrop} className="command-btn">✂ Crop</button>
        <button onClick={onSave} disabled={saving}
                className={`command-btn font-semibold ${saving?'opacity-50 cursor-not-allowed':'text-blue-600'}`}>
          {saving ? '⏳ Saving…' : '💾 Save'}
        </button>
      </div>
    </div>
  )
}

/* inject one-off tiny CSS (only once) */
if(typeof window!=='undefined' && !document.getElementById('toolbar-css')){
  const shared='border px-2 py-[2px] rounded hover:bg-gray-100 disabled:opacity-40'
  const style=document.createElement('style'); style.id='toolbar-css'
  style.innerHTML=`.toolbar-btn{${shared}} .command-btn{${shared}}`
  document.head.appendChild(style)
}