/**********************************************************************
 * SelfieDrawer.tsx – v2.1 (June 2025)
 * --------------------------------------------------------------------
 * idle        → pick / replace
 * generating  → progress bar
 * select      → show 4 variants returned by /api/variants
 *
 * New in v2.1
 * • nonce → first page-load after a hard refresh always triggers a
 *   fresh OpenAI call (nonce is part of the KV fingerprint).
 * • force → “Generate again” button bypasses KV, so the user always
 *   gets four new images.
 *********************************************************************/
'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useEffect, useRef, useState } from 'react'

/*───────────────── types & constants ─────────────────*/
type Phase = 'idle' | 'generating' | 'select'

export interface SelfieDrawerProps {
  open          : boolean
  onClose       : () => void
  onUseSelected : (url: string) => void
  placeholderId : string | null
}

const SLIDE_MS  = 300
const DRAWER_PX = 340

/*───────────────── component ─────────────────────────*/
export default function SelfieDrawer ({
  open, onClose, onUseSelected, placeholderId,
}: SelfieDrawerProps) {

  /*──────── file-picker state ────────*/
  const [file,    setFile]    = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')

  /*──────── workflow state ───────────*/
  const [phase,   setPhase]   = useState<Phase>('idle')
  const [pct,     setPct]     = useState(0)                // fake progress %
  const [results, setResults] = useState<string[]>([])     // 4 data-URLs
  const [choice,  setChoice]  = useState(0)                // selected index

  /*──── per-page nonce busts cache on hard-refresh ────*/
  const [nonce] = useState(
    () => (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  )

  /*──────── refs & timers ───────────*/
  const inputRef     = useRef<HTMLInputElement | null>(null)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const requestedRef = useRef(false)       // ensure single API hit per run
  const forceRef     = useRef(false)       // “Generate again” flag

  /*──────── revoke preview URL on change / unmount ───*/
  useEffect(() => () => { preview && URL.revokeObjectURL(preview) }, [preview])

  /*──────── fake progress bar ─────────*/
  useEffect(() => {
    if (phase !== 'generating') return

    setPct(0)
    timerRef.current = setInterval(() => {
      setPct(p => {
        if (p >= 100) {
          clearInterval(timerRef.current!)
          fetchResults(forceRef.current)    // use latest flag
          return 100
        }
        return p + 2.5
      })
    }, 100)

    return () => clearInterval(timerRef.current!)
  }, [phase])

  /*───────────────── helpers ─────────────────*/
  const openPicker = () => inputRef.current?.click()

  const resetToIdle = () => {
    clearInterval(timerRef.current!)
    setPct(0)
    setPhase('idle')
    setResults([])
    setChoice(0)
    requestedRef.current = false
  }

  const handleFiles = (files?: FileList | null) => {
    if (!files?.length) return
    const f = files[0]
    if (!f.type.startsWith('image/')) { alert('Please pick an image'); return }
    if (f.size > 8 * 1024 * 1024)     { alert('Max size is 8 MB');     return }

    preview && URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  /*──────────── entry point → generating ────────────*/
  const startGeneration = (force = false) => {
    if (!file || !placeholderId) return
    forceRef.current = force
    setPhase('generating')
    setResults([])
  }

  /*──────────── call /api/variants ────────────*/
  const fetchResults = async (force: boolean) => {
    if (requestedRef.current) return           // guarantee single hit
    requestedRef.current = true

    if (!preview || !placeholderId) return     // extra guard

    /* file preview (blob) → base64 data-URL */
    const selfieBlob  = await fetch(preview).then(r => r.blob())
    const selfieBase64: string = await new Promise(res => {
      const fr = new FileReader()
      fr.onloadend = () => res(fr.result as string)
      fr.readAsDataURL(selfieBlob)
    })

    try {
      const r = await fetch('/api/variants', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          selfieBase64,
          placeholderId,
          force,          // bypass KV?
          nonce,          // per-page nonce
        }),
      })

      if (!r.ok) throw new Error(await r.text())
      const urls: string[] = await r.json()

      if (urls.length === 0) {
        alert('Image generation returned no results – try again.')
        resetToIdle()
        return
      }

      setResults(urls)
      setChoice(0)
      setPhase('select')
    } catch (err) {
      console.error(err)
      alert('Image generation failed — please try again later.')
      resetToIdle()
    }
  }

  /*────────────────── UI ──────────────────*/
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 flex"
        onClose={() => { resetToIdle(); onClose() }}
      >
        {/*──── backdrop ────*/}
        <Transition.Child
          as={Fragment}
          enter={`transition-opacity ease-out duration-${SLIDE_MS} delay-${SLIDE_MS}`}
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave={`transition-opacity ease-in duration-${SLIDE_MS}`}
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-y-0 left-0"
            style={{ right: DRAWER_PX }}
            aria-hidden
          >
            <div className="w-full h-full bg-black/20 backdrop-blur-sm" />
          </div>
        </Transition.Child>

        {/*──── drawer ────*/}
        <Transition.Child
          as={Fragment}
          enter="transform transition ease-out duration-300"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transform transition ease-in duration-300"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div className="ml-auto w-[340px] max-w-full h-full bg-white shadow-xl flex flex-col">
            {/* header */}
            <div className="flex items-center justify-between bg-white shadow px-4 py-3">
              <h2 className="text-sm font-medium">
                {phase === 'generating' ? 'Generating your images' : 'Selfie Drawer'}
              </h2>
              <button onClick={onClose} className="text-xl leading-none">×</button>
            </div>

            {/*──────── idle ─────────*/}
            {phase === 'idle' && (
              <section className="flex-1 overflow-auto p-6 space-y-6">
                <h3 className="text-xl font-semibold">Replace the face</h3>

                <DropZone
                  preview={preview}
                  openPicker={openPicker}
                  handleFiles={handleFiles}
                  inputRef={inputRef}
                />

                {preview && (
                  <button
                    onClick={openPicker}
                    className="text-indigo-600 underline text-xs"
                  >
                    Replace
                  </button>
                )}

                <TipsBox />

                <button
                  disabled={!file || !placeholderId}
                  onClick={() => startGeneration(false)}
                  className={`w-full rounded-md py-2 font-semibold
                    ${file
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  Generate 4 variants
                </button>
              </section>
            )}

            {/*──────── generating ─────────*/}
            {phase === 'generating' && (
              <section className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
                <SkeletonGrid />
                <p className="text-center text-lg font-medium">
                  Just adding some spice 🌶️
                </p>
                <ProgressBar pct={pct} />
                <button
                  onClick={resetToIdle}
                  className="text-indigo-600 underline font-medium"
                >
                  Cancel
                </button>
              </section>
            )}

            {/*──────── select ─────────*/}
            {phase === 'select' && (
              <section className="flex-1 overflow-auto p-6 space-y-6">
                <h3 className="text-xl font-semibold mb-1">Replace the face</h3>

                <div className="grid grid-cols-2 gap-3">
                  {results.map((url, i) => (
                    <button
                      key={url}
                      onClick={() => setChoice(i)}
                      className={`relative rounded-md overflow-hidden ring-2
                        ${choice === i ? 'ring-indigo-600' : 'ring-transparent'}
                        focus:outline-none`}
                    >
                      <img
                        src={url}
                        alt={`variant ${i}`}
                        className="w-full h-full object-cover"
                      />
                      {choice === i && (
                        <span
                          className="absolute top-1 right-1 bg-white rounded-full p-0.5 text-indigo-600"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <p className="text-center text-sm">
                  Pick the picture you like best.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => { onUseSelected(results[choice]); onClose() }}
                    className="flex-1 rounded-md bg-indigo-600 text-white py-2 font-semibold"
                  >
                    Use selected
                  </button>
                  <button
                    onClick={() => startGeneration(true)}   /* force = true */
                    className="flex-1 rounded-md border border-indigo-600 text-indigo-600 py-2 font-semibold"
                  >
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

/*──────────────── sub-components (unchanged UI bits) ───────────*/

function DropZone({
  preview, openPicker, handleFiles, inputRef,
}: {
  preview: string
  openPicker: () => void
  handleFiles: (f?: FileList | null) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <label
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
      onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      className={`relative flex flex-col items-center justify-center aspect-[4/3]
        rounded-lg border-2 border-dashed cursor-pointer transition-colors
        ${preview ? 'border-transparent' : 'border-indigo-300 hover:border-indigo-400'}`}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt="chosen"
            className="absolute inset-0 w-full h-full object-cover rounded-md"
          />
          <button
            type="button"
            onClick={openPicker}
            className="absolute inset-0 flex items-center justify-center
              bg-black/60 text-white opacity-0 hover:opacity-100 transition-opacity rounded-md"
          >
            Use different image ↺
          </button>
        </>
      ) : <PickerPlaceholder />}

      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg"
        onChange={e => handleFiles(e.target.files)}
        className="sr-only"
      />
    </label>
  )
}

const PickerPlaceholder = () => (
  <div className="flex flex-col items-center gap-2 text-gray-500 px-4">
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7h3l2-3h6l2 3h3a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z"
      />
      <circle cx="12" cy="13" r="4" />
    </svg>
    <span>
      Drag a picture here
      <br />
      or <span className="text-indigo-600 underline">browse files</span>
    </span>
  </div>
)

const TipsBox = () => (
  <section className="border rounded-lg px-4 py-3 bg-gray-50 space-y-1">
    <h4 className="font-medium">Tips for best results</h4>
    <ul className="list-disc list-inside space-y-0.5">
      <li>clear, well-lit picture</li>
      <li>one person only</li>
      <li>face forward</li>
      <li>head fully visible</li>
      <li>higher resolution → sharper swap</li>
    </ul>
  </section>
)

const SkeletonGrid = () => (
  <div className="flex gap-3 opacity-30">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="w-16 h-16 bg-gray-200 rounded-md" />
    ))}
  </div>
)

const ProgressBar = ({ pct }: { pct: number }) => (
  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
    <div
      style={{ width: `${pct}%` }}
      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600"
    />
  </div>
)