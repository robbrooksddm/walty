/**********************************************************************
 * app/admin/templates/[id]/page.tsx
 * Staff-only template-editor page
 *********************************************************************/
import { sanity }                 from '@/sanity/lib/client'
import groq                       from 'groq'
import { revalidatePath }         from 'next/cache'

import { templateToFabricPages }  from '@/sanity/lib/mappers'
import CardEditor from '../../../components/CardEditor'

/* ------------------------------------------------------------------ */
/* types                                                              */
type Params = { id: string }
type Props   = { params: Params }

/* ------------------------------------------------------------------ */
/* page component (Server Component)                                  */
export default async function StaffTemplatePage ({ params }: Props) {
  /* 1 ▸ fetch the template ---------------------------------------- */
  const tpl = await sanity.fetch(
    groq`*[_type == "cardTemplate" && _id == $id][0]`,
    { id: params.id },
  )
  console.log('DEBUG tpl', tpl)

  if (!tpl) {
    return (
      <h1 className="p-10 text-center text-3xl text-red-600">
        Template not found
      </h1>
    )
  }

  /* 2 ▸ server action – save edited layers --------------------------- */
async function saveLayers (payload: string) {
  'use server'                         // ← must be first line

  const layers = JSON.parse(payload) as unknown[][]   // 4 × layers[]

  /* always target the draft copy */
  const draftId = `drafts.${params.id}`

  await sanity
    .patch(draftId)
    .setIfMissing({ pages: [{}, {}, {}, {}] })
    .set({
      'pages[0].layers': layers[0],
      'pages[1].layers': layers[1],
      'pages[2].layers': layers[2],
      'pages[3].layers': layers[3],
    })
    .unset(['layers'])
    .commit({ autoGenerateArrayKeys: true })

  /* revalidate so everyone sees new data */
  revalidatePath(`/admin/templates/${params.id}`)
}

  /* 3 ▸ render the editor (Client component) --------------------- */
  return (
    <CardEditor
      initialPages={templateToFabricPages(tpl)}
      mode="staff"
      onSave={saveLayers}
    />
  )
}