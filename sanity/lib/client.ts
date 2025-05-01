// sanity/lib/client.ts
import {createClient} from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET!
const token     = process.env.SANITY_WRITE_TOKEN  // leave undefined for read-only

export const sanity = createClient({
  apiVersion : '2023-10-01',
  projectId,
  dataset,
  token,
  useCdn     : false,
})