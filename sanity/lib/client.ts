/*────────────────────────────────────────────────────────────
  sanity/lib/client.ts
  ────────────────────────────────────────────────────────────*/

import {createClient} from '@sanity/client'

/*────────────────────────────────────────────────────────────
  Environment variables
  ────────────────────────────────────────────────────────────*/
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET!

/* Read‑only token (Viewer) used **only** in the card‑editor to
   fetch drafts + published docs. Leave undefined on the public site. */
const readToken  = process.env.SANITY_READ_TOKEN  || undefined

/* Contributor token used for writes (create / patch / publish). */
const writeToken = process.env.SANITY_WRITE_TOKEN || undefined

/*────────────────────────────────────────────────────────────
  1. Public, CDN‑cached, *published‑only* client  (store‑front)
  ────────────────────────────────────────────────────────────*/
export const sanity = createClient({
  projectId,
  dataset,
  apiVersion : '2023-10-01',
  perspective: 'published',   // ⇠ only published docs
  useCdn     : true,          // ⇠ fastest / cached
} as any)

/*────────────────────────────────────────────────────────────
  2. Read‑only *draft + published* client  (card‑editor / admin)
  ────────────────────────────────────────────────────────────*/
export const sanityPreview = createClient({
  projectId,
  dataset,
  apiVersion : '2023-10-01',
  token      : readToken,     // Viewer token
  perspective: 'previewDrafts',
  useCdn     : false,         // drafts never reach the CDN
} as any)

/*────────────────────────────────────────────────────────────
  3. Write‑enabled client  (saving templates, publishing, etc.)
  ────────────────────────────────────────────────────────────*/
export const sanityWriteClient = createClient({
  projectId,
  dataset,
  apiVersion : '2023-10-01',
  token      : writeToken,    // Contributor token
  perspective: 'previewDrafts',
  useCdn     : false,
} as any)
