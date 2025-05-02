// app/api/templates/[id]/route.ts
import {NextRequest, NextResponse} from 'next/server'
import {sanity} from '@/sanity/lib/client'

export async function POST(
  req: NextRequest,
  {params}: {params: {id: string}},
) {
  try {
    const {layers} = await req.json()

    if (!Array.isArray(layers)) {
      return NextResponse.json({error: 'layers missing'}, {status: 400})
    }

    const draftId = `drafts.${params.id}`        // always target the draft

    await sanity
      .patch(draftId)
      .set({layers})
      .commit({autoGenerateArrayKeys: true})

    return NextResponse.json({ok: true})
  } catch (err) {
    console.error('[save-template]', err)
    return NextResponse.json({error: 'server'}, {status: 500})
  }
}