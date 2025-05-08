/**********************************************************************
 * getPromptForPlaceholder.ts
 * Returns { prompt, version, refUrl } from an aiPlaceholder doc
 *********************************************************************/
import { sanity } from './client'      // ← ADD THIS LINE

export interface PlaceholderPrompt {
  prompt : string
  version: string          //  _updatedAt timestamp
  refUrl?: string          //  https://cdn.sanity.io/…  (undefined if no image)
}

/*───────────────────────────────────────────────────────────────────*/
export async function getPromptForPlaceholder(
  id: string,
): Promise<PlaceholderPrompt> {
  const query = /* groq */ `
    *[_type == "aiPlaceholder" && _id == $id][0]{
      "prompt" : prompt,
      "version": _updatedAt,
      "refUrl" : refImage.asset->url     // resolve the CDN URL
    }
  `
  return sanity.fetch(query, { id })
}