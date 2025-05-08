import { createClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET!;
const token     = process.env.SANITY_WRITE_TOKEN || undefined;

/* Read-only (fast CDN) */
export const sanity = createClient({
  projectId,
  dataset,
  apiVersion : '2023-10-01',
  perspective: 'published',
  useCdn     : true,
});

/* Write-enabled (no CDN) */
export const sanityWriteClient = createClient({
  projectId,
  dataset,
  apiVersion : '2023-10-01',
  token,                        // must be set in env for writes
  perspective: 'previewDrafts',
  useCdn     : false,
});