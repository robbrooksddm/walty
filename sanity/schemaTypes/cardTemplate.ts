/**********************************************************************
 * cardTemplate.ts – master schema for printable greeting-cards
 * --------------------------------------------------------------------
 * 2025-06-09  • bgImage now stores raw URLs in hidden “srcUrl”
 *********************************************************************/

import {
  defineType,
  defineField,
  defineArrayMember,
} from 'sanity'
import { ComposeIcon } from '@sanity/icons'

/*──────────────── fieldsets ────────────────────────────────────────*/
const fieldsets = [
  { name: 'pageset', title: 'Pages', options: { columns: 1 } },
]

/*------------------------------------------------------------------*/
/* reusable layer members – reference the separate object types      */
/*------------------------------------------------------------------*/
const layerMembers = [
  /* ── locked background image (inline) ───────────────────────── */
  defineArrayMember({
    type  : 'image',
    name  : 'bgImage',
    title : 'Background (locked)',
    options: { hotspot: true },
    /*  Hidden raw-URL mirror so the Studio keeps editor uploads   */
    fields: [
      { name: 'srcUrl', type: 'url', hidden: true },   // ← NEW
    ],
  }),

  /* the three interactive layer kinds (object types) */
  defineArrayMember({ type: 'editableImage' }),
  defineArrayMember({ type: 'editableText'  }),
  defineArrayMember({ type: 'aiLayer'       }),
]

/*──────────────── schema ───────────────────────────────────────────*/
export default defineType({
  name : 'cardTemplate',
  type : 'document',
  title: 'Card template',

  groups: [
    { name: 'basic',      title: 'Basics',      default: true },
    { name: 'store',      title: 'Store data' },
    { name: 'pageLayout', title: 'Pages' },
  ],

  fieldsets,

  fields: [
    /* —— Basics ——————————————————————————————————————————— */
    defineField({
      name : 'title',
      type : 'string',
      title: 'Template name',
      group: 'basic',
      validation: r => r.required(),
    }),
    defineField({
      name : 'slug',
      type : 'slug',
      title: 'Slug',
      group: 'basic',
      options: { source: 'title', maxLength: 96 },
      validation: r => r.required(),
    }),

    /* hidden raw JSON mirror (round-trip safety-net) */
    defineField({ name: 'json', type: 'text', hidden: true }),

    /* —— Store data ——————————————————————————————— */
    defineField({
      name : 'isLive',
      type : 'boolean',
      title: 'Visible in store?',
      group: 'store',
      initialValue: false,
      options: { layout: 'switch' },
      validation: r => r.required(),
    }),
    defineField({
      name : 'products',
      type : 'array',
      title: 'Available as…',
      group: 'store',
      of   : [{ type: 'reference', to: [{ type: 'cardProduct' }] }],
      validation: r => r.min(1).error('Choose at least one product SKU'),
    }),
    defineField({
      name : 'description',
      type : 'text',
      title: 'Product description',
      group: 'store',
      rows : 3,
      validation: r => r.max(300),
    }),

    /* category facets */
    defineField({
      name : 'occasion',
      type : 'array',
      title: 'Occasion',
      group: 'store',
      options: { layout: 'tags' },
      of: [{ type: 'reference', to: [{ type: 'occasion' }] }],
    }),
    defineField({
      name : 'audience',
      type : 'array',
      title: 'Who’s it for?',
      group: 'store',
      options: { layout: 'tags' },
      of: [{ type: 'reference', to: [{ type: 'audience' }] }],
    }),
    defineField({
      name : 'theme',
      type : 'array',
      title: 'Theme',
      group: 'store',
      options: { layout: 'tags' },
      of: [{ type: 'reference', to: [{ type: 'theme' }] }],
    }),
    defineField({
      name : 'relation',
      type : 'array',
      title: 'Relation to buyer (optional)',
      group: 'store',
      options: { layout: 'tags' },
      of: [{ type: 'reference', to: [{ type: 'relation' }] }],
    }),

    /* —— Pages (exactly 4) ——————————————————————————— */
    defineField({
      name : 'pages',
      title: 'Pages (Front · Inner-L · Inner-R · Back)',
      group: 'pageLayout',
      fieldset: 'pageset',
      type : 'array',
      of   : [defineArrayMember({
        type: 'object',
        name: 'page',
        fields: [
          defineField({ name: 'name', type: 'string', hidden: true }),
          defineField({ name: 'layers', type: 'array', of: layerMembers }),
        ],
        preview: {
          select: { title: 'name', media: 'layers.0.src' },
          prepare: ({ title }) => ({
            title:
              title === 'front'    ? 'Front cover' :
              title === 'inner-L'  ? 'Inner left'  :
              title === 'inner-R'  ? 'Inner right' :
                                    'Back cover',
          }),
        },
      })],
      initialValue: [
        { name: 'front',   layers: [] },
        { name: 'inner-L', layers: [] },
        { name: 'inner-R', layers: [] },
        { name: 'back',    layers: [] },
      ],
      validation: r => r.length(4),
    }),
  ],

  /* —— publish guard ———————————————————————— */
  validation: Rule => Rule.custom((doc: any) => {
    if (doc.isLive && (!doc.products || doc.products.length === 0)) {
      return 'Cannot publish: add at least one product and keep “Visible in store?” ON'
    }
    return true
  }),
})