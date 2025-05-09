/**********************************************************************
 * aiPlaceholder.ts – face-swap / AI-image placeholder definition
 *********************************************************************/
import {defineType, defineField} from 'sanity'

export default defineType({
  name : 'aiPlaceholder',
  type : 'document',
  title: 'AI face-swap placeholder',
  fields: [
    /* ─── author-visible ─── */
    defineField({
      name : 'title',
      type : 'string',
      title: 'Short title',
      validation: r => r.required(),
    }),
    defineField({
      name : 'prompt',
      type : 'text',
      rows : 6,
      title: 'Prompt sent to OpenAI',
      validation: r => r.required(),
    }),
    /* NEW ─── Aspect ratio --------------------------------------- */
    defineField({
      name : 'ratio',
      type : 'string',
      title: 'Aspect ratio',
      options: {
        list: [
          {title:'Square (1:1)',  value:'1:1'},
          {title:'Landscape (3:2)', value:'3:2'},
          {title:'Portrait (2:3)',  value:'2:3'},
        ],
        layout: 'radio',
      },
      initialValue: '1:1',
      validation: r => r.required(),
    }),
    /* NEW ─── Quality ------------------------------------------- */
    defineField({
      name : 'quality',
      type : 'string',
      title: 'Quality',
      options: {
        list: [
          {title:'Low',    value:'low'},
          {title:'Medium', value:'medium'},
          {title:'High',   value:'high'},
        ],
        layout: 'radio',
      },
      initialValue: 'medium',
      validation: r => r.required(),
    }),
    /* NEW ─── Background ---------------------------------------- */
    defineField({
      name : 'background',
      type : 'string',
      title: 'Background',
      description: 'Controls alpha channel in the generated PNG',
      options: {
        list: [
          {title:'Transparent', value:'transparent'},
          {title:'Opaque',      value:'opaque'},
          {title:'Auto',        value:'auto'},
        ],
        layout: 'radio',
      },
      initialValue: 'transparent',
      validation: r => r.required(),
    }),
    /* NEW ─── Face-swap toggle ---------------------------------- */
    defineField({
      name : 'doFaceSwap',
      type : 'boolean',
      title: 'Perform face-swap after generation?',
      initialValue: true,
    }),

    /* optional reference image */
    defineField({
      name : 'refImage',
      type : 'image',
      title: 'Reference style image (optional)',
      options:{hotspot:true},
    }),
  ],
})