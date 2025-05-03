/**********************************************************************
 * cardTemplate.ts  –  design master for printable greeting-cards
 * --------------------------------------------------------------------
 * 2025-05-03  pages[4] ➜ layers[]
 * 2025-05-04  AI-placeholder layer (prompt / ref image / lock)
 * 2025-05-05  pages initialValue + clean validation types
 *********************************************************************/

import {
  defineType,
  defineField,
  defineArrayMember,
} from 'sanity'
import {ComposeIcon} from '@sanity/icons'

/* ───────── reusable layer members ───────── */
const layerMembers = [
  /* background image – locked for customers */
  defineArrayMember({
    type  : 'image',
    name  : 'bgImage',
    title : 'Background image (locked)',
    options: {hotspot: true},
  }),

  /* customer-editable text */
  defineArrayMember({
    type  : 'object',
    name  : 'editableText',
    title : 'Editable text',
    fields: [
      {name:'text'     , type:'string', title:'Default text'},
      {name:'x'        , type:'number', title:'X (px)'},
      {name:'y'        , type:'number', title:'Y (px)'},
      {name:'fontSize' , type:'number', title:'Font size'},
      {name:'fill'     , type:'string', title:'Colour (hex)'},
      {name:'maxLength', type:'number', title:'Max chars'},
    ],
  }),

  /* customer-editable image */
  defineArrayMember({
    type  : 'object',
    name  : 'editableImage',
    title : 'Editable image',
    fields: [
      {name:'src', type:'image' , title:'Default image', options:{hotspot:true}},
      {name:'x'  , type:'number', title:'X (px)'},
      {name:'y'  , type:'number', title:'Y (px)'},
      {name:'w'  , type:'number', title:'Width (px)'},
      {name:'h'  , type:'number', title:'Height (px)'},
      {name:'scaleX', type:'number', hidden:true},
      {name:'scaleY', type:'number', hidden:true},
    ],
  }),

  /* AI face-swap placeholder */
  defineArrayMember({
    type : 'object',
    name : 'aiPlaceholder',
    title: 'AI face-swap placeholder',
    icon : ComposeIcon,

    fields: [
      {
        name :'prompt',
        type :'text',
        rows : 3,
        title:'Prompt sent to OpenAI',
        validation: rule => rule.required().error('Prompt is required'),
      },
      {
        name :'refImage',
        type :'image',
        title:'Reference style image (optional)',
        options:{hotspot:true},
      },
      {
        name :'locked',
        type :'boolean',
        title:'Lock position & size?',
        initialValue:false,
      },

      /* geometry written by CardEditor – hidden in Studio */
      {name:'x', type:'number', hidden:true},
      {name:'y', type:'number', hidden:true},
      {name:'w', type:'number', hidden:true},
      {name:'h', type:'number', hidden:true},
    ],

    preview:{
      select : {title:'prompt'},
      prepare: ({title}) => ({
        title: title ? `${title.slice(0,40)}…` : 'AI placeholder',
        media: ComposeIcon,
      }),
    },
  }),
]

/* ───────── schema definition ───────── */
export default defineType({
  name : 'cardTemplate',
  type : 'document',
  title: 'Card template',

  fields: [
    /* identity ---------------------------------------------------- */
    defineField({
      name :'title',
      type :'string',
      title:'Template name',
      validation: rule => rule.required(),
    }),
    defineField({
      name :'slug',
      type :'slug',
      title:'Slug',
      options:{source:'title',maxLength:96},
      validation: rule => rule.required(),
    }),

    /* live toggle ------------------------------------------------- */
    defineField({
      name :'isLive',
      type :'boolean',
      title:'Visible in store?',
      description:'Keep OFF while laying out artwork. Turn ON when ready.',
      initialValue:false,
      options:{layout:'switch'},
      validation: rule => rule.required(),
    }),

    /* product SKUs ----------------------------------------------- */
    defineField({
      name :'products',
      type :'array',
      title:'Available as…',
      of   :[{type:'reference',to:[{type:'cardProduct'}]}],
      validation: rule => rule.min(1).error('Choose at least one product SKU'),
    }),

    /* default AI prompt (optional) ------------------------------- */
    defineField({
      name :'aiPrompt',
      type :'text',
      title:'Default DALL-E prompt',
      rows :3,
    }),

    /* pages[4] ➜ layers[] ---------------------------------------- */
    defineField({
      name :'pages',
      title:'Pages (must be four)',
      description:'Front • inner-left • inner-right • back',
      type :'array',
      initialValue:[
        {layers:[]},  // front
        {layers:[]},  // inner-L
        {layers:[]},  // inner-R
        {layers:[]},  // back
      ],
      validation: rule => rule.length(4),
      of:[ defineArrayMember({
        type :'object',
        name :'page',
        title:'Page',
        fields:[ defineField({
          name :'layers',
          title:'Layers (top → bottom)',
          type :'array',
          of   : layerMembers,
          /* must have ≥1 layer across ANY of the 4 pages */
          validation: rule =>
            rule.custom((layers, ctx) => {
              const pages = (ctx.document as any)?.pages ?? []
              const hasAny =
                (layers as any[])?.length > 0 ||
                pages.some((p:any)=>p?.layers?.length)
              return hasAny
                ? true
                : 'Add at least one layer before publishing'
            }),
        }) ],
      }) ],
    }),

    /* legacy root-level layers (hidden) -------------------------- */
    defineField({
      name  :'layers',
      type  :'array',
      title :'Layers (legacy)',
      of    : layerMembers,
      hidden:true,
    }),

    /* raw JSON debug / export ------------------------------------ */
    defineField({
      name  :'json',
      type  :'text',
      title :'Template JSON (debug / export)',
      rows  :8,
      hidden: ({document}) => Boolean((document as any)?.pages?.length),
    }),
  ],
})