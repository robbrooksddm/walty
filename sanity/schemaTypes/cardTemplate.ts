/**********************************************************************
 * cardTemplate.ts – master schema for printable greeting-cards
 * --------------------------------------------------------------------
 * 2025-06-05  Studio clean-up:
 * • 4 category facets  (occasion / audience / theme / relation)
 * • product “description” copy
 * • publish guard: needs products & visibleInStore ON
 * • pages array shows thumbnails + friendly page names
 * • removed obsolete “aiPrompt” field
 *********************************************************************/

import {
  defineType,
  defineField,
  defineArrayMember,
} from 'sanity'
import {ComposeIcon} from '@sanity/icons'

/*──────────────── fieldsets (plain object) ──────────────────────────*/
const fieldsets = [
  { name:'pageset', title:'Pages', options:{columns:1} },
]

/*──────────────── reusable layer members ───────────────────────────*/
const layerMembers = [
  /* locked background image */
  defineArrayMember({
    type :'image',
    name :'bgImage',
    title:'Background (locked)',
    options:{ hotspot:true },
  }),

  /* customer-editable text */
  defineArrayMember({
    type :'object',
    name :'editableText',
    title:'Editable text',
    fields:[
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
    type :'object',
    name :'editableImage',
    title:'Editable image',
    fields:[
      {name:'src', type:'image', title:'Default image', options:{hotspot:true}},
      {name:'x' , type:'number', title:'X (px)'},
      {name:'y' , type:'number', title:'Y (px)'},
      {name:'w' , type:'number', title:'Width (px)'},
      {name:'h' , type:'number', title:'Height (px)'},
      {name:'scaleX', type:'number', hidden:true},
      {name:'scaleY', type:'number', hidden:true},
    ],
  }),

  /* AI face-swap layer */
  defineArrayMember({
    type :'object',
    name :'aiLayer',
    title:'AI face-swap layer',
    icon :ComposeIcon,
    fields:[
      {
        name:'source',
        type:'reference',
        to  :[{type:'aiPlaceholder'}],
        title:'Placeholder spec',
        validation:r=>r.required(),
      },
      {name:'x', type:'number', hidden:true},
      {name:'y', type:'number', hidden:true},
      {name:'w', type:'number', hidden:true},
      {name:'h', type:'number', hidden:true},
      {
        name:'locked',
        type:'boolean',
        title:'Lock position & size?',
        initialValue:false,
      },
    ],
    preview:{
      select:{title:'source.prompt', media:'source.refImage'},
      prepare:({title, media})=>({
        title: title ? `${title.slice(0,40)}…` : 'AI placeholder',
        media,
      }),
    },
  }),
]

/*──────────────── schema definition ───────────────────────────────*/
export default defineType({
  name :'cardTemplate',
  type :'document',
  title:'Card template',

  /* tab groups (Desk views are configured in structure.ts) */
  groups:[
    {name:'basic'     , title:'Basics',      default:true},
    {name:'store'     , title:'Store data'},
    {name:'pageLayout', title:'Pages'},
  ],

  fieldsets,

  fields:[

    /* —— Basics ——————————————————————————————— */
    defineField({
      name:'title',
      type:'string',
      title:'Template name',
      group:'basic',
      validation:r=>r.required(),
    }),
    defineField({
      name:'slug',
      type:'slug',
      title:'Slug',
      group:'basic',
      options:{source:'title', maxLength:96},
      validation:r=>r.required(),
    }),

    /* —— Store data ——————————————————————————— */
    defineField({
      name:'isLive',
      type:'boolean',
      title:'Visible in store?',
      group:'store',
      initialValue:false,
      options:{layout:'switch'},
      validation:r=>r.required(),
    }),
    defineField({
      name:'products',
      type:'array',
      group:'store',
      title:'Available as…',
      of:[{type:'reference', to:[{type:'cardProduct'}]}],
      validation:r=>r.min(1).error('Choose at least one product SKU'),
    }),
    defineField({
      name:'description',
      type:'text',
      group:'store',
      title:'Product description',
      rows:3,
      validation:r=>r.max(300),
    }),

    /* —— Category facets ———————————————————— */
    defineField({
      name:'occasion',
      type:'array',
      group:'store',
      title:'Occasion',
      options:{layout:'tags'},
      of:[{type:'reference', to:[{type:'occasion'}]}],
    }),
    defineField({
      name:'audience',
      type:'array',
      group:'store',
      title:'Who’s it for?',
      options:{layout:'tags'},
      of:[{type:'reference', to:[{type:'audience'}]}],
    }),
    defineField({
      name:'theme',
      type:'array',
      group:'store',
      title:'Theme',
      options:{layout:'tags'},
      of:[{type:'reference', to:[{type:'theme'}]}],
    }),
    defineField({
      name:'relation',
      type:'array',
      group:'store',
      title:'Relation to buyer (optional)',
      options:{layout:'tags'},
      of:[{type:'reference', to:[{type:'relation'}]}],
    }),

    /* —— Pages (4) ——————————————————————————— */
    defineField({
      name :'pages',
      group:'pageLayout',
      fieldset:'pageset',
      title:'Pages (Front · Inner-L · Inner-R · Back)',
      type :'array',
      initialValue:[
        {name:'front',       layers:[]},
        {name:'inner-left',  layers:[]},
        {name:'inner-right', layers:[]},
        {name:'back',        layers:[]},
      ],
      validation:r=>r.length(4),
      of:[ defineArrayMember({
        type :'object',
        name :'page',
        preview:{
          select:{title:'name', media:'layers.0.src'},
          prepare:({title})=>({
            title:(
              title==='front'       ? 'Front cover' :
              title==='inner-left'  ? 'Inner left'  :
              title==='inner-right' ? 'Inner right' :
              'Back cover'
            ),
          }),
        },
        fields:[
          defineField({name:'name', type:'string', hidden:true}),
          defineField({
            name :'layers',
            title:'Layers (top → bottom)',
            type :'array',
            of   :layerMembers,
            validation:r=>r.custom((layers, ctx)=>{
              const pages = (ctx.document as any)?.pages ?? []
              const any   = (layers as any[])?.length>0 ||
                            pages.some((p:any)=>p?.layers?.length)
              return any || 'Add at least one layer before publishing'
            }),
          }),
        ],
      }) ],
    }),
  ],

  /* —— final “can-publish?” guard ————————— */
  validation:(Rule)=>Rule.custom((doc:any)=>{
    if (doc.isLive && (!doc.products || doc.products.length===0))
      return 'Cannot publish: add at least one product & keep “Visible” ON'
    return true
  }),
})