import 'dotenv/config'
import {createClient} from '@sanity/client'

const sanity = createClient({
  projectId : process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset   : process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2023-10-01',
  token     : process.env.SANITY_SERVICE_TOKEN,
  useCdn    : false,
})

interface Variant { _id: string; variantHandle: string }
interface Fulfil { _id: string; fulfilHandle: string }

const STEMS: Record<string, string> = {
  'gc-mini': 'GLOBAL-GRE-GLOS-4X6',
  'gc-classic': 'GLOBAL-GRE-GLOS-5X7',
  'gc-large': 'GLOBAL-GRE-GLOS-A4',
}

function suffixFor(handle: string): string | null {
  if (handle.startsWith('toRecipient')) return '-REC'
  if (handle.startsWith('toSender')) return '-DIR'
  return null
}

async function run() {
  const variants = await sanity.fetch<Variant[]>(`*[_type=="cardProduct"]{_id,variantHandle}`)
  const fulfils = await sanity.fetch<Fulfil[]>(`*[_type=="fulfilOption"]{_id,fulfilHandle}`)

  for (const v of variants) {
    const stem = STEMS[v.variantHandle]
    if (!stem) {
      console.warn(`No SKU stem for variant ${v.variantHandle}`)
      continue
    }
    for (const f of fulfils) {
      const suffix = suffixFor(f.fulfilHandle)
      if (!suffix) {
        console.warn(`No suffix for fulfil ${f.fulfilHandle}`)
        continue
      }
      const id = `${v.variantHandle}_${f.fulfilHandle}`
      const prodigiSku = `${stem}${suffix}`
      await sanity.createIfNotExists({
        _id: id,
        _type: 'skuMap',
        variant: { _type: 'reference', _ref: v._id },
        fulfil: { _type: 'reference', _ref: f._id },
        prodigiSku,
        printAreaId: 'front_cover',
        sizingStrategy: 'fillPrintArea',
        active: true,
      })
    }
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
