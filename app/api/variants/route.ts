/**********************************************************************
 * app/api/variants/route.ts – GPT-Image-1 thumbnail generator (v4.2)
 * -------------------------------------------------------------------
 *  • KV-fingerprint = selfie + placeholderId + promptVersion + nonce + refUrl
 *  • “force:true” bypasses KV (Generate-again button)
 *  • Upload TWO reference images to GPT-Image-1 via images.edit():
 *      – user selfie  (data-URL from browser)
 *      – template PNG in Sanity (downloaded server-side, alpha kept)
 *  • NEW: passes size / quality / background taken from the placeholder
 *  • DEBUG: dumps the first PNG we get back to /tmp/_openai_result.png
 *********************************************************************/

import { NextRequest, NextResponse } from 'next/server'
import OpenAI, { APIError, toFile }  from 'openai'
import crypto                        from 'crypto'
import { writeFileSync }             from 'fs'

import {
  getPromptForPlaceholder,
  type PlaceholderPrompt,
} from '@/sanity/lib/getPromptForPlaceholder'
import { incCost, checkBudget } from '@/lib/budget'
import { KV }                   from '@/lib/kv'

/* ───────── OpenAI client ───────── */
const openai = new OpenAI({
  apiKey : process.env.OPENAI_API_KEY!,
  timeout: 1000 * 120,          // dev-server: keep socket 2 min
})

/* ───────── constants ──────────── */
const NUM_VARIANTS  = 4
const IMAGE_MODEL   = 'gpt-image-1'
let   savedDebugPng = false      // only write once per server-boot

/* ─ helpers – File builders ─ */
const fileFromBase64 = async (dataUrl: string, name = 'img.png') =>
  toFile(Buffer.from(dataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64'),
         name, { type: 'image/png' })

const fileFromUrl = async (url: string, name = 'img.png') =>
  toFile(Buffer.from(await (await fetch(url)).arrayBuffer()), name,
         { type: 'image/png' })

/* ───────────── route handler ───────────── */
export async function POST (req: NextRequest) {
  const {
    selfieBase64,
    placeholderId,
    force = false,
    nonce = '',
  } = await req.json() as {
    selfieBase64 : string
    placeholderId: string
    force?       : boolean
    nonce?       : string
  }

  /* ───── cost guard ───── */
  if (!checkBudget()) {
    return NextResponse.json({ error: 'Daily budget exhausted' }, { status: 429 })
  }

  /* 1 ▸ fetch prompt + author-options from Sanity */
  const {
    prompt,
    version    : promptVersion,
    refUrl     = '',

    /* author controls (schema defaults already applied) */
    ratio      = '1:1',          // '1:1' | '3:2' | '2:3'
    quality    = 'medium',       // 'low' | 'medium' | 'high' | 'auto'
    background = 'transparent',  // 'transparent' | 'opaque' | 'auto'
  } = await getPromptForPlaceholder(placeholderId) as PlaceholderPrompt

  /* 2 ▸ derive OpenAI “size” from ratio */
  const size =
        ratio === '3:2' ? '1536x1024'
      : ratio === '2:3' ? '1024x1536'
      :                   '1024x1024'   // default 1:1

  /* 3 ▸ KV fingerprint */
  const fpSeed =
    selfieBase64 + placeholderId + promptVersion + nonce + refUrl
  const fingerprint = crypto.createHash('sha1').update(fpSeed).digest('hex')

  /* 4 ▸ serve from KV cache (unless “force”) */
if (!force) {
  const hit = await KV.get(fingerprint) as string | null      //  ← removed <string>
  if (hit) {
    const { version, urls } = JSON.parse(hit)
    if (version === promptVersion) return NextResponse.json(urls)
  }
}

  try {
    /* 5 ▸ reference images */
    const selfieFile   = await fileFromBase64(selfieBase64, 'selfie.png')
    const templateFile = refUrl ? await fileFromUrl(refUrl, 'template.png') : null
    const imageFiles   = templateFile ? [templateFile, selfieFile] : [selfieFile]

    /* 6 ▸ single OpenAI call */
    const result = await (openai.images as any).edit({
      model   : IMAGE_MODEL,
      image   : imageFiles,
      prompt,
      n       : NUM_VARIANTS,

      /* ✨ new options */
      size,                 // 1024x1024 / 1536x1024 / 1024x1536
      quality,              // low | medium | high | auto
      background,           // transparent | opaque | auto

      user   : placeholderId,
      output_format: 'png',
    } as any)  /* ← TS cast until openai-sdk exposes array-of-files signature */

    const urls = (result.data as Array<{ b64_json?: string }>)
      .map(d => d.b64_json ? `data:image/png;base64,${d.b64_json}` : null)
      .filter((u): u is string => Boolean(u))

    /* 7 ▸ debug-dump once */
    if (!savedDebugPng && urls[0]) {
      writeFileSync('/tmp/_openai_result.png',
        Buffer.from(urls[0].split(',')[1]!, 'base64'))
      console.log('🔍 1st PNG ➜ /tmp/_openai_result.png')
      savedDebugPng = true
    }

    incCost('openai', urls.length)

    if (!urls.length) {
      return NextResponse.json(
        { error: 'Image generation returned no usable results – please retry.' },
        { status: 502 },
      )
    }

    /* 8 ▸ cache 24 h */
    await KV.set(
      fingerprint,
      JSON.stringify({ version: promptVersion, urls }),
      { ex: 60 * 60 * 24 },
    )

    /* 9 ▸ return to client */
    return NextResponse.json(urls)
  } catch (err) {
    /* unify error feedback */
    if (err instanceof APIError) {
      console.error('💥 OpenAI error', JSON.stringify({
        status : err.status,
        type   : err.type,
        message: err.message,
        data   : err.error,
      }, null, 2))
    } else {
      console.error('💥 /api/variants failed', err)
    }
    return NextResponse.json(
      { error: 'Image generation failed — please try again later.' },
      { status: 500 },
    )
  }
}