/**********************************************************************
 * sanity/lib/index.ts  –  barrel exports
 *********************************************************************/

export { sanity, sanityWriteClient } from './client'
export { urlFor }                    from './image'

export { getPromptForPlaceholder }   from './getPromptForPlaceholder'
export type { PlaceholderPrompt }    from './getPromptForPlaceholder'