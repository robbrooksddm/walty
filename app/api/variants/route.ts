/**********************************************************************
 * app/api/variants/route.ts – GPT-Image-1 thumbnail editor (v5.3-fixed)
 *********************************************************************/

import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile }            from 'openai';
import crypto                        from 'crypto';
import { writeFileSync }             from 'fs';

import { getPromptForPlaceholder }   from '@/sanity/lib/getPromptForPlaceholder';
import { incCost, checkBudget }      from '@/lib/budget';
import { KV }                        from '@/lib/kv';
import { cleanAlpha }                from '@/lib/cleanAlpha';

/* — OpenAI client — */
const openai = new OpenAI({
  apiKey : process.env.OPENAI_API_KEY!,
  timeout: 1000 * 120,
});

/* — constants — */
const NUM_VARIANTS = 1;
const IMAGE_MODEL  = 'gpt-image-1';

/* — helpers — */
const fileFromBase64 = async (dataUrl: string, name = 'selfie.png') =>
  toFile(
    Buffer.from(dataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64'),
    name,
    { type: 'image/png' },
  );

/*  Sanity’s CDN often converts PNG-alpha ➜ JPEG/WebP.  
    Append  ?fm=png&dl=  to force the exact uploaded PNG with transparency. */
const forcePngUrl = (url: string) =>
  url.includes('?') ? `${url}&fm=png&dl=` : `${url}?fm=png&dl=`;

const fileFromUrl = async (url: string, name = 'template.png') =>
  toFile(
    Buffer.from(await (await fetch(url)).arrayBuffer()),
    name,
    { type: 'image/png' },
  );

/* — route handler — */
export async function POST(req: NextRequest) {
  const { selfieBase64, placeholderId, force = false, nonce = '' } =
    (await req.json()) as {
      selfieBase64 : string
      placeholderId: string
      force?       : boolean
      nonce?       : string
    };
  // `selfieBase64` must be a data-URL containing base64-encoded PNG

  if (!checkBudget()) {
    return NextResponse.json({ error: 'Daily budget exhausted' }, { status: 429 });
  }

  /* 1 ▸ Fetch metadata from Sanity */
  const {
    prompt,
    version   : promptVersion,
    refUrl    = '',
    ratio     = '1:1',          // 1:1 | 3:2 | 2:3
    quality   = 'medium',       // low | medium | high | auto
    background= 'transparent',  // transparent | opaque | auto
  } = await getPromptForPlaceholder(placeholderId);

  /* 2 ▸ Map ratio → OpenAI size flag */
  const size =
        ratio === '3:2' ? '1536x1024'
      : ratio === '2:3' ? '1024x1536'
      :                   '1024x1024';

  /* 3 ▸ KV fingerprint */
  const fpSeed = selfieBase64 + placeholderId + promptVersion + nonce + refUrl;
  const fingerprint = crypto.createHash('sha1').update(fpSeed).digest('hex');

  /* 4 ▸ Cached hit? */
  if (!force) {
    const hit = (await KV.get(fingerprint)) as string | null;
    if (hit) {
      const { version, urls } = JSON.parse(hit);
      if (version === promptVersion) return NextResponse.json(urls);
    }
  }

  try {
    /* 5 ▸ Build [template, selfie] array */
    const templateFile = refUrl ? await fileFromUrl(forcePngUrl(refUrl)) : null;

    if (!templateFile) {
      return NextResponse.json(
        { error: 'Template PNG missing – cannot perform face-swap.' },
        { status: 400 },
      );
    }

    const selfieFile = await fileFromBase64(selfieBase64);
    const referenceImages = [templateFile, selfieFile];   // ORDER matters

  /* 6 ▸ images.edit – send PNGs and request base64 output */
  const result = await (openai.images as any).edit({
      model   : IMAGE_MODEL,
      image   : referenceImages,
      prompt,
      n       : NUM_VARIANTS,
      size,
      quality,
      background,
      user    : placeholderId,
    });

    /* 7 ▸ Validate response */
    if (!result.data?.length || typeof result.data[0].b64_json !== 'string') {
      return NextResponse.json(
        { error: 'Image edit returned no usable result — please retry.' },
        { status: 502 },
      );
    }

  /* 8 ▸ Convert b64_json (base64 PNG) → data-URL */
  const urls = result.data.map(
    ({ b64_json }: { b64_json: string }) =>
      `data:image/png;base64,${b64_json}`,
  );

    /* 9 ▸ Optional debug dump */
    if (!process.env.NODE_ENV?.startsWith('prod')) {
      writeFileSync('/tmp/_openai_result.png',
        Buffer.from(result.data[0].b64_json, 'base64'));
      console.log('🔍 1st PNG ➜ /tmp/_openai_result.png');
    }

    incCost('openai', urls.length);

    /* 10 ▸ Cache 24 h */
    await KV.set(
      fingerprint,
      JSON.stringify({ version: promptVersion, urls }),
      { ex: 60 * 60 * 24 },
    );

    /* 11 ▸ Return */
    return NextResponse.json(urls);

  } catch (err) {
    console.error('💥 openai.images.edit failed', err);
    return NextResponse.json(
      { error: 'Image edit failed — please try again later.' },
      { status: 500 },
    );
  }
}