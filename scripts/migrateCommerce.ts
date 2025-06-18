import 'dotenv/config'
import {createClient} from '@sanity/client'

const sanity = createClient({
  projectId : process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset   : process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2023-10-01',
  token     : process.env.SANITY_SERVICE_TOKEN,
  useCdn    : false,
})

interface CardProduct {
  _id: string
  title: string
  printSpec: { _ref: string }
}

// fill with your known Prodigi SKUs
const SKUS: Record<string, { toSender: string; toRecipient: string }> = {
  // e.g. 'greetingcard-7x5': { toSender: 'SKU123', toRecipient: 'SKU124' }
}

async function run() {
  const cps = await sanity.fetch<CardProduct[]>(`*[_type=="cardProduct"]{_id,title,printSpec}`)

  // create fulfil docs
  const fulfilSender = { _id: 'toSender', _type: 'fulfilOption', title: 'Ship to buyer', shipTo: 'buyer', packaging: 'flat', shippingMethod: 'unknown', serviceLevel: 'unknown', postageCostExVat: 0, active: true }
  const fulfilRecipient = { _id: 'toRecipient', _type: 'fulfilOption', title: 'Ship to recipient', shipTo: 'recipient', packaging: 'flat', shippingMethod: 'unknown', serviceLevel: 'unknown', postageCostExVat: 0, active: true }
  await sanity.createIfNotExists(fulfilSender)
  await sanity.createIfNotExists(fulfilRecipient)

  for (const cp of cps) {
    const variantId = cp._id

    const skus = SKUS[cp._id] || { toSender: '', toRecipient: '' }
    const maps = [
      { fulfil: fulfilSender._id, sku: skus.toSender },
      { fulfil: fulfilRecipient._id, sku: skus.toRecipient },
    ]

    for (const m of maps) {
      if (!m.sku) continue
      const id = `${variantId}_${m.fulfil}`
      await sanity.createIfNotExists({
        _id: id,
        _type: 'skuMap',
        variant: { _type: 'reference', _ref: variantId },
        fulfil: { _type: 'reference', _ref: m.fulfil },
        prodigiSku: m.sku,
        printAreaId: 'default',
        sizingStrategy: 'fillPrintArea',
      })
    }
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
