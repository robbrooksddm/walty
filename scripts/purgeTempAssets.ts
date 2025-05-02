/******************************************************************
 * scripts/purgeTempAssets.ts
 * Deletes every Sanity **image** asset that
 *   • carries our tag  "temp-upload"
 *   • is more than 60 minutes old
 ******************************************************************/

import 'dotenv/config'
import {createClient} from '@sanity/client'

/* 1 ─ authenticated client (read + write) */
const sanity = createClient({
  projectId : process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset   : process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2023-10-01',
  token     : process.env.SANITY_SERVICE_TOKEN,   // full-access service token
  useCdn    : false,
})

/* 2 ─ one-hour cutoff (ISO) */
const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString()

/* 3 ─ GROQ: tag **NOT** label */
const query = `
  *[
    _type == "sanity.imageAsset"           &&
    "temp-upload" in tags[]->name          &&   // 👈 our flag
    _createdAt < $cutoff
  ]._id
`

/* 4 ─ run */
;(async () => {
  console.log('🔍 looking for stale temp uploads…')
  const ids: string[] = await sanity.fetch(query, {cutoff})

  if (!ids.length) {
    console.log('✅ nothing to delete')
    return
  }

  console.log(`🗑 deleting ${ids.length} asset(s)…`)
  const tx = sanity.transaction()
  ids.forEach(id => tx.delete(id))
  await tx.commit()
  console.log('✅ purge complete')
})().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})