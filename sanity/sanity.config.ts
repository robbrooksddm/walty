/**********************************************************************
 * sanity/sanity.config.ts  –  Studio configuration  (FULL FILE)
 *********************************************************************/

import {defineConfig} from 'sanity'
import {deskTool}     from 'sanity/desk'
import {structure}    from './structure'
import {schemaTypes}  from './schemaTypes'

export default defineConfig({
  /* ---------------------------------------------------- project meta */
  name : 'default',
  title: 'Get-Card Studio',

  /* ---------------------------------------------------- connection   */
  projectId: (
    process.env.SANITY_STUDIO_PROJECT_ID ??
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  ) as string,

  dataset: (
    process.env.SANITY_STUDIO_DATASET ??
    process.env.NEXT_PUBLIC_SANITY_DATASET
  ) as string,

  apiVersion: (
    process.env.SANITY_STUDIO_API_VERSION ??
    process.env.NEXT_PUBLIC_SANITY_API_VERSION ??
    '2023-10-01'
  ) as string,

  /* ---------------------------------------------------- plugins      */
  plugins: [
    deskTool({structure}),
  ],

  /* ---------------------------------------------------- schema       */
  schema: {types: schemaTypes},
})