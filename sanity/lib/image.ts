/**********************************************************************
 * sanity/lib/image.ts  – one tiny helper for CDN URLs
 * Always ends with .format('png') so transparent PNGs keep their alpha
 *********************************************************************/
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

import { dataset, projectId } from '../env'

/** One global builder that we can re-use everywhere */
const builder = imageUrlBuilder({ projectId, dataset })

/**
 * Pass any Sanity image field (or asset) and receive a chainable builder.
 * `.format('png')` tells the CDN “never auto-convert, give me PNG”.
 */
export const urlFor = (source: SanityImageSource) =>
  builder.image(source).format('png')