/**********************************************************************
 * PATCH / POST /api/templates/[id]
 *********************************************************************/
import {NextRequest, NextResponse} from 'next/server'
import {sanity}                    from '@/sanity/lib/client'
import {toSanity}                  from '@/app/library/layerAdapters'

export async function PATCH(
  req: NextRequest,
  {params}:{params:{id:string}},
){
  try{
    const body = await req.json()
    const pages = body?.pages
    if(!Array.isArray(pages)||pages.length!==4){
      return NextResponse.json({error:'`pages` must be 4-length array'},{status:400})
    }

    /* convert every layer */
    const sanePages = pages.map((p:any)=>({
      layers: (p.layers??[]).map(toSanity),
    }))

    await sanity.patch(`drafts.${params.id}`)
      .set({pages:sanePages, json:JSON.stringify(pages)})
      .commit({autoGenerateArrayKeys:true})

    return NextResponse.json({ok:true})
  }catch(err){
    console.error('[save-template]',err)
    return NextResponse.json({error:'server'},{status:500})
  }
}

/*  Allow POST as well  */
export const POST = PATCH;