/*  seedSkuMaps.mjs  – run with `node scripts/seedSkuMaps.mjs`
   ---------------------------------------------------------- */

   import dotenv from 'dotenv'
   dotenv.config({ path: '.env.local' })        // ← picks up your secrets
   
   import { createClient } from '@sanity/client'
   
   const sanity = createClient({
     projectId : process.env.SANITY_STUDIO_PROJECT_ID,
     dataset   : process.env.SANITY_STUDIO_DATASET,
     apiVersion: '2023-10-01',
     token     : process.env.SANITY_WRITE_TOKEN,
     useCdn    : false
   })
   
   /* ---- handles & helpers ------------------------------------------ */
   
   const VARIANTS = ['gc-mini', 'gc-classic', 'gc-large']
   
   const FULFILS = [
     'toRecipient_flat_std',
     'toRecipient_flat_next',
     'toRecipient_flat_express',
     'toSender_flat_std',
     'toSender_flat_next',
     'toSender_flat_express'
   ]
   
   const STEMS = {
     'gc-mini'   : 'GLOBAL-GRE-GLOS-4X6',
     'gc-classic': 'GLOBAL-GRE-GLOS-5X7',
     'gc-large'  : 'GLOBAL-GRE-GLOS-A4'
   }
   
   const suffixFor = fh =>
     fh.startsWith('toRecipient') ? '-REC'
     : fh.startsWith('toSender')  ? '-DIR'
     : ''
   
   /* ---- main runner ------------------------------------------------ */
   
   async function run () {
     /* 1. fetch refs */
     const variants = await sanity.fetch(
       `*[_type=="cardProduct" && variantHandle in $v]{ _id, variantHandle }`,
       { v: VARIANTS }
     )
     const fulfils  = await sanity.fetch(
       `*[_type=="fulfilOption" && fulfilHandle in $f]{ _id, fulfilHandle }`,
       { f: FULFILS }
     )
   
     console.log(`found variants:${variants.length} fulfils:${fulfils.length}`)
   
     /* 2. build/create skuMaps */
     let count = 0
     const txn = sanity.transaction()
   
     for (const v of variants) {
       const stem = STEMS[v.variantHandle]
       if (!stem) continue
   
       for (const f of fulfils) {
         const suffix = suffixFor(f.fulfilHandle)
         if (!suffix) continue
   
         txn.createOrReplace({
           _id: `${v.variantHandle}_${f.fulfilHandle}`,
           _type: 'skuMap',
           variant: { _type: 'reference', _ref: v._id },
           fulfil : { _type: 'reference', _ref: f._id },
           prodigiSku: `${stem}${suffix}`,
           printAreaId: 'front',
           sizingStrategy: 'fillPrintArea',
           active: true
         })
         count++
       }
     }
   
     await txn.commit()
     console.log(`✅  seeded / refreshed ${count} skuMap documents`)
   }
   
   run().catch(err => {
     console.error('❌ seed failed:', err)
     process.exit(1)
   })