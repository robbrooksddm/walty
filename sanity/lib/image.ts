// sanity/lib/image.ts
import imageUrlBuilder from '@sanity/image-url'
import type {SanityImageSource} from '@sanity/image-url/lib/types/types'

import {dataset, projectId} from '../env'

/** One global builder we can reuse everywhere */
const builder = imageUrlBuilder({projectId, dataset})

/** Helper → pass it a Sanity image field, get back a chainable builder      */
export const urlFor = (source: SanityImageSource) => builder.image(source)