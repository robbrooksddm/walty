/**********************************************************************
 * sanity/sanity.config.ts  –  Studio configuration
 *********************************************************************/

import {
  defineConfig,
  type DocumentActionComponent,
  type DocumentActionProps,
} from 'sanity'

import {deskTool}   from 'sanity/desk'
import {media}      from 'sanity-plugin-media'
import {visionTool} from '@sanity/vision'

import {structure}   from './structure'
import {schemaTypes} from './schemaTypes'

/* custom buttons (each sets showAsAction:'button') */
import cardEditorAction from './plugins/cardEditorAction'
import SaveDraftAction  from './plugins/saveDraftAction'

/* ------------------------------------------------ document actions - */
const cardTemplateActions = (
  prev: DocumentActionComponent[],
  ctx : any,                   // draft / published not yet in typings
): DocumentActionComponent[] => {
  if (ctx.schemaType !== 'cardTemplate') return prev

  /* built-ins */
  const publish = prev.find(a => a.action === 'publish')
  const others  = prev.filter(a => a.action !== 'publish')

  /* wrap Publish so we recompute disabled every time Studio re-renders */
  const gatedPublish: DocumentActionComponent | null = publish
    ? (props: DocumentActionProps) => {
        const draftOrLive = props.draft || props.published
        const hasLayers =
          Array.isArray(draftOrLive?.pages) &&
          draftOrLive.pages.some((p: any) => p?.layers?.length)

        const desc = publish(props)
        return desc
          ? { ...desc, disabled: !hasLayers, showAsAction: 'button' }
          : null
      }
    : null

  return [
    SaveDraftAction,           // bottom row
    cardEditorAction,          // bottom row
    ...(gatedPublish ? [gatedPublish] : []), // bottom row (grey/enabled)
    ...others,                 // Duplicate / Delete stay in “…” menu
  ]
}

/* ------------------------------------------------ main export ------- */
export default defineConfig({
  /* project meta */
  name : 'default',
  title: 'Get-Card Studio',

  /* connection */
  projectId : process.env.SANITY_STUDIO_PROJECT_ID
           ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
           ?? '',
  dataset   : process.env.SANITY_STUDIO_DATASET
           ?? process.env.NEXT_PUBLIC_SANITY_DATASET
           ?? '',
  apiVersion: process.env.SANITY_STUDIO_API_VERSION
           ?? process.env.NEXT_PUBLIC_SANITY_API_VERSION
           ?? '2023-10-01',

  /* plugins */
  plugins: [
    deskTool({structure}),
    media(),
    visionTool(),
  ],

  /* custom actions */
  document: {
    actions: cardTemplateActions,
  },

  /* schema */
  schema: {types: schemaTypes},
})