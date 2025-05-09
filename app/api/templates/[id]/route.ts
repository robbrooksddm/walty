/**********************************************************************
 * PATCH / POST /api/templates/[id]
 * - Always writes to the **draft** (id prefixed with `drafts.`)
 * - If the draft isn’t there yet we create a stub first, then patch.
 *********************************************************************/
import { NextRequest, NextResponse }           from 'next/server'
import { sanityWriteClient as sanity }         from '@/sanity/lib/client'
import { toSanity }                            from '@/app/library/layerAdapters'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
/* ---------- 1. validate body ---------- */
const body  = await req.json()
console.log('POST body', JSON.stringify(body, null, 2))
const { pages } = body         // ← same as before, just after the log
    if (!Array.isArray(pages) || pages.length !== 4) {
      return NextResponse.json(
        { error: '`pages` must be a 4-element array' },
        { status: 400 },
      )
    }

    /* ---------- 2. convert layers ---------- */
    const sanePages = pages.map((p: any) => ({
      layers: (p.layers ?? []).map(toSanity),
    }))

    /* ---------- 3. draft id ---------- */
    const draftId = `drafts.${params.id}`

    /* ---------- 4. create-or-patch in one transaction ---------- */
    await sanity
      .transaction()
      .createIfNotExists({
        _id   : draftId,
        _type : 'cardTemplate',
        title : '(untitled)',           // bare minimum so Studio is happy
        pages : [],
      })
      .patch(draftId, p =>
        p.set({ pages: sanePages, json: JSON.stringify(pages) }),
      )
      .commit({ autoGenerateArrayKeys: true })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[save-template]', err)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}

/* Allow POST as well */
export const POST = PATCH