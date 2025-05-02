/**********************************************************************
 * sanity/schemaTypes/cardTemplate.ts
 * Card-design “template” – one design can be sold as many products
 * --------------------------------------------------------------------
 * 2025-05-02  • adds isLive flag, product refs, stronger validation
 * 2025-05-03  • NEW: pages[4] → layers[] structure
 *********************************************************************/

import {defineType, defineField, defineArrayMember} from 'sanity'

/* ───────────────────────── reusable layer members ───────────────── */
const layerMembers = [
  /* background image – locked for customers */
  defineArrayMember({
    type : 'image',
    name : 'bgImage',
    title: 'Background image (locked)',
    options: {hotspot: true},
  }),

  /* customer-editable text */
  defineArrayMember({
    type  : 'object',
    name  : 'editableText',
    title : 'Editable text',
    fields: [
      {name:'text'     , type:'string' , title:'Default text'},
      {name:'x'        , type:'number' , title:'X (px)'},
      {name:'y'        , type:'number' , title:'Y (px)'},
      {name:'fontSize' , type:'number' , title:'Font size'},
      {name:'fill'     , type:'string' , title:'Colour (hex)'},
      {name:'maxLength', type:'number' , title:'Max chars'},
    ],
  }),

  /* customer-editable image */
  defineArrayMember({
    type  : 'object',
    name  : 'editableImage',
    title : 'Editable image',
    fields: [
      {name:'src', type:'image', title:'Default image', options:{hotspot:true}},
      {name:'x'  , type:'number', title:'X (px)'},
      {name:'y'  , type:'number', title:'Y (px)'},
      {name:'w'  , type:'number', title:'Width (px)'},
      {name:'h'  , type:'number', title:'Height (px)'},
    ],
  }),

  /* AI placeholder */
  defineArrayMember({
    type  : 'object',
    name  : 'aiPlaceholder',
    title : 'AI image placeholder',
    fields: [
      {name:'prompt', type:'text'  , title:'DALL-E prompt', rows:4},
      {name:'x'     , type:'number', title:'X (px)'},
      {name:'y'     , type:'number', title:'Y (px)'},
      {name:'w'     , type:'number', title:'Width (px)'},
      {name:'h'     , type:'number', title:'Height (px)'},
    ],
  }),
]

/* ───────────────────────── schema definition ────────────────────── */
export default defineType({
  name : 'cardTemplate',
  type : 'document',
  title: 'Card template',

  fields: [
    /* identity ------------------------------------------------------ */
    defineField({
      name : 'title',
      type : 'string',
      title: 'Template name',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name : 'slug',
      type : 'slug',
      title: 'Slug',
      options: {source: 'title', maxLength: 96},
      validation: Rule => Rule.required(),
    }),

    /* live toggle --------------------------------------------------- */
    defineField({
      name : 'isLive',
      type : 'boolean',
      title: 'Visible in store?',
      description:
        'Keep this OFF while you are laying out the artwork. Turn it ON when ready.',
      initialValue: false,
      options: {layout: 'switch'},
      validation: Rule => Rule.required(),
    }),

    /* product SKUs -------------------------------------------------- */
    defineField({
      name : 'products',
      type : 'array',
      title: 'Available as…',
      of   : [{type: 'reference', to: [{type: 'cardProduct'}]}],
      validation: Rule =>
        Rule.min(1).error('Choose at least one product SKU'),
    }),

    /* default AI prompt -------------------------------------------- */
    defineField({
      name : 'aiPrompt',
      type : 'text',
      title: 'Default DALL-E prompt',
      rows : 3,
    }),

    /* NEW pages[4] -> layers[] ------------------------------------- */
    defineField({
      name : 'pages',
      title: 'Pages',
      type : 'array',
      validation: Rule => Rule.length(4),
      of: [
        defineArrayMember({
          type  : 'object',
          name  : 'page',
          title : 'Page',
          fields: [
            defineField({
              name : 'layers',
              title: 'Layers (top → bottom)',
              type : 'array',
              of   : layerMembers,
            }),
          ],
                  }),
      ],
    }),

    /* legacy top-level layers (hidden) ----------------------------- */
    defineField({
      name  : 'layers',
      type  : 'array',
      title : 'Layers (legacy)',
      of    : layerMembers,
      hidden: true,                      // hide but keep for old docs
    }),

    /* raw JSON backup / debug -------------------------------------- */
    defineField({
      name  : 'json',
      type  : 'text',
      title : 'Template JSON (debug / export)',
      rows  : 8,
      hidden: ({document}) => Boolean((document as any)?.pages?.length),
    }),
  ],
})