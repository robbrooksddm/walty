/**********************************************************************
 * SelfieDrawer.tsx
 * idle   → pick / replace
 * generating → progress bar (fake until real API wired)
 * select → user picks 1 of 4 variants
 *********************************************************************/
'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { Dialog, Transition }                    from '@headlessui/react'

/*───────────────── placeholders ─────────────────*/
const SAMPLE_FACES = [
  '/sample-faces/sample-face 1.webp',
  '/sample-faces/sample-face 2.webp',
  '/sample-faces/sample-face 3.webp',
  '/sample-faces/sample-face 4.webp',
] as const   // ⇢ string literal array

/*───────────────── constants & types ────────────*/
type Phase    = 'idle' | 'generating' | 'select'
 type Props = {
       open: boolean
       onClose: () => void
       onUseSelected: (url: string) => void   // 👈 NEW
     }
const SLIDE_MS  = 300
const DRAWER_PX = 340

/*───────────────── component ────────────────────*/
export default function SelfieDrawer ({ open, onClose, onUseSelected }: Props) {  /*── file-picker ─*/
  const [file,    setFile]    = useState<File|null>(null)
  const [preview, setPreview] = useState('')
  /*── workflow ─*/
  const [phase,   setPhase]   = useState<Phase>('idle')
  const [pct,     setPct]     = useState(0)                    // progress %
  const [results, setResults] = useState<string[]>([])         // 4 URLs
  const [choice,  setChoice]  = useState(0)                    // chosen index

  const inputRef = useRef<HTMLInputElement|null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)

  /* revoke blob URL when component unmounts / file changes */
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  /* fake progress bar ------------------------------------------------*/
  useEffect(() => {
    if (phase !== 'generating') return
    setPct(0)
    timerRef.current = setInterval(() => {
      setPct(p => {
        if (p >= 100) { clearInterval(timerRef.current!); fetchResults(); return 100 }
        return p + 2.5
      })
    }, 100)
    return () => clearInterval(timerRef.current!)
  }, [phase])

  /* helpers ----------------------------------------------------------*/
  const openPicker  = () => inputRef.current?.click()
  const resetToIdle = ()   => { clearInterval(timerRef.current!); setPct(0); setPhase('idle') }

  const handleFiles = (files?: FileList|null) => {
    if (!files?.length) return
    const f = files[0]
    if (!f.type.startsWith('image/')) { alert('Please pick an image'); return }
    if (f.size > 8 * 1024 * 1024)     { alert('Max size is 8 MB');      return }

    preview && URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const startGeneration = () => { if (file) setPhase('generating') }

  /* stub: replace with a real API call that returns 4 face-swap URLs */
  const fakeSwap = (): Promise<string[]> =>
    new Promise(res => setTimeout(() => res([...SAMPLE_FACES]), 1200))

  const fetchResults = async () => {
    const urls = await fakeSwap()          // ← swap with your API
    setResults(urls)
    setChoice(0)
    setPhase('select')
  }

  /*────────────────────────── render ───────────────────────────────*/
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 flex"
              onClose={() => { resetToIdle(); onClose() }}>

        {/* backdrop */}
        <Transition.Child as={Fragment}
          enter={`transition-opacity ease-out duration-${SLIDE_MS} delay-${SLIDE_MS}`}
          enterFrom="opacity-0" enterTo="opacity-100"
          leave={`transition-opacity ease-in duration-${SLIDE_MS}`}
          leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className={`fixed inset-y-0 left-0 right-[${DRAWER_PX}px]
                           bg-black/40 backdrop-blur-sm`}/>
        </Transition.Child>

        {/* drawer */}
        <Transition.Child as={Fragment}
          enter="transform transition ease-out duration-300"
          enterFrom="translate-x-full" enterTo="translate-x-0"
          leave="transform transition ease-in duration-300"
          leaveFrom="translate-x-0"     leaveTo="translate-x-full">
          <div className="ml-auto w-[340px] max-w-full h-full bg-white shadow-xl flex flex-col">

            {/* header */}
            <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-3">
              <h2 className="text-sm font-medium">
                {phase === 'generating' ? 'Regenerating your image' : 'Selfie Drawer'}
              </h2>
              <button onClick={onClose} className="text-xl leading-none">×</button>
            </div>

            {/* ── phase: idle (picker) ───────────────────────────── */}
            {phase === 'idle' && (
              <section className="flex-1 overflow-auto p-6 space-y-6 text-sm">
                <h3 className="text-xl font-semibold">Replace the face</h3>

                <DropZone
                  preview={preview}
                  openPicker={openPicker}
                  handleFiles={handleFiles}
                  inputRef={inputRef}
                />

                {preview && (
                  <button onClick={openPicker}
                          className="text-indigo-600 underline text-xs">
                    Replace
                  </button>
                )}

                <TipsBox/>

                <button
                  disabled={!file}
                  onClick={startGeneration}
                  className={`w-full rounded-md py-2 font-semibold
                              ${file
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  Generate&nbsp;4 variants
                </button>
              </section>
            )}

            {/* ── phase: generating (progress) ──────────────────── */}
            {phase === 'generating' && (
              <section className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
                <SkeletonGrid/>
                <p className="text-center text-lg font-medium leading-snug">
                  Just adding some spice&nbsp;🌶️<br/>to your design…
                </p>
                <ProgressBar pct={pct}/>
                <button onClick={resetToIdle}
                        className="text-indigo-600 underline font-medium">
                  Cancel
                </button>
              </section>
            )}

            {/* ── phase: select (grid) ──────────────────────────── */}
            {phase === 'select' && (
              <section className="flex-1 overflow-auto p-6 space-y-6 text-sm">
                <h3 className="text-xl font-semibold mb-1">Replace the face</h3>

                {/* 2×2 grid */}
                <div className="grid grid-cols-2 gap-3">
                  {results.map((url, i) => (
                    <button key={url} onClick={() => setChoice(i)}
                            className={`relative rounded-md overflow-hidden
                                        ring-2 ${choice === i ? 'ring-indigo-600' : 'ring-transparent'}
                                        focus:outline-none`}>
                      <img src={url} alt={`variant ${i}`}
                           className="w-full h-full object-cover"/>
                      {choice === i && (
                        <span className="absolute top-1 right-1 bg-white rounded-full p-0.5 text-indigo-600">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <p className="text-center text-sm">Pick the picture you&nbsp;like best.</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => { onUseSelected(results[choice]); onClose() }}
                    className="flex-1 rounded-md bg-indigo-600 text-white py-2 font-semibold">
                    Use selected
                  </button>
                  <button
                    onClick={startGeneration}
                    className="flex-1 rounded-md border border-indigo-600 text-indigo-600 py-2 font-semibold">
                    Generate again
                  </button>
                </div>
              </section>
            )}
          </div>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  )
}

/*──────────────── sub-components ───────────────*/

function DropZone({
  preview, openPicker, handleFiles, inputRef,
}: {
  preview    : string
  openPicker : () => void
  handleFiles: (f?: FileList|null) => void
  inputRef   : React.RefObject<HTMLInputElement|null>
}) {
  return (
    <label
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
      onDrop     ={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      className={`relative flex flex-col items-center justify-center aspect-[4/3]
                  rounded-lg border-2 border-dashed cursor-pointer transition-colors
                  ${preview ? 'border-transparent'
                            : 'border-indigo-300 hover:border-indigo-400'}`}
    >
      {/* thumbnail or placeholder */}
      {preview ? (
        <>
          <img src={preview} alt="chosen"
               className="absolute inset-0 w-full h-full object-cover rounded-md"/>
          <button type="button" onClick={openPicker}
                  className="absolute inset-0 flex items-center justify-center
                             bg-black/60 text-white opacity-0 hover:opacity-100
                             transition-opacity rounded-md">
            Use different image ↺
          </button>
        </>
      ) : <PickerPlaceholder/>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={e => handleFiles(e.target.files)}
        className="sr-only"
      />
    </label>
  )
}

const PickerPlaceholder = () => (
  <div className="flex flex-col items-center gap-2 text-gray-500 px-4">
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 7h3l2-3h6l2 3h3a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
    <span>Drag a picture here<br/>or <span className="text-indigo-600 underline">browse files</span></span>
  </div>
)

const TipsBox = () => (
  <section className="border rounded-lg px-4 py-3 bg-gray-50 space-y-1">
    <h4 className="font-medium">Tips for best results</h4>
    <ul className="list-disc list-inside space-y-0.5">
      <li>clear, well-lit picture</li><li>one person only</li>
      <li>face forward</li><li>head fully visible</li>
      <li>higher resolution → sharper swap</li>
    </ul>
  </section>
)

const SkeletonGrid = () => (
  <div className="flex gap-3 opacity-30">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="w-16 h-16 bg-gray-200 rounded-md"/>
    ))}
  </div>
)

const ProgressBar = ({ pct }: { pct: number }) => (
  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
    <div style={{ width: `${pct}%` }}
         className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600"/>
  </div>
)