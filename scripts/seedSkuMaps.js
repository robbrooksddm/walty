import 'dotenv/config'
import {createClient} from '@sanity/client'

const sanity = createClient({
  projectId : process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset   : process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2023-10-01',
  token     : process.env.SANITY_TOKEN,
  useCdn    : false,
})

const VARIANTS = ['gc-mini', 'gc-classic', 'gc-large']
const FULFILS = [
  'toRecipient_flat_std',
  'toRecipient_flat_next',
  'toRecipient_flat_express',
  'toSender_flat_std',
  'toSender_flat_next',
  'toSender_flat_express',
]

const STEMS = {
  'gc-mini': 'GLOBAL-GRE-GLOS-4X6',
  'gc-classic': 'GLOBAL-GRE-GLOS-5X7',
  'gc-large': 'GLOBAL-GRE-GLOS-A4',
}

function suffixFor(handle) {
  if (handle.startsWith('toRecipient')) return '-REC'
  if (handle.startsWith('toSender')) return '-DIR'
  return ''
}

async function run() {
  const variants = await sanity.fetch(
    `*[_type=="cardProduct" && variantHandle in $v]{_id,variantHandle}`,
    {v: VARIANTS},
  )
  const fulfils = await sanity.fetch(
    `*[_type=="fulfilOption" && fulfilHandle in $f]{_id,fulfilHandle}`,
    {f: FULFILS},
  )

  let count = 0

  for (const v of variants) {
    const stem = STEMS[v.variantHandle]
    if (!stem) continue
    for (const f of fulfils) {
      const suffix = suffixFor(f.fulfilHandle)
      if (!suffix) continue
      const id = `${v.variantHandle}_${f.fulfilHandle}`
      await sanity.createOrReplace({
        _id: id,
        _type: 'skuMap',
        variant: {_type: 'reference', _ref: v._id},
        fulfil: {_type: 'reference', _ref: f._id},
        prodigiSku: `${stem}${suffix}`,
        printAreaId: 'front',
        sizingStrategy: 'fillPrintArea',
        active: true,
      })
      count++
    }
  }

  console.log(`✅ ${count} skuMap docs seeded`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
