/* sanity.config.ts – replace the whole file */

import { defineConfig }     from 'sanity'
import { visionTool }       from '@sanity/vision'
import { structureTool }    from 'sanity/structure'

import { apiVersion, dataset, projectId } from './sanity/env'
import { structure }        from './sanity/structure'
import { schemaTypes }      from './sanity/schemaTypes'   // ←  note the name!

export default defineConfig({
  /* where the Studio is served in your Next-js app */
  basePath : '/studio',

  /* project settings that the CLI printed after `sanity init` */
  projectId,
  dataset,

  /* tell Sanity which document / object types are allowed */
  schema : {
    types : schemaTypes,
  },

  /* extra goodies */
  plugins : [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
})