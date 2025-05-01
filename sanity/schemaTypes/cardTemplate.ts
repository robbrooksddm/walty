/* sanity/schemaTypes/cardTemplate.ts
   ------------------------------------------------------------------ */

   import {
    defineType,
    defineField,
    defineArrayMember,
  } from 'sanity'
  
  export default defineType({
    name : 'cardTemplate',
    type : 'document',
    title: 'Card template',
  
    fields: [
  
      /* ───────────── identity ───────────── */
      defineField({
        name : 'title',
        type : 'string',
        title: 'Template name',
        validation: (Rule) => Rule.required(),
      }),
  
      defineField({
        name : 'slug',
        type : 'slug',
        title: 'Slug',
        options: { source: 'title', maxLength: 96 },
        validation: (Rule) => Rule.required(),
      }),
  
      /* ───────────── catalogue settings ─── */
      defineField({
        name : 'price',
        type : 'number',
        title: 'Price (£)',
        description: 'Retail price shown to customers',
        validation: (Rule) => Rule.required().positive(),
      }),
  
      defineField({
        name : 'size',
        type : 'string',
        title: 'Card size',
        options: {
          list: [
            { title:'A6 – 105×148 mm', value:'A6'    },
            { title:'A5 – 148×210 mm', value:'A5'    },
            { title:'5″×7″',           value:'5x7'   },
            { title:'Square 148 mm',   value:'sq148' },
          ],
          layout: 'radio',
        },
        validation: (Rule) => Rule.required(),
      }),
  
      defineField({
        name : 'pageCount',
        type : 'number',
        title: 'Pages',
        description: '1 = Post-card (front + back) · 4 = Greeting card',
        initialValue: 4,
        validation: (Rule) => Rule.required().integer().min(1).max(4),
      }),
  
      /* ───────────── editable layers ────── */
      defineField({
        name : 'layers',
        title: 'Layers (top → bottom)',
        type : 'array',
        of   : [
  
          /* background image – locked for customers */
          defineArrayMember({
            type : 'image',
            name : 'bgImage',
            title: 'Background image (locked)',
            options: { hotspot: true },
          }),
  
          /* customer-editable text */
          defineArrayMember({
            type : 'object',
            name : 'editableText',
            title: 'Editable text',
            fields: [
              { name:'text'     , type:'string', title:'Default text' },
              { name:'x'        , type:'number', title:'X (px)'      },
              { name:'y'        , type:'number', title:'Y (px)'      },
              { name:'fontSize' , type:'number', title:'Font size'   },
              { name:'fill'     , type:'string', title:'Colour (hex)'},
              { name:'maxLength', type:'number', title:'Max chars'   },
            ],
          }),
  
          /* customer-editable image */
          defineArrayMember({
            type : 'object',
            name : 'editableImage',
            title: 'Editable image',
            fields: [
              { name:'src' , type:'image',  title:'Default image', options:{hotspot:true} },
              { name:'x'   , type:'number', title:'X (px)' },
              { name:'y'   , type:'number', title:'Y (px)' },
              { name:'w'   , type:'number', title:'Width (px)' },
              { name:'h'   , type:'number', title:'Height (px)' },
            ],
          }),
  
          /* AI placeholder (OpenAI prompt) */
          defineArrayMember({
            type : 'object',
            name : 'aiPlaceholder',
            title: 'AI image placeholder',
            fields: [
              { name:'prompt', type:'text',   title:'DALL-E prompt', rows:4 },
              { name:'x'     , type:'number', title:'X (px)' },
              { name:'y'     , type:'number', title:'Y (px)' },
              { name:'w'     , type:'number', title:'Width (px)' },
              { name:'h'     , type:'number', title:'Height (px)' },
            ],
          }),
        ],
  
        /* at least one layer please */
        validation: (Rule) =>
          Rule.min(1).error('Add at least one layer'),
      }),
  
/* raw JSON backup / debug (optional) */
defineField({
  name : 'json',
  type : 'text',
  title: 'Template JSON (debug / export)',
  rows : 8,
  hidden: ({document}) =>
    Boolean((document as any)?.layers?.length),   //  ← cast silences TS
}),
  ],
})
